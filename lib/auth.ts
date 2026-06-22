/**
 * Thin compatibility layer over Better-Auth. The public API
 * (`getUser`, `requireUser`, `destroySession`) is identical to what
 * the rest of the app was reading from the legacy custom-session
 * module, so no caller had to change. Internally it now delegates to
 * Better-Auth's session lookup + sign-out.
 *
 * createSession() is no longer used directly — Better-Auth issues the
 * cookie automatically during signUpEmail / signInEmail.
 */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { auth } from "./auth-server";

export async function destroySession() {
  // Better-Auth handles cookie deletion + session row cleanup.
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // If the cookie was already gone, swallow — same behaviour as the
    // legacy implementation.
  }
}

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Better-Auth's User shape is lean — we need to hydrate the profile
  // relation for the rest of the app to keep reading `user.profile.X`.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Get the session cookie name that Better-Auth is configured to use.
 * Exposed so other modules (middleware, manual cookie inspection)
 * don't hardcode the string.
 */
export const SESSION_COOKIE = "tbos_session";

/**
 * Returns true if there's a live session cookie. Cheap — does not hit
 * the DB. Use for middleware-level "is this request even maybe logged
 * in" checks, not authorization.
 */
export async function hasSessionCookie() {
  const c = await cookies();
  return !!c.get(SESSION_COOKIE)?.value;
}
