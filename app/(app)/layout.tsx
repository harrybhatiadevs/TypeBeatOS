import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import NavLinks from "./NavLinks";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="app-page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/dashboard" className="logo marketing-logo" aria-label="TypeBeatOS dashboard">
            <span className="logo-mark" aria-hidden="true">
              TB
            </span>
            <span className="logo-word">
              TypeBeat<span>OS</span>
            </span>
          </Link>
          <div className="nav-links">
            <NavLinks />
            <Link href="/beats/new" className="btn btn-primary btn-sm">
              + New beat
            </Link>
            <form action={logout} style={{ display: "inline" }}>
              <button type="submit" className="nav-link nav-logout">
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
