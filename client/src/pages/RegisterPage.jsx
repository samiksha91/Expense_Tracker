import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
    if (!name.trim()) next.name = "Name is required";
    if (!email.trim()) next.email = "Email is required";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return !next.name && !next.email && !next.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ name, email, password });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card form" onSubmit={handleSubmit} noValidate>
        <h1>Create account</h1>
        <p className="muted">Start tracking your expenses</p>

        {apiError && <div className="error-banner">{apiError}</div>}

        <div className="form-group">
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </div>

        <p className="muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
