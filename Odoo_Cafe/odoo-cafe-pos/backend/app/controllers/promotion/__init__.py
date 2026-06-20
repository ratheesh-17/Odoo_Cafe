from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin
from app.models.user import User
from app.schemas.promotion import PromotionCreate, PromotionUpdate, PromotionResponse
import app.services.promotion as promotion_service

router = APIRouter(prefix="/promotions", tags=["Promotions"])


@router.get("", response_model=list[PromotionResponse])
def list_promotions(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return promotion_service.get_all(db)


@router.get("/{promotion_id}", response_model=PromotionResponse)
def get_promotion(promotion_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return promotion_service.get_by_id(promotion_id, db)


@router.post("", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
def create_promotion(payload: PromotionCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return promotion_service.create(payload, db)


@router.put("/{promotion_id}", response_model=PromotionResponse)
def update_promotion(promotion_id: int, payload: PromotionUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return promotion_service.update(promotion_id, payload, db)


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(promotion_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    promotion_service.delete(promotion_id, db)
