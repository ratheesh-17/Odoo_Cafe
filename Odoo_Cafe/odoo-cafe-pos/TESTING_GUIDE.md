# Odoo Cafe POS - Complete Testing Guide

This comprehensive guide helps you test all CRUD operations and workflows in the fixed system.

---

## ✅ Pre-Testing Setup

### Required
1. Backend running: `python -m uvicorn app.main:app --reload` (on port 8000)
2. Frontend running: `npm start` (on port 3000)
3. Database initialized with seed data
4. Browser console open (F12) to see any errors

### Optional
- Postman or similar API testing tool (for direct API testing)
- Network throttling enabled (to test error handling)

---

## 🔐 Authentication Tests

### Test 1: Admin Login
**Steps**:
1. Go to `/login`
2. Enter admin credentials (created during signup)
3. Should redirect to `/backend`
4. Username should display in top nav

**Expected**: ✅ Login successful, redirected to admin dashboard

---

### Test 2: Employee Login
**Steps**:
1. Go to `/login`
2. Enter employee credentials
3. Should redirect to `/pos`
4. Should see POS terminal interface

**Expected**: ✅ Login successful, redirected to POS

---

### Test 3: Employee Can't Access Admin Pages
**Steps**:
1. Login as employee
2. Manually type `/backend` in URL
3. Should redirect back to `/pos`

**Expected**: ✅ Redirect works, can't bypass role checks

---

### Test 4: Signup Creates Admin
**Steps**:
1. Go to `/signup`
2. Create new account
3. Should redirect to `/backend` (admin dashboard)

**Expected**: ✅ New accounts are created as admins

---

## 👥 Employee Management Tests (CRUD)

### Prerequisites
- Logged in as admin
- On `/backend/employees` page

### Test 5: Create Employee
**Steps**:
1. Click "+ Add Employee" button
2. Fill form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123" (8+ chars)
   - Role: Employee
3. Click "Create"

**Expected**: ✅ "Account created!" toast, employee appears in list

---

### Test 6: Edit Employee
**Steps**:
1. Find created employee in list
2. Click "Edit" button
3. Change name to "John Smith"
4. Click "Save"

**Expected**: ✅ "Account updated!" toast, name changes in list

---

### Test 7: Change Password - Correct Flow
**Steps**:
1. Click "Change PW" on any employee
2. Modal appears
3. Enter current password correctly
4. Enter new password (different, 8+ chars)
5. Click "Change Password"

**Expected**: ✅ "Password changed successfully!" toast

---

### Test 8: Change Password - Wrong Current
**Steps**:
1. Click "Change PW"
2. Enter wrong current password
3. Enter new password
4. Click "Change Password"

**Expected**: ❌ "Current password is incorrect" error

---

### Test 9: Change Password - Same Password
**Steps**:
1. Click "Change PW"
2. Enter correct current password
3. Enter same password as "new"
4. Click "Change Password"

**Expected**: ❌ "New password must be different from current password"

---

### Test 10: Archive Employee
**Steps**:
1. Click "Archive" on active employee
2. Confirm in dialog
3. Status changes to "Archived"

**Expected**: ✅ "Account archived" toast

---

### Test 11: Restore Employee
**Steps**:
1. Click "Restore" on archived employee
2. Confirm in dialog
3. Status changes back to "Active"

**Expected**: ✅ "Account unarchived" toast

---

### Test 12: Delete Employee
**Steps**:
1. Click "Delete" on any employee
2. Confirm in dialog

**Expected**: ✅ "Employee deleted" toast, removed from list

---

## 📦 Product Management Tests

### Test 13: Create Product
**Steps**:
1. Go to `/backend/products`
2. Click "+ Add Product"
3. Fill form:
   - Name: "Espresso Coffee"
   - Category: (select existing or create new)
   - Price: 150.00
   - UOM: piece
   - Tax: 5
4. Click "Create Product"

**Expected**: ✅ "Product created!" toast (error if you get "All fields are required")

---

### Test 14: Edit Product
**Steps**:
1. Find product in list
2. Click Edit
3. Change price to 160.00
4. Click "Save Changes"

**Expected**: ✅ "Product updated!" toast, price updates in list

---

### Test 15: Product Search
**Steps**:
1. On Products page
2. Type in search box: "Espresso"
3. List filters automatically

**Expected**: ✅ Only Espresso products show

---

### Test 16: Filter by Category
**Steps**:
1. On Products page
2. Click category tab/filter

**Expected**: ✅ List shows only products in that category

---

## 🛒 Order Tests

### Test 17: Create Draft Order (POS)
**Steps**:
1. Login as employee (or access `/pos`)
2. Click on a table (or create order)
3. Select products
4. Click "Add to Cart" or similar

**Expected**: ✅ Products appear in cart section

---

### Test 18: Cancel Draft Order
**Steps**:
1. Create draft order
2. Go to Orders list (`/pos/orders`)
3. Click on draft order
4. Click "Cancel Order" button
5. Confirm dialog

**Expected**: ✅ "Order cancelled" toast, status changes to "cancelled"

---

### Test 19: Can't Cancel Paid Order
**Steps**:
1. Create and complete an order (make it paid)
2. Go to Orders list
3. Try to cancel paid order

**Expected**: ❌ "Cannot cancel orders with status: paid" error

---

### Test 20: Can't Cancel Kitchen Order
**Steps**:
1. Create order and send to kitchen
2. Go to Orders list
3. Try to cancel order

**Expected**: ❌ "Cannot cancel orders with status: sent_to_kitchen" error

---

## 🏪 Category Management Tests

### Test 21: Create Category
**Steps**:
1. Go to `/backend/categories`
2. Click "+ Add Category"
3. Enter name and color
4. Click "Create"

