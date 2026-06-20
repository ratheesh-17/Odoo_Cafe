# ☕ Odoo Cafe POS

> A complete, full-stack **Restaurant Point-of-Sale system** built for the hackathon — covering order management, kitchen display, payments, self-ordering via QR, real-time reporting, table/floor management, and more.

---

## 📸 Overview

Odoo Cafe POS is a production-grade café management system with three distinct interfaces:

| Interface | Description |
|---|---|
| **Backend (Admin Panel)** | Configure products, categories, tables, employees, discounts, payments, and view reports |
| **POS Terminal** | Employees take orders, manage carts, apply coupons, send to kitchen, and process payments |
| **Kitchen Display System (KDS)** | Real-time ticket board for kitchen staff — advance stages, mark items done |
| **Self Order (QR)** | Customers scan a table QR code, browse the menu, add items, and place orders |
| **Customer Facing Display** | Live order status shown to the customer during checkout |

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance REST API framework |
| **SQLAlchemy 2.0** | ORM with declarative mapped columns |
| **MySQL (PyMySQL)** | Relational database |
| **Pydantic v2** | Request/response validation and serialization |
| **python-jose** | JWT authentication |
| **passlib (bcrypt)** | Password hashing |
| **ReportLab** | PDF generation (receipts + reports) |
| **openpyxl** | Excel report exports |
| **qrcode[pil]** | UPI payment QR + table self-order QR generation |
| **SMTP (stdlib)** | Email receipt delivery |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework (CRA / react-scripts) |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with JWT interceptors |
| **Zustand** | Lightweight global state management |
| **Recharts** | Sales trend and category charts |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |

---

## 🗃️ Database Design

The schema covers **18 tables** with thoughtful referential integrity:

```
users               → sessions, orders
categories          → products
products            → order_items, promotions
payment_methods     → payments
floors              → tables
tables              → orders, bookings
customers           → orders, bookings
coupons             → orders
promotions          → orders
pos_sessions        → orders
orders              → order_items, payments, kitchen_tickets, receipts
order_items         → kitchen_ticket_items
kitchen_tickets     → kitchen_ticket_items
payments
receipts
bookings
self_order_config
```

### Key Design Decisions
- **Snapshot pattern** — `unit_price`, `tax_percent`, `subtotal`, `discount_amount`, `total_amount` are stored at order time so historical reports are always accurate regardless of future price changes
- **Discount traceability** — `coupon_id` and `promotion_id` are stored on orders for full reporting visibility
- **`show_in_kds` flag** on products — only relevant items appear on the kitchen display
- **`self_order_token`** on tables — UUID hex auto-generated on table creation for QR-based ordering
- **`ondelete` strategies** differ intentionally: `CASCADE` for child records, `RESTRICT` for referenced entities, `SET NULL` for optional links

---

## 🚀 Features

### Backend Admin
- ✅ Signup / Login with JWT authentication
- ✅ Product management (CRUD, archive/restore, KDS flag, category color)
- ✅ Category management with color picker (color propagates to POS cards)
- ✅ Payment method setup — Cash, Card, UPI (toggle enable, set UPI ID)
- ✅ Floor & table management with QR token per table
- ✅ Coupon codes — percentage/fixed, usage limits, expiry
- ✅ Automated promotions — product-level (min qty) and order-level (min amount)
- ✅ Employee/user management — roles, archive, change password
- ✅ Table bookings with full state machine (pending → confirmed → seated → completed / cancelled)
- ✅ Self-order configuration (online ordering / QR menu mode, background color/image)
- ✅ Reports dashboard — total orders, revenue, avg order value, sales trend chart, top categories, top products, top orders
- ✅ Export reports as **PDF** and **XLS**
- ✅ POS session management (open/close with closing summary)

### POS Terminal
- ✅ Floor/table selection popup with active order indicators
- ✅ Product grid with category filter tabs and search
- ✅ Full cart management — add, update quantity, remove items
- ✅ Product-level promotions auto-applied per cart line
- ✅ Order-level promotions auto-applied on recalculate
- ✅ Coupon code entry and validation
- ✅ Send to Kitchen — creates KDS ticket with only `show_in_kds` products
- ✅ Payment — Cash (change calculation), Card (transaction ref), UPI QR
- ✅ Receipt print (PDF) and email delivery
- ✅ Orders list with search, status filter, edit/delete draft orders

### Kitchen Display System (KDS)
- ✅ Real-time polling every 5 seconds
- ✅ Three-column board: **To Cook → Preparing → Completed**
- ✅ Click ticket to advance entire order to next stage
- ✅ Click individual item to mark it done (strikethrough)
- ✅ Auto-advance ticket when all items are done
- ✅ Filter by category and product
- ✅ Progress ring per ticket

### Self Ordering (QR)
- ✅ Customer scans table QR → lands on `/s/{token}/menu`
- ✅ Idempotent order creation (returns existing draft if present)
- ✅ Full cart — add, update, remove items
- ✅ Coupon code support
- ✅ Submit order → auto-sent to KDS
- ✅ Real-time order status tracking (kitchen stages + per-item done status)

