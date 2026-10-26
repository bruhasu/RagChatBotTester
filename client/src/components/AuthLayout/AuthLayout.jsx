import { useEffect, useState } from "react";
import { tenant } from "../../tenantConfig.js";
import "./AuthLayout.css";

const SLIDE_SECONDS = 5;

// Shared look for the Login and Signup pages, the same for BOTH tenants:
// heading on top, carousel on the left, a colored panel on the right holding the page's form.
// Only the name, logo, colors and slide text change, and they come from tenantConfig.js.
export default function AuthLayout({ subtitle, children }) {
  const highlights = tenant.login.highlights;
  const [slide, setSlide] = useState(0);
  const slideCount = highlights.length;

  // Go to the next slide every 5 seconds. Clicking a dot changes "slide",
  // which restarts the timer. Skipped if the user prefers reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setSlide((slide + 1) % slideCount), SLIDE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [slide, slideCount]);

  return (
    <div className="auth">
      <div className="auth-heading">
        <h1>{tenant.name}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="auth-banner">
        <div className="auth-carousel">
          {highlights.map((text, i) => (
            <div
              key={text}
              className={`auth-slide${i === slide ? " is-active" : ""}`}
              aria-hidden={i !== slide}
            >
              <img src={tenant.logo} alt="" className="auth-slide-logo" />
              <p className="auth-slide-text">{text}</p>
            </div>
          ))}
          <div className="auth-dots">
            {highlights.map((text, i) => (
              <button
                key={text}
                type="button"
                className="auth-dot"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === slide}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>

        <div className="auth-panel">{children}</div>
      </div>
    </div>
  );
}
