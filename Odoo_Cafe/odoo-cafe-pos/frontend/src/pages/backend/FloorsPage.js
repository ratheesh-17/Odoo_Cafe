import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

export default function FloorsPage() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/floors"); setFloors(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openFloorCreate = () => { setForm({ type: "floor", name: "" }); setModal("create"); };
  const openFloorEdit = (f) => { setForm({ type: "floor", id: f.id, name: f.name }); setModal("edit"); };
  const openTableCreate = (f) => { setForm({ type: "table", floor_id: f.id, floor_name: f.name, table_number: "", seats: 2 }); setModal("create"); };
  const openTableEdit = (t, f) => { setForm({ type: "table", id: t.id, floor_id: f.id, floor_name: f.name, table_number: t.table_number, seats: t.seats, is_active: t.is_active }); setModal("edit"); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.type === "floor") {
        if (!form.name.trim()) return toast.error("Floor name required");
        if (modal === "create") { await api.post("/floors", { name: form.name.trim() }); toast.success("Floor created!"); }
        else { await api.put(`/floors/${form.id}`, { name: form.name.trim() }); toast.success("Floor updated!"); }
      } else {
        if (!form.table_number.trim()) return toast.error("Table number required");
        if (modal === "create") { await api.post("/tables", { floor_id: form.floor_id, table_number: form.table_number.trim(), seats: parseInt(form.seats) }); toast.success("Table added!"); }
        else { await api.put(`/tables/${form.id}`, { table_number: form.table_number.trim(), seats: parseInt(form.seats), is_active: form.is_active }); toast.success("Table updated!"); }
      }
      setModal(null); load();
    } catch {}
  };

  const deleteFloor = async (f) => {
    if (!window.confirm(`Delete floor "${f.name}" and all its tables?`)) return;
    try { await api.delete(`/floors/${f.id}`); toast.success("Floor deleted"); load(); } catch {}
  };

  const deleteTable = async (t) => {
    if (!window.confirm(`Delete table "${t.table_number}"?`)) return;
    try { await api.delete(`/tables/${t.id}`); toast.success("Table deleted"); load(); } catch {}
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Floors & Tables</h1><p>Manage your restaurant layout</p></div>
        <button className="btn btn-primary" onClick={openFloorCreate}>+ Add Floor</button>
      </div>

      {floors.length === 0 && <p className="empty-state">No floors yet. Add a floor to get started.</p>}

      {floors.map(f => (
        <div key={f.id} className="form-card">
          <div className="card-row">
            <strong>📍 {f.name} ({f.tables?.length ?? 0} tables)</strong>
            <div className="actions">
              <button onClick={() => openTableCreate(f)}>+ Table</button>
              <button onClick={() => openFloorEdit(f)}>Edit</button>
              <button className="danger" onClick={() => deleteFloor(f)}>Delete</button>
            </div>
          </div>
          {f.tables?.length > 0 && (
            <table className="inner-table">
              <thead><tr><th>Table #</th><th>Seats</th><th>Status</th><th>QR Token</th><th>Actions</th></tr></thead>
              <tbody>
                {f.tables.map(t => (
                  <tr key={t.id}>
                    <td>{t.table_number}</td>
                    <td>{t.seats}</td>
                    <td><span className={`badge ${t.is_active ? "badge-green" : "badge-gray"}`}>{t.is_active ? "Active" : "Inactive"}</span></td>
                    <td><span className={`badge ${t.self_order_token ? "badge-blue" : "badge-gray"}`}>{t.self_order_token ? "Ready" : "—"}</span></td>
                    <td className="actions">
                      <button onClick={() => openTableEdit(t, f)}>Edit</button>
                      <button className="danger" onClick={() => deleteTable(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              {form.type === "floor"
                ? (modal === "create" ? "New Floor" : "Edit Floor")
                : (modal === "create" ? `Add Table — ${form.floor_name}` : `Edit Table — ${form.floor_name}`)}
            </h2>
            <form className="modal-form" onSubmit={handleSave}>
              {form.type === "floor" ? (
                <label>Floor Name *<input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus /></label>
              ) : (
                <>
                  <div className="form-row">
                    <label>Table Number *<input value={form.table_number} onChange={e => setForm(p => ({ ...p, table_number: e.target.value }))} autoFocus /></label>
                    <label>Seats<input type="number" min="1" value={form.seats} onChange={e => setForm(p => ({ ...p, seats: e.target.value }))} /></label>
                  </div>
                  {modal === "edit" && (
                    <label className="toggle-label">
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                      Active
                    </label>
                  )}
                </>
              )}
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
