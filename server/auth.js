// server/auth.js
// Accounts and login for ONE tenant. Each backend opens only its own database, so
// Tenant A and Tenant B never share accounts:
// - On this computer: a SQLite file (DB_PATH in .env.tenantA / .env.tenantB).
// - When hosted: its own Turso database (DB_URL + DB_AUTH_TOKEN, set in the Render dashboard).
// - Passwords are hashed with bcrypt. The plain password is never stored.
// - A login creates a random session token. The browser keeps it in an httpOnly
//   cookie (JavaScript can't read it). The database only keeps a hash of the token.
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import bcrypt from "bcryptjs";

const TENANT_ID = process.env.TENANT_ID;
const DB_PATH = process.env.DB_PATH;
const DB_URL = process.env.DB_URL; // e.g. libsql://bagwis-accounts-yourname.turso.io

if (!TENANT_ID || (!DB_URL && !DB_PATH)) {
  console.error("TENANT_ID, or DB_URL / DB_PATH, is missing. Did you start with --env-file?");
  process.exit(1);
}

// Render's disk is wiped on every restart, so a hosted backend must use Turso, not a file.
if (process.env.NODE_ENV === "production" && !DB_URL) {
  console.error("DB_URL is missing. Hosted backends need a Turso database (see README).");
  process.exit(1);
}

// Browsers send localhost cookies to EVERY port, so each tenant uses its own cookie name.
// Otherwise logging in on Tenant B would overwrite Tenant A's cookie.
const COOKIE_NAME = `sid_${TENANT_ID}`;
const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;
const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript in the page can't read it
  sameSite: "strict", // other websites can't make the browser send it
  secure: process.env.NODE_ENV === "production", // HTTPS only when deployed (localhost is plain http)
  path: "/",
};

// ---------- Database (one per tenant) ----------

let dbName;
let db;
if (DB_URL) {
  // Turso: the token only opens THIS tenant's database.
  dbName = DB_URL;
  db = createClient({ url: DB_URL, authToken: process.env.DB_AUTH_TOKEN });
} else {
  // Local file. DB_PATH is relative to the server/ folder, e.g. data/tenantA.db
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  dbName = path.resolve(serverDir, DB_PATH);
  mkdirSync(path.dirname(dbName), { recursive: true });
  db = createClient({ url: pathToFileURL(dbName).href });
}

// Runs one SQL statement. Returns the first row (or undefined).
async function getRow(sql, ...args) {
  const result = await db.execute({ sql, args });
  return result.rows[0];
}

async function run(sql, ...args) {
  await db.execute({ sql, args });
}

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id     TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (tenant_id, email)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    tenant_id  TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

// Safety net: refuse to start if this database holds another tenant's accounts
// (for example, both tenants pointing at the same DB_PATH or DB_URL by mistake).
const foreign = await getRow("SELECT tenant_id FROM users WHERE tenant_id != ? LIMIT 1", TENANT_ID);
if (foreign) {
  console.error(`${dbName} has accounts for ${foreign.tenant_id}, not ${TENANT_ID}. Check DB_PATH / DB_URL.`);
  process.exit(1);
}

console.log(`Accounts database for ${TENANT_ID}: ${dbName}`);

// Every query also checks tenant_id, as a second lock on top of the separate databases.
const findUserByEmail = (email) => getRow(
  "SELECT id, full_name, email, password_hash FROM users WHERE tenant_id = ? AND email = ?",
  TENANT_ID, email
);
const insertUser = (fullName, email, passwordHash) => run(
  "INSERT INTO users (tenant_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)",
  TENANT_ID, fullName, email, passwordHash
);
const insertSession = (tokenHash, userId, expiresAt) => run(
  "INSERT INTO sessions (token_hash, user_id, tenant_id, expires_at) VALUES (?, ?, ?, ?)",
  tokenHash, userId, TENANT_ID, expiresAt
);
const findSessionUser = (tokenHash) => getRow(`
  SELECT u.full_name, u.email FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = ? AND s.tenant_id = ? AND u.tenant_id = ? AND s.expires_at > ?
`, tokenHash, TENANT_ID, TENANT_ID, Date.now());
const deleteSession = (tokenHash) => run(
  "DELETE FROM sessions WHERE token_hash = ? AND tenant_id = ?", tokenHash, TENANT_ID
);
const deleteExpiredSessions = () => run("DELETE FROM sessions WHERE expires_at <= ?", Date.now());

