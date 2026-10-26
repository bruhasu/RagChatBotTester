// mock-router/server.js
// A FAKE version of my partner's router service. It pretends to be the real
// /v1/chat service so the test website can be built before the real one is ready.
// It never calls an AI. It just returns made-up answers.
import express from "express";

const app = express();
app.use(express.json());

const PORT = 3000;

// The two fake API keys this mock accepts, one per tenant.
// These must match ROUTER_API_KEY in server/.env.tenantA and server/.env.tenantB.
const TENANTS = {
  "mock-key-tenant-a-bagwis": { id: "tenantA", name: "Bagwis University Help Desk" },
  "mock-key-tenant-b-kahonko": { id: "tenantB", name: "KahonKo Gadgets Support" },
};

// Checks the x-api-key header. If it's missing or unknown, replies 401 and stops.
// If it's valid, remembers which tenant is calling (req.tenant) and continues.
function requireApiKey(req, res, next) {
  const key = req.get("x-api-key");
  const tenant = TENANTS[key];
  if (!tenant) {
    return res.status(401).json({ error: "Missing or invalid API key" });
  }
  req.tenant = tenant;
  next();
}

app.post("/v1/chat", requireApiKey, (req, res) => {
  const { query, session_id } = req.body ?? {};
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  console.log(`[chat] ${req.tenant.id} session=${session_id}: ${query}`);

  res.json({
    answer: `[MOCK ${req.tenant.id}] This is a fake answer from ${req.tenant.name} to: "${query}"`,
    sources: [
      { tenant: req.tenant.id, document: `${req.tenant.id}-fake-document-1.pdf`, snippet: "Fake passage one." },
      { tenant: req.tenant.id, document: `${req.tenant.id}-fake-document-2.pdf`, snippet: "Fake passage two." },
    ],
    session_id,
  });
});

app.post("/v1/feedback", requireApiKey, (req, res) => {
  const { session_id, query, rating } = req.body ?? {};
  if (rating !== "up" && rating !== "down") {
    return res.status(400).json({ error: 'rating must be "up" or "down"' });
  }

  console.log(`[feedback] ${req.tenant.id} session=${session_id} rating=${rating}: ${query}`);

  res.json({ ok: true, tenant: req.tenant.id });
});

app.listen(PORT, () => {
  console.log(`Mock router running at http://localhost:${PORT}`);
});
