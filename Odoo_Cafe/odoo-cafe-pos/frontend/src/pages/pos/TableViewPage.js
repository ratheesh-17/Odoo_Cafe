import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

export default function TableViewPage() {
  const navigate = useNavigate();
  const [floors, setFloors] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]); // draft + sent_to_kitchen only
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(null); // table id being cleared

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fl, sess] = await Promise.all([
        api.get("/floors").then(r => r.data),
        api.get("/sessions/current").then(r => r.data).catch(() => null),
      ]);
      setFloors(fl);
      // FastAPI returns HTTP 200 with null body when no session — treat that as no session
      const activeSess = sess && sess.id ? sess : null;
      setSession(activeSess);
      if (activeSess) {
        // Only draft + sent_to_kitchen count as "occupied" — paid orders free the table
        const [drafts, kitchen] = await Promise.all([
          api.get(`/orders?session_id=${activeSess.id}&status=draft`).then(r => r.data).catch(() => []),
          api.get(`/orders?session_id=${activeSess.id}&status=sent_to_kitchen`).then(r => r.data).catch(() => []),
        ]);
        setActiveOrders([...drafts, ...kitchen]);
      } else {
        setActiveOrders([]);
      }
    } catch (err) {
      console.error("TableView load error:", err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Map table id → its active order
  const tableOrderMap = {};
  activeOrders.filter(o => o.table).forEach(o => { tableOrderMap[o.table.id] = o; });

  const selectTable = (table) => {
    if (!table.is_active) return;
    sessionStorage.setItem("ACTIVE_TABLE", JSON.stringify({ id: table.id, table_number: table.table_number }));
    const existing = tableOrderMap[table.id];
    if (existing) {
      sessionStorage.setItem("EDIT_ORDER_ID", existing.id);
      toast.success(`Loading order for Table ${table.table_number}`);
    } else {
      toast.success(`Table ${table.table_number} selected`);
    }
    navigate("/pos/order");
  };

  const clearTable = async (e, table) => {
    e.stopPropagation(); // don't trigger selectTable
    const order = tableOrderMap[table.id];
    if (!order) return;

    const hasItems = order.items?.length > 0;
    const msg = hasItems
      ? `Cancel order ${order.order_number} and free Table ${table.table_number}? Items will be lost.`
      : `Clear Table ${table.table_number}? The empty order will be deleted.`;

    if (!window.confirm(msg)) return;

    setClearing(table.id);
    try {
      if (hasItems) {
        // Has items — cancel the order
        await api.post(`/orders/${order.id}/cancel`);
        toast.success(`Table ${table.table_number} cleared`);
      } else {
        // Empty order — just delete it
        await api.delete(`/orders/${order.id}`);
        toast.success(`Table ${table.table_number} cleared`);
      }
      // If this was the active table in session, clear it
      const savedTable = sessionStorage.getItem("ACTIVE_TABLE");
      if (savedTable) {
        const parsed = JSON.parse(savedTable);
        if (parsed.id === table.id) {
          sessionStorage.removeItem("ACTIVE_TABLE");
          sessionStorage.removeItem("EDIT_ORDER_ID");
        }
      }
      await load();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not clear table";
      toast.error(msg);
    } finally {
      setClearing(null);
    }
  };

  if (loading) return <div style={{ padding: "2rem", color: "#e2e8f0" }}>Loading tables...</div>;

  if (!session) return (
    <div style={{ padding: "2rem", color: "#94a3b8", textAlign: "center" }}>
      <p>No active session. <button className="btn btn-primary" style={{ width: "auto", marginTop: "1rem" }} onClick={() => navigate("/backend")}>Open Session</button></p>
    </div>
  );

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header">
        <div><h1>Table View</h1><p>Select a table to open or create an order</p></div>
        <button className="btn btn-secondary" style={{ width: "auto" }} onClick={load}>↺ Refresh</button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
        {[
          { color: "#22c55e", label: "Available" },
          { color: "#f59e0b", label: "Order Active" },
          { color: "#334155", label: "Inactive" },
        ].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#94a3b8" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: l.color, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>

      {floors.length === 0 && (
        <p style={{ color: "#475569", textAlign: "center", padding: "3rem" }}>
          No floors configured. <span style={{ color: "#818cf8", cursor: "pointer" }} onClick={() => navigate("/backend/floors")}>Set up floors & tables →</span>
        </p>
      )}

      {floors.map(floor => (
        <div key={floor.id} className="form-card">
          <strong style={{ fontSize: "1rem", color: "#000000" }}>📍 {floor.name}</strong>
          {!floor.tables?.length && <p style={{ color: "#475569", fontSize: "0.875rem" }}>No tables on this floor.</p>}
          <div className="table-grid">
            {floor.tables?.map(table => {
              const order = tableOrderMap[table.id];
              const hasOrder = Boolean(order);
              const isClearing = clearing === table.id;

              const borderColor = !table.is_active ? "rgba(255,255,255,0.06)" : hasOrder ? "#f59e0b" : "#22c55e";
              const bg = !table.is_active ? "rgba(255,255,255,0.02)" : hasOrder ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.06)";

              return (
                <div key={table.id} style={{ position: "relative" }}>
                  <button
                    onClick={() => selectTable(table)}
                    disabled={!table.is_active || isClearing}
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.5rem",
                      borderRadius: "12px",
                      border: `2px solid ${borderColor}`,
                      background: bg,
                      color: table.is_active ? "#e2e8f0" : "#475569",
                      cursor: table.is_active ? "pointer" : "not-allowed",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      transition: "all 0.15s",
                    }}
                  >
                    <div>{table.table_number}</div>
                    <div style={{
                      fontSize: "0.7rem",
                      color: !table.is_active ? "#334155" : hasOrder ? "#f59e0b" : "#64748b",
                      fontWeight: 400,
                      marginTop: "0.2rem",
                    }}>
                      {isClearing ? "Clearing..." : !table.is_active ? "Inactive" : hasOrder ? `${order.status?.replace("_", " ")} · Tap to open` : `${table.seats} seats`}
                    </div>
                  </button>

                  {/* Clear Table button — only shown when table has an active order */}
                  {hasOrder && table.is_active && (
                    <button
                      onClick={(e) => clearTable(e, table)}
                      disabled={isClearing}
                      title="Clear table — cancel the active order and mark table as available"
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(239,68,68,0.85)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        zIndex: 2,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
