import { readFile } from "fs/promises";
import path from "path";
import { db } from "./db";
import { loggerFor } from "./logger";
import { youtubePublishStatus } from "./youtube-upload-policy";

const log = loggerFor("youtube");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const SCOPES =
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";

export function youtubeConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

function redirectUri() {
  return `${appUrl()}/api/youtube/callback`;
}

export function youtubeAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

/** Revoke the complete Google authorization grant represented by this token. */
export async function revokeGoogleAuthorization(token: string) {
  if (!token) return;

  const res = await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });
  if (res.ok) return;

  const detail = (await res.text()).slice(0, 200);
  // Google returns invalid_token when the user has already revoked the grant.
  if (res.status === 400 && /invalid_token/i.test(detail)) return;
  throw new Error(`Google authorization revocation failed (${res.status})`);
}

/** Returns a valid access token for the user, refreshing it if needed. */
export async function validAccessToken(userId: string) {
  const acct = await db.youTubeAccount.findUnique({ where: { userId } });
  if (!acct) throw new Error("YouTube channel not connected");
  if (acct.expiresAt.getTime() - Date.now() > 120_000) return acct.accessToken;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: acct.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed — disconnect and reconnect your YouTube channel");
  const data = (await res.json()) as { access_token: string; expires_in: number };
  await db.youTubeAccount.update({
    where: { userId },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
  return data.access_token;
}

export async function fetchChannel(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Could not read channel info: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const channel = data?.items?.[0];
  if (!channel) throw new Error("No YouTube channel found on this Google account");
  return { id: channel.id as string, title: channel.snippet?.title as string };
}

function diskPath(fileUrl: string) {
  return path.join(process.cwd(), "uploads", fileUrl.replace(/^\/api\/files\//, ""));
}

// One upload at a time; status lives in the DB (same pattern as video renders).
const globalForQueue = globalThis as unknown as { ytQueue?: Promise<void> };
globalForQueue.ytQueue ??= Promise.resolve();

export function enqueueYouTubeUpload(packageId: string) {
  globalForQueue.ytQueue = globalForQueue.ytQueue!.then(() =>
    uploadPackage(packageId).catch(() => {})
  );
}

async function uploadPackage(packageId: string) {
  const jobLog = log.child({ packageId, op: "uploadPackage" });
  const pkg = await db.package.findUnique({
    where: { id: packageId },
    include: { beat: true },
  });
  if (!pkg) {
    jobLog.warn("package not found, skipping upload");
    return;
  }

  const startedAt = Date.now();
  jobLog.info({ scheduledAt: pkg.scheduledAt }, "upload started");
  try {
    if (!pkg.videoPath) throw new Error("Render the video first");
    const token = await validAccessToken(pkg.beat.userId);
    const video = await readFile(diskPath(pkg.videoPath));

    const tags = pkg.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 30);
    const metadata = {
      snippet: {
        title: pkg.selectedTitle.slice(0, 100),
        description: pkg.description.slice(0, 4900),
        tags,
        categoryId: "10",
      },
      status: youtubePublishStatus({
        privacyStatus:
          pkg.youtubePrivacyStatus === "public" ||
          pkg.youtubePrivacyStatus === "unlisted"
            ? pkg.youtubePrivacyStatus
            : "private",
        madeForKids: pkg.youtubeMadeForKids,
        scheduledAt: pkg.scheduledAt,
      }),
    };

    const init = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/mp4",
          "X-Upload-Content-Length": String(video.length),
        },
        body: JSON.stringify(metadata),
      }
    );
    if (!init.ok) {
      throw new Error(`Upload init failed (${init.status}): ${(await init.text()).slice(0, 300)}`);
    }
    const location = init.headers.get("location");
    if (!location) throw new Error("YouTube did not return a resumable upload URL");

    const put = await fetch(location, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: new Uint8Array(video),
    });
    if (!put.ok) {
      throw new Error(`Upload failed (${put.status}): ${(await put.text()).slice(0, 300)}`);
    }
    const uploaded = (await put.json()) as { id: string };

    // Custom thumbnail — non-fatal (channels without phone verification can't set them)
    if (pkg.thumbnailPath) {
      try {
        const thumb = await readFile(diskPath(pkg.thumbnailPath));
        await fetch(
          `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${uploaded.id}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/png" },
            body: new Uint8Array(thumb),
          }
        );
      } catch {
        // thumbnail is best-effort
      }
    }

    await db.package.update({
      where: { id: packageId },
      data: {
        uploadStatus: "uploaded",
        youtubeVideoId: uploaded.id,
        uploadError: "",
        status: "scheduled",
      },
    });
    jobLog.info(
      { youtubeVideoId: uploaded.id, durationMs: Date.now() - startedAt },
      "upload done",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    jobLog.error(
      { durationMs: Date.now() - startedAt, err: message },
      "upload failed",
    );
    await db.package.update({
      where: { id: packageId },
      data: {
        uploadStatus: "failed",
        uploadError: message,
      },
    });
  }
}