### Customer Facing Display
- ✅ Accessible at `/customer-display?order_id=X`
- ✅ Polls every 3 seconds
- ✅ Shows order lines, totals, discounts
- ✅ Switches to UPI QR view when applicable
- ✅ Thank you screen after payment

---

## 📁 Project Structure

```
odoo-cafe-pos/
├── backend/
│   ├── app/
│   │   ├── controllers/      # FastAPI routers (one per domain)
│   │   ├── services/         # Business logic (one per domain)
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── middleware/       # Auth, role guards, error handlers
│   │   ├── database/         # Connection, Base, seed
│   │   ├── utils/            # JWT, password, QR, email, PDF, XLS
│   │   └── main.py           # FastAPI app entry point
│   ├── .env.example
│   ├── requirements.txt
│   └── alembic.ini
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── backend/      # Admin pages
    │   │   ├── pos/          # POS terminal pages
    │   │   └── kitchen/      # KDS page
    │   ├── layouts/          # BackendLayout, PosLayout
    │   ├── components/       # Shared UI components
    │   ├── api.js            # Axios instance
    │   └── auth.js           # Token helpers
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- MySQL 8.0+
- Node.js 18+

### Backend Setup

```bash
cd odoo-cafe-pos/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and a strong SECRET_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

The server auto-creates all tables on startup and seeds:
- 3 payment methods (cash / card / upi)
- Self-order config singleton
- Default admin: `admin@odoocafe.com` / `Admin@123`

### Frontend Setup

```bash
cd odoo-cafe-pos/frontend

npm install
npm start
# Opens at http://localhost:3000
```

> API calls from the frontend proxy to `http://localhost:8000` via `src/setupProxy.js`.

---

## 🔐 Authentication

- JWT Bearer tokens stored in `localStorage`
- Two roles: **admin** and **employee**
- Role guards on every endpoint:
  - `require_admin` — admin-only (backend config, reports, session)
  - `require_employee` — admin + employee (POS terminal, orders, customers)
- Kitchen Display and Self Order endpoints are public (no auth required)

### Default Credentials
```
Email:    admin@odoocafe.com
Password: Admin@123
```

---

## 🌐 API Reference

Full interactive docs available at:
- **Swagger UI** → `http://localhost:8000/docs`
- **ReDoc** → `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login and get JWT token |
| POST | `/auth/signup` | Create admin account |
| GET | `/sessions/current` | Get active POS session |
| POST | `/sessions/open` | Open a new session |
| POST | `/orders` | Create a new order |
| POST | `/orders/{id}/items` | Add item to cart |
| POST | `/orders/{id}/send-to-kitchen` | Send order to KDS |
| POST | `/orders/{id}/payment` | Process payment |
| GET | `/kitchen/tickets` | Get all kitchen tickets |
| POST | `/kitchen/tickets/{id}/advance` | Advance ticket stage |
| GET | `/reports/dashboard` | Full dashboard data |
| GET | `/reports/export/pdf` | Export PDF report |
| GET | `/s/{token}/menu` | Customer self-order menu |
| GET | `/customer-display/{order_id}` | Customer facing display data |

---

## 🧪 Architecture Highlights

- **3-layer architecture** — Controllers (HTTP) → Services (business logic) → Models (DB)
- **Snapshot pattern** — Financial fields stored on orders for immutable historical reporting
- **Promotion engine** — Re-evaluates product and order-level promotions on every cart mutation
- **Coupon lifecycle** — Validated at apply time, `used_count` incremented only at payment
- **KDS idempotency** — Re-sending to kitchen only adds new items not already in the ticket
- **Self-order isolation** — Token-based table validation prevents cross-table cart manipulation
- **Seeding on startup** — Payment methods, self-order config, and default admin auto-created

---

## 📊 Reporting

The reports dashboard supports 5 filters:
- **Period** (Today, 7 days, 30 days, This Month, All Time)
- **Employee**
- **Session**
- **Product**

Outputs:
- Summary metrics (total orders, revenue, avg order value, total discount, total tax)
- Sales trend chart (revenue per day)
- Top categories chart (bar, colored by category)
- Top products table (qty sold + revenue)
- Top orders table (highest value orders)
- Export as **PDF** (ReportLab) or **Excel** (openpyxl, 5 sheets)

---

## 📱 Self Ordering Flow

1. Admin enables Self Order in backend → choose **Online Ordering** or **QR Menu** mode
2. Tables automatically get a `self_order_token` (UUID hex) on creation
3. Admin downloads QR PDF from the Self Order config page → prints and places on tables
4. Customer scans QR → opens `{domain}/s/{token}`
5. Customer browses menu → adds items → applies coupon → submits order
6. Order is automatically sent to KDS
7. Customer can track kitchen stages in real time

---

## 🤝 Contributing

```bash
git clone https://github.com/ratheesh-17/Odoo_Cafe.git
cd Odoo_Cafe

# Backend
cd Odoo_Cafe/odoo-cafe-pos/backend
pip install -r requirements.txt

# Frontend
cd Odoo_Cafe/odoo-cafe-pos/frontend
npm install
```

---

## 📄 License

This project was built for a hackathon. All rights reserved © 2024 Odoo Cafe POS Team.

---

<p align="center">Built with ☕ for the hackathon — by the Odoo Cafe POS team</p>
