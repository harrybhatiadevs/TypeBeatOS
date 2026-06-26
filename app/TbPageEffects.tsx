"use client";

import { useEffect } from "react";

/**
 * Tiny client controller shared by every .tb-page surface (landing,
 * waitlist, future marketing pages):
 *  - Adds .is-scrolled to .tb-nav after a small scroll threshold
 *  - Reveals .tb-reveal elements when they enter the viewport
 *  - Runs the landing receipt and transport-bar interactions
 */
export default function TbPageEffects() {
  useEffect(() => {
    document.documentElement.classList.add("tb-js");

    const nav = document.querySelector(".tb-nav");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

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

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const typeText = async (target: HTMLElement) => {
      const text = target.dataset.typeText || target.textContent || "";

      if (reduceMotion) {
        target.textContent = text;
        return;
      }

      target.textContent = "";
      const step = text.length > 84 ? 3 : 2;

      for (let i = 0; i < text.length; i += step) {
        if (cancelled) return;
        target.textContent = text.slice(0, i + step);
        await sleep(14);
      }
    };

    const runReceipt = async (receipt: HTMLElement) => {
      if (receipt.dataset.started === "true") return;
      receipt.dataset.started = "true";

      const status = receipt.querySelector<HTMLElement>("[data-generating-status]");
      const rows = Array.from(receipt.querySelectorAll<HTMLElement>("[data-receipt-row]"));

      receipt.classList.add("is-generating");
      if (status) status.textContent = "generating";

      for (const row of rows) {
        if (cancelled) return;
        row.classList.add("is-filling");
        const targets = Array.from(row.querySelectorAll<HTMLElement>("[data-type-target]"));
        for (const target of targets) {
          await typeText(target);
        }
        row.classList.remove("is-filling");
        row.classList.add("is-filled");
        await sleep(reduceMotion ? 0 : 110);
      }

      receipt.classList.remove("is-generating");
      receipt.classList.add("is-complete");
      if (status) status.textContent = "complete";
    };

    const receipts = Array.from(document.querySelectorAll<HTMLElement>("[data-receipt]"));
    const receiptIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void runReceipt(entry.target as HTMLElement);
            receiptIo.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.34, rootMargin: "0px 0px -80px 0px" }
    );
    receipts.forEach((receipt) => receiptIo.observe(receipt));

    const transportCleanups: Array<() => void> = [];
    document.querySelectorAll<HTMLElement>("[data-transport]").forEach((transport) => {
      const button = transport.querySelector<HTMLButtonElement>("[data-transport-toggle]");
      if (!button) return;

      const onClick = () => {
        const paused = transport.classList.toggle("is-paused");
        button.setAttribute("aria-pressed", String(paused));
        button.setAttribute(
          "aria-label",
          paused ? "Resume upload flow" : "Pause upload flow"
        );
      };

      button.addEventListener("click", onClick);
      transportCleanups.push(() => button.removeEventListener("click", onClick));
    });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      receiptIo.disconnect();
      transportCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
