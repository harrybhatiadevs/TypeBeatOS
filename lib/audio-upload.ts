export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_AUDIO_LABEL = "50 MB";
export const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.ogg,.flac,.aiff";

export function audioUploadError(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return null;

  if (file.size > MAX_AUDIO_BYTES) {
    return `Audio file is too large. Upload a file under ${MAX_AUDIO_LABEL}.`;
  }

  const lower = file.name.toLowerCase();
  if (!AUDIO_ACCEPT.split(",").some((ext) => lower.endsWith(ext))) {
    return "Unsupported audio file. Use MP3, WAV, M4A, OGG, FLAC, or AIFF.";
  }

  return null;
}
