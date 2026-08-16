"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";

export default function AppNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLDetailsElement>("details[open]")
      ?.removeAttribute("open");
  }, [pathname]);

  const closeMobileMenuAfterSelection = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) return;

    event.target
      .closest("a")
      ?.closest<HTMLDetailsElement>("details.mobile-nav-menu")
      ?.removeAttribute("open");
  };

  return (
    <nav
      ref={navRef}
      className="nav"
      onClick={closeMobileMenuAfterSelection}
    >
      {children}
    </nav>
  );
}
