import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeAudio } from "./audio-analysis";

describe("audio analysis worker", () => {
  it("detects a click track while keeping the main thread responsive", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "tbos-analysis-"));
    const sampleRate = 44100;
    const samples = sampleRate * 12;
    const wav = Buffer.alloc(44 + samples * 2);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(samples * 2, 40);
    for (let i = 0; i < samples; i++) {
      const phase = i % (sampleRate / 2);
      const amplitude = Math.exp(-phase / 500) * Math.sin(2 * Math.PI * 220 * i / sampleRate);
      wav.writeInt16LE(Math.round(amplitude * 24000), 44 + i * 2);
    }
    const file = path.join(directory, "click-track.wav");
    await writeFile(file, wav);
    let ticks = 0;
    let longestGap = 0;
    let previous = performance.now();
    const heartbeat = setInterval(() => {
      const now = performance.now();
      longestGap = Math.max(longestGap, now - previous);
      previous = now;
      ticks++;
    }, 10);
    try {
      const result = await analyzeAudio(file);
      longestGap = Math.max(longestGap, performance.now() - previous);
      expect(result.bpm).toBeGreaterThanOrEqual(118);
      expect(result.bpm).toBeLessThanOrEqual(122);
      expect(result.key).toBeTruthy();
      expect(ticks).toBeGreaterThan(2);
      expect(longestGap).toBeLessThan(500);
    } finally {
      clearInterval(heartbeat);
      await rm(directory, { recursive: true, force: true });
    }
  }, 45000);
});
