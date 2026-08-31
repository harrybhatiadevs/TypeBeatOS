import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { beatNameFromFilename } from "@/lib/beat-name";
import { refineBeatNames } from "@/lib/generate";

/** Filenames per request — the batch uploader caps a batch well below this. */
const MAX_FILENAMES = 25;
const MAX_FILENAME_LENGTH = 300;

/**
 * Clean uploaded filenames into beat names.
 *
 * The client already shows the deterministic name instantly; this endpoint is
 * the optional AI refinement pass on top. It never fails the caller — on any
 * problem it returns the same deterministic names the client already has, so
 * the upload flow works identically with no AI key configured.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = (body as { filenames?: unknown })?.filenames;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "filenames must be an array" }, { status: 400 });
  }

  const filenames = raw
    .filter((f): f is string => typeof f === "string")
    .slice(0, MAX_FILENAMES)
    .map((f) => f.slice(0, MAX_FILENAME_LENGTH));

  const items = filenames.map((filename) => ({
    filename,
    fallback: beatNameFromFilename(filename),
  }));

  try {
    return NextResponse.json({ names: await refineBeatNames(items) });
  } catch {
    return NextResponse.json({ names: items.map((i) => i.fallback) });
  }
}
