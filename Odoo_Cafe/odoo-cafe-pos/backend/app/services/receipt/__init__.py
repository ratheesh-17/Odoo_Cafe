from io import BytesIO
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from reportlab.lib.pagesizes import A6
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.receipt import Receipt, DeliveryMethod, ReceiptStatus
from app.utils.email_sender import send_receipt_email


# ── Order loader ──────────────────────────────────────────────────────────────

def _get_paid_order(order_id: int, db: Session) -> Order:
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
            joinedload(Order.employee),
            joinedload(Order.table),
            joinedload(Order.payment).joinedload(Payment.payment_method),
            joinedload(Order.coupon),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != OrderStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt can only be generated for paid orders",
        )
    return order


# ── HTML receipt builder ──────────────────────────────────────────────────────

def _build_html(order: Order, app_name: str = "Odoo Cafe POS") -> str:
    items_html = "".join(
        f"""<tr>
            <td>{item.product.name}</td>
            <td style="text-align:center">{item.quantity}</td>
            <td style="text-align:right">₹{float(item.unit_price):.2f}</td>
            <td style="text-align:right">₹{float(item.line_total):.2f}</td>
        </tr>"""
        for item in order.items
    )

    customer_name = order.customer.name if order.customer else "Walk-in"
    table_info = f"Table {order.table.table_number}" if order.table else "Takeaway"
    payment_type = order.payment.payment_method.type.value.upper() if order.payment else "-"

    return f"""
    <html><body style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px">
        <h2 style="text-align:center;color:#6366f1">{app_name}</h2>
        <p style="text-align:center;color:#6b7280">Receipt — {order.order_number}</p>
        <hr/>
        <p><b>Customer:</b> {customer_name}</p>
        <p><b>Table:</b> {table_info}</p>
        <p><b>Cashier:</b> {order.employee.name}</p>
        <p><b>Date:</b> {order.created_at.strftime('%Y-%m-%d %H:%M')}</p>
        <hr/>
        <table width="100%" cellpadding="6" style="border-collapse:collapse">
            <thead style="background:#6366f1;color:white">
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>{items_html}</tbody>
        </table>
        <hr/>
        <table width="100%" cellpadding="4">
            <tr><td>Subtotal</td><td align="right">₹{float(order.subtotal):.2f}</td></tr>
            <tr><td>Tax</td><td align="right">₹{float(order.tax_amount):.2f}</td></tr>
            <tr><td>Discount</td><td align="right">-₹{float(order.discount_amount):.2f}</td></tr>
            <tr style="font-weight:bold;font-size:1.1em">
                <td>Total</td><td align="right">₹{float(order.total_amount):.2f}</td>
            </tr>
            <tr><td>Payment</td><td align="right">{payment_type}</td></tr>
        </table>
        <hr/>
        <p style="text-align:center;color:#9ca3af;font-size:12px">Thank you for visiting {app_name}!</p>
    </body></html>
    """


# ── PDF receipt builder ───────────────────────────────────────────────────────

def _build_pdf(order: Order, app_name: str = "Odoo Cafe POS") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A6, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"<b>{app_name}</b>", styles["Title"]))
    elements.append(Paragraph(f"Order: {order.order_number}", styles["Normal"]))
    elements.append(Paragraph(f"Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    if order.table:
        elements.append(Paragraph(f"Table: {order.table.table_number}", styles["Normal"]))
    if order.customer:
        elements.append(Paragraph(f"Customer: {order.customer.name}", styles["Normal"]))
    elements.append(HRFlowable(width="100%", color=colors.HexColor("#6366f1")))
    elements.append(Spacer(1, 6))

    for item in order.items:
        elements.append(Paragraph(
            f"{item.product.name} x{item.quantity} — ₹{float(item.line_total):.2f}",
            styles["Normal"],
        ))

    elements.append(HRFlowable(width="100%", color=colors.grey))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Subtotal: ₹{float(order.subtotal):.2f}", styles["Normal"]))
    elements.append(Paragraph(f"Tax: ₹{float(order.tax_amount):.2f}", styles["Normal"]))
    elements.append(Paragraph(f"Discount: -₹{float(order.discount_amount):.2f}", styles["Normal"]))
    elements.append(Paragraph(f"<b>Total: ₹{float(order.total_amount):.2f}</b>", styles["Normal"]))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("Thank you!", styles["Normal"]))

    doc.build(elements)
    return buffer.getvalue()


# ── Log receipt ───────────────────────────────────────────────────────────────

def _log(order_id: int, delivery: DeliveryMethod, sent_to: str | None, success: bool, db: Session) -> Receipt:
    receipt = Receipt(
        order_id=order_id,
        delivery=delivery,
        sent_to=sent_to,
        status=ReceiptStatus.sent if success else ReceiptStatus.failed,
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


# ── Public API ────────────────────────────────────────────────────────────────

def send_email(order_id: int, to_email: str, db: Session) -> Receipt:
    order = _get_paid_order(order_id, db)
    html = _build_html(order)
    pdf = _build_pdf(order)
    success = send_receipt_email(
        to_email=to_email,
        order_number=order.order_number,
        html_body=html,
        pdf_attachment=pdf,
    )
    return _log(order_id, DeliveryMethod.email, to_email, success, db)


def log_print(order_id: int, db: Session) -> bytes:
    """Logs a print action and returns the PDF bytes for the frontend to trigger print."""
    order = _get_paid_order(order_id, db)
    pdf = _build_pdf(order)
    _log(order_id, DeliveryMethod.print, None, True, db)
    return pdf


def get_history(order_id: int, db: Session) -> list[Receipt]:
    """Returns all receipt delivery records for an order."""
    return (
        db.query(Receipt)
        .filter(Receipt.order_id == order_id)
        .order_by(Receipt.sent_at.desc())
        .all()
    )