**Expected**: ✅ Category created, appears in list with color

---

### Test 22: Edit Category
**Steps**:
1. Find category in list
2. Click Edit
3. Change name or color
4. Click "Save"

**Expected**: ✅ Category updated

---

## 🏠 Floor & Table Tests

### Test 23: Create Floor
**Steps**:
1. Go to `/backend/floors`
2. Click "+ Add Floor"
3. Enter floor name (e.g., "Ground Floor")
4. Click "Create"

**Expected**: ✅ Floor created and appears in list

---

### Test 24: Add Table to Floor
**Steps**:
1. Find floor in list
2. Click "Add Table"
3. Enter table number
4. Enter seat count
5. Click "Add"

**Expected**: ✅ Table appears under floor with status "Available"

---

## 🔐 Error Handling Tests

### Test 25: Network Error Handling
**Steps**:
1. Open DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode
4. Try any API call (create product, load list, etc.)
5. Disable offline mode

**Expected**: ✅ See error message, not silent failure

---

### Test 26: Invalid Input Handling
**Steps**:
1. Try to create product with:
   - Empty name
   - Empty category
   - Invalid price (negative)
2. Submit form

**Expected**: ✅ See validation error messages

---

### Test 27: Unauthorized Access
**Steps**:
1. Logout
2. Try accessing `/backend` directly

**Expected**: ✅ Redirected to `/login`

---

## 📋 API Endpoint Tests (Using Postman/curl)

### Test 28: Get Current User
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: ✅ Returns user object with id, name, email, role

---

### Test 29: Login Endpoint
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

**Expected**: ✅ Returns {access_token, token_type}

---

### Test 30: Create Product API
```bash
curl -X POST http://localhost:8000/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cappuccino",
    "category_id": 1,
    "price": 200,
    "unit_of_measure": "cup",
    "tax_percent": 5
  }'
```

**Expected**: ✅ Returns created product object

---

## 🔄 Role-Based Access Control Tests

### Test 31: Admin Access to All Pages
**Steps**:
1. Login as admin
2. Visit each path:
   - `/backend` ✅
   - `/backend/products` ✅
   - `/backend/employees` ✅
   - `/pos` ✅
   - `/pos/order` ✅

**Expected**: ✅ All pages accessible

---

### Test 32: Employee Restricted Access
**Steps**:
1. Login as employee
2. Try visiting:
   - `/backend` - Should redirect to `/pos`
   - `/backend/products` - Should redirect to `/pos`
   - `/backend/employees` - Should redirect to `/pos`
   - `/pos` - ✅ Accessible
   - `/pos/order` - ✅ Accessible

**Expected**: ✅ Blocked from admin pages, can access POS

---

## ✨ Final Verification Checklist

- [ ] Admin login works, redirect to `/backend`
- [ ] Employee login works, redirect to `/pos`
- [ ] Role-based access control works
- [ ] Can create employees with proper validation
- [ ] Can change password with verification
- [ ] Can't access admin pages as employee
- [ ] Products CRUD works completely
- [ ] Categories CRUD works completely
- [ ] Orders can be created and managed
- [ ] Can't cancel paid/kitchen orders
- [ ] All error messages display properly
- [ ] No silent failures (empty catch blocks show errors)
- [ ] Network errors are handled gracefully
- [ ] API responds correctly to all requests

---

## 🐛 If Tests Fail

### Debug Steps:
1. **Check Console**: F12 → Console tab for error messages
2. **Check Network Tab**: See API responses
3. **Check Local Storage**: See if token/role are stored
4. **Restart Services**:
   ```bash
   # Backend
   pkill -f "uvicorn"
   python -m uvicorn app.main:app --reload
   
   # Frontend  
   pkill -f "npm start"
   npm start
   ```
5. **Check Database**: Verify seed data exists
6. **Clear Browser Cache**: Ctrl+Shift+Delete, select "All time"

### Common Issues:

**Problem**: "CORS Error"
- **Solution**: Check backend CORS configuration in `app/main.py`

**Problem**: "401 Unauthorized"
- **Solution**: Token might have expired, login again

**Problem**: "Cannot find module"
- **Solution**: Run `npm install` to install dependencies

**Problem**: "Database error"
- **Solution**: Restart backend, verify database connection

---

## 📊 Test Results Template

Copy and paste to document your testing:

```
Testing Date: ___________
Tested By: ___________

Authentication: [PASS / FAIL]
- Admin Login: ✅ / ❌
- Employee Login: ✅ / ❌
- Role-based Access: ✅ / ❌

Employee CRUD: [PASS / FAIL]
- Create: ✅ / ❌
- Read: ✅ / ❌
- Update: ✅ / ❌
- Delete: ✅ / ❌

Products CRUD: [PASS / FAIL]
- Create: ✅ / ❌
- Read: ✅ / ❌
- Update: ✅ / ❌
- Delete: ✅ / ❌

Order Management: [PASS / FAIL]
- Create: ✅ / ❌
- Cancel Draft: ✅ / ❌
- Prevent Cancel Paid: ✅ / ❌
- Prevent Cancel Kitchen: ✅ / ❌

Error Handling: [PASS / FAIL]
- Network Error: ✅ / ❌
- Validation Error: ✅ / ❌
- Auth Error: ✅ / ❌

Overall: [PASS / FAIL]

Issues Found:
1. ___________
2. ___________
3. ___________
```

---

## 🎉 When All Tests Pass

**Congratulations!** Your Odoo Cafe POS system is now:
- ✅ Secure (role-based access)
- ✅ Reliable (error handling)
- ✅ User-friendly (proper feedback)
- ✅ Production-ready (environment configuration)

**Next Steps**: Deploy to production! 🚀
