from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin, require_employee
from app.models.user import User
from app.schemas.session import SessionOpen, SessionClose, SessionResponse
import app.services.session as session_service

router = APIRouter(prefix="/sessions", tags=["POS Sessions"])


@router.get("", response_model=list[SessionResponse])
def list_sessions(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return [session_service._build_response(s) for s in session_service.get_all(db)]


@router.get("/current", response_model=SessionResponse | None)
def get_current_session(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    session = session_service.get_current(db)
    if not session:
        return None
    return session_service._build_response(session)


@router.post("/open", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def open_session(
    payload: SessionOpen,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return session_service.open_session(payload, current_user, db)


@router.post("/{session_id}/close", response_model=SessionResponse)
def close_session(
    session_id: int,
    payload: SessionClose,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return session_service.close_session(session_id, payload, db)
