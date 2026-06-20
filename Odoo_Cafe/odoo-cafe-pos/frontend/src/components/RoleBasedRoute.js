import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getUserRole } from "../auth";

/**
 * RoleBasedRoute - Protects routes and enforces role-based access
 * 
 * Usage:
 * <Route path="/backend" element={<RoleBasedRoute allowedRoles={["admin"]}><BackendLayout /></RoleBasedRoute>} />
 * <Route path="/pos" element={<RoleBasedRoute allowedRoles={["admin", "employee"]}><PosLayout /></RoleBasedRoute>} />
 */
export default function RoleBasedRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();

  // No role stored — stale or incomplete auth state, send to login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, just check authentication
  if (allowedRoles.length === 0) {
    return children || <Outlet />;
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(userRole)) {
    // employee trying to access /backend → send to POS
    if (userRole === "employee") {
      return <Navigate to="/pos" replace />;
    }
    // unknown role — force to login
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}
