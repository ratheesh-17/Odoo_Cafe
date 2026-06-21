import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`;
const STATUS_COLOR = { draft: "badge-gray", sent_to_kitchen: "badge-blue", paid: "badge-green", cancelled: "badge-red" };

export default function OrdersListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sess = await api.get("/sessions/current").then((r) => r.data).catch(() => null);
      setSession(sess);
      const params = new URLSearchParams();
      if (sess) params.set("session_id", sess.id);
      if (search.trim()) params.set("search", search.trim());
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (order) => {
    // Prevent deleting orders that are not in draft status
    if (order.status !== "draft") {
      toast.error(`Cannot delete orders with status: ${order.status}`);
      return;
    }
    if (!window.confirm(`Delete order ${order.order_number}?`)) return;
    try {
      await api.delete(`/orders/${order.id}`);
      toast.success("Order deleted");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete order");
    }
  };

  const handleCancel = async (order) => {
    // Only draft orders can be cancelled
    if (order.status !== "draft") {
      toast.error(`Cannot cancel orders with status: ${order.status}. Only draft orders can be cancelled.`);
      return;
    }
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    try {
      await api.post(`/orders/${order.id}/cancel`);
      toast.success("Order cancelled");
      load();
      setSelected(prev => prev ? { ...prev, status: "cancelled" } : null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel order");
    }
  };

  const handleEdit = (order) => {
    // Store order id in sessionStorage so OrderViewPage can load it
    sessionStorage.setItem("EDIT_ORDER_ID", order.id);
    navigate("/pos/order");
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading orders...</div>;

  return (
    <div className="page-shell" style={{ padding: "1.5rem" }}>
      <div className="page-header">
        <div><h1>Orders</h1><p>Current session history</p></div>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search by order #, customer, or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: "300px" }}
        />
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Employee</th>
              <th>Customer</th>
              <th>Table</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: "pointer" }}>
                <td><code>{o.order_number}</code></td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td>{o.employee?.name ?? "—"}</td>
                <td>{o.customer?.name ?? "—"}</td>
                <td>{o.table?.table_number ?? "Takeaway"}</td>
                <td>{fmt(o.total_amount)}</td>
                <td>
                  <span className={`badge ${STATUS_COLOR[o.status] ?? "badge-gray"}`}>
                    {o.status?.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="empty">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2>Order {selected.order_number}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
              <div><strong>Date:</strong> {new Date(selected.created_at).toLocaleString()}</div>
              <div><strong>Status:</strong> <span className={`badge ${STATUS_COLOR[selected.status] ?? "badge-gray"}`}>{selected.status?.replace("_", " ")}</span></div>
              <div><strong>Employee:</strong> {selected.employee?.name ?? "—"}</div>
              <div><strong>Customer:</strong> {selected.customer?.name ?? "—"}</div>
              <div><strong>Table:</strong> {selected.table?.table_number ?? "Takeaway"}</div>
            </div>

            <div className="table-card" style={{ marginBottom: "1rem" }}>
              <table>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {selected.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product.name}</td>
                      <td>{item.quantity}</td>
                      <td>{fmt(item.unit_price)}</td>
                      <td>{fmt(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gap: "0.4rem", fontSize: "0.9rem", textAlign: "right" }}>
              <div>Subtotal: {fmt(selected.subtotal)}</div>
              <div>Tax: {fmt(selected.tax_amount)}</div>
              {selected.discount_amount > 0 && <div>Discount: -{fmt(selected.discount_amount)}</div>}
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Total: {fmt(selected.total_amount)}</div>
            </div>

            {selected.status === "draft" && (
              <div className="form-actions" style={{ marginTop: "1.25rem" }}>
                <button className="btn btn-danger" onClick={() => handleDelete(selected)}>Delete</button>
                <button className="btn btn-secondary" style={{ width: "auto" }} onClick={() => handleCancel(selected)}>Cancel Order</button>
                <button className="btn btn-primary" onClick={() => handleEdit(selected)}>Edit Order</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
