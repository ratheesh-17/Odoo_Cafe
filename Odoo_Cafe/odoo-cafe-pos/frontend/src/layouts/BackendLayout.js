import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout, isAuthenticated } from "../auth";

const navItems = [
  { to: "/backend", label: "Session", end: true },
  { to: "/backend/dashboard", label: "Dashboard" },
  { to: "/backend/products", label: "Products" },
  { to: "/backend/categories", label: "Categories" },
  { to: "/backend/payments", label: "Payment Methods" },
  { to: "/backend/floors", label: "Floors & Tables" },
  { to: "/backend/coupons", label: "Coupons & Promos" },
  { to: "/backend/employees", label: "Employees" },
  { to: "/backend/bookings", label: "Bookings" },
  { to: "/backend/self-order", label: "Self Order" },
  { to: "/backend/reports", label: "Reports" },
];

export default function BackendLayout() {
  const navigate = useNavigate();

  return (
    <div className="backend-shell">
      <aside className="backend-sidebar">
        <div className="sidebar-logo">☕ Odoo Cafe</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={() => navigate("/pos")}>
            🖥 POS Terminal
          </button>
          <button className="sidebar-link" onClick={() => navigate("/kitchen")}>
            🍳 Kitchen Display
          </button>
          <button className="sidebar-link danger" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="backend-main">
        <Outlet />
      </main>
    </div>
  );
}
