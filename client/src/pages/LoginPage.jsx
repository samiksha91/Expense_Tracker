import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = "Email is required";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return !next.email && !next.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card form" onSubmit={handleSubmit} noValidate>
        <h1>Sign in</h1>
        <p className="muted">Welcome back to Expense Tracker</p>

        {apiError && <div className="error-banner">{apiError}</div>}

        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <p className="muted">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
