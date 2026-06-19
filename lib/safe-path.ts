import path from "path";

/**
 * Resolve `segments` under `rootDir` and return the absolute path
 * only if the result is genuinely inside `rootDir`. Returns null if:
 *   - the segment list is empty,
 *   - any segment is empty / contains "/" / "\\" / null byte / `..`,
 *   - the resolved path escapes rootDir.
 *
 * Belt-and-braces: Next.js already URL-decodes catch-all params, but we
 * still reject explicit `..` segments and slashes inside one segment as a
 * defence-in-depth measure against future framework changes.
 */
export function safeResolveUnder(rootDir: string, segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const seg of segments) {
    if (
      typeof seg !== "string" ||
      seg === "" ||
      seg === "." ||
      seg === ".." ||
      seg.includes("/") ||
      seg.includes("\\") ||
      seg.includes("\0")
    ) {
      return null;
    }
  }
  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, ...segments);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}
