// client/src/authService.js
// The ONLY file that knows how login works. It talks to OUR backend (/auth/...),
// which checks this tenant's own account database.
// - The password is sent once to log in or sign up, and the backend only stores a hash of it.
// - The session lives in an httpOnly cookie. JavaScript can't read it, and nothing is
//   kept in localStorage or sessionStorage.
// - Every function here returns a result and never throws.

const NETWORK_ERROR = "Can't reach the server. Is the backend running? Please try again.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks the sign-up form before sending it. Returns { field: message } (empty = all good).
// Same rules as validateSignup in server/auth.js, which checks again (the server is the one that counts).
export function validateSignup({ fullName, email, password, confirmPassword }) {
  const errors = {};
  if (!fullName.trim()) errors.fullName = "Please enter your full name.";
  else if (fullName.trim().length > 100) errors.fullName = "Name must be 100 characters or less.";

  if (!email.trim()) errors.email = "Please enter your email.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Please enter a valid email, like juan@example.com.";

  if (!password) errors.password = "Please enter a password.";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (new TextEncoder().encode(password).length > 72) errors.password = "Password must be 72 characters or less.";

  if (!confirmPassword) errors.confirmPassword = "Please type your password again.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// Returns { ok: true }, or { ok: false, errors: { field: message } }.
// "errors.form" is a message for the whole form (e.g. server down).
export async function signup(fields) {
  try {
    const { ok, data } = await postJson("/auth/signup", fields);
    if (ok) return { ok: true };
    return { ok: false, errors: data.errors ?? { form: data.error ?? NETWORK_ERROR } };
  } catch (err) {
    console.error("Signup failed:", err);
    return { ok: false, errors: { form: NETWORK_ERROR } };
  }
}

// Returns { user: { name, email } } or { error: "message" }.
export async function login(email, password) {
  try {
    const { ok, data } = await postJson("/auth/login", { email, password });
    return ok && data.user ? { user: data.user } : { error: data.error ?? NETWORK_ERROR };
  } catch (err) {
    console.error("Login failed:", err);
    return { error: NETWORK_ERROR };
  }
}

export async function logout() {
  try {
    await postJson("/auth/logout");
  } catch (err) {
    console.error("Logout failed:", err);
  }
}

// The logged-in user ({ name, email }), or null if nobody is logged in (or the server is down).
export async function getCurrentUser() {
  try {
    const res = await fetch("/auth/me");
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}
