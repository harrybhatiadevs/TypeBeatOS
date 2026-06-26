"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Music2,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/beats", label: "Beats", icon: Music2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserRound },
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

export default function NavLinks({ variant = "top" }: { variant?: "top" | "bottom" }) {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((l) => {
        const Icon = l.icon;
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`${variant === "bottom" ? "mobile-nav-link" : "nav-link"}${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {variant === "bottom" && <Icon aria-hidden="true" size={18} strokeWidth={2.2} />}
            <span>{l.label}</span>
          </Link>
        );
      })}
    </>
  );
}
