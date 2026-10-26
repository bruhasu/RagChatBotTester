// client/api/proxy.js
// Runs on Vercel (not in the browser). vercel.json sends every /api/... request here,
// and this passes it on to THIS tenant's backend on Render:
//   https://bagwis.vercel.app/api/auth/login  ->  BACKEND_URL/auth/login
// Because the browser only ever talks to the Vercel site, the login cookie belongs to
// that site and works without any cross-site cookie tricks.
// BACKEND_URL is set in each Vercel project's Environment Variables (Tenant A and B differ).

// Only these backend routes can be reached through the proxy.
const ALLOWED = ["auth/signup", "auth/login", "auth/me", "auth/logout", "chat", "feedback", "config"];

async function forward(request) {
  const backend = process.env.BACKEND_URL;
  const target = new URL(request.url).searchParams.get("path") ?? "";
  if (!backend) return Response.json({ error: "BACKEND_URL is not set on Vercel" }, { status: 500 });
  if (!ALLOWED.includes(target)) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    const reply = await fetch(`${backend.replace(/\/$/, "")}/${target}`, {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: request.method === "GET" ? undefined : await request.text(),
    });

    const headers = new Headers({ "Content-Type": reply.headers.get("content-type") ?? "application/json" });
    for (const cookie of reply.headers.getSetCookie()) headers.append("Set-Cookie", cookie);
    return new Response(await reply.text(), { status: reply.status, headers });
  } catch (err) {
    console.error(`Backend call to /${target} failed:`, err.message);
    return Response.json({ error: "Could not reach the backend" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
