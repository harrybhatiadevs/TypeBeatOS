import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import {
  aiTitleOptions,
  buildDescription,
  buildHashtags,
  buildPinnedComment,
  buildPackageTitleOptions,
  buildTags,
} from "@/lib/generate";
import { analyzeAudio } from "@/lib/audio-analysis";
import { sniff } from "@/lib/file-magic";
import { loggerFor } from "@/lib/logger";

const log = loggerFor("beats");

/** Resolve with `fallback` if `p` doesn't settle within `ms` — never blocks generation. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50 MB

/** Save the uploaded audio for a beat; returns the saved path on disk, or null. */
async function saveAudio(beatId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_AUDIO_BYTES) return null;

  // Trust the actual bytes, not the supplied filename extension.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes.subarray(0, 64), "audio");
  if (!ext) return null;

  const dir = path.join(process.cwd(), "uploads", "audio");
  await mkdir(dir, { recursive: true });
  const filename = `${beatId}${ext}`;
  const diskPath = path.join(dir, filename);
  await writeFile(diskPath, Buffer.from(bytes));
  await db.beat.update({
    where: { id: beatId },
    data: { audioPath: `/api/files/audio/${filename}` },
  });
  return diskPath;
}

/** Auto-detect BPM/key from audio for any field the producer left blank. */
async function fillMissingFromAudio(beatId: string, diskPath: string | null): Promise<boolean> {
  if (!diskPath) return false;
  const beat = await db.beat.findUnique({ where: { id: beatId } });
  if (!beat || (beat.bpm && beat.key)) return false;
  const detected = await analyzeAudio(diskPath);
  const data: { bpm?: number; key?: string } = {};
  if (!beat.bpm && detected.bpm) data.bpm = detected.bpm;
  if (!beat.key && detected.key) data.key = detected.key;
  if (Object.keys(data).length > 0) {
    await db.beat.update({ where: { id: beatId }, data });
    return true;
  }
  return false;
}

async function refreshGeneratedPackageFields(beatId: string, profile: Parameters<typeof buildDescription>[1]) {
  const pkg = await db.package.findFirst({ where: { beatId }, include: { beat: true } });
  if (!pkg) return;
  await db.package.update({
    where: { id: pkg.id },
    data: {
      description: buildDescription(pkg.beat, profile, pkg.selectedTitle),
      tags: buildTags(pkg.beat),
      hashtags: buildHashtags(pkg.beat),
      pinnedComment: buildPinnedComment(pkg.beat, profile),
    },
  });
}

function analyzeAudioInBackground(
  beatId: string,
  diskPath: string | null,
  profile: Parameters<typeof buildDescription>[1],
) {
  if (!diskPath) return;
  fillMissingFromAudio(beatId, diskPath)
    .then(async (changed) => {
      if (changed) await refreshGeneratedPackageFields(beatId, profile);
      log.info({ beatId, changed }, "createBeat: background audio analysis done");
    })
    .catch((err) =>
      log.warn(
        { beatId, err: err instanceof Error ? err.message : err },
        "createBeat: background audio analysis failed",
      ),
    );
}

type ProfileUser = { id: string; profile: unknown };

export type CreateBeatResult = { packageId: string } | { error: string };
export type UpdateBeatResult = { ok: true } | { error: string };

/**
 * Update an existing beat's metadata (and optionally replace its audio), shared
 * by the `/api/beats/[id]` route handler. Audio goes through a route handler for
 * the same reason as create — Server Actions fail on file uploads here.
 */
export async function updateBeatFromForm(
  user: { id: string },
  beatId: string,
  formData: FormData,
): Promise<UpdateBeatResult> {
  const id = beatId.trim();
  const name = String(formData.get("name") || "").trim();
  const targetArtist = String(formData.get("targetArtist") || "").trim();
  if (!id) return { error: "Missing beat id." };
  if (!name || !targetArtist) {
    return { error: "Beat name and target artist are required." };
  }

  const existing = await db.beat.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "Beat not found." };

  const bpmRaw = String(formData.get("bpm") || "").trim();
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

  try {
    await db.beat.update({
      where: { id: existing.id },
      data: {
        name,
        targetArtist,
        secondaryArtist: String(formData.get("secondaryArtist") || "").trim(),
        genre: String(formData.get("genre") || "").trim(),
        mood: String(formData.get("mood") || "").trim(),
        bpm: bpm && !isNaN(bpm) ? bpm : null,
        key: String(formData.get("key") || "").trim(),
        storeLink: String(formData.get("storeLink") || "").trim(),
        licensePrice: String(formData.get("licensePrice") || "").trim(),
        exclusivePrice: String(formData.get("exclusivePrice") || "").trim(),
      },
    });

    const diskPath = await saveAudio(existing.id, formData.get("audio")).catch(() => null);
    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    analyzeAudioInBackground(existing.id, diskPath, profile);
    return { ok: true };
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : err }, "updateBeat: failed");
    return { error: "Could not save the beat. Try again, or use a smaller audio file." };
  }
}

