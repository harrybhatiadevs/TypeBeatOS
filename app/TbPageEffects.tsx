"use client";

import { useEffect } from "react";

/**
 * Tiny client controller shared by every .tb-page surface (landing,
 * waitlist, future marketing pages):
 *  - Reveals .tb-reveal elements when they enter the viewport
 */
export default function TbPageEffects() {
  useEffect(() => {
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
      io.disconnect();
    };
  }, []);

  return null;
}
