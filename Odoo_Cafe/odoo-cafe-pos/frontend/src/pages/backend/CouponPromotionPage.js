import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const fmtDiscount = (type, value) =>
  type === "percent" ? `${value}%` : `₹${parseFloat(value).toFixed(2)}`;
const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default function CouponPromotionPage() {
  const [coupons, setCoupons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const [c, p, prods] = await Promise.all([
        api.get("/coupons").then((r) => r.data),
        api.get("/promotions").then((r) => r.data),
        api.get("/products").then((r) => r.data).catch(() => []),
      ]);
      setCoupons(c);
      setPromotions(p);
      setProducts(prods);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCoupon = (c = null) => {
    setForm(
      c
        ? { _type: "coupon", _edit: c.id, code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, usage_limit: c.usage_limit ?? "", expires_at: toLocal(c.expires_at), is_active: c.is_active }
        : { _type: "coupon", code: "", discount_type: "percent", discount_value: "", usage_limit: "", expires_at: "" }
    );
    setModal("coupon");
  };

  const openPromo = (p = null) => {
    setForm(
      p
        ? { _type: "promo", _edit: p.id, name: p.name, applies_to: p.applies_to, product_id: p.product?.id ?? "", min_quantity: p.min_quantity ?? "", min_order_amount: p.min_order_amount ?? "", discount_type: p.discount_type, discount_value: p.discount_value, is_active: p.is_active, starts_at: toLocal(p.starts_at), ends_at: toLocal(p.ends_at) }
        : { _type: "promo", name: "", applies_to: "order", product_id: "", min_quantity: "", min_order_amount: "", discount_type: "percent", discount_value: "", starts_at: "", ends_at: "" }
    );
    setModal("promo");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form._type === "coupon") {
        const payload = {
          code: form.code.trim().toUpperCase(),
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          ...(form._edit && { is_active: form.is_active }),
        };
        form._edit ? await api.put(`/coupons/${form._edit}`, payload) : await api.post("/coupons", payload);
        toast.success(form._edit ? "Coupon updated!" : "Coupon created!");
      } else {
        const payload = {
          name: form.name.trim(),
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          ...(form._edit && { is_active: form.is_active }),
          ...(!form._edit && { applies_to: form.applies_to }),
          ...(form.applies_to === "product"
            ? { product_id: parseInt(form.product_id), min_quantity: parseInt(form.min_quantity) }
            : { min_order_amount: parseFloat(form.min_order_amount) }),
        };
        form._edit ? await api.put(`/promotions/${form._edit}`, payload) : await api.post("/promotions", payload);
        toast.success(form._edit ? "Promotion updated!" : "Promotion created!");
      }
      setModal(null);
      load();
    } catch {}
  };

  const deleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    try { await api.delete(`/coupons/${c.id}`); toast.success("Deleted"); load(); } catch {}
  };

  const deletePromo = async (p) => {
    if (!window.confirm(`Delete promotion "${p.name}"?`)) return;
    try { await api.delete(`/promotions/${p.id}`); toast.success("Deleted"); load(); } catch {}
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header"><div><h1>Coupons & Promotions</h1><p>Manage discounts</p></div></div>

      <div className="section-header">
        <h2>Coupons</h2>
        <button className="btn btn-primary" onClick={() => openCoupon()}>+ Add Coupon</button>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Used/Limit</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><code>{c.code}</code></td>
                <td>{fmtDiscount(c.discount_type, c.discount_value)}</td>
                <td>{c.used_count} / {c.usage_limit ?? "∞"}</td>
                <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td><span className={`badge ${c.is_active ? "badge-green" : "badge-gray"}`}>{c.is_active ? "Active" : "Inactive"}</span></td>
                <td className="actions">
                  <button onClick={() => openCoupon(c)}>Edit</button>
                  <button className="danger" onClick={() => deleteCoupon(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={6} className="empty">No coupons</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="section-header">
        <h2>Promotions</h2>
        <button className="btn btn-primary" onClick={() => openPromo()}>+ Add Promotion</button>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Condition</th><th>Discount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><span className={`badge ${p.applies_to === "product" ? "badge-blue" : "badge-purple"}`}>{p.applies_to}</span></td>
                <td>{p.applies_to === "product" ? `${p.product?.name} × ${p.min_quantity}` : `Order ≥ ₹${p.min_order_amount}`}</td>
                <td>{fmtDiscount(p.discount_type, p.discount_value)}</td>
                <td><span className={`badge ${p.is_active ? "badge-green" : "badge-gray"}`}>{p.is_active ? "Active" : "Inactive"}</span></td>
                <td className="actions">
                  <button onClick={() => openPromo(p)}>Edit</button>
                  <button className="danger" onClick={() => deletePromo(p)}>Delete</button>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && <tr><td colSpan={6} className="empty">No promotions</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h2>{form._edit ? "Edit" : "New"} {modal === "coupon" ? "Coupon" : "Promotion"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              {modal === "coupon" ? (
                <>
                  <label>Code *<input className="uppercase" value={form.code} onChange={(e) => set("code", e.target.value)} autoFocus /></label>
                  <div className="form-row">
                    <label>Type<select value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)}><option value="percent">Percentage %</option><option value="fixed">Fixed ₹</option></select></label>
                    <label>Value *<input type="number" min="0.01" step="0.01" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} /></label>
                  </div>
                  <div className="form-row">
                    <label>Usage Limit<input type="number" min="1" value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} placeholder="Unlimited" /></label>
                    <label>Expires At<input type="datetime-local" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} /></label>
                  </div>
                  {form._edit && <label className="toggle-label"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active</label>}
                </>
              ) : (
                <>
                  <label>Name *<input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus /></label>
                  {!form._edit && (
                    <div className="form-row">
                      <button type="button" className={`tab-btn ${form.applies_to === "order" ? "active" : ""}`} onClick={() => set("applies_to", "order")}>Order Level</button>
                      <button type="button" className={`tab-btn ${form.applies_to === "product" ? "active" : ""}`} onClick={() => set("applies_to", "product")}>Product Level</button>
                    </div>
                  )}
                  {form.applies_to === "product" ? (
                    <div className="form-row">
                      <label>Product *
                        <select value={form.product_id} onChange={(e) => set("product_id", e.target.value)}>
                          <option value="">Select...</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </label>
                      <label>Min Qty *<input type="number" min="1" value={form.min_quantity} onChange={(e) => set("min_quantity", e.target.value)} /></label>
                    </div>
                  ) : (
                    <label>Min Order (₹) *<input type="number" min="0.01" step="0.01" value={form.min_order_amount} onChange={(e) => set("min_order_amount", e.target.value)} /></label>
                  )}
                  <div className="form-row">
                    <label>Type<select value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)}><option value="percent">Percentage %</option><option value="fixed">Fixed ₹</option></select></label>
                    <label>Value *<input type="number" min="0.01" step="0.01" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} /></label>
                  </div>
                  <div className="form-row">
                    <label>Starts At<input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></label>
                    <label>Ends At<input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></label>
                  </div>
                  {form._edit && <label className="toggle-label"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active</label>}
                </>
              )}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{form._edit ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
