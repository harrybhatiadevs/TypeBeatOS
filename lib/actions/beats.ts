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

const AUDIO_EXTS = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aiff"]);

export async function createBeat(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const targetArtist = String(formData.get("targetArtist") || "").trim();
  if (!name || !targetArtist) redirect("/beats/new?error=Beat+name+and+target+artist+are+required");

  const bpmRaw = String(formData.get("bpm") || "").trim();
  const bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;

  const beat = await db.beat.create({
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

  // Save audio file if provided
  const file = formData.get("audio");
  if (file instanceof File && file.size > 0) {
    const ext = path.extname(file.name).toLowerCase();
    if (AUDIO_EXTS.has(ext)) {
      const dir = path.join(process.cwd(), "uploads", "audio");
      await mkdir(dir, { recursive: true });
      const filename = `${beat.id}${ext}`;
      await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
      await db.beat.update({
        where: { id: beat.id },
        data: { audioPath: `/api/files/audio/${filename}` },
      });
    }
  }

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
