import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import toast from "react-hot-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const { data } = await api.get(`/customers${params}`);
      setCustomers(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: "", email: "", phone: "" }); setModal("create"); };
  const openEdit = (c) => { setForm({ id: c.id, name: c.name, email: c.email ?? "", phone: c.phone ?? "" }); setModal("edit"); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    const payload = { name: form.name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null };
    try {
      if (modal === "create") {
        await api.post("/customers", payload);
        toast.success("Customer created!");
      } else {
        await api.put(`/customers/${form.id}`, payload);
        toast.success("Customer updated!");
      }
      setModal(null);
      load();
    } catch {}
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete customer "${c.name}"?`)) return;
    try {
      await api.delete(`/customers/${c.id}`);
      toast.success("Deleted");
      load();
    } catch {}
  };

  const assignToOrder = async (customer) => {
    try {
      const sess = await api.get("/sessions/current").then((r) => r.data).catch(() => null);
      if (!sess) return toast.error("No active session");
      const orders = await api.get(`/orders?session_id=${sess.id}&status=draft`).then((r) => r.data);
      if (!orders.length) return toast.error("No active draft order");
      // Gap #11 — prefer the draft that matches the persisted active table
      const savedTable = sessionStorage.getItem("ACTIVE_TABLE");
      const tableId = savedTable ? JSON.parse(savedTable).id : null;
      const order = (tableId && orders.find(o => o.table?.id === tableId)) || orders[0];
      await api.put(`/orders/${order.id}`, { customer_id: customer.id });
      toast.success(`${customer.name} assigned to order ${order.order_number}`);
    } catch {}
  };

  return (
    <div className="page-shell" style={{ padding: "1.5rem" }}>
      <div className="page-header">
        <div><h1>Customers</h1><p>Search, manage and assign customers</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Customer</button>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: "300px" }}
        />
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="table-card">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td className="actions">
                    <button onClick={() => assignToOrder(c)}>Assign</button>
                    <button onClick={() => openEdit(c)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={4} className="empty">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modal === "create" ? "New Customer" : "Edit Customer"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Name *<input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
              <label>Phone<input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
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
