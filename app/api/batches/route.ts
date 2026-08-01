import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlanState, startOfMonth } from "@/lib/billing";
import { nextSlots, parseScheduleDays } from "@/lib/schedule";
import { validateCreateBatchInput } from "@/lib/batch-types";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a batch." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid batch settings." }, { status: 400 });
  }

  const parsed = validateCreateBatchInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const planState = await getPlanState(user);
  if (!planState.isAdmin && planState.planId === "free") {
    return NextResponse.json(
      { error: "Batch uploads are available on Pro and Serious plans." },
      { status: 403 },
    );
  }
  const reserved = planState.isAdmin ? 0 : await db.uploadBatchItem.count({
    where: {
      batch: { userId: user.id },
      packageId: null,
      status: { in: ["pending", "preparing"] },
      createdAt: { gte: startOfMonth() },
    },
  });
  const available = Math.max(0, planState.remaining - reserved);
  if (!planState.isAdmin && parsed.value.items.length > available) {
    return NextResponse.json(
      { error: `This batch needs ${parsed.value.items.length} upload packs, but only ${available} remain this month.` },
      { status: 403 },
    );
  }

  if (parsed.value.autoUpload) {
    const connected = await db.youTubeAccount.findUnique({ where: { userId: user.id } });
    if (!connected) {
      return NextResponse.json(
        { error: "Connect a YouTube channel or turn off automatic YouTube upload." },
        { status: 400 },
      );
    }
  }

  let slots: Date[] = [];
  if (parsed.value.autoSchedule) {
    const existing = await db.package.findMany({
      where: { beat: { userId: user.id }, scheduledAt: { not: null } },
      select: { scheduledAt: true },
    });
    const taken = new Set(existing.flatMap((pkg) => (pkg.scheduledAt ? [pkg.scheduledAt.getTime()] : [])));
    const days = parseScheduleDays(user.profile?.scheduleDays || "1,3,5");
    slots = nextSlots(
      days.length ? days : [1, 3, 5],
      user.profile?.scheduleTime || "18:00",
      parsed.value.items.length,
      taken,
      user.profile?.timezone || "UTC",
    );
  }

  const batch = await db.uploadBatch.create({
    data: {
      userId: user.id,
      videoStyle: parsed.value.videoStyle,
      autoUpload: parsed.value.autoUpload,
      autoSchedule: parsed.value.autoSchedule,
      privacyStatus: parsed.value.privacyStatus,
      madeForKids: parsed.value.madeForKids,
      items: {
        create: parsed.value.items.map((item, position) => ({
          position,
          audioName: item.audioName,
          imageName: item.imageName,
          scheduledAt: slots[position] || null,
        })),
      },
    },
    include: { items: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({
    batchId: batch.id,
    items: batch.items.map((item) => ({ id: item.id, position: item.position })),
  });
}
