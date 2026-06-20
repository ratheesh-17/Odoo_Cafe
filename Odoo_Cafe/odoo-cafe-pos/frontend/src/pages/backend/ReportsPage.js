import { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../../api";

const fmt = (n) => `₹${parseFloat(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "" },
];

function periodToDates(period) {
  const now = new Date();
  const f = (d) => d.toISOString().slice(0, 10);
  const today = f(now);
  if (period === "today") return { date_from: today, date_to: today };
  if (period === "7d") return { date_from: f(new Date(now - 6 * 86400000)), date_to: today };
  if (period === "30d") return { date_from: f(new Date(now - 29 * 86400000)), date_to: today };
  if (period === "month") return { date_from: f(new Date(now.getFullYear(), now.getMonth(), 1)), date_to: today };
  return { date_from: "", date_to: "" };
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState("30d");
  const [employeeId, setEmployeeId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [productId, setProductId] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/users").then((r) => r.data).catch(() => []),
      api.get("/sessions").then((r) => r.data).catch(() => []),
      api.get("/products").then((r) => r.data).catch(() => []),
    ]).then(([u, s, p]) => { setEmployees(u); setSessions(s); setProducts(p); });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dates = periodToDates(period);
      const params = new URLSearchParams();
      if (dates.date_from) params.set("date_from", dates.date_from);
      if (dates.date_to) params.set("date_to", dates.date_to);
      if (employeeId) params.set("employee_id", employeeId);
      if (sessionId) params.set("session_id", sessionId);
      if (productId) params.set("product_id", productId);
      const { data: d } = await api.get(`/reports/dashboard?${params}`);
      setData(d);
    } catch {} finally { setLoading(false); }
  }, [period, employeeId, sessionId, productId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const dates = periodToDates(period);
      const params = new URLSearchParams();
      if (dates.date_from) params.set("date_from", dates.date_from);
      if (dates.date_to) params.set("date_to", dates.date_to);
      if (employeeId) params.set("employee_id", employeeId);
      if (sessionId) params.set("session_id", sessionId);
      if (productId) params.set("product_id", productId);
      const resp = await api.get(`/reports/export/${type}?${params}`, { responseType: "blob" });
      const mime = type === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const url = URL.createObjectURL(new Blob([resp.data], { type: mime }));
      const a = document.createElement("a"); a.href = url; a.download = `sales_report.${type === "pdf" ? "pdf" : "xlsx"}`; a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setExporting(null); }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Reports</h1><p>Sales analytics and performance overview</p></div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => handleExport("pdf")} disabled={!!exporting}>{exporting === "pdf" ? "Exporting..." : "Export PDF"}</button>
          <button className="btn btn-secondary" onClick={() => handleExport("xls")} disabled={!!exporting}>{exporting === "xls" ? "Exporting..." : "Export XLS"}</button>
        </div>
      </div>

      <div className="filter-bar">
        {PERIODS.map((p) => (
          <button key={p.value} className={`filter-btn ${period === p.value ? "active" : ""}`} onClick={() => setPeriod(p.value)}>{p.label}</button>
        ))}
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
          <option value="">All Sessions</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>#{s.id} — {s.opened_by?.name}</option>)}
        </select>
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? <p>Loading...</p> : data && (
        <>
          <div className="grid grid-3">
            <div className="metric-card card-glow"><h2>Total Orders</h2><strong>{data.summary.total_orders}</strong></div>
            <div className="metric-card card-glow"><h2>Revenue</h2><strong>{fmt(data.summary.revenue)}</strong><p>Discount: {fmt(data.summary.total_discount)}</p></div>
            <div className="metric-card card-glow"><h2>Avg Order Value</h2><strong>{fmt(data.summary.avg_order_value)}</strong><p>Tax: {fmt(data.summary.total_tax)}</p></div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h2>Sales Trend</h2>
              {data.sales_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.sales_trend}>
                    <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff8c52" stopOpacity={0.4} /><stop offset="95%" stopColor="#ff8c52" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#ff8c52" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="empty">No data for this period</p>}
            </div>

            <div className="chart-card">
              <h2>Top Categories</h2>
              {data.top_categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.top_categories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="category_name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {data.top_categories.map((e) => <Cell key={e.category_id} fill={e.category_color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="empty">No data</p>}
            </div>
          </div>

          <div className="table-card">
            <h2>Top Products</h2>
            <table>
              <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.top_products.map((p, i) => (
                  <tr key={p.product_id}><td>{i + 1}</td><td>{p.product_name}</td><td>{p.category_name}</td><td>{p.quantity_sold}</td><td>{fmt(p.revenue)}</td></tr>
                ))}
                {data.top_products.length === 0 && <tr><td colSpan={5} className="empty">No data</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="table-card">
            <h2>Top Orders</h2>
            <table>
              <thead><tr><th>Order #</th><th>Employee</th><th>Customer</th><th>Paid At</th><th>Total</th></tr></thead>
              <tbody>
                {data.top_orders.map((o) => (
                  <tr key={o.order_id}><td><code>{o.order_number}</code></td><td>{o.employee_name}</td><td>{o.customer_name ?? "—"}</td><td>{o.paid_at ? new Date(o.paid_at).toLocaleString() : "—"}</td><td>{fmt(o.total_amount)}</td></tr>
                ))}
                {data.top_orders.length === 0 && <tr><td colSpan={5} className="empty">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
