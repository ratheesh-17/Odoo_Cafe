import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`;

// Module-level guards — survive React StrictMode double-mount
let _sessionCheckDone = false;
let _sessionToastShown = false;

export default function OrderViewPage() {
  // Reset module guards when component truly unmounts (navigating away)
  useEffect(() => {
    _sessionCheckDone = false;
    _sessionToastShown = false;
    return () => {
      _sessionCheckDone = false;
      _sessionToastShown = false;
    };
  }, []);
  const navigate = useNavigate();
  // Use a ref for navigate so it never causes useCallback/useEffect to re-run
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  const [session, setSession] = useState(null);
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payMethods, setPayMethods] = useState([]);
  const [payType, setPayType] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [txRef, setTxRef] = useState("");
  const [upiQr, setUpiQr] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paidOrder, setPaidOrder] = useState(null);
  const [floors, setFloors] = useState([]);
  const [showFloor, setShowFloor] = useState(false);
  const [activeTable, setActiveTable] = useState(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: "", email: "", phone: "" });

  // Empty deps — runs once on mount only, uses navigateRef to avoid loop
  const loadBase = useCallback(async () => {
    if (_sessionCheckDone) return;
    _sessionCheckDone = true;
    try {
      const [sess, prods, cats, fl] = await Promise.all([
        api.get("/sessions/current").then(r => r.data).catch(() => null),
        api.get("/products").then(r => r.data.filter(p => p.is_active)).catch(() => []),
        api.get("/categories").then(r => r.data).catch(() => []),
        api.get("/floors").then(r => r.data).catch(() => []),
      ]);
      setSession(sess);
      setProducts(prods);
      setCategories(cats);
      setFloors(fl);

      if (!sess) {
        if (!_sessionToastShown) {
          _sessionToastShown = true;
          toast.error("No active session. Open a session first.", { id: "no-session" });
        }
        // Do NOT navigate — just set loading false and let the UI show the no-session state
        return;
      }

      const editId = sessionStorage.getItem("EDIT_ORDER_ID");
      if (editId) {
        sessionStorage.removeItem("EDIT_ORDER_ID");
        const { data: existing } = await api.get(`/orders/${editId}`);
        setOrder(existing);
        if (existing.table) {
          setActiveTable(existing.table);
          sessionStorage.setItem("ACTIVE_TABLE", JSON.stringify(existing.table));
        }
      } else {
        const savedTable = sessionStorage.getItem("ACTIVE_TABLE");
        const restoredTable = savedTable ? JSON.parse(savedTable) : null;
        if (restoredTable) setActiveTable(restoredTable);

        const drafts = await api.get(`/orders?session_id=${sess.id}&status=draft`).then(r => r.data).catch(() => []);
        const tableDraft = restoredTable ? drafts.find(o => o.table?.id === restoredTable.id) : null;
        const posDraft = tableDraft || drafts.find(o => o.order_source === "pos" && !o.table);
        if (posDraft) {
          setOrder(posDraft);
        } else {
          const tableId = restoredTable?.id ?? null;
          const o = await api.post("/orders", { table_id: tableId }).then(r => r.data);
          setOrder(o);
        }
      }
    } catch {} finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBase(); }, [loadBase]);

  useEffect(() => {
    if (order?.id) localStorage.setItem("CUSTOMER_DISPLAY_ORDER_ID", String(order.id));
  }, [order?.id]);

  const addItem = async (product) => {
    if (!order) return;
    setAdding(product.id);
    try { const { data } = await api.post(`/orders/${order.id}/items`, { product_id: product.id, quantity: 1 }); setOrder(data); }
    catch {} finally { setAdding(null); }
  };

  const updateItem = async (item, qty) => {
    setUpdating(item.id);
    try {
      if (qty < 1) { const { data } = await api.delete(`/orders/${order.id}/items/${item.id}`); setOrder(data); }
      else { const { data } = await api.put(`/orders/${order.id}/items/${item.id}`, { quantity: qty }); setOrder(data); }
    } catch {} finally { setUpdating(null); }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try { const { data } = await api.post(`/orders/${order.id}/coupon`, { code: couponCode.trim().toUpperCase() }); setOrder(data); setCouponCode(""); setShowCoupon(false); toast.success("Coupon applied!"); }
    catch {}
  };

  const removeCoupon = async () => {
    try { const { data } = await api.delete(`/orders/${order.id}/coupon`); setOrder(data); }
    catch {}
  };

  const sendToKitchen = async () => {
    try { const { data } = await api.post(`/orders/${order.id}/send-to-kitchen`); setOrder(data); toast.success("Sent to kitchen!"); }
    catch {}
  };

  const openPayment = async () => {
    const methods = await api.get("/payment-methods").then(r => r.data.filter(m => m.is_enabled));
    setPayMethods(methods);
    setPayType(methods[0]?.type ?? "cash");
    setAmountPaid("");
    setTxRef("");
    setUpiQr(null);
    setShowPayment(true);
  };

  useEffect(() => {
    if (payType === "upi" && order && showPayment) {
      api.get(`/payment-methods/upi/qr?amount=${order.total_amount}`).then(r => setUpiQr(r.data)).catch(() => {});
    }
  }, [payType, showPayment, order]);

  const processPayment = async () => {
    const total = parseFloat(order.total_amount);
    const paid = payType === "cash" ? parseFloat(amountPaid) : total;
    if (payType === "cash" && paid < total) return toast.error(`Need at least ${fmt(total)}`);
    if (payType === "card" && !txRef.trim()) return toast.error("Transaction reference required");
    setPaying(true);
    try {
      const { data } = await api.post(`/orders/${order.id}/payment`, { payment_type: payType, amount_paid: paid, transaction_ref: payType === "card" ? txRef.trim() : null });
      setPaidOrder(data);
      setShowPayment(false);
      toast.success("Payment complete!");
    } catch {} finally { setPaying(false); }
  };

  const sendReceipt = async (email) => {
    if (!email.trim()) return;
    try { await api.post(`/orders/${paidOrder.id}/receipt/email`, { email }); toast.success("Receipt sent!"); }
    catch {}
  };

  const printReceipt = async () => {
    try {
      const resp = await api.get(`/orders/${paidOrder.id}/receipt/print`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
      window.open(url, "_blank");
    } catch {}
  };

  const searchCustomers = useCallback(async (q) => {
    setCustomerLoading(true);
    try {
      const params = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
      const { data } = await api.get(`/customers${params}`);
      setCustomers(data);
    } catch {} finally { setCustomerLoading(false); }
  }, []);

  useEffect(() => {
    if (!showCustomer) return;
    searchCustomers(customerSearch);
  }, [showCustomer, customerSearch, searchCustomers]);

  const assignCustomer = async (customer) => {
    try {
      const { data } = await api.put(`/orders/${order.id}`, { customer_id: customer.id });
      setOrder(data);
      setShowCustomer(false);
      setCustomerSearch("");
      toast.success(`${customer.name} assigned to order`);
    } catch {}
  };

  const removeCustomer = async () => {
    try {
      const { data } = await api.put(`/orders/${order.id}`, { customer_id: null });
      setOrder(data);
    } catch {}
  };

  const createAndAssignCustomer = async (e) => {
    e.preventDefault();
    if (!newCustForm.name.trim()) return toast.error("Name is required");
    try {
      const { data: created } = await api.post("/customers", {
        name: newCustForm.name.trim(),
        email: newCustForm.email.trim() || null,
        phone: newCustForm.phone.trim() || null,
      });
      await assignCustomer(created);
      setShowNewCustomer(false);
      setNewCustForm({ name: "", email: "", phone: "" });
    } catch {}
  };

  const newOrder = async () => {
    setPaidOrder(null);
    setActiveTable(null);
    sessionStorage.removeItem("ACTIVE_TABLE");
    localStorage.removeItem("CUSTOMER_DISPLAY_ORDER_ID");
    const o = await api.post("/orders", { table_id: null }).then(r => r.data);
    setOrder(o);
  };

  const selectTable = async (table) => {
    setActiveTable(table);
    sessionStorage.setItem("ACTIVE_TABLE", JSON.stringify(table));
    setShowFloor(false);
    try {
      const orders = session ? await api.get(`/orders?session_id=${session.id}&status=draft`).then(r => r.data) : [];
      const existing = orders.find(o => o.table?.id === table.id);
      if (existing) { setOrder(existing); }
      else { const { data } = await api.put(`/orders/${order.id}`, { table_id: table.id }); setOrder(data); }
    } catch {}
  };

  const filtered = products.filter(p => {
    const matchCat = activeCat ? (p.category?.id === activeCat || p.category_id === activeCat) : true;
    const matchSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    return matchCat && matchSearch;
  });

  const isPaid = order?.status === "paid";
  const canModify = order?.status === "draft";

  if (loading) return <div style={{ padding: "2rem" }}><p>Loading POS...</p></div>;

  if (!session) return (
    <div style={{ padding: "3rem", textAlign: "center", color: "#7c4a37" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>☕</div>
      <h2 style={{ color: "#7c2f18", marginBottom: "0.5rem" }}>No Active Session</h2>
      <p style={{ marginBottom: "1.5rem" }}>A manager needs to open a session before you can use the POS terminal.</p>
      <a href="/backend" style={{ color: "#c05621", textDecoration: "underline" }}>Go to Backend →</a>
    </div>
  );

  if (paidOrder) return (
    <div className="receipt-screen">
      <div className="receipt-card">
        <div className="receipt-icon">🎉</div>
        <h2>Payment Complete</h2>
        <p>{paidOrder.order_number}</p>
        <div className="receipt-total">{fmt(paidOrder.total_amount)}</div>
        <p>Paid via {paidOrder.payment?.payment_type?.toUpperCase()}{paidOrder.payment?.change_due > 0 ? ` · Change: ${fmt(paidOrder.payment.change_due)}` : ""}</p>
        <ReceiptActions onEmail={sendReceipt} onPrint={printReceipt} onNew={newOrder} />
      </div>
    </div>
  );

  return (
    <div className="pos-view">
      {/* Products panel */}
      <div className="pos-products">
        <div className="pos-search-bar">
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="pos-btn" onClick={() => setShowFloor(true)}>
            {activeTable ? `Table ${activeTable.table_number}` : "Select Table"}
          </button>
        </div>
        <div className="cat-tabs">
          <button className={`cat-tab ${!activeCat ? "active" : ""}`} onClick={() => setActiveCat(null)}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`cat-tab ${activeCat === c.id ? "active" : ""}`}
              style={activeCat === c.id ? { borderColor: c.color, color: c.color } : {}}
              onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}>
              <span className="color-dot" style={{ background: c.color }} />{c.name}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {filtered.map(p => (
            <button key={p.id} className="product-card" onClick={() => addItem(p)} disabled={adding === p.id}>
              <div className="product-thumb" style={{ background: p.category?.color ?? "#f7c7b7" }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { e.target.style.display = "none"; e.target.parentNode.querySelector(".product-initial").style.display = "flex"; }}
                    />
                  : null}
                <span className="product-initial" style={{ display: p.image_url ? "none" : "flex", background: "transparent" }}>{p.name[0]}</span>
              </div>
              <div className="product-name">{p.name}</div>
              <div className="product-price">{fmt(p.price)}</div>
              {adding === p.id && <div className="product-loading">...</div>}
            </button>
          ))}
          {filtered.length === 0 && <p className="empty" style={{ gridColumn: "1/-1" }}>No products found</p>}
        </div>
      </div>

      {/* Cart panel */}
      <div className="pos-cart">
        <div className="cart-header">
          <div>
            <strong>{order?.order_number ?? "No Order"}</strong>
            <span className="cart-sub">{activeTable ? `Table ${activeTable.table_number}` : "Takeaway"}{order?.customer ? ` · ${order.customer.name}` : ""}</span>
          </div>
          {order && <span className={`badge ${isPaid ? "badge-green" : order?.status === "sent_to_kitchen" ? "badge-blue" : "badge-gray"}`}>{order.status?.replace("_", " ")}</span>}
        </div>

        <div className="cart-items">
          {!order?.items?.length ? (
            <div className="cart-empty">🛒<p>Cart is empty</p></div>
          ) : order.items.map(item => (
            <div key={item.id} className={`cart-item ${updating === item.id ? "updating" : ""}`}>
              <div className="cart-item-info">
                <span>{item.product.name}</span>
                <span className="cart-item-price">{fmt(item.unit_price)}</span>
                {item.line_discount > 0 && <span className="cart-item-discount">-{fmt(item.line_discount)} promo</span>}
              </div>
              <div className="cart-item-qty">
                <button onClick={() => updateItem(item, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateItem(item, item.quantity + 1)}>+</button>
              </div>
              <span className="cart-item-total">{fmt(item.line_total)}</span>
            </div>
          ))}
        </div>

        {order?.coupon && (
          <div className="cart-coupon">
            <span>🎟 {order.coupon.code} applied</span>
            {canModify && <button onClick={removeCoupon}>✕</button>}
          </div>
        )}
        {order?.promotion && (
          <div className="cart-coupon"><span>🏷 {order.promotion.name} (auto)</span></div>
        )}

        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><span>{fmt(order?.subtotal)}</span></div>
          <div className="summary-row"><span>Tax</span><span>{fmt(order?.tax_amount)}</span></div>
          {order?.discount_amount > 0 && <div className="summary-row discount"><span>Discount</span><span>-{fmt(order?.discount_amount)}</span></div>}
          <div className="summary-row total"><span>Total</span><span>{fmt(order?.total_amount)}</span></div>
        </div>

        {order?.customer && (
          <div className="cart-coupon">
            <span>👤 {order.customer.name}{order.customer.email ? ` · ${order.customer.email}` : ""}</span>
            {canModify && <button onClick={removeCustomer}>✕</button>}
          </div>
        )}

        {!isPaid && (
          <div className="cart-actions">
            <div className="cart-action-row">
              <button className="pos-btn" onClick={() => setShowCustomer(true)} disabled={!canModify}>
                {order?.customer ? "👤 " + order.customer.name.split(" ")[0] : "Customer"}
              </button>
              <button className="pos-btn" onClick={() => setShowCoupon(true)} disabled={!canModify || !order?.items?.length}>
                {order?.coupon ? "Coupon ✓" : "Coupon"}
              </button>
            </div>
            <div className="cart-action-row">
              <button className="pos-btn" onClick={sendToKitchen} disabled={!order?.items?.length}>Kitchen</button>
            </div>
            <button className="pos-btn primary full" onClick={openPayment} disabled={!order?.items?.length}>
              Pay {fmt(order?.total_amount)}
            </button>
          </div>
        )}
      </div>

      {/* Floor modal */}
      {showFloor && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Select Table</h2>
              <button onClick={() => setShowFloor(false)}>✕</button>
            </div>
            <button className="pos-btn" style={{ marginBottom: "1rem" }} onClick={() => { setActiveTable(null); setShowFloor(false); }}>Takeaway / No Table</button>
            {floors.map(f => (
              <div key={f.id}>
                <p><strong>{f.name}</strong></p>
                <div className="table-grid">
                  {f.tables?.map(t => (
                    <button key={t.id} className={`table-btn ${!t.is_active ? "inactive" : ""} ${activeTable?.id === t.id ? "selected" : ""}`}
                      onClick={() => selectTable(t)} disabled={!t.is_active}>
                      <div>{t.table_number}</div>
                      <div className="table-seats">{t.seats} seats</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer assignment modal */}
      {showCustomer && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Assign Customer</h2>
              <button onClick={() => { setShowCustomer(false); setShowNewCustomer(false); setCustomerSearch(""); }}>✕</button>
            </div>
            {!showNewCustomer ? (
              <div className="modal-form">
                <input
                  placeholder="Search by name, email or phone..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  autoFocus
                />
                <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {customerLoading && <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Searching...</p>}
                  {!customerLoading && customers.map(c => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.85rem", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div>
                              <div style={{ color: "#7c2f18", fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</div>
                              <div style={{ color: "#7c4a37", fontSize: "0.78rem" }}>{c.email ?? ""}{c.email && c.phone ? " · " : ""}{c.phone ?? ""}</div>
                      </div>
                            <button className="btn btn-secondary" style={{ width: "auto" }} onClick={() => assignCustomer(c)}>Select</button>
                    </div>
                  ))}
                        {!customerLoading && customers.length === 0 && <p style={{ color: "#7c4a37", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>No customers found</p>}
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowCustomer(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowNewCustomer(true)}>+ New Customer</button>
                </div>
              </div>
            ) : (
              <form className="modal-form" onSubmit={createAndAssignCustomer}>
                <label>Name *<input value={newCustForm.name} onChange={e => setNewCustForm(p => ({ ...p, name: e.target.value }))} autoFocus /></label>
                <label>Email<input type="email" value={newCustForm.email} onChange={e => setNewCustForm(p => ({ ...p, email: e.target.value }))} /></label>
                <label>Phone<input value={newCustForm.phone} onChange={e => setNewCustForm(p => ({ ...p, phone: e.target.value }))} /></label>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewCustomer(false)}>Back</button>
                  <button type="submit" className="btn btn-primary" style={{ width: "auto" }}>Create & Assign</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Coupon modal */}
      {showCoupon && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Apply Coupon</h2>
            <div className="modal-form">
              <label>Coupon Code<input className="uppercase" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="e.g. SAVE10" autoFocus /></label>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowCoupon(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={applyCoupon}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Process Payment</h2>
            <div className="modal-form">
              <div className="pay-total">{fmt(order?.total_amount)}</div>
              <div className="pay-method-tabs">
                {payMethods.map(m => (
                  <button key={m.type} className={`tab-btn ${payType === m.type ? "active" : ""}`} onClick={() => setPayType(m.type)}>
                    {m.type === "cash" ? "💵 Cash" : m.type === "card" ? "💳 Card" : "📱 UPI"}
                  </button>
                ))}
              </div>
              {payType === "cash" && (
                <>
                  <label>Amount Received (₹)<input type="number" min={order?.total_amount} step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} autoFocus /></label>
                  {parseFloat(amountPaid) > 0 && <div className="change-due">Change: {fmt(Math.max(parseFloat(amountPaid) - parseFloat(order?.total_amount), 0))}</div>}
                </>
              )}
              {payType === "card" && <label>Transaction Reference *<input value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="TXN123456" autoFocus /></label>}
              {payType === "upi" && (
                <div className="upi-qr">
                  {upiQr ? <img src={`data:image/png;base64,${upiQr.qr_base64}`} alt="UPI QR" /> : <p>Loading QR...</p>}
                  <p>Scan and pay {fmt(order?.total_amount)}</p>
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowPayment(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={processPayment} disabled={paying}>{paying ? "Processing..." : `Confirm · ${fmt(order?.total_amount)}`}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptActions({ onEmail, onPrint, onNew }) {
  const [email, setEmail] = useState("");
  return (
    <div className="receipt-actions">
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@email.com" />
        <button className="btn btn-secondary" onClick={() => onEmail(email)}>Send</button>
      </div>
      <button className="btn btn-secondary" onClick={onPrint}>🖨 Print Receipt</button>
      <button className="btn btn-primary" onClick={onNew}>New Order</button>
    </div>
  );
}
