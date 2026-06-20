import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff7f2", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "5rem", fontWeight: 900, color: "#c05621" }}>404</div>
        <p style={{ color: "#7c4a37", marginBottom: "1.5rem" }}>Page not found.</p>
        <Link to="/backend" style={{ background: "linear-gradient(135deg,#f7c7b7,#f2c2b2)", color: "#7c2f18", padding: "0.65rem 1.5rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700 }}>Go to Dashboard</Link>
      </div>
    </div>
  );
}
