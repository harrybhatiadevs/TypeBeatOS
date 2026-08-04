import "server-only";

import { db } from "@/lib/db";
import { enqueueRender } from "@/lib/video";
import { enqueueYouTubeUpload } from "@/lib/youtube";
import { TERMINAL_BATCH_ITEM_STATUSES } from "@/lib/batch-types";
import { loggerFor } from "@/lib/logger";

const log = loggerFor("batch-pipeline");

export async function refreshBatchStatus(batchId: string) {
  const items = await db.uploadBatchItem.findMany({
    where: { batchId },
    select: { status: true },
  });
  if (items.length === 0) return;

  const allFinished = items.every((item) => TERMINAL_BATCH_ITEM_STATUSES.has(item.status));
  const hasFailure = items.some((item) => item.status === "failed");
  const status = allFinished ? (hasFailure ? "partial_failure" : "completed") : "processing";
  await db.uploadBatch.update({ where: { id: batchId }, data: { status } });
}

async function finishItem(
  itemId: string,
  batchId: string,
  status: "completed" | "ready" | "failed",
  error = "",
) {
  await db.uploadBatchItem.update({ where: { id: itemId }, data: { status, error } });
  await refreshBatchStatus(batchId);
}

async function startYouTubeUpload(input: {
  itemId: string;
  batchId: string;
  packageId: string;
}) {
  const claimed = await db.uploadBatchItem.updateMany({
    where: { id: input.itemId, status: "rendering" },
    data: { status: "uploading_youtube", error: "" },
  });
  if (claimed.count === 0) return;

  await db.package.update({
    where: { id: input.packageId },
    data: { uploadStatus: "uploading", uploadError: "" },
  });

  enqueueYouTubeUpload(input.packageId, async (result) => {
    if (result.ok) {
      await finishItem(input.itemId, input.batchId, "completed");
    } else {
      await finishItem(input.itemId, input.batchId, "failed", result.error);
    }
  });
}
export async function startBatchPipeline(input: {
  itemId: string;
  batchId: string;
  packageId: string;
  autoUpload: boolean;
}) {
  const claimed = await db.uploadBatchItem.updateMany({
    where: { id: input.itemId, status: { in: ["pending", "preparing"] } },
    data: { status: "rendering", error: "" },
  });
  if (claimed.count === 0) return;

  await db.package.update({
    where: { id: input.packageId },
    data: { videoStatus: "rendering", videoError: "" },
  });
  await refreshBatchStatus(input.batchId);

  enqueueRender(input.packageId, async (result) => {
    if (!result.ok) {
      await finishItem(input.itemId, input.batchId, "failed", result.error);
      return;
    }
    if (!input.autoUpload) {
      await finishItem(input.itemId, input.batchId, "ready");
      return;
    }
    await startYouTubeUpload(input);
  });
}

/**
 * Reconcile work after a process restart. The normal path advances via queue
 * callbacks; this path lets polling repair the persisted state safely.
 */
export async function reconcileBatch(batchId: string) {
  const batch = await db.uploadBatch.findUnique({
    where: { id: batchId },
    include: { items: { include: { package: true } } },
  });
  if (!batch) return;

  for (const item of batch.items) {
    const pkg = item.package;
    if (!pkg) continue;

    if (item.status === "rendering" && pkg.videoStatus === "failed") {
      await finishItem(item.id, batch.id, "failed", pkg.videoError || "Video render failed.");
    } else if (item.status === "rendering" && pkg.videoStatus === "done") {
      if (batch.autoUpload) {
        await startYouTubeUpload({ itemId: item.id, batchId: batch.id, packageId: pkg.id });
      } else {
        await finishItem(item.id, batch.id, "ready");
      }
    } else if (item.status === "uploading_youtube" && pkg.uploadStatus === "uploaded") {
      await finishItem(item.id, batch.id, "completed");
    } else if (item.status === "uploading_youtube" && pkg.uploadStatus === "failed") {
      await finishItem(item.id, batch.id, "failed", pkg.uploadError || "YouTube upload failed.");
    }
  }

  await refreshBatchStatus(batchId).catch((err) => {
    log.warn({ batchId, err: err instanceof Error ? err.message : err }, "batch status refresh failed");
  });
}
