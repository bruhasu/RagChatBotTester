import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "mode" is tenantA or tenantB (set by npm run dev:a / dev:b in package.json).
// Each tenant gets its own port so both sites can run at the same time.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: mode === "tenantB" ? 5174 : 5173,
    // Send /api/... (log in, chat, feedback) to THIS tenant's backend only, without the "/api"
    // (/api/auth/login -> http://localhost:4000/auth/login). The browser sees one address,
    // so the login cookie works without extra setup. On Vercel, api/proxy.js does the same job.
    proxy: {
      "/api": {
        target: `http://localhost:${mode === "tenantB" ? 4001 : 4000}`,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
}));
