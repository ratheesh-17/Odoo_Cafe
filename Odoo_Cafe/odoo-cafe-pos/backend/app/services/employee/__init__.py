from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.employee import UserCreate, UserUpdate, ChangePasswordRequest
from app.utils.password_hash import hash_password, verify_password


def get_all(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def get_by_id(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def create(payload: UserCreate, db: Session) -> User:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update(user_id: int, payload: UserUpdate, db: Session, current_user: User) -> User:
    user = get_by_id(user_id, db)
    data = payload.model_dump(exclude_unset=True)

    if "email" in data:
        duplicate = db.query(User).filter(
            User.email == data["email"], User.id != user_id
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use by another account",
            )

    # prevent demoting the only active admin
    if "role" in data and data["role"] == UserRole.employee:
        _guard_last_admin(user, db)

    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def change_password(user_id: int, payload: ChangePasswordRequest, db: Session) -> User:
    user = get_by_id(user_id, db)
    
    # Verify old password
    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Prevent using same password
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return user


def archive(user_id: int, db: Session, current_user: User) -> User:
    user = get_by_id(user_id, db)
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot archive your own account",
        )
    _guard_last_admin(user, db)
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def unarchive(user_id: int, db: Session) -> User:
    user = get_by_id(user_id, db)
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


def delete(user_id: int, db: Session, current_user: User) -> None:
    user = get_by_id(user_id, db)
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )
    _guard_last_admin(user, db)
    if user.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a user that has created orders",
        )
    db.delete(user)
    db.commit()


def _guard_last_admin(user: User, db: Session) -> None:
    """Prevent archiving or demoting the last active admin."""
    if user.role == UserRole.admin and user.is_active:
        active_admin_count = db.query(User).filter(
            User.role == UserRole.admin,
            User.is_active == True,
        ).count()
        if active_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last active admin account",
            )
