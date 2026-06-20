from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.base import Base
from app.database.connection import engine
from app.database.seed import run_seed
from app.middleware.error_handler import (
    validation_exception_handler,
    integrity_error_handler,
    generic_exception_handler,
)
from app.controllers.auth import router as auth_router
from app.controllers.category import router as category_router
from app.controllers.product import router as product_router
from app.controllers.payment_method import router as payment_method_router
from app.controllers.floor import router as floor_router
from app.controllers.floor.table import router as table_router
from app.controllers.coupon import router as coupon_router
from app.controllers.promotion import router as promotion_router
from app.controllers.employee import router as employee_router
from app.controllers.customer import router as customer_router
from app.controllers.session import router as session_router
from app.controllers.order import router as order_router
from app.controllers.kitchen import router as kitchen_router
from app.controllers.self_order import router as self_order_router
from app.controllers.reports import router as reports_router
from app.controllers.receipt import router as receipt_router
from app.controllers.booking import router as booking_router
import app.models  # noqa: F401 — registers all models with Base.metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_seed()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# routers
app.include_router(auth_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(payment_method_router)
app.include_router(floor_router)
app.include_router(table_router)
app.include_router(coupon_router)
app.include_router(promotion_router)
app.include_router(employee_router)
app.include_router(customer_router)
app.include_router(session_router)
app.include_router(order_router)
app.include_router(kitchen_router)
app.include_router(self_order_router)
app.include_router(reports_router)
app.include_router(receipt_router)
app.include_router(booking_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
