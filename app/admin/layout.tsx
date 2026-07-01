import type { Metadata } from "next";
import "../(app)/app-chrome.css";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin · TypeBeatOS",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate the whole /admin segment — non-admins never render any of it.
  await requireAdmin();

  return (
    <div className="app-page">
      <main className="app-main">{children}</main>
    </div>
  );
}
