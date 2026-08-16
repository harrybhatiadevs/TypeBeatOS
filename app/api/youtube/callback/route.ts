import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { appUrl, exchangeCode, fetchChannel } from "@/lib/youtube";
import { oauthLimiter } from "@/lib/rate-limit";
import { safeReturnPath } from "@/lib/safe-return-path";

const DEFAULT_RETURN_PATH = "/settings?tab=profile";

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET(req: NextRequest) {
  const returnPath = safeReturnPath(
    req.cookies.get("yt_return")?.value,
    DEFAULT_RETURN_PATH,
  );
  const withParam = (param: string) =>
    new URL(`${returnPath}${returnPath.includes("?") ? "&" : "?"}${param}`, appUrl());

  const fail = (msg: string) =>
    NextResponse.redirect(withParam(`yt_error=${encodeURIComponent(msg)}`));

  const gate = await oauthLimiter.consume(clientIp(req));
  if (!gate.allowed) return fail("Too many requests — try again in a minute.");

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

    const res = NextResponse.redirect(withParam("yt_connected=1"));
    res.cookies.delete("yt_oauth_state");
    res.cookies.delete("yt_return");
    return res;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Connection failed");
  }
}
