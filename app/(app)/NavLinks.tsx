"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pathMatches } from "@/lib/nav";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/beats", label: "Beats", aliases: ["/packages"] },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link${
            pathMatches(pathname, l.href, l.aliases) ? " active" : ""
          }`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}
