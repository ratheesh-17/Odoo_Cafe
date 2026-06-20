import qrcode
import qrcode.image.svg
from io import BytesIO
import base64
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Image, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet


def _qr_to_base64(data: str) -> str:
    """Generate a QR code from data string and return as base64-encoded PNG."""
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _qr_to_bytes(data: str) -> bytes:
    """Generate a QR code and return raw PNG bytes."""
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_upi_qr(upi_id: str, amount: float, note: str = "Payment") -> str:
    """
    Generates a UPI payment QR code string.
    UPI deep link format: upi://pay?pa=<upi_id>&pn=<name>&am=<amount>&cu=INR&tn=<note>
    Returns base64-encoded PNG.
    """
    upi_url = f"upi://pay?pa={upi_id}&pn=Cafe&am={amount:.2f}&cu=INR&tn={note}"
    return _qr_to_base64(upi_url)


def generate_table_qr_base64(token: str, domain: str) -> str:
    """
    Generates a self-order QR code for a table.
    URL format: <domain>/s/<token>
    Returns base64-encoded PNG.
    """
    url = f"{domain}/s/{token}"
    return _qr_to_base64(url)


def generate_table_qr_pdf(tables: list[dict], domain: str) -> bytes:
    """
    Generates a downloadable PDF with one QR code per table.
    tables: list of {"table_number": str, "floor_name": str, "token": str}
    Returns raw PDF bytes.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Table QR Codes", styles["Title"]))
    elements.append(Spacer(1, 16))

    table_data = []
    row = []
    for i, t in enumerate(tables):
        url = f"{domain}/s/{t['token']}"
        qr_bytes = _qr_to_bytes(url)
        qr_img = Image(BytesIO(qr_bytes), width=110, height=110)

        label = Paragraph(
            f"<b>{t['table_number']}</b><br/>{t['floor_name']}<br/><font size=6>{url}</font>",
            styles["Normal"],
        )
        cell = [qr_img, label]
        row.append(cell)

        if len(row) == 3 or i == len(tables) - 1:
            # pad row to 3 columns
            while len(row) < 3:
                row.append("")
            table_data.append(row)
            row = []

    if table_data:
        t = Table(table_data, colWidths=[175, 175, 175])
        elements.append(t)

    doc.build(elements)
    return buffer.getvalue()
