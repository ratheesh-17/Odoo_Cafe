from datetime import date, datetime, timedelta
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.category import Category
from app.models.payment import Payment
from app.models.user import User
from app.models.customer import Customer
from app.schemas.reports import (
    DashboardResponse, ReportSummary, SalesTrendPoint,
    TopCategoryRow, TopProductRow, TopOrderRow,
)


# ── Filter builder ────────────────────────────────────────────────────────────

def _base_query(db: Session, date_from, date_to, employee_id, session_id):
    """Returns a base query of paid orders with all requested filters applied."""
    q = db.query(Order).filter(Order.status == OrderStatus.paid)

    if date_from:
        q = q.filter(cast(Order.created_at, Date) >= date_from)
    if date_to:
        q = q.filter(cast(Order.created_at, Date) <= date_to)
    if employee_id:
        q = q.filter(Order.employee_id == employee_id)
    if session_id:
        q = q.filter(Order.session_id == session_id)

    return q


# ── Summary ───────────────────────────────────────────────────────────────────

def _get_summary(db, date_from, date_to, employee_id, session_id, product_id) -> ReportSummary:
    q = _base_query(db, date_from, date_to, employee_id, session_id)

    if product_id:
        order_ids = db.query(OrderItem.order_id).filter(
            OrderItem.product_id == product_id
        ).subquery()
        q = q.filter(Order.id.in_(order_ids))

    result = q.with_entities(
        func.count(Order.id),
        func.coalesce(func.sum(Order.total_amount), 0),
        func.coalesce(func.sum(Order.discount_amount), 0),
        func.coalesce(func.sum(Order.tax_amount), 0),
    ).one()

    total_orders, revenue, total_discount, total_tax = result
    revenue = float(revenue)
    avg = round(revenue / total_orders, 2) if total_orders > 0 else 0.0

    return ReportSummary(
        total_orders=total_orders,
        revenue=round(revenue, 2),
        avg_order_value=avg,
        total_discount=round(float(total_discount), 2),
        total_tax=round(float(total_tax), 2),
    )


# ── Sales trend ───────────────────────────────────────────────────────────────

def _get_sales_trend(db, date_from, date_to, employee_id, session_id) -> list[SalesTrendPoint]:
    q = _base_query(db, date_from, date_to, employee_id, session_id)

    rows = (
        q.with_entities(
            cast(Order.created_at, Date).label("day"),
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        )
        .group_by("day")
        .order_by("day")
        .all()
    )

    return [
        SalesTrendPoint(
            label=str(row.day),
            revenue=round(float(row.revenue), 2),
            order_count=row.order_count,
        )
        for row in rows
    ]


# ── Top categories ────────────────────────────────────────────────────────────

def _get_top_categories(db, date_from, date_to, employee_id, session_id, limit=10) -> list[TopCategoryRow]:
    q = _base_query(db, date_from, date_to, employee_id, session_id)
    order_ids = q.with_entities(Order.id).subquery()

    rows = (
        db.query(
            Category.id,
            Category.name,
            Category.color,
            func.count(Order.id.distinct()).label("order_count"),
            func.coalesce(func.sum(OrderItem.line_total), 0).label("revenue"),
        )
        .join(Product, Product.category_id == Category.id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.id.in_(order_ids))
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(OrderItem.line_total).desc())
        .limit(limit)
        .all()
    )

    return [
        TopCategoryRow(
            category_id=row.id,
            category_name=row.name,
            category_color=row.color,
            order_count=row.order_count,
            revenue=round(float(row.revenue), 2),
        )
        for row in rows
    ]


# ── Top products ──────────────────────────────────────────────────────────────

def _get_top_products(db, date_from, date_to, employee_id, session_id, product_id, limit=10) -> list[TopProductRow]:
    q = _base_query(db, date_from, date_to, employee_id, session_id)
    order_ids = q.with_entities(Order.id).subquery()

    pq = (
        db.query(
            Product.id,
            Product.name,
            Category.name.label("category_name"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("quantity_sold"),
            func.coalesce(func.sum(OrderItem.line_total), 0).label("revenue"),
        )
        .join(Category, Category.id == Product.category_id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .filter(OrderItem.order_id.in_(order_ids))
        .group_by(Product.id, Product.name, Category.name)
        .order_by(func.sum(OrderItem.line_total).desc())
    )

    if product_id:
        pq = pq.filter(Product.id == product_id)

    rows = pq.limit(limit).all()

    return [
        TopProductRow(
            product_id=row.id,
            product_name=row.name,
            category_name=row.category_name,
            quantity_sold=row.quantity_sold,
            revenue=round(float(row.revenue), 2),
        )
        for row in rows
    ]


# ── Top orders ────────────────────────────────────────────────────────────────

def _get_top_orders(db, date_from, date_to, employee_id, session_id, limit=10) -> list[TopOrderRow]:
    q = _base_query(db, date_from, date_to, employee_id, session_id)

    rows = (
        q.join(User, User.id == Order.employee_id)
        .outerjoin(Customer, Customer.id == Order.customer_id)
        .outerjoin(Payment, Payment.order_id == Order.id)
        .with_entities(
            Order.id,
            Order.order_number,
            User.name.label("employee_name"),
            Customer.name.label("customer_name"),
            Order.total_amount,
            Payment.paid_at,
        )
        .order_by(Order.total_amount.desc())
        .limit(limit)
        .all()
    )

    return [
        TopOrderRow(
            order_id=row.id,
            order_number=row.order_number,
            employee_name=row.employee_name,
            customer_name=row.customer_name,
            total_amount=round(float(row.total_amount), 2),
            paid_at=row.paid_at,
        )
        for row in rows
    ]


# ── Public API ────────────────────────────────────────────────────────────────

def get_dashboard(
    db: Session,
    date_from: date | None,
    date_to: date | None,
    employee_id: int | None,
    session_id: int | None,
    product_id: int | None,
) -> DashboardResponse:
    return DashboardResponse(
        summary=_get_summary(db, date_from, date_to, employee_id, session_id, product_id),
        sales_trend=_get_sales_trend(db, date_from, date_to, employee_id, session_id),
        top_categories=_get_top_categories(db, date_from, date_to, employee_id, session_id),
        top_products=_get_top_products(db, date_from, date_to, employee_id, session_id, product_id),
        top_orders=_get_top_orders(db, date_from, date_to, employee_id, session_id),
    )
