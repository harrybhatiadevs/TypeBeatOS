import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { appUrl, exchangeCode, fetchChannel } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/profile?yt_error=${encodeURIComponent(msg)}`, appUrl()));

  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", appUrl()));

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("Google authorization was denied");

  const code = params.get("code");
  const state = params.get("state");
  const cookieState = req.cookies.get("yt_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("OAuth state mismatch — try connecting again");
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      return fail(
        "Google did not return a refresh token. Remove this app at myaccount.google.com/permissions, then reconnect."
      );
    }
    const channel = await fetchChannel(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await db.youTubeAccount.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        channelId: channel.id,
        channelTitle: channel.title,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        channelId: channel.id,
        channelTitle: channel.title,
      },
    });

    const res = NextResponse.redirect(new URL("/profile?yt_connected=1", appUrl()));
    res.cookies.delete("yt_oauth_state");
    return res;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Connection failed");
  }
}
