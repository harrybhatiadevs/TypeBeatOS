import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import NavLinks from "./NavLinks";
import VerifyEmailBanner from "./VerifyEmailBanner";
import ThemeToggle from "@/app/ThemeToggle";
import "./app-chrome.css";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

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
          <Link href="/beats/new" className="btn btn-primary btn-sm desktop-nav-action">
            + New beat
          </Link>
          <ThemeToggle className="desktop-nav-action" />
          <form action={logout} className="desktop-nav-action">
            <button type="submit" className="nav-link nav-logout">
              Log out
            </button>
          </form>
          <details className="mobile-nav-menu">
            <summary className="mobile-nav-trigger" aria-label="Open navigation menu">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <div className="mobile-nav-panel">
              <div className="mobile-nav-links">
                <NavLinks />
              </div>
              <Link href="/beats/new" className="btn btn-primary btn-sm mobile-nav-primary">
                + New beat
              </Link>
              <div className="mobile-nav-actions">
                <ThemeToggle />
                <form action={logout}>
                  <button type="submit" className="nav-link nav-logout">
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </details>
        </div>
      </nav>
      {!user.emailVerified && (
        <VerifyEmailBanner email={user.email} />
      )}
      <main className="app-main">{children}</main>
    </div>
  );
}