/**
 * Core beat → package generation, shared by the `/api/beats` route handler
 * (the path real browsers use for the audio upload) and any server action.
 *
 * Kept framework-agnostic — takes the authed user + the submitted FormData,
 * returns the new package id or a user-facing error. Audio files are uploaded
 * via the route handler (a plain multipart POST) because Next's Server Action
 * "flight" decoder drops/fails file blobs in this standalone deployment.
 */
export async function createBeatPackage(
  user: ProfileUser,
  formData: FormData,
  options: { fast?: boolean } = {},
): Promise<CreateBeatResult> {
  const name = String(formData.get("name") || "").trim();
  const targetArtist = String(formData.get("targetArtist") || "").trim();
  if (!name || !targetArtist) {
    return { error: "Beat name and target artist are required." };
  }

  const bpmRaw = String(formData.get("bpm") || "").trim();
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

  const t0 = Date.now();
  try {
    const created = await db.beat.create({
      data: {
        userId: user.id,
        name,
        targetArtist,
        secondaryArtist: String(formData.get("secondaryArtist") || "").trim(),
        genre: String(formData.get("genre") || "").trim(),
        mood: String(formData.get("mood") || "").trim(),
        bpm: bpm && !isNaN(bpm) ? bpm : null,
        key: String(formData.get("key") || "").trim(),
        storeLink: String(formData.get("storeLink") || "").trim(),
        licensePrice: String(formData.get("licensePrice") || "").trim(),
        exclusivePrice: String(formData.get("exclusivePrice") || "").trim(),
      },
    });
    log.info({ beatId: created.id, ms: Date.now() - t0 }, "createBeat: beat created");

    // Save audio + auto-detect BPM/key. Best-effort and time-bounded so a slow
    // Azure Files write can't block generation. Analysis runs after the response.
    const diskPath = await withTimeout(
      saveAudio(created.id, formData.get("audio")).catch((err) => {
        log.warn(
          { beatId: created.id, err: err instanceof Error ? err.message : err },
          "createBeat: audio save failed",
        );
        return null;
      }),
      30000,
      null,
    );
    log.info(
      { beatId: created.id, hasAudio: !!diskPath, ms: Date.now() - t0 },
      "createBeat: audio saved",
    );
    const profile = user.profile as Parameters<typeof buildDescription>[1];
    const analysisPromise = diskPath
      ? fillMissingFromAudio(created.id, diskPath).catch((err) => {
          log.warn(
            { beatId: created.id, err: err instanceof Error ? err.message : err },
            "createBeat: audio analysis failed",
          );
          return false;
        })
      : Promise.resolve(false);
    const analysisChanged = options.fast
      ? false
      : await withTimeout(analysisPromise, 8000, false);
    log.info(
      { beatId: created.id, changed: analysisChanged, ms: Date.now() - t0 },
      "createBeat: audio analysis ready",
    );

    const beat = (await db.beat.findUnique({ where: { id: created.id } }))!;

    const ai = options.fast ? [] : await withTimeout(aiTitleOptions(beat), 3000, []);
    log.info({ beatId: created.id, aiTitles: ai.length, ms: Date.now() - t0 }, "createBeat: titles ready");
    const titles = buildPackageTitleOptions(beat, ai);
    const selectedTitle = titles[0];

    const pkg = await db.package.create({
      data: {
        beatId: beat.id,
        titleOptions: JSON.stringify(titles),
        selectedTitle,
        description: buildDescription(beat, profile, selectedTitle),
        tags: buildTags(beat),
        hashtags: buildHashtags(beat),
        pinnedComment: buildPinnedComment(beat, profile),
      },
    });
    if (options.fast) {
      analysisPromise
        .then(async (changed) => {
          if (changed) await refreshGeneratedPackageFields(created.id, profile);
        })
        .catch(() => undefined);
    } else {
      analysisPromise.catch(() => undefined);
    }
    log.info({ beatId: created.id, packageId: pkg.id, totalMs: Date.now() - t0 }, "createBeat: done");
    return { packageId: pkg.id };
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err },
      "createBeat: package generation failed",
    );
    return { error: "Could not generate the upload package. Try again, or use a smaller audio file." };
  }
}
