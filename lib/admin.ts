import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

/**
 * Admin allow-list. Defaults to the owner; override in prod via ADMIN_EMAIL
 * (comma-separated to allow more than one). Matching is case-insensitive.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "harrybhatia928@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Gate a route to the admin allow-list. Logged-out users go to /login; anyone
 * logged in who isn't an admin gets a 404 so the route stays effectively hidden.
 */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
