from datetime import date, datetime
from pydantic import BaseModel


# ── Filters ───────────────────────────────────────────────────────────────────

class ReportFilters(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    employee_id: int | None = None
    session_id: int | None = None
    product_id: int | None = None


# ── Summary metrics ───────────────────────────────────────────────────────────

class ReportSummary(BaseModel):
    total_orders: int
    revenue: float
    avg_order_value: float
    total_discount: float
    total_tax: float


# ── Sales trend (chart) ───────────────────────────────────────────────────────

class SalesTrendPoint(BaseModel):
    label: str          # date string e.g. "2024-01-15"
    revenue: float
    order_count: int


# ── Top categories (chart + table) ───────────────────────────────────────────

class TopCategoryRow(BaseModel):
    category_id: int
    category_name: str
    category_color: str
    order_count: int
    revenue: float


# ── Top products (table) ──────────────────────────────────────────────────────

class TopProductRow(BaseModel):
    product_id: int
    product_name: str
    category_name: str
    quantity_sold: int
    revenue: float


# ── Top orders (table) ────────────────────────────────────────────────────────

class TopOrderRow(BaseModel):
    order_id: int
    order_number: str
    employee_name: str
    customer_name: str | None
    total_amount: float
    paid_at: datetime | None


# ── Full dashboard response ───────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    summary: ReportSummary
    sales_trend: list[SalesTrendPoint]
    top_categories: list[TopCategoryRow]
    top_products: list[TopProductRow]
    top_orders: list[TopOrderRow]
