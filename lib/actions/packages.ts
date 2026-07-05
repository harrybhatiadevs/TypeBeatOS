"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nextSlots, parseScheduleDays } from "@/lib/schedule";
import { sniff } from "@/lib/file-magic";
import { getTemplateAllowance } from "@/lib/billing";
import { aiConfigured, aiGenerateTemplate } from "@/lib/generate";
import type { PlanId } from "@/lib/plans";

export type PackageTemplate = {
  id: string;
  name: string;
  title: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
};

type TemplateInput = {
  name: string;
  title: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
};

async function ownedPackage(id: string, userId: string) {
  const pkg = await db.package.findUnique({ where: { id }, include: { beat: true } });
  if (!pkg || pkg.beat.userId !== userId) throw new Error("Package not found");
  return pkg;
}

function cleanTemplateInput(input: TemplateInput) {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Template name is required");
  if (name.length > 80) throw new Error("Template name must be 80 characters or less");

  return {
    name,
    title: input.title.trim(),
    description: input.description.trim(),
    tags: input.tags.trim(),
    hashtags: input.hashtags.trim(),
    pinnedComment: input.pinnedComment.trim(),
  };
}

function templateFilePath(userId: string) {
  return path.join(process.cwd(), "uploads", "templates", `${encodeURIComponent(userId)}.json`);
}

