import { describe, expect, it } from "vitest";
import { audioUploadError, MAX_AUDIO_BYTES } from "./audio-upload";

describe("audioUploadError", () => {
  it("accepts supported audio under the size limit", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "beat.mp3");
    expect(audioUploadError(file)).toBeNull();
  });

  it("rejects unsupported extensions", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "cover.png");
    expect(audioUploadError(file)).toContain("Unsupported audio file");
  });

  it("rejects files over the upload limit", () => {
    const file = { name: "beat.wav", size: MAX_AUDIO_BYTES + 1 } as File;
    expect(audioUploadError(file)).toContain("too large");
  });
});
