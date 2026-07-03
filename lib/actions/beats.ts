"use server";

import { redirect } from "next/navigation";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  aiTitleOptions,
  buildDescription,
  buildHashtags,
  buildPinnedComment,
  buildTags,
  buildTitleOptions,
} from "@/lib/generate";
import { analyzeAudio } from "@/lib/audio-analysis";
import { MAX_AUDIO_BYTES } from "@/lib/audio-upload";
import { sniff } from "@/lib/file-magic";
import { loggerFor } from "@/lib/logger";

const log = loggerFor("beats");

/** Resolve with `fallback` if `p` doesn't settle within `ms` — never blocks generation. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  const safe = p.catch(() => fallback);
  return Promise.race([
    safe,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export type CreateBeatState = {
  error?: string;
};

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
async function fillMissingFromAudio(beatId: string, diskPath: string | null) {
  if (!diskPath) return;
  const beat = await db.beat.findUnique({ where: { id: beatId } });
  if (!beat || (beat.bpm && beat.key)) return;
  const detected = await analyzeAudio(diskPath);
  const data: { bpm?: number; key?: string } = {};
  if (!beat.bpm && detected.bpm) data.bpm = detected.bpm;
  if (!beat.key && detected.key) data.key = detected.key;
  if (Object.keys(data).length > 0) {
    await db.beat.update({ where: { id: beatId }, data });
  }
}

function analyzeAudioInBackground(beatId: string, diskPath: string | null) {
  if (!diskPath) return;

  fillMissingFromAudio(beatId, diskPath)
    .then(() => {
      log.info({ beatId }, "createBeat: background audio analysis done");
    })
    .catch((err) => {
      log.warn(
        { beatId, err: err instanceof Error ? err.message : err },
        "createBeat: background audio analysis failed",
      );
    });
}

export async function createBeat(
  stateOrFormData: CreateBeatState | FormData,
  maybeFormData?: FormData,
): Promise<CreateBeatState> {
  const user = await requireUser();
  const formData = maybeFormData ?? (stateOrFormData instanceof FormData ? stateOrFormData : null);
  if (!formData) {
    return { error: "Could not read the beat details. Reload the page and try again." };
  }

  const name = String(formData.get("name") || "").trim();
  const targetArtist = String(formData.get("targetArtist") || "").trim();
  if (!name || !targetArtist) {
    return { error: "Beat name and target artist are required." };
  }

  const bpmRaw = String(formData.get("bpm") || "").trim();
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

  const t0 = Date.now();
  let packageId: string | null = null;

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

    // Save audio + auto-detect BPM/key. Both are best-effort and time-bounded so
    // a slow Azure Files write or stuck analysis can never block generation. Audio
    // analysis runs after redirect; the package itself should land quickly.
    const audioPromise = saveAudio(created.id, formData.get("audio"))
      .then((diskPath) => {
        analyzeAudioInBackground(created.id, diskPath);
        return diskPath;
      })
      .catch((err) => {
        log.warn(
          { beatId: created.id, err: err instanceof Error ? err.message : err },
          "createBeat: audio save failed",
        );
        return null;
      });
    const diskPath = await withTimeout(audioPromise, 10000, null);
    log.info({ beatId: created.id, hasAudio: !!diskPath, ms: Date.now() - t0 }, "createBeat: audio saved");

    const beat = (await db.beat.findUnique({ where: { id: created.id } }))!;

    // AI titles are optional and must never make the producer wait long.
    const profile = user.profile;
    const ai = await withTimeout(aiTitleOptions(beat), 3000, []);
    log.info({ beatId: created.id, aiTitles: ai.length, ms: Date.now() - t0 }, "createBeat: titles ready");
    const titles = [...buildTitleOptions(beat), ...ai];
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
    packageId = pkg.id;
    log.info({ beatId: created.id, packageId, totalMs: Date.now() - t0 }, "createBeat: done, redirecting");
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err },
      "createBeat: package generation failed",
    );
    return { error: "Could not generate the upload package. Try again, or use a smaller audio file." };
  }

  if (!packageId) {
    return { error: "Could not generate the upload package. Try again." };
  }

  redirect(`/packages/${packageId}`);
}

export async function deleteBeat(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  await db.beat.deleteMany({ where: { id, userId: user.id } });
  redirect("/beats");
}

export async function updateBeat(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const targetArtist = String(formData.get("targetArtist") || "").trim();

  if (!id) redirect("/beats");
  if (!name || !targetArtist) {
    redirect(`/beats/${id}/edit?error=Beat+name+and+target+artist+are+required`);
  }

  const existingBeat = await db.beat.findFirst({ where: { id, userId: user.id } });
  if (!existingBeat) redirect("/beats");

  const bpmRaw = String(formData.get("bpm") || "").trim();
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

  await db.beat.update({
    where: { id: existingBeat.id },
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

  const diskPath = await saveAudio(existingBeat.id, formData.get("audio"));
  await fillMissingFromAudio(existingBeat.id, diskPath);

  redirect("/beats");
}
