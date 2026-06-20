import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout } from "../auth";
import api from "../api";

export default function PosLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  // Gap #5 — read active table from sessionStorage so topbar reflects current table
  const [activeTable, setActiveTable] = useState(() => {
    const t = sessionStorage.getItem("ACTIVE_TABLE");
    return t ? JSON.parse(t) : null;
  });

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/backend");
  };

  // Gap #6 — load current employee info
  useEffect(() => {
    api.get("/auth/me").then(r => setUser(r.data)).catch(() => {});
  }, []);

  // sync table indicator whenever sessionStorage changes (set by OrderViewPage)
  useEffect(() => {
    const sync = () => {
      const t = sessionStorage.getItem("ACTIVE_TABLE");
      setActiveTable(t ? JSON.parse(t) : null);
    };
    window.addEventListener("storage", sync);
    // also poll every second to catch same-tab writes
    const interval = setInterval(sync, 1000);
    return () => { window.removeEventListener("storage", sync); clearInterval(interval); };
  }, []);

  // Gap #7 — hamburger menu items
  const menuLinks = [
    { label: "Products", path: "/backend/products" },
    { label: "Categories", path: "/backend/categories" },
    { label: "Payment Methods", path: "/backend/payments" },
    { label: "Coupons & Promos", path: "/backend/coupons" },
    { label: "Bookings", path: "/backend/bookings" },
    { label: "Employees", path: "/backend/employees" },
    { label: "Kitchen Display", path: "/kitchen" },
    { label: "Reports", path: "/backend/reports" },
  ];

  return (
    <div className="pos-shell">
      <aside className="pos-sidebar">
        <div className="sidebar-logo">☕ Odoo Cafe POS</div>
        <nav className="sidebar-nav">
          <NavLink to="/pos/order" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Order</NavLink>
          <NavLink to="/pos/orders" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Orders</NavLink>
          <NavLink to="/pos/customers" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Customers</NavLink>
          <NavLink to="/pos/tables" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>Table View</NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={() => navigate("/kitchen")}>Kitchen Display</button>
          <button className="sidebar-link danger" onClick={logout}>Logout</button>
        </div>
      </aside>
      <main className="pos-main">
        <header className="pos-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button className="pos-btn" onClick={goBack} style={{ padding: "0.45rem 0.7rem" }}>← Back</button>
            <span className="pos-brand">☕ Odoo Cafe POS</span>
          </div>
          <div className="pos-topbar-info">
            {activeTable && (
              <span className="pos-badge">🗻 Table {activeTable.table_number}</span>
            )}
            {user && (
              <span className="pos-user">👤 {user.name}</span>
            )}
          </div>
          <div className="pos-actions">
          </div>
        </header>
        <div className="pos-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
