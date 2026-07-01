"use client";

import { useEffect } from "react";

/**
 * Landing-only client controller (isolated from TbPageEffects):
 *  - Adds .is-scrolled to .lp-nav past a small threshold.
 *  - Reveals .lp-reveal elements on scroll via IntersectionObserver.
 *
 * Reveal is enhancement-only: a fallback timer + reduced-motion CSS guarantee
 * content is never left hidden on headless renders or hidden tabs.
 */
export default function LpEffects() {
  useEffect(() => {
    const nav = document.querySelector(".lp-nav");
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

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

    // Safety net: if IO never fires (background tab, headless), reveal everything.
    const fallback = window.setTimeout(() => els.forEach(reveal), 1600);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
