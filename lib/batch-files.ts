const EXTENSION = /\.[^.]+$/;

/** Convert an uploaded filename into an editable beat name. */
export function beatNameFromFilename(filename: string): string {
  const base = filename.replace(EXTENSION, "").trim();
  return base
    .replace(/[_]+/g, " ")
    .replace(/(?:\s*-\s*|\s+)(?:final|master(?:ed)?|mix(?:down)?|v\d+)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Comparable stem used for the initial audio/image pairing. */
export function normalizedFileStem(filename: string): string {
  return beatNameFromFilename(filename)
    .toLowerCase()
    .replace(/\b(?:cover|art|artwork|thumbnail|thumb)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Pair each audio file with the most similar unused image. Exact normalized
 * stems win; remaining files retain their selected order.
 */
export function pairFileNames(audioNames: string[], imageNames: string[]): number[] {
  const available = new Set(imageNames.map((_, index) => index));
  const pairs = audioNames.map(() => -1);

  audioNames.forEach((audioName, audioIndex) => {
    const stem = normalizedFileStem(audioName);
    const exact = imageNames.findIndex(
      (imageName, imageIndex) => available.has(imageIndex) && normalizedFileStem(imageName) === stem,
    );
    if (exact >= 0) {
      pairs[audioIndex] = exact;
      available.delete(exact);
    }
  });

  pairs.forEach((selected, audioIndex) => {
    if (selected >= 0) return;
    const fallback = available.has(audioIndex) ? audioIndex : (available.values().next().value ?? -1);
    pairs[audioIndex] = fallback;
    if (fallback >= 0) available.delete(fallback);
  });

  return pairs;
}
