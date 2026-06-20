import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const UOM = ["piece", "kg", "litre", "plate", "cup", "glass", "serving"];

function ProductForm({ initial, categories, onSave, onCancel, onCategoryCreated }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category_id: initial?.category?.id ?? "",
    price: initial?.price ?? "",
    unit_of_measure: initial?.unit_of_measure ?? "piece",
    tax_percent: initial?.tax_percent ?? 0,
    description: initial?.description ?? "",
    show_in_kds: initial?.show_in_kds ?? true,
    is_active: initial?.is_active ?? true,
  });
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: "", color: "#f7c7b7" });
  const [savingCat, setSavingCat] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.category_id) return toast.error("Category is required");
    if (form.price === "" || parseFloat(form.price) < 0) return toast.error("Valid price required");
    onSave({
      name: form.name.trim(),
      category_id: parseInt(form.category_id),
      price: parseFloat(form.price),
      unit_of_measure: form.unit_of_measure,
      tax_percent: parseFloat(form.tax_percent) || 0,
      description: form.description.trim() || null,
      show_in_kds: form.show_in_kds,
      ...(initial && { is_active: form.is_active }),
    });
  };

  // Gap #9 — create category on the fly
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatForm.name.trim()) return toast.error("Category name required");
    setSavingCat(true);
    try {
      const { data } = await api.post("/categories", { name: newCatForm.name.trim(), color: newCatForm.color });
      toast.success(`Category "${data.name}" created!`);
      onCategoryCreated(data);          // refresh list in parent
      set("category_id", data.id);      // auto-select new category
      setShowNewCat(false);
      setNewCatForm({ name: "", color: "#f7c7b7" });
    } catch {} finally { setSavingCat(false); }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <label>Name *<input value={form.name} onChange={e => set("name", e.target.value)} autoFocus /></label>
      <div className="form-row">
        <label>Category *
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <select value={form.category_id} onChange={e => set("category_id", e.target.value)} style={{ flex: 1 }}>
              <option value="">Select...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" title="Add new category" onClick={() => setShowNewCat(p => !p)}
              style={{ padding: "0.45rem 0.65rem", borderRadius: "8px", border: "1px solid rgba(192,86,33,0.12)", background: showNewCat ? "#c05621" : "rgba(192,86,33,0.04)", color: "#fff", cursor: "pointer", flexShrink: 0, fontWeight: 700 }}>+</button>
          </div>
        </label>
        <label>Unit of Measure
          <select value={form.unit_of_measure} onChange={e => set("unit_of_measure", e.target.value)}>
            {UOM.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      {/* Gap #9 — inline new category form */}
      {showNewCat && (
        <div style={{ background: "rgba(240,201,193,0.6)", border: "1px solid rgba(192,86,33,0.12)", borderRadius: "12px", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <strong style={{ fontSize: "0.82rem", color: "#7c2f18" }}>New Category</strong>
          <div className="form-row">
            <label>Name *<input value={newCatForm.name} onChange={e => setNewCatForm(p => ({ ...p, name: e.target.value }))} /></label>
            <label>Color
              <div className="color-picker-row">
                <input type="color" value={newCatForm.color} onChange={e => setNewCatForm(p => ({ ...p, color: e.target.value }))} />
                <input value={newCatForm.color} onChange={e => setNewCatForm(p => ({ ...p, color: e.target.value }))} maxLength={7} />
                <span className="color-swatch" style={{ background: newCatForm.color }} />
              </div>
            </label>
          </div>
          <div className="form-actions" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowNewCat(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" style={{ width: "auto" }} disabled={savingCat} onClick={handleCreateCategory}>
              {savingCat ? "Creating..." : "Create Category"}
            </button>
          </div>
        </div>
      )}
      <div className="form-row">
        <label>Price (₹) *<input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} /></label>
        <label>Tax (%)<input type="number" min="0" max="100" step="0.01" value={form.tax_percent} onChange={e => set("tax_percent", e.target.value)} /></label>
      </div>
      <label>Description<textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} /></label>
      <div className="form-row">
        <label className="toggle-label">
          <input type="checkbox" checked={form.show_in_kds} onChange={e => set("show_in_kds", e.target.checked)} />
          Show in Kitchen Display
        </label>
        {initial && (
          <label className="toggle-label">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
            Active
          </label>
        )}
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? "Save Changes" : "Create Product"}</button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState(null); // null | "create" | product object

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (catFilter) params.set("category_id", catFilter);
      if (search.trim()) params.set("search", search.trim());
      if (showArchived) params.set("include_archived", "true");
      const [prods, cats] = await Promise.all([
        api.get(`/products?${params}`).then(r => r.data),
        api.get("/categories").then(r => r.data),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {} finally { setLoading(false); }
  }, [search, catFilter, showArchived]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload) => {
    try {
      if (modal === "create") {
        await api.post("/products", payload);
        toast.success("Product created!");
      } else {
        await api.put(`/products/${modal.id}`, payload);
        toast.success("Product updated!");
      }
      setModal(null);
      load();
    } catch {}
  };

  const handleArchive = async (p) => {
    try {
      await api.put(`/products/${p.id}`, { is_active: !p.is_active });
      toast.success(p.is_active ? "Archived" : "Restored");
      load();
    } catch {}
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Deleted");
      load();
    } catch {}
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Products</h1><p>Manage your menu items</p></div>
        <button className="btn btn-primary" onClick={() => setModal("create")}>+ Add Product</button>
      </div>

      <div className="filter-bar">
        <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="toggle-label">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          Show Archived
        </label>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="table-card">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Tax</th><th>UOM</th><th>KDS</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <span className="color-dot" style={{ background: p.category?.color }} />
                    {p.name}
                  </td>
                  <td>{p.category?.name}</td>
                  <td>₹{parseFloat(p.price).toFixed(2)}</td>
                  <td>{p.tax_percent}%</td>
                  <td>{p.unit_of_measure}</td>
                  <td><span className={`badge ${p.show_in_kds ? "badge-green" : "badge-gray"}`}>{p.show_in_kds ? "Yes" : "No"}</span></td>
                  <td><span className={`badge ${p.is_active ? "badge-green" : "badge-gray"}`}>{p.is_active ? "Active" : "Archived"}</span></td>
                  <td className="actions">
                    <button onClick={() => setModal(p)}>Edit</button>
                    <button onClick={() => handleArchive(p)}>{p.is_active ? "Archive" : "Restore"}</button>
                    <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={8} className="empty">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modal === "create" ? "New Product" : "Edit Product"}</h2>
            <ProductForm
              initial={modal !== "create" ? modal : null}
              categories={categories}
              onSave={handleSave}
              onCancel={() => setModal(null)}
              onCategoryCreated={(newCat) => setCategories(prev => [...prev, newCat])}
            />
          </div>
        </div>
      )}
    </div>
  );
}
