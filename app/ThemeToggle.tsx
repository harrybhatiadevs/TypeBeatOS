"use client";

import { useEffect, useState } from "react";

/**
 * Day/night toggle. Dark is the TypeBeatOS brand default;
 * flipping to light persists per device via localStorage("tb-theme") and
 * takes effect by setting data-theme on <html> — the same attribute the
 * pre-paint script in app/layout.tsx reads, so there's never a flash.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  // null until mounted — the server doesn't know the choice, so render a
  // neutral button first and fill the state in after hydration.
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  const flip = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("tb-theme", next);
    } catch {
      // private mode — the toggle still works for this page view
    }
  };

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={flip}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Dark theme" : "Light theme"}
    >
      {/* Moon (shown in dark mode) / Sun (shown in light) — CSS decides via
          [data-theme]; both are inline so no icon package is needed. */}
      <svg className="theme-toggle-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="theme-toggle-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
      </svg>
    </button>
  );
}
