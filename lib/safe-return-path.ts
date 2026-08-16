const SAFE_BASE = "https://typebeatos.invalid";

/**
 * Accept only same-origin application paths. URL treats backslashes like
 * slashes for special schemes, so checking the resolved origin also blocks
 * values such as `/\example.com`.
 */
export function safeReturnPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/")) return fallback;

  try {
    const resolved = new URL(value, SAFE_BASE);
    if (resolved.origin !== SAFE_BASE) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
