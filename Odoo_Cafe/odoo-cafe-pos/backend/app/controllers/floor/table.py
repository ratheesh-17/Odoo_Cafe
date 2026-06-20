from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin, require_employee
from app.models.user import User
from app.schemas.floor.table import TableCreate, TableUpdate, TableResponse
import app.services.floor.table as table_service

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("", response_model=list[TableResponse])
def list_tables(
    floor_id: int | None = Query(None, description="Filter tables by floor"),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return table_service.get_all(db, floor_id=floor_id)


@router.get("/{table_id}", response_model=TableResponse)
def get_table(table_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    table = table_service.get_by_id(table_id, db)
    return table_service._to_response(table, db)


@router.post("", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
def create_table(payload: TableCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return table_service.create(payload, db)


@router.put("/{table_id}", response_model=TableResponse)
def update_table(table_id: int, payload: TableUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return table_service.update(table_id, payload, db)


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(table_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    table_service.delete(table_id, db)
