# 🍳 Odoo Cafe POS - Demo Setup Guide

This guide explains how to seed demo data and run the judges' demo.

## What's Seeded

The seed script (`app/database/seed.py`) automatically populates the database with:

### 👥 Users
- **Admin** — Full system access
  - Email: `admin@odoocafe.com`
  - Password: `Admin@123`
- **Employee (Alice)** — POS terminal access
  - Email: `alice@cafe.com`
  - Password: `Employee@123`

### 🏢 Venue
- **Floors:** 2 (Ground Floor, First Floor)
- **Tables:** 6 per floor (12 total), with self-order QR tokens

### ☕ Menu
- **Categories:** 4 (Drinks, Food, Desserts, Specials) with vibrant colors
- **Products:** 17 items
  - Drinks: Espresso, Cappuccino, Latte, Iced Coffee, Orange Juice
  - Food: Burger, Salad, Pizza, Sandwich, Pasta
  - Desserts: Cake, Cheesecake, Ice Cream, Brownie
  - Specials: Salmon, Ribeye Steak, Tandoori Chicken
- **Images:** Each product has a placeholder image URL (free service)

### 💳 Payment Methods
- Cash, Card, UPI (all enabled)

### 🎟️ Promotions
- **Coupons:** SAVE10 (10% off), DEMO5 (5% off)
- **Happy Hour:** 15% off select drinks

### 📋 Demo Orders
- **Draft Order:** Shows cart editing (table G1)
- **Sent-to-Kitchen:** Order in prep queue (table G2, with kitchen ticket)
- **Paid Order:** Completed order with receipt (takeaway)

### 🛒 Self-Order
- **Enabled:** Yes
- **Mode:** Online Ordering (full cart + checkout)
- **Background:** Peach gradient (matches main theme)
- **QR Codes:** Auto-generated for all tables

---

## Running the Seed

### Option 1: Automatic (Recommended)
The seed runs automatically when you start the backend:

```bash
cd odoo-cafe-pos/backend
python -m app.main
```

### Option 2: Manual
Run the seed script directly:

```bash
cd odoo-cafe-pos/backend
python run_seed.py
```

---

## Demo Scenarios for Judges

### Scenario 1: Admin Dashboard
1. Log in as **admin@odoocafe.com** / `Admin@123`
2. Navigate to `/backend`
3. Explore:
   - **Dashboard** — Overview of today's sales, orders, customers
   - **Products** — Browse the menu with images
   - **Categories** — See the vibrant category colors
   - **Self Order** — Download table QR codes as PDF
   - **Reports** — View historical data

### Scenario 2: POS Terminal (Employee)
1. Log in as **alice@cafe.com** / `Employee@123`
2. Go to `/pos`
3. Demonstrate:
   - **Order View** — Add products, see cart updates
   - **Send to Kitchen** — Forward order to kitchen display
   - **Payment** — Process cash, card, or UPI
   - **Table View** — Select tables for orders
   - **Customer Assignment** — Attach customer to order for loyalty

### Scenario 3: Kitchen Display
1. Navigate to `/kitchen`
2. Show:
   - Active kitchen tickets from demo orders
   - Stage filters (To Cook → Preparing → Completed)
   - Advance ticket stages
   - Mark items as done
   - Real-time updates

### Scenario 4: Customer Self-Order (QR Menu)
1. Open a table QR code (from admin panel or PDF)
2. Scan with phone or open direct URL: `/s/{token}`
3. Demonstrate:
   - Browse menu by category
   - Search products
   - Add to cart (if `online_ordering` mode)
   - Apply coupon (e.g., SAVE10)
   - Submit order
   - Real-time order status tracking

### Scenario 5: Order Tracking
1. After placing an order via self-order:
2. Track progress through kitchen stages
3. Show status screen with stage emojis and estimated time

---

## Database & Migrations

If you need to reset the demo:

1. **Drop & recreate DB:**
   ```bash
   # Stop backend first
   # Then in your DB client (psql/mysql):
   DROP DATABASE odoocafe;
   CREATE DATABASE odoocafe;
   ```

2. **Apply migrations:**
   ```bash
   cd odoo-cafe-pos/backend
   alembic upgrade head
   ```

3. **Re-seed:**
   ```bash
   python run_seed.py
   # or start backend normally
   python -m app.main
   ```

---

## Frontend Setup

In a separate terminal:

```bash
cd odoo-cafe-pos/frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000` by default.

---

## Tips for Judges

- ✨ **Theme:** Peach color palette throughout for cohesive design
- 🎯 **Responsive:** Sidebar collapses on mobile, navigation persists
- ⚡ **Real-time:** Kitchen display updates in real-time
- 📱 **QR Flow:** Customers can order via phone using table QR codes
- 💾 **Data Persistence:** All demo data is seeded into the database

---

## Troubleshooting

### "Database not found" error
→ Ensure PostgreSQL is running and `DATABASE_URL` env is set correctly.

### "Alembic error"
→ Run `alembic upgrade head` to apply all migrations.

### "Seed incomplete"
→ Check logs for FK constraint errors; ensure tables are created before seeding.

### "Images not loading"
→ The seed uses free placeholder URLs (picsum.photos). Requires internet connection.

---

## What's NOT Seeded

- **Bookings** — You can create via Admin → Bookings
- **Custom Promotions** — Currently 1 Happy Hour promo. Add more in Admin
- **Receipt Templates** — Uses default template; can be customized in backend
- **Inventory/Stock** — Not tracked; all products are unlimited

---

Enjoy the demo! 🚀
