import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee, Mail, Lock } from "lucide-react";
import api from "../api";
import { setToken, setUserRole, setUserId, setUserName } from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const loginResponse = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      const token = loginResponse.data.access_token;
      setToken(token);

      const userResponse = await api.get("/auth/me");
      const { id, role, name } = userResponse.data;
      setUserId(id);
      setUserRole(role);
      setUserName(name);

      navigate(role === "admin" ? "/backend" : "/pos");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page--light">
      <section className="auth-left-panel auth-login-panel">
        <div className="auth-deco-card auth-deco-card--light">
          <div className="auth-hero-title">Welcome back to Odoo Cafe</div>
          <div className="auth-hero-features">
            <div>“Fast service, clear control.”</div>
            <div>“QR ordering to kitchen flow in seconds.”</div>
          </div>
          <div className="auth-image-card">
            <img
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80"
              alt="Cafe shop interior"
              className="auth-side-image"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="auth-right-panel">
        <div className="auth-form-shell auth-form-shell--light">
          <div className="auth-header">
            <span className="badge badge-yellow">Login</span>
            <h1>Sign in to your cafe dashboard</h1>
            <p>Enter your credentials to continue to orders, bookings, and POS controls.</p>
          </div>

          {error && <div className="alert error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email address
              <div className="input-shell input-shell--light">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@cafe.com"
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className="input-shell input-shell--light">
                <Lock className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </label>

            <div className="auth-form-meta">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don’t have an account?</span>
            <Link to="/signup">Create one</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
