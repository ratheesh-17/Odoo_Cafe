# Implementation Guide: Adding Error Handling to All Pages

This guide helps you add proper error handling to the remaining pages in the Odoo Cafe POS system.

## Quick Reference: Error Handler Utility

All error utilities are in `src/utils/errorHandler.js`. Here's how to use them:

```javascript
import { getErrorMessage } from "../../utils/errorHandler";
import toast from "react-hot-toast";

// In your try-catch block:
try {
  // API call
  await api.post("/endpoint", data);
  toast.success("Success message");
} catch (err) {
  // Use this simple one-liner for most cases:
  toast.error(getErrorMessage(err, "Failed to perform action"));
}
```

---

## Pattern: Before & After

### BEFORE (Silent Failures)
```javascript
const handleSave = async () => {
  try {
    await api.post("/products", productData);
    toast.success("Product created");
    loadProducts();
  } catch {} // ❌ SILENT FAILURE - User doesn't know what went wrong
};
```

### AFTER (Proper Error Handling)
```javascript
import { getErrorMessage } from "../../utils/errorHandler";

const handleSave = async () => {
  try {
    await api.post("/products", productData);
    toast.success("Product created");
    loadProducts();
  } catch (err) {
    // ✅ User sees what went wrong
    toast.error(getErrorMessage(err, "Failed to create product"));
  }
};
```

---

## Pages That Need Fixing (in priority order)

### 1. ProductsPage.js (CRITICAL - Core CRUD)
**File**: `src/pages/backend/ProductsPage.js`

**Current Issues**:
- Line ~155: `catch {}` in load()
- Line ~165: `catch {}` in handleSave()
- Line ~60: `catch {}` in handleCreateCategory()
- Line ~176: `catch {}` in handleDelete()
- Line ~182: `catch {}` in handleArchive()

**Fix Template**:
```javascript
// Add import at top
import { getErrorMessage } from "../../utils/errorHandler";

// Find each empty catch {} and replace:
catch (err) {
  toast.error(getErrorMessage(err, "Failed to load products"));
}
```

### 2. CategoriesPage.js (CRITICAL - Core CRUD)
**File**: `src/pages/backend/CategoriesPage.js`

**Issues**: Similar to ProductsPage

**Fix**: Same pattern as ProductsPage

### 3. OrderViewPage.js (CRITICAL - Main POS page)
**File**: `src/pages/pos/OrderViewPage.js`

**Current Issues**: 14+ empty catch blocks
- Cart operations
- Payment processing  
- Customer assignment
- Product loading

**Fix Template**:
```javascript
catch (err) {
  const errorMsg = getErrorMessage(err, "Operation failed");
  toast.error(errorMsg);
  // Some pages also log for debugging:
  console.error("OrderView Error:", err);
}
```

### 4. SelfOrderPage.js (PUBLIC - Customer facing)
**File**: `src/pages/SelfOrderPage.js`

**Current Issues**: 7+ empty catch blocks

**Fix**: Same pattern

### 5. Other Backend Pages
- PaymentMethodsPage.js
- FloorsPage.js
- CouponPromotionPage.js
- BookingsPage.js
- SelfOrderConfigPage.js
- ReportsPage.js

---

## Step-by-Step Fix Instructions

### For Each Page:

1. **Add import at top**:
   ```javascript
   import { getErrorMessage } from "../../utils/errorHandler";
   ```

2. **Find all `catch {}` blocks** (use Ctrl+F)

3. **Replace each one** with:
   ```javascript
   catch (err) {
     toast.error(getErrorMessage(err, "Failed to [action]"));
   }
   ```

4. **For important operations, also log**:
   ```javascript
   catch (err) {
     console.error("[PageName] Error:", err);
     toast.error(getErrorMessage(err, "Failed to [action]"));
   }
   ```

5. **Test the page**: Try triggering the error (disconnect network, use invalid data, etc.)

---

## Advanced Error Handling Patterns

### Pattern 1: Different Messages by Error Type
```javascript
catch (err) {
  if (isNetworkError(err)) {
    toast.error("Network connection error. Please check your connection.");
  } else if (isValidationError(err)) {
    toast.error(getErrorMessage(err, "Please check your input"));
  } else if (isServerError(err)) {
    toast.error("Server error. Please try again later");
  } else {
    toast.error(getErrorMessage(err, "Operation failed"));
  }
}
```

### Pattern 2: With Field Validation Errors
```javascript
import { getValidationErrors } from "../../utils/errorHandler";

catch (err) {
  if (isValidationError(err)) {
    const errors = getValidationErrors(err);
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
    }
  } else {
    toast.error(getErrorMessage(err, "Failed to save"));
  }
}
```

### Pattern 3: With Loading State
```javascript
const handleSave = async () => {
  setSaving(true);
  try {
    await api.post("/endpoint", data);
    toast.success("Success");
    refresh();
  } catch (err) {
    toast.error(getErrorMessage(err, "Failed to save"));
  } finally {
    setSaving(false);
  }
};
```

---

## Testing Your Fixes

For each page, test these scenarios:

1. **Network Error**: 
   - Disconnect internet, try operation
   - Should see: "Network Error" or connection message

2. **Validation Error**:
   - Send invalid data (if applicable)
   - Should see: Specific validation message

3. **Server Error**:
   - Simulate server down
   - Should see: "Server error. Please try again later"

4. **Success**:
   - Normal operation should show success toast

---

## Reference: All Error Helper Functions

```javascript
import {
  getErrorMessage,        // Get main error message
  isNetworkError,         // Check connection error
  isValidationError,      // Check 400 error
  isUnauthorized,         // Check 401 error
  isForbidden,            // Check 403 error
  isNotFound,             // Check 404 error
  isServerError,          // Check 500+ error
  getValidationErrors,    // Get all validation errors
} from "../../utils/errorHandler";
```

---

## Checklist for Complete Error Handling

- [ ] ProductsPage.js
- [ ] CategoriesPage.js
- [ ] PaymentMethodsPage.js
- [ ] FloorsPage.js
- [ ] CouponPromotionPage.js
- [ ] OrderViewPage.js
- [ ] CustomersPage.js
- [ ] TableViewPage.js
- [ ] SelfOrderPage.js
- [ ] SelfOrderConfigPage.js
- [ ] BookingsPage.js
- [ ] ReportsPage.js
- [ ] KitchenPage.js
- [ ] CustomerDisplayPage.js

---

## Need Help?

All error utilities are documented in: `src/utils/errorHandler.js`

Common issues:
- **Toast not showing?** - Make sure `import toast from "react-hot-toast"` is at top
- **Error message not clear?** - Use better defaultMessage in getErrorMessage call
- **Want to log for debugging?** - Use `console.error(err)` in catch block
