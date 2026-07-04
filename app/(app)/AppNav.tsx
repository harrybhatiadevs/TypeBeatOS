"use client";

import { useEffect, useRef, useState } from "react";

export default function AppNav({ children }: { children: React.ReactNode }) {
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);

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

  return <nav className={`nav${hidden ? " is-hidden" : ""}`}>{children}</nav>;
}
