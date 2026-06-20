import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";

export default function SelfOrderConfigPage() {
  const [form, setForm] = useState({ is_enabled: false, mode: "online_ordering", background_color: "#111827", background_image: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get("/self-order/config").then((r) => {
      setForm({ is_enabled: r.data.is_enabled, mode: r.data.mode, background_color: r.data.background_color, background_image: r.data.background_image ?? "" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/self-order/config", { ...form, background_image: form.background_image.trim() || null });
      toast.success("Config saved!");
    } catch {} finally { setSaving(false); }
  };

  const handleQrPdf = async () => {
    setDownloading(true);
    try {
      const resp = await api.get(`/self-order/qr-pdf?domain=${encodeURIComponent(window.location.origin)}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = "table_qr_codes.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast.success("QR PDF downloaded!");
    } catch {} finally { setDownloading(false); }
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div><h1>Self Order</h1><p>Customer-facing kiosk and QR menu settings</p></div>
        <button className="btn btn-secondary" onClick={handleQrPdf} disabled={downloading}>
          {downloading ? "Downloading..." : "⬇ Download All QR Codes"}
        </button>
      </div>

      <form className="form-card" onSubmit={handleSave}>
        <div className="card-row">
          <div><strong>Enable Self Order</strong><p>Allow customers to browse and order via QR code</p></div>
          <label className="switch">
            <input type="checkbox" checked={form.is_enabled} onChange={(e) => set("is_enabled", e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        <label>Mode
          <div className="form-row">
            <button type="button" className={`tab-btn ${form.mode === "online_ordering" ? "active" : ""}`} onClick={() => set("mode", "online_ordering")}>
              Online Ordering — Full cart + order
            </button>
            <button type="button" className={`tab-btn ${form.mode === "qr_menu" ? "active" : ""}`} onClick={() => set("mode", "qr_menu")}>
              QR Menu — Browse only
            </button>
          </div>
        </label>

        <label>Background Color
          <div className="color-picker-row">
            <input type="color" value={form.background_color} onChange={(e) => set("background_color", e.target.value)} />
            <input value={form.background_color} onChange={(e) => set("background_color", e.target.value)} maxLength={7} />
            <span className="color-swatch" style={{ background: form.background_color }} />
          </div>
        </label>

        <label>Background Image URL (optional)
          <input value={form.background_image} onChange={(e) => set("background_image", e.target.value)} placeholder="https://example.com/image.jpg" />
        </label>

        <div className="info-box">
          Each table gets a unique QR: <code>{window.location.origin}/s/token</code>. Tokens are auto-generated when tables are created.
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </form>
    </div>
  );
}
