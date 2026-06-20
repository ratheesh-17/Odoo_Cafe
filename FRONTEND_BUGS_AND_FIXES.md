# Frontend Critical Issues & Quick Fixes

## 🔴 CRITICAL BUGS (Fix Before Production)

### 1. Order Cancellation Bypass - Can Cancel Paid Orders
**Location**: [src/pages/pos/OrdersListPage.js](src/pages/pos/OrdersListPage.js#L37-L50)  
**Severity**: CRITICAL  
**Impact**: Lost revenue, data integrity

```javascript
// ❌ CURRENT CODE (BUGGY)
const handleCancel = async (order) => {
  if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
  try {
    await api.post(`/orders/${order.id}/cancel`);
    toast.success("Order cancelled");
    load();
  } catch {}
};

// ✅ FIXED CODE
const handleCancel = async (order) => {
  // Only draft and sent_to_kitchen can be cancelled
  if (!['draft', 'sent_to_kitchen'].includes(order.status)) {
    return toast.error("Cannot cancel paid or completed orders");
  }
  if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
  try {
    await api.post(`/orders/${order.id}/cancel`);
    toast.success("Order cancelled");
    load();
  } catch (err) {
    const msg = err.response?.data?.detail || "Failed to cancel order";
    toast.error(msg);
  }
};
```

---

### 2. No Role-Based Access Control - Any User Can Access Admin Pages
**Location**: [src/components/ProtectedRoute.js](src/components/ProtectedRoute.js)  
**Severity**: CRITICAL SECURITY  
**Impact**: Employees can delete other employees, modify configs, etc.

```javascript
// ❌ CURRENT CODE (NO ROLE CHECKS)
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children || <Outlet />;
}

// ✅ FIXED CODE
export default function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    api.get("/auth/me")
      .then(r => setUser(r.data))
      .catch(() => {});
  }, []);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  
  // If role required but not met, redirect
  if (requiredRole && user && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }
  
  return children || <Outlet />;
}
```

Then update [src/App.js](src/App.js#L61-L76):
```javascript
// Update backend route to require admin
<Route path="/backend" element={
  <ProtectedRoute requiredRole="admin">
    <BackendLayout />
  </ProtectedRoute>
}>
  {/* All backend pages now protected */}
</Route>

// Update POS route to require employee
<Route path="/pos" element={
  <ProtectedRoute requiredRole="employee">
    <PosLayout />
  </ProtectedRoute>
}>
  {/* All POS pages now protected */}
</Route>
```

---

### 3. Password Change Without Verification
**Location**: [src/pages/backend/EmployeesPage.js](src/pages/backend/EmployeesPage.js#L27-L34)  
**Severity**: CRITICAL SECURITY  
**Impact**: Admins can hijack any account

```javascript
// ❌ CURRENT CODE (NO OLD PASSWORD CHECK)
const handleChangePw = async (e) => {
  e.preventDefault();
  if (pwForm.password.length < 8) return toast.error("Min 8 characters");
  try {
    await api.patch(`/users/${pwForm.user_id}/change-password`, { 
      new_password: pwForm.password 
    });
    toast.success("Password changed!");
    setPwForm({ user_id: null, name: "", password: "" });
  } catch {}
};

// ✅ FIXED CODE
const handleChangePw = async (e) => {
  e.preventDefault();
  if (pwForm.password.length < 8) return toast.error("Min 8 characters");
  
  try {
    // Backend should require old password for non-admin users
    // Or add current password verification
    await api.patch(`/users/${pwForm.user_id}/change-password`, { 
      new_password: pwForm.password,
      // Backend should verify current user is admin or provide old_password
    });
    toast.success("Password changed!");
    setPwForm({ user_id: null, name: "", password: "" });
  } catch (err) {
    toast.error(err.response?.data?.detail || "Failed to change password");
  }
};
```

**Backend Recommendation**: Require old password or restrict password changes to own account only.

---

## 🟠 HIGH PRIORITY ISSUES

### 4. Hardcoded API Base URL
**Location**: [src/api.js](src/api.js#L4)  
**Severity**: HIGH  
**Impact**: Will break in production

```javascript
// ❌ CURRENT CODE
const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ✅ FIXED CODE
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
```

Create `.env.production`:
```
REACT_APP_API_URL=https://api.odoo-cafe.com
```

---

### 5. Silent API Failures - Empty Catch Blocks Everywhere
**Location**: ALL pages (28+ instances)  
**Severity**: HIGH  
**Impact**: Users don't know when operations fail

```javascript
// ❌ PATTERN FOUND IN EVERY PAGE
const handleSave = async (payload) => {
  try {
    await api.post("/products", payload);
    toast.success("Created!");
    load();
  } catch {} // ❌ NO ERROR HANDLING
};

// ✅ FIX PATTERN (USE EVERYWHERE)
const handleSave = async (payload) => {
  try {
    await api.post("/products", payload);
    toast.success("Created!");
    load();
  } catch (err) {
    const msg = err.response?.data?.detail 
      || err.response?.data?.message 
      || err.message 
      || "Operation failed";
    toast.error(msg);
    console.error('Error:', err);
  }
};
```

Create a utility function in [src/utils/errorHandler.js](src/utils/errorHandler.js):
```javascript
export const getErrorMessage = (error) => {
  return (
    error.response?.data?.detail 
    || error.response?.data?.message 
    || error.message 
    || "An unexpected error occurred"
  );
};

export const handleError = (error, context = "") => {
  const msg = getErrorMessage(error);
  console.error(`Error ${context}:`, error);
  toast.error(msg);
};
```

Then use in all pages:
```javascript
import { handleError } from "../../utils/errorHandler";

catch (err) {
  handleError(err, "saving product");
}
```

---

### 6. No Pagination - Scalability Blocker
**Affected Pages**: 
- ProductsPage
- OrdersListPage
- CustomersPage
- EmployeesPage

**Example Fix - ProductsPage**:

```javascript
// ❌ CURRENT (LOADS ALL)
const [products, setProducts] = useState([]);

const load = useCallback(async () => {
  try {
    const [prods, cats] = await Promise.all([
      api.get(`/products?${params}`).then(r => r.data), // ALL!
      api.get("/categories").then(r => r.data),
    ]);
    setProducts(prods);
  } catch {}
}, [search, catFilter, showArchived]);

// ✅ FIXED (PAGINATED)
const [products, setProducts] = useState([]);
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const PAGE_SIZE = 50;

const load = useCallback(async () => {
  try {
    params.set("skip", (page - 1) * PAGE_SIZE);
    params.set("limit", PAGE_SIZE);
    
    const [data, cats] = await Promise.all([
      api.get(`/products?${params}`).then(r => r.data),
      api.get("/categories").then(r => r.data),
    ]);
    
    setProducts(page === 1 ? data.items : [...products, ...data.items]);
    setTotal(data.total);
    setCategories(cats);
  } catch (err) {
    handleError(err, "loading products");
  }
}, [search, catFilter, showArchived, page]);

// Add "Load More" button
{products.length < total && (
  <button onClick={() => setPage(p => p + 1)}>
    Load More ({products.length}/{total})
  </button>
)}
```

---

### 7. Missing Pre-Payment Validations
**Location**: [src/pages/pos/OrderViewPage.js](src/pages/pos/OrderViewPage.js#L200-L220)  
**Severity**: HIGH  
**Impact**: Can process payment for invalid orders

```javascript
// ❌ CURRENT CODE
const processPayment = async () => {
  const total = parseFloat(order.total_amount);
  const paid = payType === "cash" ? parseFloat(amountPaid) : total;
  if (payType === "cash" && paid < total) return toast.error(`Need at least ${fmt(total)}`);
  if (payType === "card" && !txRef.trim()) return toast.error("Transaction reference required");
  setPaying(true);
  try {
    const { data } = await api.post(`/orders/${order.id}/payment`, { 
      payment_type: payType, 
      amount_paid: paid, 
      transaction_ref: payType === "card" ? txRef.trim() : null 
    });
    // ...
  } catch {}
};

// ✅ FIXED CODE
const processPayment = async () => {
  // Add these validations
  if (!order) return toast.error("No order selected");
  if (!order.items?.length) return toast.error("Order has no items");
  if (!['draft', 'sent_to_kitchen'].includes(order.status)) {
    return toast.error("Cannot pay for this order status");
  }
  if (!session) return toast.error("No active session");
  
  const total = parseFloat(order.total_amount);
  const paid = payType === "cash" ? parseFloat(amountPaid) : total;
  if (payType === "cash" && paid < total) 
    return toast.error(`Need at least ${fmt(total)}`);
  if (payType === "card" && !txRef.trim()) 
    return toast.error("Transaction reference required");
  
  setPaying(true);
  try {
    const { data } = await api.post(`/orders/${order.id}/payment`, { 
      payment_type: payType, 
      amount_paid: paid, 
      transaction_ref: payType === "card" ? txRef.trim() : null 
    });
    setPaidOrder(data);
    setShowPayment(false);
    toast.success("Payment complete!");
  } catch (err) {
    handleError(err, "processing payment");
  } finally {
    setPaying(false);
  }
};
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 8. Token Stored in localStorage (XSS Vulnerability)
**Location**: [src/auth.js](src/auth.js#L1-L9)  
**Severity**: MEDIUM SECURITY

**Fix**: Configure backend to use httpOnly cookies

```javascript
// Backend (FastAPI)
response.set_cookie(
  "access_token",
  token,
  httponly=True,
  secure=True,  # HTTPS only
  samesite="strict"
)

// Frontend - no need to manually store token
api.defaults.withCredentials = true;
// Token sent automatically with each request
```

---

### 9. Inefficient State Sync via sessionStorage Polling
**Location**: [src/layouts/PosLayout.js](src/layouts/PosLayout.js#L20-L31)  
**Severity**: MEDIUM

```javascript
// ❌ CURRENT (POLLS EVERY SECOND!)
useEffect(() => {
  const sync = () => {
    const t = sessionStorage.getItem("ACTIVE_TABLE");
    setActiveTable(t ? JSON.parse(t) : null);
  };
  window.addEventListener("storage", sync);
  const interval = setInterval(sync, 1000); // BATTERY DRAIN!
  return () => { 
    window.removeEventListener("storage", sync); 
    clearInterval(interval); 
  };
}, []);

// ✅ FIXED (USE ZUSTAND - ALREADY IN package.json!)
// Create store/orderStore.js
import create from 'zustand';

export const useOrderStore = create((set) => ({
  activeTable: null,
  order: null,
  setActiveTable: (table) => set({ activeTable: table }),
  setOrder: (order) => set({ order }),
}));

// In OrderViewPage.js
import { useOrderStore } from '../../store/orderStore';
const { activeTable, setActiveTable } = useOrderStore();

// In PosLayout.js
const { activeTable } = useOrderStore();
// NO POLLING! Direct state updates
```

---

## Summary Table

| Issue | Severity | File | Estimate | Status |
|-------|----------|------|----------|--------|
| Order cancellation bypass | 🔴 CRITICAL | OrdersListPage.js | 30 min | Ready to fix |
| No role-based access | 🔴 CRITICAL | ProtectedRoute.js, App.js | 2 hours | Ready to fix |
| Password change verification | 🔴 CRITICAL | EmployeesPage.js | 1 hour | Backend fix needed |
| Hardcoded API URL | 🟠 HIGH | api.js | 15 min | Ready to fix |
| Silent API failures | 🟠 HIGH | All pages | 3 hours | Ready to fix |
| No pagination | 🟠 HIGH | 4 pages | 6 hours | Ready to fix |
| Pre-payment validation | 🟠 HIGH | OrderViewPage.js | 1 hour | Ready to fix |
| localStorage token | 🟡 MEDIUM | auth.js | 2 hours | Backend change required |
| sessionStorage polling | 🟡 MEDIUM | PosLayout.js | 1 hour | Ready to fix |

**Total Estimated Fix Time**: 15-17 hours

---

## Files Ready to Fix (Immediate)

1. ✅ OrdersListPage.js - Add status check to handleCancel
2. ✅ ProtectedRoute.js & App.js - Add role-based routing
3. ✅ api.js - Move baseURL to env variable
4. ✅ All pages - Replace catch {} with proper error handling
5. ✅ ProductsPage.js & OrdersListPage.js - Add pagination
6. ✅ OrderViewPage.js - Add pre-payment validation
7. ✅ PosLayout.js - Replace polling with Zustand
8. ✅ EmployeesPage.js - Add password verification (or backend fix)

---

## Testing Checklist After Fixes

- [ ] Employee cannot access /backend/* pages
- [ ] Employee can only access /pos/* pages
- [ ] Cannot cancel paid orders
- [ ] API failures show error messages
- [ ] Products page handles 1000+ items without freezing
- [ ] Password change requires verification (or blocked)
- [ ] API URL changes with environment
- [ ] Table state persists without polling
