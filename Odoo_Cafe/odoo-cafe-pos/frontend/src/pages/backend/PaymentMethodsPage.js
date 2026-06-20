import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

const META = {
  cash: { label: "Cash", desc: "Accept physical cash payments at the counter." },
  card: { label: "Card / Digital", desc: "Accept debit and credit card payments." },
  upi:  { label: "UPI QR", desc: "Display a UPI QR code for customers to scan and pay." },
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upiEdit, setUpiEdit] = useState("");
  const [editingUpi, setEditingUpi] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payment-methods");
      const order = ["cash", "card", "upi"];
      setMethods(data.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)));
      const upi = data.find(m => m.type === "upi");
      setUpiEdit(upi?.upi_id ?? "");
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (type, value) => {
    try {
      const { data } = await api.put(`/payment-methods/${type}`, { is_enabled: value });
      setMethods(prev => prev.map(m => m.type === type ? data : m));
      toast.success(`${META[type]?.label} ${value ? "enabled" : "disabled"}`);
    } catch {}
  };

  const saveUpi = async () => {
    if (!upiEdit.trim()) return toast.error("UPI ID cannot be empty");
    try {
      const { data } = await api.put("/payment-methods/upi", { upi_id: upiEdit.trim() });
      setMethods(prev => prev.map(m => m.type === "upi" ? data : m));
      setEditingUpi(false);
      toast.success("UPI ID saved!");
    } catch {}
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Payment Methods</h1><p>Enable or disable payment options at checkout</p></div>
      </div>
      <div className="cards-list">
        {methods.map(m => (
          <div key={m.type} className={`form-card ${!m.is_enabled ? "disabled" : ""}`}>
            <div className="card-row">
              <div>
                <strong>{META[m.type]?.label}</strong>
                <p>{META[m.type]?.desc}</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={m.is_enabled} onChange={e => toggle(m.type, e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
            {m.type === "upi" && (
              <div className="upi-section">
                <strong>UPI ID</strong>
                {editingUpi ? (
                  <div className="form-row">
                    <input value={upiEdit} onChange={e => setUpiEdit(e.target.value)} placeholder="yourname@upi" />
                    <button className="btn btn-primary" onClick={saveUpi}>Save</button>
                    <button className="btn btn-secondary" onClick={() => setEditingUpi(false)}>Cancel</button>
                  </div>
                ) : (
                  <div className="form-row">
                    <span>{m.upi_id || "Not configured"}</span>
                    <button className="btn btn-secondary" onClick={() => setEditingUpi(true)}>Edit</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
