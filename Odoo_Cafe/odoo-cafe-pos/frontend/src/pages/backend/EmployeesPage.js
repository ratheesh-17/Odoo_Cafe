import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/errorHandler";

export default function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ user_id: null, name: "", old_password: "", new_password: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "employee" });
    setModal("create");
  };

  const openEdit = (u) => {
    setForm({ id: u.id, name: u.name, email: u.email, role: u.role });
    setModal("edit");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === "create") {
        if (!form.name || !form.email || !form.password) {
          return toast.error("All fields are required");
        }
        await api.post("/users", { name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success("Account created!");
      } else {
        if (!form.name || !form.email) {
          return toast.error("Name and email are required");
        }
        await api.put(`/users/${form.id}`, { name: form.name, email: form.email, role: form.role });
        toast.success("Account updated!");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save employee"));
    }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!pwForm.old_password) {
      return toast.error("Current password is required");
    }
    if (!pwForm.new_password) {
      return toast.error("New password is required");
    }
    if (pwForm.new_password.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    if (pwForm.old_password === pwForm.new_password) {
      return toast.error("New password must be different from current password");
    }
    try {
      await api.patch(`/users/${pwForm.user_id}/change-password`, {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password
      });
      toast.success("Password changed successfully!");
      setPwForm({ user_id: null, name: "", old_password: "", new_password: "" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change password"));
    }
  };

  const handleArchive = async (u) => {
    const action = u.is_active ? "archive" : "unarchive";
    if (!window.confirm(`${action} "${u.name}"?`)) return;
    try {
      await api.patch(`/users/${u.id}/${action}`);
      toast.success(`Account ${action}d`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${action} account`));
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("Employee deleted");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete employee"));
    }
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Employees</h1><p>Manage staff accounts and access roles</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Employee</button>
      </div>

      <div className="table-card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === "admin" ? "badge-purple" : "badge-blue"}`}>{u.role}</span></td>
                <td><span className={`badge ${u.is_active ? "badge-green" : "badge-gray"}`}>{u.is_active ? "Active" : "Archived"}</span></td>
                <td className="actions">
                  <button onClick={() => openEdit(u)}>Edit</button>
                  <button onClick={() => setPwForm({ user_id: u.id, name: u.name, old_password: "", new_password: "" })}>Change PW</button>
                  <button onClick={() => handleArchive(u)}>{u.is_active ? "Archive" : "Restore"}</button>
                  <button className="danger" onClick={() => handleDelete(u)}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="empty">No employees</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modal === "create" ? "New Employee" : "Edit Account"}</h2>
            <form className="modal-form" onSubmit={handleSave}>
              <label>Name *<input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus /></label>
              <label>Email *<input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
              {modal === "create" && <label>Password *<input type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} /></label>}
              <label>Role
                <select value={form.role} onChange={(e) => set("role", e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal === "create" ? "Create" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pwForm.user_id && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Change Password — {pwForm.name}</h2>
            <form className="modal-form" onSubmit={handleChangePw}>
              <label>Current Password *<input type="password" value={pwForm.old_password} onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))} autoFocus /></label>
              <label>New Password *<input type="password" minLength={8} value={pwForm.new_password} onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))} /></label>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setPwForm({ user_id: null, name: "", old_password: "", new_password: "" })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
