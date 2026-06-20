import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api";
import toast from "react-hot-toast";

const publicApi = axios.create({ baseURL: "http://localhost:8000", headers: { "Content-Type": "application/json" } });

const STAGES = ["to_cook", "preparing", "completed"];
const STAGE_LABEL = { to_cook: "To Cook", preparing: "Preparing", completed: "Completed" };
const STAGE_COLOR = { to_cook: "#ef4444", preparing: "#f59e0b", completed: "#22c55e" };

export default function KitchenPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("to_cook");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.set("stage", stageFilter);
      if (productFilter) params.set("product_id", productFilter);
      if (categoryFilter) params.set("category_id", categoryFilter);
      const [t, prods, cats] = await Promise.all([
        api.get(`/kitchen/tickets?${params}`).then((r) => r.data),
        publicApi.get("/products").then((r) => r.data).catch(() => []),
        publicApi.get("/categories").then((r) => r.data).catch(() => []),
      ]);
      setTickets(t);
      setProducts(prods);
      setCategories(cats);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [stageFilter, productFilter, categoryFilter]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const advance = async (ticketId) => {
    try {
      const { data } = await api.post(`/kitchen/tickets/${ticketId}/advance`);
      setTickets((prev) => {
        const updated = prev.map((t) => (t.id === ticketId ? data : t));
        return updated.filter((t) => t.stage === stageFilter);
      });
      toast.success(`Order advanced to ${STAGE_LABEL[data.stage] ?? data.stage}`);
    } catch {}
  };

  const markItemDone = async (ticketId, itemId) => {
    try {
      const { data } = await api.post(`/kitchen/tickets/${ticketId}/items/${itemId}/done`);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? data : t)));
    } catch {}
  };

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    return (
      t.order?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.items?.some((i) => i.product_name?.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <main className="backend-main">
      <header className="page-header" style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/backend");
            }}
            style={{ padding: "0.45rem 0.75rem" }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>🍳 Kitchen Display</h1>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginLeft: "auto" }}>
          <input
            placeholder="Search order or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={load}>↺ Refresh</button>
        </div>
      </header>

      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(251,146,60,0.12)" }}>
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            style={{
              flex: 1, padding: "0.85rem", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "1rem",
              background: stageFilter === s ? STAGE_COLOR[s] : "#fff7f2",
              color: stageFilter === s ? "#fff" : "#7c2f18",
              borderBottom: stageFilter === s ? `3px solid ${STAGE_COLOR[s]}` : "3px solid transparent",
              transition: "all 0.2s",
            }}
          >
            {STAGE_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>Loading tickets...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", padding: "1.5rem" }}>
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                background: "#fff7f2", borderRadius: "16px", overflow: "hidden",
                border: `2px solid ${STAGE_COLOR[ticket.stage] ?? "#2a2a4a"}`,
                boxShadow: `0 0 20px ${STAGE_COLOR[ticket.stage]}22`,
              }}
            >
              <div
                onClick={() => advance(ticket.id)}
                style={{
                  padding: "1rem 1.25rem", cursor: "pointer",
                  background: `${STAGE_COLOR[ticket.stage]}22`,
                  borderBottom: "1px solid rgba(251,146,60,0.12)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
                title="Click to advance stage"
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>#{ticket.order.order_number}</div>
                  {ticket.order.table_number && <div style={{ fontSize: "0.8rem", color: "#aaa" }}>Table {ticket.order.table_number}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                  <span style={{ background: STAGE_COLOR[ticket.stage], color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                    {STAGE_LABEL[ticket.stage]}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#666" }}>
                    {new Date(ticket.sent_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div style={{ padding: "0.75rem 1.25rem 1.25rem" }}>
                {ticket.items?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markItemDone(ticket.id, item.id)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.6rem 0", borderBottom: "1px solid rgba(251,146,60,0.12)", cursor: "pointer",
                      textDecoration: item.is_done ? "line-through" : "none",
                      color: item.is_done ? "#7c4a37" : "#5c3529",
                      transition: "color 0.2s",
                    }}
                    title="Click to mark item done"
                  >
                    <span>{item.product_name}</span>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: "#555" }}>
              <div style={{ fontSize: "3rem" }}>✅</div>
              <p>No tickets in "{STAGE_LABEL[stageFilter]}"</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}


