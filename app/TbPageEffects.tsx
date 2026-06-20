"use client";

import { useEffect } from "react";

/**
 * Tiny client controller shared by every .tb-page surface (landing,
 * waitlist, future marketing pages):
 *  - Adds .is-scrolled to .tb-nav after a small scroll threshold
 *  - Reveals .tb-reveal elements when they enter the viewport
 */
export default function TbPageEffects() {
  useEffect(() => {
    const nav = document.querySelector(".tb-nav");

    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 12) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const els = document.querySelectorAll(".tb-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return null;
}
