import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { sniff } from "@/lib/file-magic";

const MAX_BATCH_IMAGE_BYTES = 8 * 1024 * 1024;

/** Save the browser-normalized 1280×720 PNG as this package's thumbnail. */
export async function saveBatchThumbnail(packageId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image for this beat.");
  }
  if (file.size > MAX_BATCH_IMAGE_BYTES) {
    throw new Error("Prepared thumbnail is too large (maximum 8 MB).");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (sniff(bytes.subarray(0, 16), "image") !== ".png") {
    throw new Error("Prepared thumbnail must be a PNG.");
  }

  const dir = path.join(process.cwd(), "uploads", "thumbs");
  await mkdir(dir, { recursive: true });
  const filename = `${packageId}.png`;
  await writeFile(path.join(dir, filename), Buffer.from(bytes));
  const thumbnailPath = `/api/files/thumbs/${filename}`;

  await db.package.update({
    where: { id: packageId },
    data: {
      thumbnailPath,
      thumbnailConfig: JSON.stringify({ source: "batch-import" }),
    },
  });

  return thumbnailPath;
}