// Compared against when the email doesn't exist, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

// ---------- Helpers ----------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as validateSignup in client/src/authService.js. The server is the one that counts.
function validateSignup({ fullName, email, password, confirmPassword }) {
  const errors = {};
  if (!fullName) errors.fullName = "Please enter your full name.";
  else if (fullName.length > 100) errors.fullName = "Name must be 100 characters or less.";

  if (!email) errors.email = "Please enter your email.";
  else if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = "Please enter a valid email, like juan@example.com.";

  if (!password) errors.password = "Please enter a password.";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (Buffer.byteLength(password) > 72) errors.password = "Password must be 72 characters or less."; // bcrypt's limit

  if (!confirmPassword) errors.confirmPassword = "Please type your password again.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

// Reads the request body safely. Names and emails are trimmed, emails lowercased. Passwords are left as typed.
function readFields(body = {}) {
  const text = (value) => (typeof value === "string" ? value : "");
  return {
    fullName: text(body.fullName).trim(),
    email: text(body.email).trim().toLowerCase(),
    password: text(body.password),
    confirmPassword: text(body.confirmPassword),
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readSessionToken(req) {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// The logged-in user for this request ({ name, email }), or null.
async function getSessionUser(req) {
  const token = readSessionToken(req);
  if (!token) return null;
  const row = await findSessionUser(hashToken(token));
  return row ? { name: row.full_name, email: row.email } : null;
}

// Put in front of a route so only logged-in users can use it (401 otherwise).
// Used for /chat and /feedback, because every router call costs real money.
export async function requireLogin(req, res, next) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Please log in first." });
  next();
}

// ---------- Routes (mounted at /auth in server.js) ----------

export const authRouter = express.Router();

// POST /auth/signup  { fullName, email, password, confirmPassword }
// 201 { ok: true }, or 400 { errors: { field: message } }
authRouter.post("/signup", async (req, res) => {
  const fields = readFields(req.body);
  const errors = validateSignup(fields);
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const emailTaken = { email: "An account with this email already exists. Try logging in." };
  if (await findUserByEmail(fields.email)) return res.status(400).json({ errors: emailTaken });

  try {
    const passwordHash = await bcrypt.hash(fields.password, BCRYPT_ROUNDS);
    await insertUser(fields.fullName, fields.email, passwordHash);
    res.status(201).json({ ok: true });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the UNIQUE rule catches the second one.
    if (String(err.message).includes("UNIQUE")) return res.status(400).json({ errors: emailTaken });
    console.error("Signup failed:", err);
    res.status(500).json({ error: "Could not create the account. Please try again." });
  }
});

// POST /auth/login  { email, password }  ->  200 { user } and sets the session cookie, or 401 { error }
authRouter.post("/login", async (req, res) => {
  const { email, password } = readFields(req.body);
  if (!email || !password) return res.status(400).json({ error: "Please enter your email and password." });

  const user = await findUserByEmail(email);
  const passwordOk = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  // Same message for "no such email" and "wrong password", so nobody can test which emails exist.
  if (!user || !passwordOk) return res.status(401).json({ error: "Incorrect email or password." });

  await deleteExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const maxAge = SESSION_DAYS * 24 * 60 * 60 * 1000;
  await insertSession(hashToken(token), user.id, Date.now() + maxAge);
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge });
  res.json({ user: { name: user.full_name, email: user.email } });
});

// GET /auth/me  ->  { user } if logged in, otherwise { user: null }
authRouter.get("/me", async (req, res) => {
  res.json({ user: await getSessionUser(req) });
});

// POST /auth/logout  ->  deletes the session and the cookie
authRouter.post("/logout", async (req, res) => {
  const token = readSessionToken(req);
  if (token) await deleteSession(hashToken(token));
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.json({ ok: true });
});
