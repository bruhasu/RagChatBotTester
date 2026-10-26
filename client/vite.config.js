import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "mode" is tenantA or tenantB (set by npm run dev:a / dev:b in package.json).
// Each tenant gets its own port so both sites can run at the same time.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: mode === "tenantB" ? 5174 : 5173,
    // Send /auth/... (sign up, log in, log out) to THIS tenant's backend only.
    // The browser sees one address, so the login cookie works without extra setup.
    proxy: {
      "/auth": `http://localhost:${mode === "tenantB" ? 4001 : 4000}`,
    },
  },
}));
