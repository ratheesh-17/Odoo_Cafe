from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from app.schemas.reports import DashboardResponse


def export_pdf(data: DashboardResponse, title: str = "Sales Report") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(title, styles["Title"]))
    elements.append(Spacer(1, 12))

    # Summary
    elements.append(Paragraph("Summary", styles["Heading2"]))
    summary_data = [
        ["Metric", "Value"],
        ["Total Orders", str(data.summary.total_orders)],
        ["Revenue", f"₹{data.summary.revenue:,.2f}"],
        ["Avg Order Value", f"₹{data.summary.avg_order_value:,.2f}"],
        ["Total Discount", f"₹{data.summary.total_discount:,.2f}"],
        ["Total Tax", f"₹{data.summary.total_tax:,.2f}"],
    ]
    _add_table(elements, summary_data)
    elements.append(Spacer(1, 12))

    # Top Products
    if data.top_products:
        elements.append(Paragraph("Top Products", styles["Heading2"]))
        product_data = [["Product", "Category", "Qty Sold", "Revenue"]] + [
            [r.product_name, r.category_name, str(r.quantity_sold), f"₹{r.revenue:,.2f}"]
            for r in data.top_products
        ]
        _add_table(elements, product_data)
        elements.append(Spacer(1, 12))

    # Top Categories
    if data.top_categories:
        elements.append(Paragraph("Top Categories", styles["Heading2"]))
        cat_data = [["Category", "Orders", "Revenue"]] + [
            [r.category_name, str(r.order_count), f"₹{r.revenue:,.2f}"]
            for r in data.top_categories
        ]
        _add_table(elements, cat_data)
        elements.append(Spacer(1, 12))

    # Top Orders
    if data.top_orders:
        elements.append(Paragraph("Top Orders", styles["Heading2"]))
        order_data = [["Order #", "Employee", "Customer", "Total"]] + [
            [r.order_number, r.employee_name, r.customer_name or "-", f"₹{r.total_amount:,.2f}"]
            for r in data.top_orders
        ]
        _add_table(elements, order_data)

    doc.build(elements)
    return buffer.getvalue()


def _add_table(elements, data):
    t = Table(data, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366f1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
