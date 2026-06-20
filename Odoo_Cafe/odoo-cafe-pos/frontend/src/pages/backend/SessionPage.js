import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

export default function SessionPage() {
  const [current, setCurrent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [cur, all] = await Promise.all([
        api.get("/sessions/current").then(r => r.data).catch(() => null),
        api.get("/sessions").then(r => r.data).catch(() => []),
      ]);
      setCurrent(cur);
      setSessions(all);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async (e) => {
    e.preventDefault();
    try {
      await api.post("/sessions/open", { opening_cash: parseFloat(openingCash) || 0 });
      toast.success("Session opened!");
      setOpeningCash("");
      load();
    } catch {}
  };

  const handleClose = async () => {
    if (!window.confirm("Close the current session?")) return;
    try {
      const { data } = await api.post(`/sessions/${current.id}/close`, { note: closeNote });
      setSummary(data.summary);
      toast.success("Session closed!");
      load();
    } catch {}
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1>POS Session</h1>
        <p>Manage your daily sales sessions</p>
      </div>

      <div className={`session-status-card ${current ? "open" : "closed"}`}>
        <div>
          <strong>{current ? "Session Active" : "No Active Session"}</strong>
          {current && <p>Opened by {current.opened_by?.name} • {new Date(current.opened_at).toLocaleString()}</p>}
          {!current && sessions.length > 0 && (
            <p>Last session: ₹{parseFloat(sessions[0]?.closing_total_sales || 0).toFixed(2)}</p>
          )}
        </div>
        {current && (
          <button className="btn btn-primary" onClick={() => navigate("/pos")}>
            Open POS Terminal →
          </button>
        )}
      </div>

      {summary && (
        <div className="summary-grid">
          <div className="metric-card"><h2>Orders</h2><strong>{summary.total_orders}</strong></div>
          <div className="metric-card"><h2>Revenue</h2><strong>₹{summary.total_revenue?.toFixed(2)}</strong></div>
          <div className="metric-card"><h2>Cash</h2><strong>₹{summary.cash_sales?.toFixed(2)}</strong></div>
          <div className="metric-card"><h2>UPI</h2><strong>₹{summary.upi_sales?.toFixed(2)}</strong></div>
          <div className="metric-card"><h2>Card</h2><strong>₹{summary.card_sales?.toFixed(2)}</strong></div>
          <div className="metric-card"><h2>Discounts</h2><strong>₹{summary.total_discount?.toFixed(2)}</strong></div>
        </div>
      )}

      {!current ? (
        <div className="form-card">
          <h2>Open Session</h2>
          <form onSubmit={handleOpen}>
            <label>Opening Cash (₹)
              <input type="number" min="0" step="0.01" value={openingCash}
                onChange={e => setOpeningCash(e.target.value)} placeholder="0.00" />
            </label>
            <button type="submit" className="btn btn-primary">Open Session</button>
          </form>
        </div>
      ) : (
        <div className="form-card">
          <h2>Close Session</h2>
          <label>Note (optional)
            <textarea value={closeNote} onChange={e => setCloseNote(e.target.value)} placeholder="End of shift notes..." />
          </label>
          <button className="btn btn-danger" onClick={handleClose}>Close Session</button>
        </div>
      )}

      <div className="table-card">
        <h2>Session History</h2>
        <table>
          <thead><tr><th>#</th><th>Opened By</th><th>Opened At</th><th>Closed At</th><th>Total Sales</th><th>Status</th></tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{s.opened_by?.name}</td>
                <td>{new Date(s.opened_at).toLocaleString()}</td>
                <td>{s.closed_at ? new Date(s.closed_at).toLocaleString() : "—"}</td>
                <td>₹{parseFloat(s.closing_total_sales).toFixed(2)}</td>
                <td><span className={`badge ${s.status === "open" ? "badge-green" : "badge-gray"}`}>{s.status}</span></td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={6}>No sessions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
