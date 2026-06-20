from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate


def _validate_category(category_id: int, db: Session) -> None:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


def get_all(db: Session, category_id: int | None = None, search: str | None = None, include_archived: bool = False) -> list[Product]:
    query = db.query(Product).options(joinedload(Product.category))
    if not include_archived:
        query = query.filter(Product.is_active == True)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.order_by(Product.name).all()


def get_by_id(product_id: int, db: Session) -> Product:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def create(payload: ProductCreate, db: Session) -> Product:
    _validate_category(payload.category_id, db)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return get_by_id(product.id, db)


def update(product_id: int, payload: ProductUpdate, db: Session) -> Product:
    product = get_by_id(product_id, db)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        _validate_category(data["category_id"], db)
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return get_by_id(product_id, db)


def delete(product_id: int, db: Session) -> None:
    product = get_by_id(product_id, db)
    if product.order_items:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a product that has been used in orders",
        )
    db.delete(product)
    db.commit()
