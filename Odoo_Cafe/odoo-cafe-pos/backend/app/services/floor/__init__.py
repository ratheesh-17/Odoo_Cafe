from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.floor import Floor
from app.models.order import Order, OrderStatus
from app.schemas.floor import FloorCreate, FloorUpdate


def get_all(db: Session) -> list[Floor]:
    return (
        db.query(Floor)
        .options(joinedload(Floor.tables))
        .order_by(Floor.name)
        .all()
    )


def get_by_id(floor_id: int, db: Session) -> Floor:
    floor = (
        db.query(Floor)
        .options(joinedload(Floor.tables))
        .filter(Floor.id == floor_id)
        .first()
    )
    if not floor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floor not found")
    return floor


def create(payload: FloorCreate, db: Session) -> Floor:
    existing = db.query(Floor).filter(Floor.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Floor name already exists")
    floor = Floor(name=payload.name)
    db.add(floor)
    db.commit()
    db.refresh(floor)
    return get_by_id(floor.id, db)


def update(floor_id: int, payload: FloorUpdate, db: Session) -> Floor:
    floor = get_by_id(floor_id, db)
    duplicate = db.query(Floor).filter(Floor.name == payload.name, Floor.id != floor_id).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Floor name already exists")
    floor.name = payload.name
    db.commit()
    db.refresh(floor)
    return get_by_id(floor_id, db)


def delete(floor_id: int, db: Session) -> None:
    floor = get_by_id(floor_id, db)
    # block delete if any table on this floor has an active order
    table_ids = [t.id for t in floor.tables]
    if table_ids:
        active_order = (
            db.query(Order)
            .filter(
                Order.table_id.in_(table_ids),
                Order.status.in_([OrderStatus.draft, OrderStatus.sent_to_kitchen]),
            )
            .first()
        )
        if active_order:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete a floor that has tables with active orders",
            )
    db.delete(floor)
    db.commit()
