import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUser } from "@/lib/auth";
import { appUrl, youtubeAuthUrl, youtubeConfigured } from "@/lib/youtube";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl()));
  if (!youtubeConfigured()) {
    return NextResponse.redirect(
      new URL("/profile?yt_error=Google+credentials+are+not+configured", appUrl())
    );
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(youtubeAuthUrl(state));
  res.cookies.set("yt_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
