import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const fmt = (n) => `₹${parseFloat(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

const LINKS = [
  { to: "/backend/products", label: "Products", emoji: "📦" },
  { to: "/backend/categories", label: "Categories", emoji: "🏷" },
  { to: "/backend/floors", label: "Floors & Tables", emoji: "🗺" },
  { to: "/backend/coupons", label: "Coupons & Promos", emoji: "🎟" },
  { to: "/backend/payments", label: "Payment Methods", emoji: "💳" },
  { to: "/backend/employees", label: "Employees", emoji: "👥" },
  { to: "/backend/bookings", label: "Bookings", emoji: "📅" },
  { to: "/backend/self-order", label: "Self Order", emoji: "📱" },
  { to: "/backend/reports", label: "Reports", emoji: "📊" },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = today();
    api.get(`/reports/dashboard?date_from=${t}&date_to=${t}`)
      .then(r => setSummary(r.data.summary))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid grid-3">
          <div className="metric-card card-glow">
            <h2>Today's Orders</h2>
            <strong>{summary?.total_orders ?? 0}</strong>
            <p>Paid orders today</p>
          </div>
          <div className="metric-card card-glow">
            <h2>Today's Revenue</h2>
            <strong>{fmt(summary?.revenue ?? 0)}</strong>
            <p>Discount: {fmt(summary?.total_discount ?? 0)}</p>
          </div>
          <div className="metric-card card-glow">
            <h2>Avg Order Value</h2>
            <strong>{fmt(summary?.avg_order_value ?? 0)}</strong>
            <p>Tax: {fmt(summary?.total_tax ?? 0)}</p>
          </div>
        </div>
      )}

      <h2>Quick Access</h2>
      <div className="grid grid-3">
        {LINKS.map(l => (
          <button key={l.to} className="quick-link-card" onClick={() => navigate(l.to)}>
            <span className="quick-link-emoji">{l.emoji}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
