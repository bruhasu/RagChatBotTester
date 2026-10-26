// server/server.js
// The test website's backend. It holds the API key and forwards questions to
// the router service. The key stays here and never reaches the browser.
// Settings come from an .env file, e.g.: node --env-file=.env.tenantA server.js
import express from "express";
import { authRouter } from "./auth.js";

const app = express();
app.use(express.json());

// Sign up, log in, log out, "who am I" (see auth.js). Uses this tenant's own database.
app.use("/auth", authRouter);

const PORT = process.env.PORT || 4000;
const ROUTER_API_URL = process.env.ROUTER_API_URL;
const ROUTER_API_KEY = process.env.ROUTER_API_KEY;

if (!ROUTER_API_URL || !ROUTER_API_KEY) {
  console.error("ROUTER_API_URL or ROUTER_API_KEY is missing. Did you start with --env-file?");
  process.exit(1);
}

// Sends a JSON body to the router (with the secret key) and passes its reply back.
async function forwardToRouter(path, body, res) {
  try {
    const r = await fetch(`${ROUTER_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ROUTER_API_KEY,
      },
      body: JSON.stringify(body),
    });
    res.status(r.status).json(await r.json());
  } catch (err) {
    // The router is down, unreachable, or didn't send back JSON.
    console.error(`Router call to ${path} failed:`, err.message);
    res.status(502).json({ error: "Could not reach the router service" });
  }
}

// Branding only. NEVER add the API key here, because the browser can read this.
app.get("/config", (req, res) => {
  res.json({
    name: process.env.BRAND_NAME,
    primaryColor: process.env.BRAND_PRIMARY_COLOR,
    accentColor: process.env.BRAND_ACCENT_COLOR,
    logo: process.env.BRAND_LOGO,
  });
});

app.post("/chat", (req, res) => {
  forwardToRouter("/v1/chat", {
    query: req.body.query,
    session_id: req.body.sessionId,
  }, res);
});

app.post("/feedback", (req, res) => {
  forwardToRouter("/v1/feedback", {
    session_id: req.body.sessionId,
    query: req.body.query,
    rating: req.body.rating, // "up" or "down"
  }, res);
});

app.listen(PORT, () => {
  console.log(`${process.env.BRAND_NAME} backend running at http://localhost:${PORT}`);
});
