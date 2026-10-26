import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tenant } from "../../tenantConfig.js";
import { signup, validateSignup } from "../../authService.js";
import AuthLayout from "../../components/AuthLayout/AuthLayout.jsx";
import "./Signup.css";

const FIELDS = [
  { name: "fullName", label: "Full name", type: "text", autoComplete: "name", placeholder: "e.g. Juan Dela Cruz" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "e.g. juan@example.com" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 8 characters." },
  { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
];

const EMPTY = { fullName: "", email: "", password: "", confirmPassword: "" };

// Create account page, shared by BOTH tenants. The account is saved only in THIS
// tenant's database, so it won't work on the other tenant's site.
export default function Signup() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined })); // hide the old message while typing
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateSignup(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setBusy(true);
    const result = await signup(values);
    setBusy(false);
    if (result.ok) {
      navigate("/login", { state: { created: true, email: values.email.trim() } });
    } else {
      setErrors(result.errors); // e.g. "email already used" comes from the server
    }
  }

  return (
    <AuthLayout subtitle="Create an account to continue">
      <h2>Create your account</h2>
      <p className="auth-panel-text">Sign up for {tenant.shortName} in under a minute.</p>
      <p className="signup-demo-note" role="note">
        <strong>School demo:</strong> please don't use a real password.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {FIELDS.map((field) => {
          const error = errors[field.name];
          const hintId = `${field.name}-hint`;
          const errorId = `${field.name}-error`;
          return (
            <div className="auth-field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={values[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : field.hint ? hintId : undefined}
              />
              {error ? (
                <p className="auth-field-error" id={errorId}>{error}</p>
              ) : (
                field.hint && <p className="signup-hint" id={hintId}>{field.hint}</p>
              )}
            </div>
          );
        })}
        {errors.form && <p className="auth-error" role="alert">{errors.form}</p>}
        <button type="submit" className="btn btn-accent" disabled={busy}>
          {busy ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      <p className="auth-note">
        Fictional business for a school project.
      </p>
    </AuthLayout>
  );
}
