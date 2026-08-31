import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import { VIDEO_HEIGHT, VIDEO_WIDTH } from "./video-format";
import { db } from "./db";
import { loggerFor } from "./logger";

const log = loggerFor("video-render");

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
        new Error("Render timed out. The audio may be unusually long — please try again."),
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

function buildArgs(imagePath: string, audioPath: string, outPath: string) {
  return [
    "-y",
    "-loop", "1",
    "-framerate", "2",
    "-i", imagePath,
    "-i", audioPath,
    // Thumbnails are already written at exactly this size, so this is a no-op
    // for new packages; it exists to normalize thumbnails saved before the
    // frame size moved to 1080p rather than fail the encode on odd dimensions.
    "-vf", `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT},setsar=1,format=yuv420p`,
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
// marked "rendering" was orphaned by a previous process exiting. Resume those
// renders rather than failing them: the work is fully repeatable from the stored
// audio and thumbnail, and failing them stranded batch items on "Needs attention"
// for what was only a restart. A render that genuinely cannot succeed still ends
// up failed via the normal path (or the hard timeout), so this cannot loop
// forever across restarts.
if (!globalForQueue.videoRecovered) {
  globalForQueue.videoRecovered = true;
  void resumeOrphanedRenders();
}

async function resumeOrphanedRenders() {
  try {
    const orphaned = await db.package.findMany({
      where: { videoStatus: "rendering" },
      select: { id: true, thumbnailPath: true, beat: { select: { audioPath: true } } },
    });
    if (orphaned.length === 0) return;

    // Missing inputs can never render, so those are the only real failures here.
    const renderable = orphaned.filter((p) => p.thumbnailPath && p.beat.audioPath);
    const unrenderable = orphaned.filter((p) => !p.thumbnailPath || !p.beat.audioPath);

    if (unrenderable.length > 0) {
      await db.package.updateMany({
        where: { id: { in: unrenderable.map((p) => p.id) } },
        data: {
          videoStatus: "failed",
          videoError: "Render was interrupted and the beat is missing its audio or thumbnail.",
        },
      });
    }

    // Batch items stay "rendering" and are reconciled by the batch poll once
    // these land on "done", so the queue continuation survives the restart.
    for (const pkg of renderable) enqueueRender(pkg.id);

    log.warn(
      { resumed: renderable.length, failed: unrenderable.length },
      "resumed orphaned renders on startup",
    );
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : err }, "orphaned render recovery failed");
  }
}

export type QueueResult = { ok: true } | { ok: false; error: string };

export function enqueueRender(
  packageId: string,
  onComplete?: (result: QueueResult) => void | Promise<void>,
) {
  globalForQueue.videoQueue = globalForQueue.videoQueue!.then(async () => {
    const result = await renderVideo(packageId).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : "Render failed",
    }));
    await onComplete?.(result);
  }).catch((err) => {
    log.error({ packageId, err: err instanceof Error ? err.message : err }, "render queue callback failed");
  });
}

async function renderVideo(packageId: string): Promise<QueueResult> {
  const jobLog = log.child({ packageId });
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
      buildArgs(diskPath(pkg.thumbnailPath), diskPath(pkg.beat.audioPath), outPath)
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
