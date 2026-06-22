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
import { sniff } from "@/lib/file-magic";

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

export async function createBeat(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const targetArtist = String(formData.get("targetArtist") || "").trim();
  if (!name || !targetArtist) redirect("/beats/new?error=Beat+name+and+target+artist+are+required");

  const bpmRaw = String(formData.get("bpm") || "").trim();
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

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

  // Save audio and auto-detect BPM/key for blank fields before generating
  const diskPath = await saveAudio(created.id, formData.get("audio"));
  await fillMissingFromAudio(created.id, diskPath);
  const beat = (await db.beat.findUnique({ where: { id: created.id } }))!;

  // Generate the upload package
  const profile = user.profile;
  const titles = [...buildTitleOptions(beat), ...(await aiTitleOptions(beat))];
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

  redirect(`/packages/${pkg.id}`);
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
