/**
 * Tiny magic-byte sniffer for the file kinds we accept.
 * Trust this, not the client-supplied filename extension or Content-Type.
 *
 * We only need to recognise audio that ffmpeg can decode and image formats
 * the thumbnail builder produces, so the catalog is intentionally small.
 *
 * Returns the canonical extension (".mp3", ".png", ...) the file actually is,
 * or null when nothing matches.
 */
export type SniffKind = "audio" | "image";

const AUDIO_RULES: { ext: string; match: (b: Uint8Array) => boolean }[] = [
  { ext: ".mp3", match: (b) => b.length >= 3 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33 }, // "ID3"
  { ext: ".mp3", match: (b) => b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0 }, // MPEG sync
  { ext: ".wav", match: (b) => prefix(b, "RIFF") && b.length >= 12 && view(b, 8, 4) === "WAVE" },
  { ext: ".aiff", match: (b) => prefix(b, "FORM") && b.length >= 12 && (view(b, 8, 4) === "AIFF" || view(b, 8, 4) === "AIFC") },
  { ext: ".flac", match: (b) => prefix(b, "fLaC") },
  { ext: ".ogg", match: (b) => prefix(b, "OggS") },
  { ext: ".m4a", match: (b) => b.length >= 12 && view(b, 4, 4) === "ftyp" }, // M4A / MP4 audio (ftyp box)
];

const IMAGE_RULES: { ext: string; match: (b: Uint8Array) => boolean }[] = [
  { ext: ".png", match: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { ext: ".jpg", match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
];

function prefix(b: Uint8Array, s: string): boolean {
  if (b.length < s.length) return false;
  for (let i = 0; i < s.length; i++) if (b[i] !== s.charCodeAt(i)) return false;
  return true;
}

function view(b: Uint8Array, offset: number, len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += String.fromCharCode(b[offset + i]);
  return out;
}

export function sniff(bytes: Uint8Array, kind: SniffKind): string | null {
  const rules = kind === "audio" ? AUDIO_RULES : IMAGE_RULES;
  for (const r of rules) if (r.match(bytes)) return r.ext;
  return null;
}
