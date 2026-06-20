from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_all(db: Session, search: str | None = None) -> list[Customer]:
    query = db.query(Customer)
    if search:
        term = f"%{search}%"
        query = query.filter(
            Customer.name.ilike(term)
            | Customer.email.ilike(term)
            | Customer.phone.ilike(term)
        )
    return query.order_by(Customer.name).all()


def get_by_id(customer_id: int, db: Session) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


def create(payload: CustomerCreate, db: Session) -> Customer:
    if payload.email:
        if db.query(Customer).filter(Customer.email == payload.email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this email already exists",
            )
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update(customer_id: int, payload: CustomerUpdate, db: Session) -> Customer:
    customer = get_by_id(customer_id, db)
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"]:
        duplicate = db.query(Customer).filter(
            Customer.email == data["email"], Customer.id != customer_id
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already used by another customer",
            )
    for field, value in data.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete(customer_id: int, db: Session) -> None:
    customer = get_by_id(customer_id, db)
    if customer.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a customer that has orders",
        )
    db.delete(customer)
    db.commit()
