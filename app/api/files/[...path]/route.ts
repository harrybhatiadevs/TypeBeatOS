import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aiff": "audio/aiff",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;
  const uploadsDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsDir, ...parts);

  // Prevent path traversal
  if (!filePath.startsWith(uploadsDir + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": type } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
