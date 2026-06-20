import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { setToken, setUserRole, setUserId, setUserName } from "../auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      // Step 1: Signup and get token
      const signupResponse = await api.post("/auth/signup", { name, email, password });
      const token = signupResponse.data.access_token;
      setToken(token);

      // Step 2: Fetch user info to get role (newly created accounts are admin)
      const userResponse = await api.get("/auth/me");
      const { id, role, name: userName } = userResponse.data;
      setUserId(id);
      setUserRole(role);
      setUserName(userName);

      // Step 3: Navigate to backend (admins only)
      navigate("/backend");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.errors?.[0]?.message || "Signup failed. Please try again.");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-left-panel auth-signup-panel">
        <div className="auth-deco-card">
          <div className="auth-hero-title">Launch your cafe control center</div>
          <p className="auth-hero-copy">Create your account and start building the menus, tables, and kitchen operations with elegant cafe visuals.</p>
          <div className="auth-hero-features">
            <div>• Quick setup for products & categories</div>
            <div>• Self-order QR and table booking</div>
            <div>• Reports with export and session tracking</div>
          </div>
          <div className="auth-visuals auth-visuals-alt">
            <div className="visual-dot visual-dot-4"></div>
            <div className="visual-dot visual-dot-5"></div>
            <div className="visual-dot visual-dot-6"></div>
          </div>
        </div>
      </section>
      <section className="auth-right-panel">
        <div className="auth-form-shell">
          <div className="auth-header">
            <span className="badge">New Account</span>
            <h1>Create your cafe admin</h1>
            <p>Use a secure password and start managing staff, tables, products and payments.</p>
          </div>
          {error && <div className="alert error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </label>
            <button type="submit" className="btn btn-primary">Signup</button>
          </form>
          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Login here</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
