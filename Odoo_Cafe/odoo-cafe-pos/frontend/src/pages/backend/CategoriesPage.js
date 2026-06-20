import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#f7c7b7" });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/categories"); setCategories(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", color: "#f7c7b7" }); setModal("create"); };
  const openEdit = (c) => { setForm({ name: c.name, color: c.color }); setModal(c); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name required");
    try {
      if (modal === "create") { await api.post("/categories", form); toast.success("Created!"); }
      else { await api.put(`/categories/${modal.id}`, form); toast.success("Updated!"); }
      setModal(null); load();
    } catch {}
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    try { await api.delete(`/categories/${c.id}`); toast.success("Deleted"); load(); } catch {}
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Categories</h1><p>Organise your menu</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Category</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="table-card">
          <table>
            <thead><tr><th>Color</th><th>Name</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td><span className="color-swatch" style={{ background: c.color }} title={c.color} /></td>
                  <td><strong>{c.name}</strong></td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => openEdit(c)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={4} className="empty">No categories yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modal === "create" ? "New Category" : "Edit Category"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Name *<input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus /></label>
              <label>Color
                <div className="color-picker-row">
                  <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
                  <input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="#f7c7b7" maxLength={7} />
                  <span className="color-swatch" style={{ background: form.color }} />
                </div>
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal === "create" ? "Create" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
