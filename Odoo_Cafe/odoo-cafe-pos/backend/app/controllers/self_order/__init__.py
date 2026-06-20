from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin
from app.models.user import User
from app.models.table import Table
from app.schemas.self_order import (
    SelfOrderConfigUpdate, SelfOrderConfigResponse,
    MenuResponse, SelfCartItemAdd, SelfCartItemUpdate,
    SelfCouponApply, SelfOrderStatusResponse,
    CustomerDisplayResponse,
)
from app.schemas.order import OrderResponse
from app.utils.qr_generator import generate_table_qr_base64, generate_table_qr_pdf
import app.services.self_order as self_order_service

router = APIRouter(tags=["Self Order"])


# ── Admin: config management ──────────────────────────────────────────────────

@router.get("/self-order/config", response_model=SelfOrderConfigResponse)
def get_config(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return self_order_service.get_config(db)


@router.put("/self-order/config", response_model=SelfOrderConfigResponse)
def update_config(
    payload: SelfOrderConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return self_order_service.update_config(payload, db)


@router.get("/self-order/tables/{table_id}/qr-url")
def get_table_qr_url(
    table_id: int,
    domain: str = Query(..., description="Frontend base domain e.g. https://mycafe.com"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    url = self_order_service.get_qr_url(table_id, domain, db)
    return {"table_id": table_id, "qr_url": url}


@router.get("/self-order/tables/{table_id}/qr-image")
def get_table_qr_image(
    table_id: int,
    domain: str = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Returns QR code as base64 PNG — used by frontend to display and download."""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table or not table.self_order_token:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=404, detail="Table or QR token not found")
    qr_b64 = generate_table_qr_base64(table.self_order_token, domain)
    return {"table_id": table_id, "qr_base64": qr_b64}


@router.get("/self-order/qr-pdf")
def download_all_qr_pdf(
    domain: str = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Downloads a PDF with QR codes for all active tables — for printing and placing on tables."""
    from sqlalchemy.orm import joinedload
    from app.models.floor import Floor
    tables = (
        db.query(Table)
        .options(joinedload(Table.floor))
        .filter(Table.is_active == True, Table.self_order_token.isnot(None))
        .all()
    )
    table_list = [
        {"table_number": t.table_number, "floor_name": t.floor.name, "token": t.self_order_token}
        for t in tables
    ]
    pdf_bytes = generate_table_qr_pdf(table_list, domain)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=table_qr_codes.pdf"},
    )


# ── Customer-facing: no auth required ────────────────────────────────────────

@router.get("/s/{token}/menu", response_model=MenuResponse)
def get_menu(token: str, db: Session = Depends(get_db)):
    """Customer scans QR → gets full menu + table info + config (bg color/image)."""
    return self_order_service.get_menu(token, db)


@router.post("/s/{token}/orders", response_model=OrderResponse)
def place_order(token: str, db: Session = Depends(get_db)):
    """Customer initiates a new order (or returns existing draft for this table)."""
    return self_order_service.place_order(token, db)


@router.post("/s/{token}/orders/{order_id}/items", response_model=OrderResponse)
def add_item(
    token: str,
    order_id: int,
    payload: SelfCartItemAdd,
    db: Session = Depends(get_db),
):
    return self_order_service.add_item(token, order_id, payload, db)


@router.put("/s/{token}/orders/{order_id}/items/{item_id}", response_model=OrderResponse)
def update_item(
    token: str,
    order_id: int,
    item_id: int,
    payload: SelfCartItemUpdate,
    db: Session = Depends(get_db),
):
    return self_order_service.update_item(token, order_id, item_id, payload, db)


@router.delete("/s/{token}/orders/{order_id}/items/{item_id}", response_model=OrderResponse)
def remove_item(
    token: str,
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
):
    return self_order_service.remove_item(token, order_id, item_id, db)


@router.post("/s/{token}/orders/{order_id}/coupon", response_model=OrderResponse)
def apply_coupon(
    token: str,
    order_id: int,
    payload: SelfCouponApply,
    db: Session = Depends(get_db),
):
    return self_order_service.apply_coupon(token, order_id, payload, db)


@router.post("/s/{token}/orders/{order_id}/submit", response_model=OrderResponse)
def submit_order(token: str, order_id: int, db: Session = Depends(get_db)):
    """Customer submits cart — auto-sends to Kitchen Display."""
    return self_order_service.submit_order(token, order_id, db)


@router.get("/s/{token}/orders/{order_id}/status", response_model=SelfOrderStatusResponse)
def get_order_status(token: str, order_id: int, db: Session = Depends(get_db)):
    """Customer polls this to track kitchen stage and per-item completion."""
    return self_order_service.get_order_status(token, order_id, db)


# ── Customer-facing display (no auth, keyed by order_id) ─────────────────────

@router.get("/customer-display/{order_id}", response_model=CustomerDisplayResponse)
def customer_display(
    order_id: int,
    db: Session = Depends(get_db),
):
    """
    Polled by the Customer Facing Display screen.
    Returns order lines, totals, payment status and UPI QR when applicable.
    No auth required — the display screen is a dedicated device.
    """
    return self_order_service.get_customer_display(order_id, db)
