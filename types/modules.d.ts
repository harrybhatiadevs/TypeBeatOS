declare module "music-tempo" {
  export default class MusicTempo {
    constructor(audioData: Float32Array | number[], params?: Record<string, unknown>);
    tempo: number;
    beats: number[];
  }
}

declare module "fft.js" {
  export default class FFT {
    constructor(size: number);
    createComplexArray(): number[];
    realTransform(out: number[], input: number[] | Float32Array): void;
  }
}
