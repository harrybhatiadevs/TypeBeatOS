import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { Worker } from "node:worker_threads";
import path from "node:path";

const SAMPLE_RATE = 44100;
const ANALYZE_SECONDS = 75;

/** Decode any audio file to mono float32 PCM at 44.1kHz using the bundled ffmpeg. */
function decodePcm(filePath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    // stdio: ignore stdin + stderr. We only read the PCM on stdout; ffmpeg
    // logs verbosely to stderr, and if that pipe isn't drained its buffer
    // fills and ffmpeg blocks forever (deadlock) — discarding it avoids that.
    const proc = spawn(
      ffmpegPath as unknown as string,
      [
        "-nostdin",
        "-threads", "1",
        "-i", filePath,
        "-t", String(ANALYZE_SECONDS),
        "-ac", "1",
        "-ar", String(SAMPLE_RATE),
        "-f", "f32le",
        "pipe:1",
      ],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    const chunks: Buffer[] = [];
    // Hard safety net: never let a stuck ffmpeg block package generation.
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("ffmpeg decode timed out"));
    }, 30000);
    proc.stdout.on("data", (d) => chunks.push(d));
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`ffmpeg decode failed (${code})`));
      const buf = Buffer.concat(chunks);
      resolve(new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4)));
    });
  });
}

export type AudioAnalysis = { bpm: number | null; key: string | null };

const EMPTY: AudioAnalysis = { bpm: null, key: null };
const analysisState = globalThis as unknown as { audioAnalysisQueue?: Promise<unknown> };
analysisState.audioAnalysisQueue ??= Promise.resolve();

function analyzeInWorker(samples: Float32Array): Promise<AudioAnalysis> {
  return new Promise((resolve) => {
    // Own the buffer so transferring it cannot detach a pooled Node Buffer.
    const owned = new Float32Array(samples);
    const worker = new Worker(path.join(process.cwd(), "lib/audio-analysis-worker.cjs"), {
      workerData: owned,
      transferList: [owned.buffer],
      resourceLimits: { maxOldGenerationSizeMb: 256 },
    });
    let settled = false;
    const finish = (result: AudioAnalysis) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish(EMPTY), 30000);
    worker.once("message", (result: AudioAnalysis) => finish(result));
    worker.once("error", () => finish(EMPTY));
    worker.once("exit", () => finish(EMPTY));
  });
}

/** Decode and analyze one file at a time without blocking uploads or page requests. */
export function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  const job = analysisState.audioAnalysisQueue!.then(async () => {
    try {
      const samples = await decodePcm(filePath);
      if (samples.length < SAMPLE_RATE * 4) return EMPTY;
      return await analyzeInWorker(samples);
    } catch {
      return EMPTY;
    }
  });
  analysisState.audioAnalysisQueue = job.catch(() => undefined);
  return job;
}
