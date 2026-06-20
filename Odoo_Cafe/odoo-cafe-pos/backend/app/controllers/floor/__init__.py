from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin, require_employee
from app.models.user import User
from app.schemas.floor import FloorCreate, FloorUpdate, FloorResponse
import app.services.floor as floor_service

router = APIRouter(prefix="/floors", tags=["Floors"])


@router.get("", response_model=list[FloorResponse])
def list_floors(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return floor_service.get_all(db)


@router.get("/{floor_id}", response_model=FloorResponse)
def get_floor(floor_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return floor_service.get_by_id(floor_id, db)


@router.post("", response_model=FloorResponse, status_code=status.HTTP_201_CREATED)
def create_floor(payload: FloorCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return floor_service.create(payload, db)


@router.put("/{floor_id}", response_model=FloorResponse)
def update_floor(floor_id: int, payload: FloorUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return floor_service.update(floor_id, payload, db)


@router.delete("/{floor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_floor(floor_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    floor_service.delete(floor_id, db)
