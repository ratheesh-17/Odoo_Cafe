import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const TRANSITIONS = { pending: ["confirmed","cancelled"], confirmed: ["seated","cancelled"], seated: ["completed","cancelled"], completed: [], cancelled: [] };
const STATUS_COLOR = { pending:"badge-yellow", confirmed:"badge-blue", seated:"badge-purple", completed:"badge-green", cancelled:"badge-red" };
const toLocal = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
};

const parseScheduledAt = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const [b, t] = await Promise.all([
        api.get(`/bookings${qs}`).then((r) => r.data),
        api.get("/tables").then((r) => r.data).catch(() => []),
      ]);
      setBookings(b); setTables(t);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = () => { setForm({ guest_name:"", guest_phone:"", guest_email:"", table_id:"", scheduled_at:"", party_size:2, note:"" }); setModal("create"); };
  const openEdit = (b) => { setForm({ _id: b.id, guest_name: b.guest_name??"", guest_phone: b.guest_phone??"", guest_email: b.guest_email??"", table_id: b.table?.id??"", scheduled_at: toLocal(b.scheduled_at), party_size: b.party_size, note: b.note??"" }); setModal("edit"); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.guest_name?.trim()) return toast.error("Guest name is required");
    const scheduledDate = parseScheduledAt(form.scheduled_at);
    if (!scheduledDate) return toast.error("Please enter a valid scheduled date and time");
    const payload = {
      guest_name: form.guest_name.trim(),
      guest_phone: form.guest_phone?.trim() || null,
      guest_email: form.guest_email?.trim() || null,
      table_id: form.table_id ? parseInt(form.table_id, 10) : null,
      scheduled_at: scheduledDate.toISOString(),
      party_size: parseInt(form.party_size, 10) || 1,
      note: form.note?.trim() || null,
    };
    try {
      modal === "create" ? await api.post("/bookings", payload) : await api.put(`/bookings/${form._id}`, payload);
      toast.success(modal === "create" ? "Booking created!" : "Booking updated!");
      setModal(null); load();
    } catch (err) {
      toast.error("Unable to save booking. Please check the fields and try again.");
    }
  };

  const transition = async (b, newStatus) => {
    if (!window.confirm(`Move booking to "${newStatus}"?`)) return;
    try { await api.patch(`/bookings/${b.id}/status`, { status: newStatus }); toast.success(`Booking ${newStatus}`); load(); } catch {}
  };

  const handleDelete = async (b) => {
    if (!window.confirm("Delete this booking?")) return;
    try { await api.delete(`/bookings/${b.id}`); toast.success("Deleted"); load(); } catch {}
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Bookings</h1><p>Table reservations and walk-in scheduling</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Booking</button>
      </div>

      <div className="filter-bar">
        {["","pending","confirmed","seated","completed","cancelled"].map((s) => (
          <button key={s} className={`filter-btn ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="table-card">
        <table>
          <thead><tr><th>Guest</th><th>Contact</th><th>Scheduled</th><th>Party</th><th>Table</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.guest_name ?? b.customer?.name ?? "—"}</strong>{b.note && <div className="sub">{b.note}</div>}</td>
                <td><div>{b.guest_phone ?? "—"}</div><div>{b.guest_email ?? ""}</div></td>
                <td>{new Date(b.scheduled_at).toLocaleString()}</td>
                <td>{b.party_size}</td>
                <td>{b.table?.table_number ?? "—"}</td>
                <td><span className={`badge ${STATUS_COLOR[b.status]}`}>{b.status}</span></td>
                <td className="actions">
                  {TRANSITIONS[b.status]?.map((s) => (
                    <button key={s} className={s === "cancelled" ? "danger" : ""} onClick={() => transition(b, s)}>{s}</button>
                  ))}
                  {!["completed","cancelled"].includes(b.status) && <button onClick={() => openEdit(b)}>Edit</button>}
                  {["pending","cancelled"].includes(b.status) && <button className="danger" onClick={() => handleDelete(b)}>Delete</button>}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan={7} className="empty">No bookings</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h2>{modal === "create" ? "New Booking" : "Edit Booking"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Guest Name *<input value={form.guest_name} onChange={(e) => set("guest_name", e.target.value)} autoFocus /></label>
              <div className="form-row">
                <label>Phone<input value={form.guest_phone} onChange={(e) => set("guest_phone", e.target.value)} /></label>
                <label>Email<input type="email" value={form.guest_email} onChange={(e) => set("guest_email", e.target.value)} /></label>
              </div>
              <div className="form-row">
                <label>Scheduled At *<input type="datetime-local" value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} /></label>
                <label>Party Size *<input type="number" min="1" value={form.party_size} onChange={(e) => set("party_size", e.target.value)} /></label>
              </div>
              <label>Table
                <select value={form.table_id} onChange={(e) => set("table_id", e.target.value)}>
                  <option value="">No table</option>
                  {tables.map((t) => <option key={t.id} value={t.id}>{t.table_number} ({t.floor?.name}) — {t.seats} seats</option>)}
                </select>
              </label>
              <label>Note<input value={form.note} onChange={(e) => set("note", e.target.value)} /></label>
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
