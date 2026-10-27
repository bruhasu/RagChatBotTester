// mock-router/server.js
// A FAKE version of my partner's router service. It pretends to be the real
// /v1/chat service so the test website can be built before the real one is ready.
// It never calls an AI. It just returns made-up answers.
import express from "express";

const app = express();
app.use(express.json());

// Render picks the port itself (PORT). On this computer it's 3000.
const PORT = process.env.PORT || 3000;

// The two fake API keys this mock accepts, one per tenant.
// These must match ROUTER_API_KEY in server/.env.tenantA and server/.env.tenantB.
// When hosted, the keys come from the Render dashboard (MOCK_KEY_TENANT_A / _B), because
// the local ones below are public in the GitHub repo.
const IS_HOSTED = process.env.NODE_ENV === "production";
const KEY_A = process.env.MOCK_KEY_TENANT_A || (IS_HOSTED ? null : "mock-key-tenant-a-bagwis");
const KEY_B = process.env.MOCK_KEY_TENANT_B || (IS_HOSTED ? null : "mock-key-tenant-b-kahonko");

if (!KEY_A || !KEY_B) {
  console.error("MOCK_KEY_TENANT_A or MOCK_KEY_TENANT_B is missing. Set them in the Render dashboard.");
  process.exit(1);
}

const TENANTS = {
  [KEY_A]: { id: "tenantA", name: "Bagwis University Help Desk" },
  [KEY_B]: { id: "tenantB", name: "KahonKo Gadgets Support" },
};

// "Am I awake?" check. Render uses it, and you can open it in a browser.
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Checks the x-api-key header. If it's missing or unknown, replies 401 and stops.
// If it's valid, remembers which tenant is calling (req.tenant) and continues.
// Errors look like the real router's: { error: { code, message } }
function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

function requireApiKey(req, res, next) {
  const key = req.get("x-api-key");
  const tenant = TENANTS[key];
  if (!tenant) {
    return sendError(res, 401, "invalid_api_key", "Missing or invalid API key.");
  }
  req.tenant = tenant;
  next();
}

// Same reply shape as the partner's real POST /v1/chat (https://lumen-roan-two.vercel.app).
// Document ids start with the tenant id, so the isolation tests can check them.
app.post("/v1/chat", requireApiKey, (req, res) => {
  const { query, session_id } = req.body ?? {};
  if (typeof query !== "string" || query.length < 1 || query.length > 2000) {
    return sendError(res, 422, "invalid_request", "Invalid request: query.");
  }

  console.log(`[chat] ${req.tenant.id} session=${session_id}: ${query}`);

  res.json({
    request_id: crypto.randomUUID(),
    answer: `[MOCK ${req.tenant.id}] This is a fake answer from ${req.tenant.name} to: "${query}" [1] [2]`,
    sources: [
      { document_id: `${req.tenant.id}-fake-document-1`, chunk_id: 1, score: 0.9 },
      { document_id: `${req.tenant.id}-fake-document-2`, chunk_id: 2, score: 0.8 },
    ],
    route: { model_tier: "none", k: 2, difficulty: 0, escalated: false, top_score: 0.9 },
    usage: { tokens_in: 0, tokens_out: 0, cost_usd: 0, latency_ms: 0 },
  });
});

// Same as the real POST /v1/feedback: { request_id, rating: 1 | -1 } -> 204 with no body.
app.post("/v1/feedback", requireApiKey, (req, res) => {
  const { request_id, rating } = req.body ?? {};
  if (typeof request_id !== "string" || !request_id) {
    return sendError(res, 422, "invalid_request", "Invalid request: request_id.");
  }
  if (rating !== 1 && rating !== -1) {
    return sendError(res, 422, "invalid_request", "Invalid request: rating.");
  }

  console.log(`[feedback] ${req.tenant.id} request=${request_id} rating=${rating}`);

  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Mock router running at http://localhost:${PORT}`);
});
