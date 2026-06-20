from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.promotion import Promotion, PromotionAppliesTo
from app.models.product import Product
from app.schemas.promotion import PromotionCreate, PromotionUpdate


def get_all(db: Session) -> list[Promotion]:
    return (
        db.query(Promotion)
        .options(joinedload(Promotion.product))
        .order_by(Promotion.created_at.desc())
        .all()
    )


def get_by_id(promotion_id: int, db: Session) -> Promotion:
    promotion = (
        db.query(Promotion)
        .options(joinedload(Promotion.product))
        .filter(Promotion.id == promotion_id)
        .first()
    )
    if not promotion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return promotion


def _validate_product(product_id: int, db: Session) -> None:
    if not db.query(Product).filter(Product.id == product_id, Product.is_active == True).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")


def create(payload: PromotionCreate, db: Session) -> Promotion:
    if payload.product_id:
        _validate_product(payload.product_id, db)
    promotion = Promotion(**payload.model_dump())
    db.add(promotion)
    db.commit()
    db.refresh(promotion)
    return get_by_id(promotion.id, db)


def update(promotion_id: int, payload: PromotionUpdate, db: Session) -> Promotion:
    promotion = get_by_id(promotion_id, db)
    data = payload.model_dump(exclude_unset=True)
    if "product_id" in data and data["product_id"] is not None:
        _validate_product(data["product_id"], db)
    for field, value in data.items():
        setattr(promotion, field, value)
    db.commit()
    db.refresh(promotion)
    return get_by_id(promotion_id, db)


def delete(promotion_id: int, db: Session) -> None:
    promotion = get_by_id(promotion_id, db)
    if promotion.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a promotion that has been applied to orders",
        )
    db.delete(promotion)
    db.commit()


def _is_promotion_active(promotion: Promotion) -> bool:
    if not promotion.is_active:
        return False
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if promotion.starts_at and promotion.starts_at > now:
        return False
    if promotion.ends_at and promotion.ends_at < now:
        return False
    return True


def evaluate_product_promotion(product_id: int, quantity: int, db: Session) -> Promotion | None:
    """
    Called by order service when a cart item quantity changes.
    Returns the first matching active product-level promotion, or None.
    """
    promotions = (
        db.query(Promotion)
        .filter(
            Promotion.applies_to == PromotionAppliesTo.product,
            Promotion.product_id == product_id,
            Promotion.is_active == True,
        )
        .all()
    )
    for promo in promotions:
        if _is_promotion_active(promo) and quantity >= promo.min_quantity:
            return promo
    return None


def evaluate_order_promotion(subtotal: float, db: Session) -> Promotion | None:
    """
    Called by order service when cart subtotal changes.
    Returns the best matching active order-level promotion, or None.
    Best = highest discount threshold that is still met.
    """
    promotions = (
        db.query(Promotion)
        .filter(
            Promotion.applies_to == PromotionAppliesTo.order,
            Promotion.is_active == True,
            Promotion.min_order_amount <= subtotal,
        )
        .order_by(Promotion.min_order_amount.desc())
        .all()
    )
    for promo in promotions:
        if _is_promotion_active(promo):
            return promo
    return None
