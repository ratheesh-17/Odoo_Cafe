# Odoo Cafe POS - Backend API Documentation

**API Base URL**: `http://localhost:8000`
**API Version**: 1.0.0
**Database**: MySQL (localhost:3306, odoo_cafe_pos)

---

## Table of Contents
1. [API Configuration & Health](#api-configuration--health)
2. [Authentication](#authentication)
3. [Authorization Levels](#authorization-levels)
4. [Endpoints by Feature](#endpoints-by-feature)
5. [Data Models & Schemas](#data-models--schemas)
6. [Issues & Missing Endpoints](#issues--missing-endpoints)

---

## API Configuration & Health

### Configuration (from config.py)
- **Database**: MySQL with PyMySQL driver
- **JWT**: HS256, 1-day token expiration
- **SMTP**: Gmail configuration for email notifications
- **CORS**: Enabled for localhost:3000 and localhost:5173 (React/Vite frontends)
- **App Name**: Odoo Cafe POS

### Health Check Endpoint
```
GET /health
Response: { "status": "ok", "app": "Odoo Cafe POS" }
```

### API Documentation
- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`

---

## Authentication

### Auth Endpoints

#### 1. User Signup
```
POST /auth/signup
Status: 201 Created
Authorization: None (public)

Request:
{
  "name": "string",
  "email": "user@example.com",
  "password": "string (min 8 chars)"
}

Response (TokenResponse):
{
  "access_token": "jwt_token_here",
  "token_type": "bearer"
}

Validations:
- Name: must not be empty
- Password: min 8 characters
- Email: must be valid and unique
```

#### 2. User Login
```
POST /auth/login
Status: 200 OK
Authorization: None (public)

Request:
{
  "email": "user@example.com",
  "password": "string"
}

Response (TokenResponse):
{
  "access_token": "jwt_token_here",
  "token_type": "bearer"
}
```

#### 3. Get Current User
```
GET /auth/me
Status: 200 OK
Authorization: Required (Bearer token)

Response (CurrentUserResponse):
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin" | "employee",
  "is_active": true
}
```

---

## Authorization Levels

### Role-Based Access Control

**Two Roles Exist**:
1. **admin** - Full system access, can create/edit/delete users, coupons, promotions, sessions, products, categories, floors, tables
2. **employee** - Limited access, can take orders, process payments, view reports (limited), manage customers, view bookings

### Middleware Guards
- `require_employee`: POST/GET requests require employee role (or admin)
- `require_admin`: Restricted endpoints require admin role

---

## Endpoints by Feature

### 1. AUTHENTICATION (3 endpoints)

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/auth/signup` | None | TokenResponse |
| POST | `/auth/login` | None | TokenResponse |
| GET | `/auth/me` | Bearer | CurrentUserResponse |

---

### 2. PRODUCT MANAGEMENT (5 endpoints)
**Prefix**: `/products`
**Tag**: Products

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/products` | Employee | category_id, search, include_archived | list[ProductResponse] |
| GET | `/products/{product_id}` | Admin | - | ProductResponse |
| POST | `/products` | Admin | - | ProductResponse (201) |
| PUT | `/products/{product_id}` | Admin | - | ProductResponse |
| DELETE | `/products/{product_id}` | Admin | - | 204 No Content |

**ProductCreate Schema**:
```json
{
  "name": "string (required)",
  "category_id": "int (required)",
  "price": "float (required, >= 0)",
  "unit_of_measure": "piece|kg|liter|etc (default: piece)",
  "tax_percent": "float (0-100, default: 0)",
  "description": "string | null",
  "show_in_kds": "boolean (default: true)"
}
```

**ProductUpdate Schema**: All fields optional (partial update)

**ProductResponse** includes:
- id, name, category (with color), price, unit_of_measure, tax_percent
- description, show_in_kds, is_active, created_at, updated_at

---

### 3. CATEGORY MANAGEMENT (5 endpoints)
**Prefix**: `/categories`
**Tag**: Categories

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/categories` | None | list[CategoryResponse] |
| GET | `/categories/{category_id}` | None | CategoryResponse |
| POST | `/categories` | Admin | CategoryResponse (201) |
| PUT | `/categories/{category_id}` | Admin | CategoryResponse |
| DELETE | `/categories/{category_id}` | Admin | 204 No Content |

**CategoryCreate Schema**:
```json
{
  "name": "string (required)",
  "color": "hex color (optional)"
}
```

---

### 4. EMPLOYEE/USER MANAGEMENT (8 endpoints)
**Prefix**: `/users`
**Tag**: User & Employee Management

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/users` | Admin | list[UserResponse] |
| GET | `/users/{user_id}` | Admin | UserResponse |
| POST | `/users` | Admin | UserResponse (201) |
| PUT | `/users/{user_id}` | Admin | UserResponse |
| PATCH | `/users/{user_id}/change-password` | Admin | UserResponse |
| PATCH | `/users/{user_id}/archive` | Admin | UserResponse |
| PATCH | `/users/{user_id}/unarchive` | Admin | UserResponse |
| DELETE | `/users/{user_id}` | Admin | 204 No Content |

**UserCreate Schema**:
```json
{
  "name": "string (required, non-empty)",
  "email": "email (required, unique)",
  "password": "string (required, min 8 chars)",
  "role": "admin|employee (default: employee)"
}
```

**UserResponse** includes:
- id, name, email, role, is_active, created_at, updated_at

---

### 5. PAYMENT METHODS (3 endpoints)
**Prefix**: `/payment-methods`
**Tag**: Payment Methods

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/payment-methods` | Employee | - | list[PaymentMethodResponse] |
| GET | `/payment-methods/upi/qr` | Employee | amount (required) | { upi_id, amount, qr_base64 } |
| PUT | `/payment-methods/{payment_type}` | Admin | - | PaymentMethodResponse |

**Payment Types**: cash, card, upi, mobile_wallet, online_transfer

**PaymentMethodUpdate Schema**:
```json
{
  "is_enabled": "boolean",
  "upi_id": "string (UPI ID for UPI payments)",
  "min_amount": "float",
  "max_amount": "float"
}
```

---

### 6. ORDER MANAGEMENT (10 core + sub-endpoints)
**Prefix**: `/orders`
**Tag**: Orders

#### Core Order Endpoints

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/orders` | Employee | session_id, status, search | list[OrderResponse] |
| GET | `/orders/{order_id}` | Employee | - | OrderResponse |
| POST | `/orders` | Employee | - | OrderResponse (201) |
| PUT | `/orders/{order_id}` | Employee | - | OrderResponse |
| POST | `/orders/{order_id}/cancel` | Employee | - | OrderResponse |
| DELETE | `/orders/{order_id}` | Employee | - | 204 No Content |

**OrderCreate Schema**:
```json
{
  "table_id": "int | null",
  "customer_id": "int | null",
  "note": "string | null"
}
```

#### Cart Management Sub-Endpoints

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/orders/{order_id}/items` | Employee | OrderResponse |
| PUT | `/orders/{order_id}/items/{item_id}` | Employee | OrderResponse |
| DELETE | `/orders/{order_id}/items/{item_id}` | Employee | OrderResponse |

**CartItemAdd Schema**:
```json
{
  "product_id": "int (required)",
  "quantity": "int (default: 1, >= 1)",
  "note": "string | null"
}
```

#### Coupon & Payment Sub-Endpoints

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/orders/{order_id}/coupon` | Employee | OrderResponse |
| DELETE | `/orders/{order_id}/coupon` | Employee | OrderResponse |
| POST | `/orders/{order_id}/send-to-kitchen` | Employee | OrderResponse |
| POST | `/orders/{order_id}/payment` | Employee | OrderResponse |

**CouponApply Schema**:
```json
{
  "code": "string (required, uppercase)"
}
```

**PaymentCreate Schema**:
```json
{
  "payment_type": "cash|card|upi|mobile_wallet|online_transfer (required)",
  "amount_paid": "float (required, > 0)",
  "transaction_ref": "string | null (required for card)"
}
```

**OrderResponse** includes:
- id, order_number, session_id, table_id, customer_id, employee_id
- status (draft, sent_to_kitchen, paid, cancelled)
- order_source (pos, self_order)
- subtotal, tax_amount, discount_amount, total_amount
- items: list[OrderItemResponse]
- coupon_id, promotion_id
- created_at, updated_at

---

### 7. FLOOR & TABLE MANAGEMENT (10 endpoints)

#### Floors (5 endpoints)
**Prefix**: `/floors`
**Tag**: Floors

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/floors` | Employee | list[FloorResponse] |
| GET | `/floors/{floor_id}` | Employee | FloorResponse |
| POST | `/floors` | Admin | FloorResponse (201) |
| PUT | `/floors/{floor_id}` | Admin | FloorResponse |
| DELETE | `/floors/{floor_id}` | Admin | 204 No Content |

**FloorCreate Schema**:
```json
{
  "name": "string (required)",
  "display_order": "int (optional)"
}
```

#### Tables (5 endpoints)
**Prefix**: `/tables`
**Tag**: Tables

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/tables` | Employee | floor_id | list[TableResponse] |
| GET | `/tables/{table_id}` | Employee | - | TableResponse |
| POST | `/tables` | Admin | - | TableResponse (201) |
| PUT | `/tables/{table_id}` | Admin | - | TableResponse |
| DELETE | `/tables/{table_id}` | Admin | - | 204 No Content |

**TableCreate Schema**:
```json
{
  "floor_id": "int (required)",
  "table_number": "string (required)",
  "capacity": "int (required, > 0)",
  "is_active": "boolean (default: true)"
}
```

**TableResponse** includes:
- id, floor_id, floor: FloorResponse
- table_number, capacity, is_active
- current_order_id, self_order_token
- created_at, updated_at

---

### 8. COUPON MANAGEMENT (6 endpoints)
**Prefix**: `/coupons`
**Tag**: Coupons

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/coupons` | Admin | list[CouponResponse] |
| GET | `/coupons/{coupon_id}` | Admin | CouponResponse |
| POST | `/coupons` | Admin | CouponResponse (201) |
| PUT | `/coupons/{coupon_id}` | Admin | CouponResponse |
| DELETE | `/coupons/{coupon_id}` | Admin | 204 No Content |
| GET | `/coupons/redeem/{code}` | Employee | CouponResponse |

**CouponCreate Schema**:
```json
{
  "code": "string (required, unique, uppercase)",
  "discount_type": "percentage|fixed_amount (required)",
  "discount_value": "float (required, > 0)",
  "usage_limit": "int | null",
  "expires_at": "datetime | null",
  "is_active": "boolean (default: true)"
}
```

**CouponResponse** includes:
- id, code, discount_type, discount_value
- is_active, usage_limit, used_count, expires_at
- created_at, updated_at

---

### 9. PROMOTION MANAGEMENT (5 endpoints)
**Prefix**: `/promotions`
**Tag**: Promotions

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/promotions` | Admin | list[PromotionResponse] |
| GET | `/promotions/{promotion_id}` | Admin | PromotionResponse |
| POST | `/promotions` | Admin | PromotionResponse (201) |
| PUT | `/promotions/{promotion_id}` | Admin | PromotionResponse |
| DELETE | `/promotions/{promotion_id}` | Admin | 204 No Content |

**PromotionCreate Schema**:
```json
{
  "name": "string (required)",
  "description": "string | null",
  "discount_type": "percentage|fixed_amount (required)",
  "discount_value": "float (required, > 0)",
  "applicable_products": "list[int] | null (product IDs)",
  "applicable_categories": "list[int] | null (category IDs)",
  "min_order_amount": "float (optional)",
  "is_active": "boolean (default: true)",
  "starts_at": "datetime | null",
  "ends_at": "datetime | null"
}
```

---

### 10. CUSTOMER MANAGEMENT (5 endpoints)
**Prefix**: `/customers`
**Tag**: Customers

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/customers` | Employee | search | list[CustomerResponse] |
| GET | `/customers/{customer_id}` | Employee | - | CustomerResponse |
| POST | `/customers` | Employee | - | CustomerResponse (201) |
| PUT | `/customers/{customer_id}` | Employee | - | CustomerResponse |
| DELETE | `/customers/{customer_id}` | Employee | - | 204 No Content |

**CustomerCreate Schema**:
```json
{
  "name": "string (required)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "loyalty_points": "float (optional, default: 0)"
}
```

**CustomerResponse** includes:
- id, name, phone, email, loyalty_points
- total_orders, total_spent
- created_at, updated_at

---

### 11. SESSION MANAGEMENT (4 endpoints)
**Prefix**: `/sessions`
**Tag**: POS Sessions

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/sessions` | Admin | list[SessionResponse] |
| GET | `/sessions/current` | Employee | SessionResponse \| null |
| POST | `/sessions/open` | Admin | SessionResponse (201) |
| POST | `/sessions/{session_id}/close` | Admin | SessionResponse |

**SessionOpen Schema**:
```json
{
  "opening_cash_amount": "float (required, > 0)"
}
```

**SessionClose Schema**:
```json
{
  "closing_cash_amount": "float (required, > 0)",
  "notes": "string | null"
}
```

**SessionResponse** includes:
- id, opened_by_user_id, opened_by_user: UserResponse
- opening_time, closing_time
- opening_cash_amount, closing_cash_amount
- cash_in_register, total_sales
- status (open, closed)
- created_at, updated_at

---

### 12. KITCHEN DISPLAY SYSTEM (3 endpoints)
**Prefix**: `/kitchen`
**Tag**: Kitchen Display

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/kitchen/tickets` | None | stage, product_id, category_id | list[KitchenTicketResponse] |
| POST | `/kitchen/tickets/{ticket_id}/advance` | None | - | KitchenTicketResponse |
| POST | `/kitchen/tickets/{ticket_id}/items/{ticket_item_id}/done` | None | - | KitchenTicketResponse |

**KitchenTicket States**: received → preparing → ready → completed

**KitchenTicketResponse** includes:
- id, order_id, status/stage
- items: list[KitchenTicketItemResponse]
- created_at, updated_at

---

### 13. SELF-ORDERING SYSTEM (13 endpoints)
**Prefix**: `/s` (customer-facing, public) and `/self-order` (admin config)
**Tag**: Self Order

#### Admin Configuration (3 endpoints)

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/self-order/config` | Admin | SelfOrderConfigResponse |
| PUT | `/self-order/config` | Admin | SelfOrderConfigResponse |
| GET | `/self-order/tables/{table_id}/qr-url` | Admin | { table_id, qr_url } |
| GET | `/self-order/tables/{table_id}/qr-image` | Admin | { table_id, qr_base64 } |
| GET | `/self-order/qr-pdf` | Admin | PDF file |

**SelfOrderConfigUpdate Schema**:
```json
{
  "enabled": "boolean",
  "background_color": "hex color (optional)",
  "background_image": "string URL (optional)",
  "branding_name": "string (optional)"
}
```

#### Customer-Facing Endpoints (No Auth Required)

| Method | Endpoint | Query | Response |
|--------|----------|-------|----------|
| GET | `/s/{token}/menu` | - | MenuResponse |
| POST | `/s/{token}/orders` | - | OrderResponse |
| POST | `/s/{token}/orders/{order_id}/items` | - | OrderResponse |
| PUT | `/s/{token}/orders/{order_id}/items/{item_id}` | - | OrderResponse |
| DELETE | `/s/{token}/orders/{order_id}/items/{item_id}` | - | OrderResponse |
| POST | `/s/{token}/orders/{order_id}/coupon` | - | OrderResponse |
| POST | `/s/{token}/orders/{order_id}/submit` | - | OrderResponse |

**MenuResponse** includes:
- categories with products
- self-order config (colors, branding)
- table info
- available coupons

---

### 14. RECEIPT & PRINTING (3 endpoints)
**Prefix**: `/orders`
**Tag**: Receipts

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/orders/{order_id}/receipt/email` | Employee | ReceiptResponse |
| GET | `/orders/{order_id}/receipt/print` | Employee | PDF file (inline) |
| GET | `/orders/{order_id}/receipts` | Employee | list[ReceiptResponse] |

**SendEmailRequest Schema**:
```json
{
  "email": "string (required)"
}
```

---

### 15. BOOKING MANAGEMENT (6 endpoints)
**Prefix**: `/bookings`
**Tag**: Bookings

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/bookings` | Employee | status, date_from, date_to | list[BookingResponse] |
| GET | `/bookings/{booking_id}` | Employee | - | BookingResponse |
| POST | `/bookings` | Employee | - | BookingResponse (201) |
| PUT | `/bookings/{booking_id}` | Employee | - | BookingResponse |
| PATCH | `/bookings/{booking_id}/status` | Employee | - | BookingResponse |
| DELETE | `/bookings/{booking_id}` | Admin | - | 204 No Content |

**BookingCreate Schema**:
```json
{
  "customer_name": "string (required)",
  "phone": "string (required)",
  "email": "string (optional)",
  "guest_count": "int (required, > 0)",
  "booking_time": "datetime (required)",
  "notes": "string | null"
}
```

**BookingStatusUpdate Schema**:
```json
{
  "status": "pending|confirmed|seated|completed|cancelled (required)"
}
```

**Booking Status Flow**: pending → confirmed → seated → completed / cancelled

---

### 16. REPORTS & ANALYTICS (3 endpoints)
**Prefix**: `/reports`
**Tag**: Reports

| Method | Endpoint | Auth | Query Params | Response |
|--------|----------|------|--------------|----------|
| GET | `/reports/dashboard` | Admin | date_from, date_to, employee_id, session_id, product_id | DashboardResponse |
| GET | `/reports/export/pdf` | Admin | (same filters) | PDF file |
| GET | `/reports/export/xls` | Admin | (same filters) | XLS file |

**DashboardResponse** includes:
- Total sales (today, this week, this month)
- Revenue by payment method
- Top selling products
- Employee performance metrics
- Customer metrics
- Inventory turnover
- Charts data

---

## Data Models & Schemas

### Core Enums

```python
class UserRole(str, enum.Enum):
    admin = "admin"
    employee = "employee"

class OrderStatus(str, enum.Enum):
    draft = "draft"
    sent_to_kitchen = "sent_to_kitchen"
    paid = "paid"
    cancelled = "cancelled"

class OrderSource(str, enum.Enum):
    pos = "pos"
    self_order = "self_order"

class PaymentType(str, enum.Enum):
    cash = "cash"
    card = "card"
    upi = "upi"
    mobile_wallet = "mobile_wallet"
    online_transfer = "online_transfer"

class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    seated = "seated"
    completed = "completed"
    cancelled = "cancelled"

class KitchenStage(str, enum.Enum):
    received = "received"
    preparing = "preparing"
    ready = "ready"
    completed = "completed"

class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed_amount = "fixed_amount"

class UnitOfMeasure(str, enum.Enum):
    piece = "piece"
    kg = "kg"
    liter = "liter"
    gram = "gram"
    ml = "ml"
```

### Key Relationships

```
User (1) → (M) Order (employee)
User (1) → (M) PosSession (opened_by_user)

PosSession (1) → (M) Order

Order (M) → (1) Table
Order (M) → (1) Customer
Order (M) → (1) Coupon
Order (M) → (1) Promotion
Order (1) → (1) Payment
Order (1) → (1) KitchenTicket
Order (1) → (M) Receipt

Product (M) → (1) Category
Product (1) → (M) OrderItem

Floor (1) → (M) Table

Coupon (1) → (M) Order
Promotion (1) → (M) Order
```

---

## Issues & Missing Endpoints

### 🚨 Critical Issues

1. **UPI QR Code Generation Issue** - `/payment-methods/upi/qr`
   - Current: Endpoint exists but lacks proper error handling for disabled payment methods
   - **Fix Needed**: Validate UPI is enabled and configured before generating QR

2. **Self-Order Auth Issue** - `/s/{token}/menu` and related endpoints
   - Current: No token validation - anyone can access any table's menu with any token
   - **Fix Needed**: Verify token matches an active table before returning menu/order data
   - **Risk**: Customer data privacy breach

3. **Order Cancellation Rules** - `/orders/{order_id}/cancel`
   - Current: No business logic to prevent cancellation of already-paid orders
   - **Fix Needed**: Add status checks - cannot cancel paid or completed orders

4. **Session Management Gap**
   - Current: No endpoint to check if a session is active or get active session for an employee
   - **Fix Needed**: Add `GET /sessions/active` to return currently open session

### ⚠️ Missing Endpoints

1. **Bulk Operations**
   - No bulk delete for products, coupons, promotions
   - No bulk status updates for bookings or orders
   - **Recommended**: Add `DELETE /products/bulk` with payload: { ids: [1,2,3] }

2. **Inventory/Stock Tracking**
   - No endpoints for product stock management
   - No low-stock alerts
   - **Recommended**: Add `/products/{id}/stock` endpoints if stock tracking is needed

3. **Customer Loyalty Program**
   - Customer model has `loyalty_points` field but no endpoints to:
     - Apply loyalty points to orders
     - View loyalty history
     - Redeem points
   - **Recommended**: Add `/customers/{id}/loyalty` endpoints

4. **Table Merging for Large Groups**
   - No endpoint to merge multiple tables into one order
   - **Recommended**: Add `POST /orders/merge` to combine multiple orders

5. **Order Splitting**
   - No endpoint to split a single order into multiple orders (e.g., separate bills)
   - **Recommended**: Add `POST /orders/{id}/split` endpoint

6. **Payment Reversal/Refunds**
   - No endpoint to refund a payment or adjust paid orders
   - **Recommended**: Add `POST /orders/{order_id}/refund` endpoint

7. **Receipt Reprinting**
   - No endpoint to reprint an old receipt for a historical order
   - **Recommended**: Add `POST /orders/{order_id}/receipt/print-history` endpoint

8. **Audit Trail**
   - No endpoint to view who made changes to products, coupons, users, etc.
   - **Recommended**: Add audit logging middleware and `/audit-logs` endpoint

9. **Staff Performance Metrics**
   - No real-time or historical performance endpoints for employees
   - **Recommended**: Add `/reports/employee-performance` endpoint

10. **Table Status Real-Time**
    - No WebSocket or polling endpoint for real-time table status updates
    - **Recommended**: Add WebSocket `/ws/tables` for live updates

### ⚠️ Data Validation Issues

1. **Product Price Validation**
   - Schema allows `price: 0` (free products) - may not be intended
   - **Recommendation**: Change validation to `price > 0` (min 0.01)

2. **Discount Application Logic**
   - No clear rules on combining coupons + promotions
   - **Recommendation**: Document/enforce: Cannot apply both coupon AND promotion

3. **Table Capacity Validation**
   - No check that booking `guest_count` doesn't exceed table `capacity`
   - **Recommendation**: Add validation in booking creation

4. **Email Validation**
   - Signup/Login requires EmailStr, but update endpoints don't validate email format changes
   - **Recommendation**: Add email validation to user update

### ⚠️ Frontend Compatibility Issues

1. **Self-Order Token Management**
   - Self-order endpoints require `{token}` in URL but never show how token is generated or provided to customers
   - **Impact**: Frontend won't know how to generate QR codes for tables
   - **Needed**: Documentation on token generation and storage

2. **No Pagination**
   - All list endpoints return entire collection (no limit/offset)
   - **Issue**: Will cause performance problems with thousands of orders/products
   - **Recommendation**: Add `limit` and `offset` query parameters to all GET list endpoints

3. **Search Implementation**
   - Orders search parameter accepts "date (YYYY-MM-DD)" but format is unclear
   - **Recommendation**: Create separate `date_from` and `date_to` filters instead

4. **Order Response Structure**
   - OrderResponse includes nested objects (category, product) but response structure varies
   - **Issue**: Frontend needs clear schema contract
   - **Recommendation**: Generate and share OpenAPI schema with frontend team

5. **Error Response Format**
   - Inconsistent error handling (validation errors vs. business logic errors)
   - **Recommendation**: Standardize error response format across all endpoints

### 🔧 Recommended Enhancements

1. **Add API Rate Limiting** - Prevent abuse of payment and self-order endpoints
2. **Add Request/Response Logging** - For audit trail and debugging
3. **Add Caching Headers** - GET /categories, /products should be cacheable
4. **Add Batch Endpoints** - POST /orders/batch for multiple orders
5. **Add Webhook Support** - For external POS integrations
6. **Add Export Endpoints** - CSV export for orders, customers, products (not just PDF/XLS)
7. **Add Sync Endpoints** - For mobile/offline POS terminals
8. **Add Health Check Versions** - Endpoint to check database connectivity, file access, etc.

---

## Summary Statistics

| Feature | Endpoints | Public | Protected |
|---------|-----------|--------|-----------|
| Auth | 3 | 2 | 1 |
| Products | 5 | 1 | 4 |
| Categories | 5 | 2 | 3 |
| Users/Employees | 8 | 0 | 8 |
| Payment Methods | 3 | 0 | 3 |
| Orders | 10 | 0 | 10 |
| Floors | 5 | 0 | 5 |
| Tables | 5 | 0 | 5 |
| Coupons | 6 | 0 | 6 |
| Promotions | 5 | 0 | 5 |
| Customers | 5 | 0 | 5 |
| Sessions | 4 | 0 | 4 |
| Kitchen | 3 | 3 | 0 |
| Self-Order | 13 | 7 | 6 |
| Receipts | 3 | 0 | 3 |
| Bookings | 6 | 0 | 6 |
| Reports | 3 | 0 | 3 |
| **TOTAL** | **101** | **15** | **86** |

---

## Frontend Integration Checklist

- [ ] Implement authentication flow (signup/login/logout)
- [ ] Implement token refresh logic (1-day expiration)
- [ ] Implement role-based UI rendering (admin vs employee)
- [ ] Implement error handling for all 4xx and 5xx responses
- [ ] Implement pagination for all list endpoints (when added)
- [ ] Implement real-time order updates (WebSocket or polling)
- [ ] Implement KDS display with live updates
- [ ] Implement self-order QR code scanning and menu display
- [ ] Implement receipt printing via PDF
- [ ] Implement payment method selection UI
- [ ] Implement coupon/promotion application
- [ ] Implement offline mode for POS terminals (sync when online)
- [ ] Implement analytics dashboard
- [ ] Add request/response logging for debugging
- [ ] Add performance monitoring (slow endpoints)
- [ ] Test all edge cases (network timeouts, 500 errors, etc.)

---

**Last Updated**: 2024
**API Status**: Partially Complete - See Issues Section
