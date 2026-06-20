import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.table import Table
from app.models.floor import Floor
from app.models.order import Order, OrderStatus
from app.schemas.floor.table import TableCreate, TableUpdate, TableResponse, FloorBrief


def _has_active_order(table: Table, db: Session) -> bool:
    return db.query(Order).filter(
        Order.table_id == table.id,
        Order.status.in_([OrderStatus.draft, OrderStatus.sent_to_kitchen]),
    ).first() is not None


def _to_response(table: Table, db: Session) -> TableResponse:
    return TableResponse(
        id=table.id,
        floor=FloorBrief.model_validate(table.floor),
        table_number=table.table_number,
        seats=table.seats,
        is_active=table.is_active,
        self_order_token=table.self_order_token,
        has_active_order=_has_active_order(table, db),
        created_at=table.created_at,
        updated_at=table.updated_at,
    )


def _validate_floor(floor_id: int, db: Session) -> None:
    if not db.query(Floor).filter(Floor.id == floor_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Floor not found")


def get_all(db: Session, floor_id: int | None = None) -> list[TableResponse]:
    query = db.query(Table).options(joinedload(Table.floor))
    if floor_id:
        query = query.filter(Table.floor_id == floor_id)
    tables = query.order_by(Table.floor_id, Table.table_number).all()
    return [_to_response(t, db) for t in tables]


def get_by_id(table_id: int, db: Session) -> Table:
    table = (
        db.query(Table)
        .options(joinedload(Table.floor))
        .filter(Table.id == table_id)
        .first()
    )
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
    return table


def create(payload: TableCreate, db: Session) -> TableResponse:
    _validate_floor(payload.floor_id, db)
    duplicate = db.query(Table).filter(
        Table.floor_id == payload.floor_id,
        Table.table_number == payload.table_number,
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Table {payload.table_number} already exists on this floor",
        )
    table = Table(
        floor_id=payload.floor_id,
        table_number=payload.table_number,
        seats=payload.seats,
        self_order_token=uuid.uuid4().hex,  # auto-generate unique QR token
    )
    db.add(table)
    db.commit()
    db.refresh(table)
    return _to_response(get_by_id(table.id, db), db)


def update(table_id: int, payload: TableUpdate, db: Session) -> TableResponse:
    table = get_by_id(table_id, db)
    data = payload.model_dump(exclude_unset=True)
    if "table_number" in data:
        duplicate = db.query(Table).filter(
            Table.floor_id == table.floor_id,
            Table.table_number == data["table_number"],
            Table.id != table_id,
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Table {data['table_number']} already exists on this floor",
            )
    for field, value in data.items():
        setattr(table, field, value)
    db.commit()
    db.refresh(table)
    return _to_response(get_by_id(table_id, db), db)


def delete(table_id: int, db: Session) -> None:
    table = get_by_id(table_id, db)
    if _has_active_order(table, db):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a table that has an active order",
        )
    db.delete(table)
    db.commit()
