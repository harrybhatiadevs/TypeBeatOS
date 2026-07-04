"use client";

import { useEffect } from "react";

/**
 * Landing-only client controller (isolated from TbPageEffects):
 *  - Adds .is-scrolled to .lp-nav past a small threshold.
 *  - Updates the active nav link and scroll progress.
 *  - Reveals .lp-reveal elements on scroll via IntersectionObserver.
 *
 * Reveal is enhancement-only: a fallback timer + reduced-motion CSS guarantee
 * content is never left hidden on headless renders or hidden tabs.
 */
export default function LpEffects() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".lp");
    const nav = document.querySelector<HTMLElement>(".lp-nav");
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".lp-nav-link[data-section-link]"));
    const sections = [
      { id: "home", el: document.getElementById("home") },
      { id: "workflow", el: document.getElementById("workflow") },
      { id: "features", el: document.getElementById("features") },
      { id: "pricing", el: document.getElementById("pricing") },
    ].filter((section): section is { id: string; el: HTMLElement } => Boolean(section.el));

    const onScroll = () => {
      if (!nav) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, scrollY / max));
      let current = sections[0];

      for (const section of sections) {
        if (section.el.getBoundingClientRect().top <= 120) current = section;
      }

      const progressText = progress.toFixed(4);

      if (page) {
        page.style.setProperty("--scroll-progress", progressText);
      }

      nav.classList.toggle("is-scrolled", scrollY > 12);
      nav.style.setProperty("--scroll-progress", progressText);
      for (const link of links) {
        link.classList.toggle("is-active", link.dataset.sectionLink === current?.id);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });

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
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
