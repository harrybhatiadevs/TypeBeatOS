"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/beats", label: "Beats" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile", label: "Profile" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link${pathname.startsWith(l.href) ? " active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}
