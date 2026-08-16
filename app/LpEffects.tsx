"use client";

import { useEffect } from "react";

/**
 * Landing-only client controller (isolated from TbPageEffects):
 *  - Reveals .lp-reveal elements on scroll via IntersectionObserver.
 *
 * Reveal is enhancement-only: a fallback timer + reduced-motion CSS guarantee
 * content is never left hidden on headless renders or hidden tabs.
 */
export default function LpEffects() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".lp-reveal"));
    const reveal = (el: Element) => el.classList.add("is-in");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));

    // Safety net: reveal only what is already in view, so below-fold
    // animations still wait until the user scrolls to them.
    const fallback = window.setTimeout(() => {
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) reveal(el);
      }
    }, 1600);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
