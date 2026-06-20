from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.payment_method import PaymentMethod, PaymentType
from app.models.self_order_config import SelfOrderConfig
from app.models.user import User, UserRole
from app.utils.password_hash import hash_password


def run_seed():
    db: Session = SessionLocal()
    try:
        _seed_payment_methods(db)
        _seed_self_order_config(db)
        _seed_default_admin(db)
    finally:
        db.close()


def _seed_payment_methods(db: Session):
    for payment_type in PaymentType:
        exists = db.query(PaymentMethod).filter_by(type=payment_type).first()
        if not exists:
            db.add(PaymentMethod(type=payment_type, is_enabled=True))
    db.commit()


def _seed_self_order_config(db: Session):
    exists = db.query(SelfOrderConfig).first()
    if not exists:
        db.add(SelfOrderConfig())
        db.commit()


def _seed_default_admin(db: Session):
    exists = db.query(User).filter_by(role=UserRole.admin).first()
    if not exists:
        db.add(User(
            name="Admin",
            email="admin@odoocafe.com",
            password_hash=hash_password("Admin@123"),
            role=UserRole.admin,
            is_active=True,
        ))
        db.commit()
