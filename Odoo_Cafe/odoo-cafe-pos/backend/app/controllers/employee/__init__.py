from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin
from app.models.user import User
from app.schemas.employee import UserCreate, UserUpdate, ChangePasswordRequest, UserResponse
import app.services.employee as employee_service

router = APIRouter(prefix="/users", tags=["User & Employee Management"])


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return employee_service.get_all(db)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return employee_service.get_by_id(user_id, db)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return employee_service.create(payload, db)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return employee_service.update(user_id, payload, db, current_user)


@router.patch("/{user_id}/change-password", response_model=UserResponse)
def change_password(
    user_id: int,
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return employee_service.change_password(user_id, payload, db)


@router.patch("/{user_id}/archive", response_model=UserResponse)
def archive_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return employee_service.archive(user_id, db, current_user)


@router.patch("/{user_id}/unarchive", response_model=UserResponse)
def unarchive_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return employee_service.unarchive(user_id, db)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    employee_service.delete(user_id, db, current_user)
