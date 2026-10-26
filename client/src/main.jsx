import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { tenant } from "./tenantConfig.js";

// Turn the tenant's colors into CSS variables (--brand-primary, etc.)
// so every .css file can use them.
const style = document.documentElement.style;
style.setProperty("--brand-primary", tenant.colors.primary);
style.setProperty("--brand-on-primary", tenant.colors.onPrimary);style.setProperty("--brand-accent", tenant.colors.accent);
style.setProperty("--brand-on-accent", tenant.colors.onAccent);
style.setProperty("--brand-bg", tenant.colors.background);

// Browser tab title and icon
document.title = tenant.name;
document.getElementById("favicon").href = tenant.logo;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
