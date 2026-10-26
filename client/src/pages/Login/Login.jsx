import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { tenant } from "../../tenantConfig.js";
import { login } from "../../authService.js";
import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import TimeWeatherCard from "../../components/TimeWeatherCard/TimeWeatherCard.jsx";
import "./Login.css";

// Time and weather card place, the same for both tenants. The weather comes from Open-Meteo.
const PLACE = {
  location: "Quezon City, Philippines",
  latitude: 14.676,
  longitude: 121.0437,
  timezone: "Asia/Manila",
};

// Login page, shared by BOTH tenants. The backend checks the email and password
// against THIS tenant's own database, so a Tenant A account doesn't work on Tenant B.
export default function Login({ onLogin }) {
  const welcome = tenant.login;
  const location = useLocation();
  const justCreated = location.state?.created === true; // set by the Signup page
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (result.user) {
      onLogin(result.user);
    } else {
      setError(result.error);
      setPassword("");
    }
  }

  return (
    <AuthLayout subtitle="Log in to continue">
      <TimeWeatherCard place={PLACE} />
      <h2>{welcome.welcomeTitle}</h2>
      <p className="auth-panel-text">{welcome.welcomeText}</p>

      {justCreated && !error && (
        <p className="login-success" role="status">
          Account created! Log in with your email and password.
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. juan@example.com"
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-accent" disabled={busy}>
          {busy ? "LOGGING IN…" : "LOG IN"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/signup">Create one</Link>
      </p>
      <p className="auth-note">
        Fictional business for a school project. Please don't reuse a password from a real account.
      </p>
    </AuthLayout>
  );
}
