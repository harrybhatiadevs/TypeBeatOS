import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/dashboard" className="logo">
            TypeBeat<span>OS</span>
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link href="/beats" className="nav-link">
              Beats
            </Link>
            <Link href="/calendar" className="nav-link">
              Calendar
            </Link>
            <Link href="/profile" className="nav-link">
              Profile
            </Link>
            <Link href="/beats/new" className="btn btn-primary btn-sm">
              + New beat
            </Link>
            <form action={logout} style={{ display: "inline" }}>
              <button type="submit" className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </>
  );
}
