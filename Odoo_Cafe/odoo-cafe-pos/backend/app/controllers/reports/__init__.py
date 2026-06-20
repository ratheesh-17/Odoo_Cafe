from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin
from app.models.user import User
from app.schemas.reports import DashboardResponse
from app.utils.pdf_exporter import export_pdf
from app.utils.xls_exporter import export_xls
import app.services.reports as reports_service

router = APIRouter(prefix="/reports", tags=["Reports"])


def _get_filters(
    date_from: date | None = Query(None, description="Start date e.g. 2024-01-01"),
    date_to: date | None = Query(None, description="End date e.g. 2024-01-31"),
    employee_id: int | None = Query(None),
    session_id: int | None = Query(None),
    product_id: int | None = Query(None),
):
    return {
        "date_from": date_from,
        "date_to": date_to,
        "employee_id": employee_id,
        "session_id": session_id,
        "product_id": product_id,
    }


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    filters: dict = Depends(_get_filters),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Returns all dashboard metrics, charts and tables.
    All stats update automatically when a filter changes.
    """
    return reports_service.get_dashboard(db, **filters)


@router.get("/export/pdf")
def export_pdf_report(
    filters: dict = Depends(_get_filters),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    data = reports_service.get_dashboard(db, **filters)
    pdf_bytes = export_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=sales_report.pdf"},
    )


@router.get("/export/xls")
def export_xls_report(
    filters: dict = Depends(_get_filters),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    data = reports_service.get_dashboard(db, **filters)
    xls_bytes = export_xls(data)
    return Response(
        content=xls_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=sales_report.xlsx"},
    )
