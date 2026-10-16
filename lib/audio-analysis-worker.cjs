// CPU-heavy analysis runs off the HTTP thread. Keep this file CommonJS so it
// can run directly in both development and the standalone Docker image.
const { parentPort, workerData } = require("node:worker_threads");
const MusicTempo = require("music-tempo");
const FFT = require("fft.js");
const SAMPLE_RATE = 44100;

/** Fold detected tempo into the range type beats actually live in. */
function foldTempo(bpm) {
  let t = bpm;
  while (t < 70) t *= 2;
  while (t > 190) t /= 2;
  return Math.round(t);
}

function detectBpm(samples) {
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

function correlation(a, b) {
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

function detectKey(samples) {
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


const samples = workerData;
parentPort.postMessage({ bpm: detectBpm(samples), key: detectKey(samples) });
