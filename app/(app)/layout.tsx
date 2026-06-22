import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import NavLinks from "./NavLinks";
import "./app-chrome.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="app-page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/dashboard" className="logo" aria-label="TypeBeatOS dashboard">
            <span className="logo-mark" aria-hidden="true" />
            <span className="logo-word">
              TYPEBEAT<span>OS</span>
            </span>
          </Link>
          <div className="nav-links">
            <NavLinks />
          </div>
          <Link href="/beats/new" className="btn btn-primary btn-sm">
            + New beat
          </Link>
          <form action={logout}>
            <button type="submit" className="nav-link nav-logout">
              Log out
            </button>
          </form>
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