async function readTemplateList(userId: string): Promise<PackageTemplate[]> {
  try {
    const raw = await readFile(templateFilePath(userId), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((template): template is PackageTemplate => {
      return (
        template &&
        typeof template.id === "string" &&
        typeof template.name === "string" &&
        typeof template.title === "string" &&
        typeof template.description === "string" &&
        typeof template.tags === "string" &&
        typeof template.hashtags === "string" &&
        typeof template.pinnedComment === "string"
      );
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function writeTemplateList(userId: string, templates: PackageTemplate[]) {
  const filePath = templateFilePath(userId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(templates, null, 2), "utf8");
}

export async function getPackageTemplates(): Promise<PackageTemplate[]> {
  const user = await requireUser();
  return readTemplateList(user.id);
}

export type TemplateState = {
  templates: PackageTemplate[];
  planId: PlanId;
  /** Max templates for this plan (Infinity = unlimited). */
  limit: number;
  /** Whether AI template generation is available (an Anthropic key is set). */
  aiEnabled: boolean;
};

/** Templates plus the current plan's allowance, for gating the create UI. */
export async function getTemplateState(): Promise<TemplateState> {
  const user = await requireUser();
  const [templates, allowance] = await Promise.all([
    readTemplateList(user.id),
    getTemplateAllowance(user),
  ]);
  return { templates, planId: allowance.planId, limit: allowance.limit, aiEnabled: aiConfigured() };
}

/**
 * AI-draft a reusable SEO template from a short brief. Fills the editor form;
 * the producer reviews and Saves it (which enforces the plan cap). Gated to
 * plans that can save templates at all.
 */
export async function generateTemplateDraft(input: { brief: string }): Promise<PackageTemplate> {
  const user = await requireUser();

  const { limit } = await getTemplateAllowance(user);
  if (limit === 0) {
    throw new Error("Saved templates are a Pro feature — upgrade to use AI generation.");
  }
  if (!aiConfigured()) {
    throw new Error("AI generation isn't set up yet — an ANTHROPIC_API_KEY is required.");
  }
  const brief = input.brief.trim();
  if (!brief) {
    throw new Error('Describe the lane or vibe first — e.g. "Drake x Latin trap, dark melodic".');
  }

  const result = await aiGenerateTemplate(brief);
  if (!result) {
    throw new Error("Couldn't generate a template right now. Try again in a moment.");
  }
  // Shape matches PackageTemplate minus the id; the client uses it as a draft.
  return { id: "", ...result };
}

function revalidateTemplateSurfaces(packageId?: string) {
  revalidatePath("/profile");
  if (packageId) revalidatePath(`/packages/${packageId}`);
}

export async function createPackageTemplate(input: TemplateInput & { packageId?: string }) {
  const user = await requireUser();
  if (input.packageId) await ownedPackage(input.packageId, user.id);

  const cleaned = cleanTemplateInput(input);
  const templates = await readTemplateList(user.id);

  const { limit } = await getTemplateAllowance(user);
  if (templates.length >= limit) {
    throw new Error(
      limit === 0
        ? "Saved templates are a Pro feature — upgrade to save reusable upload templates."
        : `You've reached your plan's ${limit}-template limit. Delete one or upgrade for more.`,
    );
  }

  if (templates.some((template) => template.name.toLowerCase() === cleaned.name.toLowerCase())) {
    throw new Error("A template with that name already exists");
  }

  const template: PackageTemplate = { id: randomUUID(), ...cleaned };
  await writeTemplateList(user.id, [template, ...templates]);

  revalidateTemplateSurfaces(input.packageId);
  return template;
}

export async function updatePackageTemplate(input: TemplateInput & { templateId: string; packageId?: string }) {
  const user = await requireUser();
  if (input.packageId) await ownedPackage(input.packageId, user.id);

  const cleaned = cleanTemplateInput(input);
  const templates = await readTemplateList(user.id);
  const index = templates.findIndex((template) => template.id === input.templateId);
  if (index === -1) throw new Error("Template not found");
  if (
    templates.some(
      (template) =>
        template.id !== input.templateId &&
        template.name.toLowerCase() === cleaned.name.toLowerCase()
    )
  ) {
    throw new Error("A template with that name already exists");
  }

  const template: PackageTemplate = { id: input.templateId, ...cleaned };
  const next = [...templates];
  next[index] = template;
  await writeTemplateList(user.id, next);

  revalidateTemplateSurfaces(input.packageId);
  return template;
}

export async function deletePackageTemplate(input: { packageId?: string; templateId: string }) {
  const user = await requireUser();
  if (input.packageId) await ownedPackage(input.packageId, user.id);

  const templates = await readTemplateList(user.id);
  await writeTemplateList(
    user.id,
    templates.filter((template) => template.id !== input.templateId)
  );

  revalidateTemplateSurfaces(input.packageId);
}

export async function updatePackage(input: {
  id: string;
  selectedTitle: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
  scheduledAt: string; // absolute UTC ISO string (converted client-side) or ""
  status: string;
}) {
  const user = await requireUser();
  await ownedPackage(input.id, user.id);

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;

  await db.package.update({
    where: { id: input.id },
    data: {
      selectedTitle: input.selectedTitle,
      description: input.description,
      tags: input.tags,
      hashtags: input.hashtags,
      pinnedComment: input.pinnedComment,
      scheduledAt,
      status: scheduledAt ? "scheduled" : input.status === "ready" ? "ready" : "draft",
    },
  });

  revalidatePath(`/packages/${input.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

const MAX_THUMB_BYTES = 8 * 1024 * 1024; // 8 MB

export async function saveThumbnail(formData: FormData) {
  const user = await requireUser();
  const packageId = String(formData.get("packageId") || "");
  await ownedPackage(packageId, user.id);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Invalid image data");
  if (file.size > MAX_THUMB_BYTES) throw new Error("Thumbnail too large (max 8 MB)");

  // Trust the bytes, not the Content-Type header.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes.subarray(0, 16), "image");
  if (ext !== ".png") throw new Error("Thumbnail must be a PNG");

  const dir = path.join(process.cwd(), "uploads", "thumbs");
  await mkdir(dir, { recursive: true });
  const filename = `${packageId}.png`;
  await writeFile(path.join(dir, filename), Buffer.from(bytes));

  const thumbnailPath = `/api/files/thumbs/${filename}`;

  let config: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(String(formData.get("config") || "{}"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      config = parsed as Record<string, unknown>;
    }
  } catch {
    config = {};
  }

  const bg = formData.get("bg");
  if (bg instanceof File && bg.size > 0) {
    if (bg.size > MAX_THUMB_BYTES) throw new Error("Background too large (max 8 MB)");
    const bgBytes = new Uint8Array(await bg.arrayBuffer());
    const bgExt = sniff(bgBytes.subarray(0, 16), "image");
    if (![".png", ".jpg", ".jpeg"].includes(bgExt || "")) {
      throw new Error("Background must be PNG or JPEG");
    }
    const bgName = `${packageId}-bg${bgExt === ".jpeg" ? ".jpg" : bgExt}`;
    await writeFile(path.join(dir, bgName), Buffer.from(bgBytes));
    config.bgPath = `/api/files/thumbs/${bgName}`;
  }

  await db.package.update({
    where: { id: packageId },
    data: { thumbnailPath, thumbnailConfig: JSON.stringify(config) },
  });

  revalidatePath(`/packages/${packageId}`);
  return thumbnailPath;
}

export async function autoScheduleQueue(formData?: FormData) {
  const user = await requireUser();
  const profile = user.profile;
  // Posting times land in the producer's local time, not the server's UTC.
  // The timezone they picked in their profile wins; if unset, fall back to the
  // browser's detected zone (sent as a hidden field), then UTC.
  const timeZone = profile?.timezone || String(formData?.get("timeZone") || "") || "UTC";

  const unscheduled = await db.package.findMany({
    where: { beat: { userId: user.id }, scheduledAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (unscheduled.length === 0) return;

  const existing = await db.package.findMany({
    where: { beat: { userId: user.id }, scheduledAt: { not: null } },
    select: { scheduledAt: true },
  });
  const taken = new Set(existing.map((p) => p.scheduledAt!.getTime()));

  const days = parseScheduleDays(profile?.scheduleDays || "1,3,5");
  const slots = nextSlots(days.length ? days : [1, 3, 5], profile?.scheduleTime || "18:00", unscheduled.length, taken, timeZone);

  await Promise.all(
    unscheduled.map((pkg, i) =>
      slots[i]
        ? db.package.update({
            where: { id: pkg.id },
            data: { scheduledAt: slots[i], status: "scheduled" },
          })
        : Promise.resolve()
    )
  );

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
