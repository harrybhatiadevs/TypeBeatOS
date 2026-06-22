import { describe, expect, it } from "vitest";
import { sniff } from "./file-magic";

// Small magic-byte fixtures. We only need the first few bytes of each
// format; ffmpeg / image libs handle anything past the sniff window.

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

function withTail(prefix: Uint8Array, tailLen = 32): Uint8Array {
  const out = new Uint8Array(prefix.length + tailLen);
  out.set(prefix, 0);
  return out;
}

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const ID3_MP3 = bytes(0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00); // "ID3" tag
const MPEG_SYNC_MP3 = bytes(0xff, 0xfb, 0x90, 0x44);                   // raw MPEG sync
const FLAC = bytes(0x66, 0x4c, 0x61, 0x43);                            // "fLaC"
const OGG = bytes(0x4f, 0x67, 0x67, 0x53);                             // "OggS"
const WAV = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45);     // "RIFF...WAVE"
const AIFF = bytes(0x46, 0x4f, 0x52, 0x4d, 0, 0, 0, 0, 0x41, 0x49, 0x46, 0x46);    // "FORM...AIFF"
const M4A = bytes(0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20);  // "....ftypM4A "

describe("sniff(audio)", () => {
  it("recognises MP3 with ID3 tag", () => {
    expect(sniff(withTail(ID3_MP3), "audio")).toBe(".mp3");
  });
  it("recognises raw MPEG-sync MP3", () => {
    expect(sniff(withTail(MPEG_SYNC_MP3), "audio")).toBe(".mp3");
  });
  it("recognises WAV", () => {
    expect(sniff(withTail(WAV), "audio")).toBe(".wav");
  });
  it("recognises AIFF", () => {
    expect(sniff(withTail(AIFF), "audio")).toBe(".aiff");
  });
  it("recognises FLAC", () => {
    expect(sniff(withTail(FLAC), "audio")).toBe(".flac");
  });
  it("recognises OGG", () => {
    expect(sniff(withTail(OGG), "audio")).toBe(".ogg");
  });
  it("recognises M4A (ftyp box)", () => {
    expect(sniff(withTail(M4A), "audio")).toBe(".m4a");
  });

  it("rejects an image disguised as audio", () => {
    expect(sniff(withTail(PNG), "audio")).toBeNull();
    expect(sniff(withTail(JPEG), "audio")).toBeNull();
  });

  it("rejects empty / short buffers", () => {
    expect(sniff(new Uint8Array(0), "audio")).toBeNull();
    expect(sniff(bytes(0x49), "audio")).toBeNull();
  });

  it("rejects an ELF binary disguised by extension", () => {
    expect(sniff(withTail(bytes(0x7f, 0x45, 0x4c, 0x46)), "audio")).toBeNull();
  });
});

describe("sniff(image)", () => {
  it("recognises PNG", () => {
    expect(sniff(withTail(PNG, 8), "image")).toBe(".png");
  });
  it("recognises JPEG", () => {
    expect(sniff(withTail(JPEG, 8), "image")).toBe(".jpg");
  });
  it("rejects audio disguised as image", () => {
    expect(sniff(withTail(MPEG_SYNC_MP3), "image")).toBeNull();
    expect(sniff(withTail(WAV), "image")).toBeNull();
  });
  it("rejects a near-PNG (one byte off in the signature)", () => {
    const fake = new Uint8Array(PNG);
    fake[1] = 0x51; // 'Q' instead of 'P'
    expect(sniff(withTail(fake, 8), "image")).toBeNull();
  });
  it("rejects empty buffers", () => {
    expect(sniff(new Uint8Array(0), "image")).toBeNull();
  });
});
