import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import { db } from "./db";
import { loggerFor } from "./logger";

const log = loggerFor("video-render");

export type VideoStyle = "static" | "waveform";

/** Resolve a stored "/api/files/..." URL back to its path on disk. */
function diskPath(fileUrl: string) {
  const rel = fileUrl.replace(/^\/api\/files\//, "");
  return path.join(process.cwd(), "uploads", rel);
}

// Hard cap on a single render. A stuck ffmpeg used to hang forever and, because
// renders share one in-process queue, wedge every later render too — leaving the
// UI on "Rendering…" indefinitely. SIGKILL after this so the job fails cleanly.
const RENDER_TIMEOUT_MS = 4 * 60 * 1000;

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as unknown as string, args);
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(
        new Error("Render timed out. The audio may be unusually long — try the static style."),
      );
    }, RENDER_TIMEOUT_MS);
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > 8000) stderr = stderr.slice(-4000);
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-600)}`));
    });
  });
}

function buildArgs(imagePath: string, audioPath: string, outPath: string, style: VideoStyle) {
  if (style === "waveform") {
    return [
      "-y",
      "-loop", "1",
      "-i", imagePath,
      "-i", audioPath,
      "-filter_complex",
      "[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[bg];" +
        "[1:a]showwaves=s=1280x160:mode=line:colors=white@0.75:rate=25[w];" +
        "[bg][w]overlay=0:540:format=auto,format=yuv420p[v]",
      "-map", "[v]",
      "-map", "1:a",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-r", "25",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-fflags", "+shortest",
      "-max_interleave_delta", "100M",
      outPath,
    ];
  }
  return [
    "-y",
    "-loop", "1",
    "-framerate", "2",
    "-i", imagePath,
    "-i", audioPath,
    "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-tune", "stillimage",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    // -shortest alone overshoots with a low-framerate looped image input
    "-fflags", "+shortest",
    "-max_interleave_delta", "100M",
    outPath,
  ];
}

// Simple in-process queue: renders run one at a time, status lives in the DB
// so the UI survives dev-server reloads.
const globalForQueue = globalThis as unknown as {
  videoQueue?: Promise<void>;
  videoRecovered?: boolean;
};
globalForQueue.videoQueue ??= Promise.resolve();

// On a fresh process nothing can legitimately be mid-render, so any package still
// marked "rendering" was orphaned by a previous process exiting (or a hung render
// from before timeouts existed). Reset them once so producers can retry instead of
// being stuck on "Rendering…" forever.
if (!globalForQueue.videoRecovered) {
  globalForQueue.videoRecovered = true;
  db.package
    .updateMany({
      where: { videoStatus: "rendering" },
      data: { videoStatus: "failed", videoError: "Render was interrupted — please try again." },
    })
    .then((r) => {
      if (r.count > 0) log.warn({ count: r.count }, "reset orphaned renders on startup");
    })
    .catch(() => {});
}

export type QueueResult = { ok: true } | { ok: false; error: string };

export function enqueueRender(
  packageId: string,
  style: VideoStyle,
  onComplete?: (result: QueueResult) => void | Promise<void>,
) {
  globalForQueue.videoQueue = globalForQueue.videoQueue!.then(async () => {
    const result = await renderVideo(packageId, style).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : "Render failed",
    }));
    await onComplete?.(result);
  }).catch((err) => {
    log.error({ packageId, err: err instanceof Error ? err.message : err }, "render queue callback failed");
  });
}

async function renderVideo(packageId: string, style: VideoStyle): Promise<QueueResult> {
  const jobLog = log.child({ packageId, style });
  const pkg = await db.package.findUnique({
    where: { id: packageId },
    include: { beat: true },
  });
  if (!pkg) {
    jobLog.warn("package not found, skipping render");
    return { ok: false, error: "Package not found" };
  }

  const startedAt = Date.now();
  jobLog.info("render started");
  try {
    if (!pkg.beat.audioPath) throw new Error("Beat has no audio file");
    if (!pkg.thumbnailPath) throw new Error("Save a thumbnail first");

    const dir = path.join(process.cwd(), "uploads", "videos");
    await mkdir(dir, { recursive: true });
    const outPath = path.join(dir, `${packageId}.mp4`);

    await runFfmpeg(
      buildArgs(diskPath(pkg.thumbnailPath), diskPath(pkg.beat.audioPath), outPath, style)
    );

    await db.package.update({
      where: { id: packageId },
      data: { videoStatus: "done", videoPath: `/api/files/videos/${packageId}.mp4`, videoError: "" },
    });
    jobLog.info({ durationMs: Date.now() - startedAt }, "render done");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    jobLog.error(
      { durationMs: Date.now() - startedAt, err: err instanceof Error ? err.message : err },
      "render failed",
    );
    await db.package.update({
      where: { id: packageId },
      data: { videoStatus: "failed", videoError: message },
    });
    return { ok: false, error: message };
  }
}
