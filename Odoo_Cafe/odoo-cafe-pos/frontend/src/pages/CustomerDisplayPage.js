import { useEffect, useState } from "react";
import api from "../api";

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`;

export default function CustomerDisplayPage() {
  const [data, setData] = useState(null);
  // Gap #8 — auto-read order id from localStorage written by OrderViewPage
  const [orderId, setOrderId] = useState(() => {
    const stored = localStorage.getItem("CUSTOMER_DISPLAY_ORDER_ID");
    return stored ? parseInt(stored) : null;
  });

  // Also poll localStorage every 2s in case POS switches to a new order
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem("CUSTOMER_DISPLAY_ORDER_ID");
      if (stored) setOrderId(parseInt(stored));
    };
    const interval = setInterval(sync, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const poll = async () => {
      try {
        const { data: d } = await api.get(`/customer-display/${orderId}`);
        setData(d);
      } catch {
        setData(null);
      }
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!orderId) {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>☕</div>
          <h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>Customer Display</h2>
          <p style={{ color: "#aaa" }}>Waiting for the cashier to open an order...</p>
          <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "0.5rem" }}>This display updates automatically when a POS order is active.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ fontSize: "3rem" }}>⏳</div>
          <p style={{ color: "#aaa", marginTop: "1rem" }}>Waiting for order #{orderId}...</p>
        </div>
      </div>
    );
  }

  // Thank you / completed
  if (data.status === "paid") {
    return (
      <div style={shell}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: "5rem" }}>🎉</div>
          <h1 style={{ color: "#22c55e", fontSize: "2.5rem", margin: "0.5rem 0" }}>Thank You!</h1>
          <p style={{ color: "#fff", fontSize: "1.25rem" }}>Order {data.order_number} • {fmt(data.total_amount)}</p>
          <p style={{ color: "#aaa" }}>Payment received. Enjoy your order!</p>
          <button onClick={() => { setData(null); setOrderId(null); localStorage.removeItem("CUSTOMER_DISPLAY_ORDER_ID"); }} style={{ ...primaryBtn, marginTop: "1.5rem", padding: "0.75rem 2rem" }}>
            New Order
          </button>
        </div>
      </div>
    );
  }

  // Payment view (UPI)
  if (!data.is_paid && data.payment_type === "upi") {
    return (
      <div style={shell}>
        <div style={card}>
          <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "1rem" }}>Scan to Pay</h2>
          {data.upi_qr_base64 ? (
            <img src={`data:image/png;base64,${data.upi_qr_base64}`} alt="UPI QR" style={{ width: "220px", height: "220px", display: "block", margin: "0 auto 1rem", borderRadius: "12px" }} />
          ) : (
            <div style={{ width: "220px", height: "220px", background: "rgba(255,255,255,0.08)", borderRadius: "12px", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>Loading QR...</div>
          )}
          <div style={{ textAlign: "center", color: "#fff", fontSize: "2rem", fontWeight: 800 }}>{fmt(data.total_amount)}</div>
          <p style={{ textAlign: "center", color: "#aaa", marginTop: "0.5rem" }}>UPI Payment</p>
        </div>
      </div>
    );
  }

  // Order view
  return (
    <div style={shell}>
      <div style={{ ...card, maxWidth: "560px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ color: "#fff", margin: 0 }}>{data.order_number}</h2>
            {data.table_number && <span style={{ color: "#aaa", fontSize: "0.85rem" }}>Table {data.table_number}</span>}
          </div>
          <span style={{ background: "#f7c7b7", color: "#7c2f18", borderRadius: "999px", padding: "0.35rem 0.85rem", fontSize: "0.8rem", fontWeight: 700 }}>
            {data.status?.replace("_", " ") ?? "Draft"}
          </span>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          {(data.items ?? []).map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#ddd" }}>
              <span>{item.product_name} <span style={{ color: "#aaa" }}>×{item.quantity}</span></span>
              <span>{fmt(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "0.75rem", display: "grid", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "0.9rem" }}><span>Subtotal</span><span>{fmt(data.subtotal)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "0.9rem" }}><span>Tax</span><span>{fmt(data.tax_amount)}</span></div>
          {data.discount_amount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#22c55e", fontSize: "0.9rem" }}><span>Discount</span><span>-{fmt(data.discount_amount)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontWeight: 800, fontSize: "1.4rem", marginTop: "0.5rem" }}><span>Total</span><span>{fmt(data.total_amount)}</span></div>
        </div>
      </div>
    </div>
  );
}

const shell = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, #fff7f2, #fff1eb)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "sans-serif",
  padding: "2rem",
};

const card = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "24px",
  padding: "2.5rem",
  backdropFilter: "blur(12px)",
  maxWidth: "400px",
  width: "100%",
};

const primaryBtn = {
  background: "linear-gradient(135deg, #ff8c52, #ff5c28)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "0.6rem 1.25rem",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "1rem",
};
