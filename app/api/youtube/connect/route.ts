import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUser } from "@/lib/auth";
import { appUrl, youtubeAuthUrl, youtubeConfigured } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl()));
  if (!youtubeConfigured()) {
    return NextResponse.redirect(
      new URL("/profile?yt_error=Google+credentials+are+not+configured", appUrl())
    );
  }

  // Optional in-app path to land on after the OAuth round-trip (e.g. onboarding)
  const ret = req.nextUrl.searchParams.get("return") || "";
  const returnPath = ret.startsWith("/") && !ret.startsWith("//") ? ret : "/profile";

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(youtubeAuthUrl(state));
  const cookieOpts = { httpOnly: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  res.cookies.set("yt_oauth_state", state, cookieOpts);
  res.cookies.set("yt_return", returnPath, cookieOpts);
  return res;
}
