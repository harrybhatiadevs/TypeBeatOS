import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import MusicTempo from "music-tempo";
import FFT from "fft.js";

const SAMPLE_RATE = 44100;
const ANALYZE_SECONDS = 75;

/** Decode any audio file to mono float32 PCM at 44.1kHz using the bundled ffmpeg. */
function decodePcm(filePath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as unknown as string, [
      "-i", filePath,
      "-t", String(ANALYZE_SECONDS),
      "-ac", "1",
      "-ar", String(SAMPLE_RATE),
      "-f", "f32le",
      "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (d) => chunks.push(d));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg decode failed (${code})`));
      const buf = Buffer.concat(chunks);
      resolve(new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4)));
    });
  });
}

/** Fold detected tempo into the range type beats actually live in. */
function foldTempo(bpm: number) {
  let t = bpm;
  while (t < 70) t *= 2;
  while (t > 190) t /= 2;
  return Math.round(t);
}

function detectBpm(samples: Float32Array): number | null {
  try {
    const mt = new MusicTempo(samples);
    const tempo = Number(mt.tempo);
    if (!tempo || isNaN(tempo)) return null;
    return foldTempo(tempo);
  } catch {
    return null;
  }
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// Krumhansl-Schmuckler key profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlation(a: number[], b: number[]) {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

function detectKey(samples: Float32Array): string | null {
  try {
    const size = 8192;
    const hop = 4096;
    const fft = new FFT(size);
    const out = fft.createComplexArray();
    const frame = new Float32Array(size);
    const chroma = new Array(12).fill(0);

    const frames = Math.floor((samples.length - size) / hop);
    if (frames < 4) return null;

    for (let f = 0; f < frames; f++) {
      const offset = f * hop;
      for (let i = 0; i < size; i++) {
        // Hann window
        frame[i] = samples[offset + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
      }
      fft.realTransform(out, frame);
      const minBin = Math.ceil((55 * size) / SAMPLE_RATE);
      const maxBin = Math.floor((4000 * size) / SAMPLE_RATE);
      for (let bin = minBin; bin <= maxBin; bin++) {
        const re = out[2 * bin];
        const im = out[2 * bin + 1];
        const mag = Math.sqrt(re * re + im * im);
        if (mag < 1e-6) continue;
        const freq = (bin * SAMPLE_RATE) / size;
        const midi = 69 + 12 * Math.log2(freq / 440);
        const pc = ((Math.round(midi) % 12) + 12) % 12;
        chroma[pc] += mag;
      }
    }

    if (chroma.every((v) => v === 0)) return null;

    let best = { score: -Infinity, note: 0, mode: "major" };
    for (let root = 0; root < 12; root++) {
      const rotated = [...chroma.slice(root), ...chroma.slice(0, root)];
      const maj = correlation(rotated, MAJOR_PROFILE);
      const min = correlation(rotated, MINOR_PROFILE);
      if (maj > best.score) best = { score: maj, note: root, mode: "major" };
      if (min > best.score) best = { score: min, note: root, mode: "minor" };
    }
    return `${NOTE_NAMES[best.note]} ${best.mode}`;
  } catch {
    return null;
  }
}

export type AudioAnalysis = { bpm: number | null; key: string | null };

/** Detect BPM and musical key from an audio file. Returns nulls on failure — never throws. */
export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  try {
    const samples = await decodePcm(filePath);
    if (samples.length < SAMPLE_RATE * 4) return { bpm: null, key: null };
    return { bpm: detectBpm(samples), key: detectKey(samples) };
  } catch {
    return { bpm: null, key: null };
  }
}
