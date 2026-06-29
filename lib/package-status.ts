/**
 * The status to show for a package. A finished YouTube upload outcome
 * ("uploaded" / "failed", and the in-flight "uploading") takes precedence over
 * the workflow status (draft / ready / scheduled), so producers can see at a
 * glance whether a beat actually made it to YouTube.
 *
 * Drives the `badge-<status>` class — keep names in sync with app-chrome.css.
 */
export function effectiveStatus(pkg: {
  status: string;
  uploadStatus?: string | null;
}): string {
  if (pkg.uploadStatus === "uploaded") return "uploaded";
  if (pkg.uploadStatus === "failed") return "failed";
  if (pkg.uploadStatus === "uploading") return "uploading";
  return pkg.status;
}
