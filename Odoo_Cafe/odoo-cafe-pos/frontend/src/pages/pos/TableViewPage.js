import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

export default function TableViewPage() {
  const navigate = useNavigate();
  const [floors, setFloors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [fl, sess] = await Promise.all([
          api.get("/floors").then(r => r.data),
          api.get("/sessions/current").then(r => r.data).catch(() => null),
        ]);
        setFloors(fl);
        setSession(sess);
        if (sess) {
          const drafts = await api.get(`/orders?session_id=${sess.id}&status=draft`).then(r => r.data).catch(() => []);
          const kitchen = await api.get(`/orders?session_id=${sess.id}&status=sent_to_kitchen`).then(r => r.data).catch(() => []);
          setOrders([...drafts, ...kitchen]);
        }
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const activeTableIds = new Set(orders.filter(o => o.table).map(o => o.table.id));

  const selectTable = (table) => {
    if (!table.is_active) return;
    // persist table so Order View and topbar pick it up
    sessionStorage.setItem("ACTIVE_TABLE", JSON.stringify({ id: table.id, table_number: table.table_number }));
    // if there's an existing active order for this table, load it for editing
    const existing = orders.find(o => o.table?.id === table.id);
    if (existing) {
      sessionStorage.setItem("EDIT_ORDER_ID", existing.id);
      toast.success(`Loading order for Table ${table.table_number}`);
    } else {
      toast.success(`Table ${table.table_number} selected`);
    }
    navigate("/pos/order");
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading tables...</div>;

  if (!session) return (
    <div style={{ padding: "2rem", color: "#7c4a37", textAlign: "center" }}>
      <p>No active session. <button className="btn btn-primary" style={{ width: "auto", marginTop: "1rem" }} onClick={() => navigate("/backend")}>Open Session</button></p>
    </div>
  );

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="page-header">
        <div><h1>Table View</h1><p>Select a table to open or create an order</p></div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#7c4a37" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          Available
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#7c4a37" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          Active Order
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#7c4a37" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#c4c4c4", display: "inline-block" }} />
          Inactive
        </span>
      </div>

      {floors.length === 0 && (
        <p style={{ color: "#7c4a37", textAlign: "center", padding: "3rem" }}>No floors configured. <span style={{ color: "#c05621", cursor: "pointer" }} onClick={() => navigate("/backend/floors")}>Set up floors & tables →</span></p>
      )}

      {floors.map(floor => (
        <div key={floor.id} className="form-card">
          <strong style={{ fontSize: "1rem", color: "#7c2f18" }}>📍 {floor.name}</strong>
          {!floor.tables?.length && <p style={{ color: "#475569", fontSize: "0.875rem" }}>No tables on this floor.</p>}
          <div className="table-grid">
            {floor.tables?.map(table => {
              const hasOrder = activeTableIds.has(table.id);
              const borderColor = !table.is_active ? "rgba(255,255,255,0.06)" : hasOrder ? "#f59e0b" : "#22c55e";
              const bg = !table.is_active ? "rgba(255,255,255,0.02)" : hasOrder ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.06)";
              return (
                <button
                  key={table.id}
                  onClick={() => selectTable(table)}
                  disabled={!table.is_active}
                  style={{
                    padding: "0.75rem 0.5rem",
                    borderRadius: "12px",
                    border: `2px solid ${borderColor}`,
                    background: bg,
                    color: table.is_active ? "#7c2f18" : "#7c4a37",
                    cursor: table.is_active ? "pointer" : "not-allowed",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    transition: "all 0.15s",
                  }}
                >
                  <div>{table.table_number}</div>
                    <div style={{ fontSize: "0.7rem", color: !table.is_active ? "#7c4a37" : hasOrder ? "#f59e0b" : "#7c4a37", fontWeight: 400, marginTop: "0.2rem" }}>
                    {!table.is_active ? "Inactive" : hasOrder ? "Order Active" : `${table.seats} seats`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
