import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { getUser } from "@/lib/auth";

/**
 * Change password as a plain form POST → 303. Better-Auth mutates session
 * cookies during changePassword; doing that inside a Server Action +
 * redirect() leaves the destination segment blank on the soft navigation
 * (same Next 15 transport quirk family as the multipart upload bug), so
 * this lives in a route handler where the browser does a real navigation.
 */
export async function POST(request: Request) {
  const redirectTo = (p: string) =>
    new NextResponse(null, { status: 303, headers: { Location: p } });

  const user = await getUser();
  if (!user) return redirectTo("/login");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectTo("/settings?tab=security&error=" + encodeURIComponent("Something went wrong — try again."));
  }

  const currentPassword = String(form.get("currentPassword") || "");
  const newPassword = String(form.get("newPassword") || "");
  const confirm = String(form.get("confirmPassword") || "");

  if (newPassword.length < 8) {
    return redirectTo("/settings?tab=security&error=" + encodeURIComponent("New password must be at least 8 characters."));
  }
  if (newPassword !== confirm) {
    return redirectTo("/settings?tab=security&error=" + encodeURIComponent("New passwords don't match."));
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        // Sign out any other devices when the password changes.
        revokeOtherSessions: true,
      },
      headers: request.headers,
    });
  } catch {
    return redirectTo("/settings?tab=security&error=" + encodeURIComponent("Current password is incorrect."));
  }
  return redirectTo("/settings?tab=security&saved=password");
}
