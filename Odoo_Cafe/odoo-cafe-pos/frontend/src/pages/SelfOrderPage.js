import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`;
const STAGE_LABEL = {
  to_cook: "Received – waiting to cook",
  preparing: "Being prepared...",
  completed: "Ready to serve! 🎉",
  pending_staff: "Order received. Waiting for staff confirmation",
};
const STAGE_COLOR = { to_cook: "#f59e0b", preparing: "#f7c7b7", completed: "#22c55e", pending_staff: "#6366f1" };

export default function SelfOrderPage() {
  const { token } = useParams();
  const [menu, setMenu] = useState(null);
  const [order, setOrder] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState("");
  const [coupon, setCoupon] = useState("");
  const [view, setView] = useState("menu"); // menu | cart | status
  const [adding, setAdding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMenu = useCallback(async () => {
    try {
      const { data } = await api.get(`/s/${token}/menu`);
      setMenu(data);
    } catch {
      setError("Invalid or expired QR code.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Poll order status when in status view
  useEffect(() => {
    if (view !== "status" || !order) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/s/${token}/orders/${order.id}/status`);
        setOrder((prev) => ({ ...prev, kitchen_stage: data.kitchen_stage, items: data.items ?? prev.items }));
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [view, order, token]);

  const getOrCreateOrder = async () => {
    if (order) return order;
    const { data } = await api.post(`/s/${token}/orders`);
    setOrder(data);
    return data;
  };

  const addItem = async (product) => {
    if (menu?.config?.mode === "qr_menu") return;
    setAdding(product.id);
    try {
      const o = await getOrCreateOrder();
      const { data } = await api.post(`/s/${token}/orders/${o.id}/items`, { product_id: product.id, quantity: 1 });
      setOrder(data);
    } catch {
    } finally {
      setAdding(null);
    }
  };

  const updateItem = async (item, qty) => {
    if (!order) return;
    try {
      if (qty < 1) {
        const { data } = await api.delete(`/s/${token}/orders/${order.id}/items/${item.id}`);
        setOrder(data);
      } else {
        const { data } = await api.put(`/s/${token}/orders/${order.id}/items/${item.id}`, { quantity: qty });
        setOrder(data);
      }
    } catch {}
  };

  const applyCoupon = async () => {
    if (!coupon.trim() || !order) return;
    try {
      const { data } = await api.post(`/s/${token}/orders/${order.id}/coupon`, { code: coupon.trim().toUpperCase() });
      setOrder(data);
      setCoupon("");
      toast.success("Coupon applied!");
    } catch {}
  };

  const submitOrder = async () => {
    if (!order?.items?.length) return toast.error("Cart is empty");
    try {
      const { data } = await api.post(`/s/${token}/orders/${order.id}/submit`);
      setOrder(data);
      setView("status");
      toast.success("Order placed! Waiting for staff confirmation.");
    } catch {}
  };

  const cartCount = order?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  if (loading) return <div style={{ ...pageStyle(menu), display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#fff", fontSize: "1.25rem" }}>Loading menu...</div></div>;
  if (error) return <div style={{ ...pageStyle(null), display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#fff", textAlign: "center" }}><div style={{ fontSize: "3rem" }}>❌</div><p>{error}</p></div></div>;

  const isOnline = menu.config.mode === "online_ordering";
  const filtered = (menu.products ?? []).filter((p) => {
    const matchCat = activeCat ? p.category_id === activeCat || p.category?.id === activeCat : true;
    const matchSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchCat && matchSearch;
  });

  if (view === "status" && order) {
    const stage = order.kitchen_stage ?? (order.status === "draft" ? "pending_staff" : null);
    return (
      <div style={{ ...pageStyle(menu), display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ background: "rgba(0,0,0,0.6)", borderRadius: "24px", padding: "2.5rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>
            {stage === "completed" ? "🎉" : stage === "preparing" ? "👨‍🍳" : "⏳"}
          </div>
          <h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>{order.order_number}</h2>
          <div style={{ background: STAGE_COLOR[stage] ?? "#444", color: "#fff", borderRadius: "999px", padding: "0.5rem 1.5rem", display: "inline-block", fontWeight: 700, marginBottom: "1rem" }}>
            {STAGE_LABEL[stage] ?? "Order received"}
          </div>
          <div style={{ color: "#ddd", marginBottom: "1.5rem" }}>
            {order.items?.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.1)", textDecoration: item.is_done ? "line-through" : "none", opacity: item.is_done ? 0.5 : 1 }}>
                <span>{item.product?.name ?? item.product_name}</span>
                <span>×{item.quantity}</span>
              </div>
            ))}
          </div>
          <div style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700 }}>Total: {fmt(order.total_amount)}</div>
          <p style={{ color: "#aaa", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            {order.status === "draft" && !order.kitchen_stage ? "Your order is with staff. They will confirm and send it to the kitchen shortly." : "Auto-refreshes every 8 seconds"}
          </p>
        </div>
      </div>
    );
  }

  if (view === "cart" && isOnline) {
    return (
      <div style={{ ...pageStyle(menu), padding: "1.5rem" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <button onClick={() => setView("menu")} style={ghostBtn}>← Back to Menu</button>
          <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Your Order</h2>
          {!order?.items?.length ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "3rem" }}>Cart is empty</div>
          ) : (
            <>
              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "16px", overflow: "hidden", marginBottom: "1rem" }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ color: "#fff" }}>{item.product.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button onClick={() => updateItem(item, item.quantity - 1)} style={qtyBtn}>−</button>
                      <span style={{ color: "#fff", minWidth: "1.5rem", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateItem(item, item.quantity + 1)} style={qtyBtn}>+</button>
                      <span style={{ color: "#aaa", minWidth: "4rem", textAlign: "right" }}>{fmt(item.line_total)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "0.5rem 0.75rem" }}
                  />
                  <button onClick={applyCoupon} style={{ background: "#c05621", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer" }}>Apply</button>
                </div>
                {order.coupon && <div style={{ color: "#22c55e", fontSize: "0.85rem", marginTop: "0.4rem" }}>✓ {order.coupon.code} applied</div>}
              </div>

              <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem", color: "#ddd" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax</span><span>{fmt(order.tax_amount)}</span></div>
                {order.discount_amount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#22c55e" }}><span>Discount</span><span>-{fmt(order.discount_amount)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.15rem", color: "#fff", marginTop: "0.5rem" }}><span>Total</span><span>{fmt(order.total_amount)}</span></div>
              </div>

              <button onClick={submitOrder} style={{ width: "100%", background: "linear-gradient(135deg, #ff8c52, #ff5c28)", color: "#fff", border: "none", borderRadius: "14px", padding: "1rem", fontSize: "1.1rem", fontWeight: 800, cursor: "pointer" }}>
                Place Order →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Menu view
  return (
    <div style={{ ...pageStyle(menu), minHeight: "100vh" }}>
      <div style={{ background: "rgba(0,0,0,0.5)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)" }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>☕ {menu.table ? `Table ${menu.table.table_number}` : "Menu"}</div>
          {menu.table && <div style={{ color: "#aaa", fontSize: "0.8rem" }}>{menu.table.floor_name}</div>}
        </div>
        {isOnline && (
          <button onClick={() => setView("cart")} style={{ background: "#ff8c52", color: "#fff", border: "none", borderRadius: "999px", padding: "0.5rem 1.25rem", fontWeight: 700, cursor: "pointer", position: "relative" }}>
            🛒 Cart {cartCount > 0 && <span style={{ background: "#fff", color: "#ff5c28", borderRadius: "999px", padding: "0.1rem 0.45rem", fontSize: "0.75rem", marginLeft: "0.25rem", fontWeight: 800 }}>{cartCount}</span>}
          </button>
        )}
      </div>

      <div style={{ padding: "1rem 1.5rem" }}>
        <input
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "12px", padding: "0.75rem 1rem", fontSize: "1rem", marginBottom: "0.75rem", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
          <button onClick={() => setActiveCat(null)} style={{ ...catChip, background: !activeCat ? "#ff8c52" : "rgba(0,0,0,0.4)", color: "#fff" }}>All</button>
          {(menu.categories ?? []).map((c) => (
            <button key={c.id} onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              style={{ ...catChip, background: activeCat === c.id ? c.color : "rgba(0,0,0,0.4)", color: "#fff", borderColor: c.color }}>
              {c.name}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => addItem(p)}
              style={{ background: "rgba(0,0,0,0.55)", borderRadius: "16px", overflow: "hidden", cursor: isOnline ? "pointer" : "default", border: `2px solid ${p.category?.color ?? "rgba(255,255,255,0.1)"}`, transition: "transform 0.15s" }}
            >
              <div style={{ height: "80px", background: p.category?.color ?? "#f7c7b7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#7c2f18", fontWeight: 800 }}>
                {p.name[0]}
              </div>
              <div style={{ padding: "0.75rem" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{p.name}</div>
                {p.description && <div style={{ color: "#aaa", fontSize: "0.75rem", marginBottom: "0.4rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</div>}
                <div style={{ color: "#ff8c52", fontWeight: 800 }}>{fmt(p.price)}</div>
                {adding === p.id && <div style={{ color: "#aaa", fontSize: "0.75rem" }}>Adding...</div>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1", color: "#aaa", textAlign: "center", padding: "3rem" }}>No items found</div>}
        </div>
      </div>
    </div>
  );
}

function pageStyle(menu) {
  const style = {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    backgroundColor: menu?.config?.background_color ?? "#111827",
  };
  if (menu?.config?.background_image) {
    style.backgroundImage = `url(${menu.config.background_image})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  return style;
}

const catChip = { border: "1px solid rgba(255,255,255,0.2)", borderRadius: "999px", padding: "0.4rem 1rem", cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.875rem", fontWeight: 600 };
const ghostBtn = { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", marginBottom: "1rem" };
const qtyBtn = { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", fontWeight: 700, fontSize: "1rem" };
