"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

export default function AppNav({ children }: { children: React.ReactNode }) {
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);

  const closeMobileMenuAfterSelection = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) return;

    event.target
      .closest("a")
      ?.closest<HTMLDetailsElement>("details.mobile-nav-menu")
      ?.removeAttribute("open");
  };

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY.current;
      setHidden(currentY > 120 && scrollingDown);
      lastY.current = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`nav${hidden ? " is-hidden" : ""}`}
      onClick={closeMobileMenuAfterSelection}
    >
      {children}
    </nav>
  );
}
