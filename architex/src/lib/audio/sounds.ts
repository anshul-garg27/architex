// ── Sound Definitions ───────────────────────────────────────────
// Each sound is a pure function that synthesizes audio via Web Audio API.
// No audio files are needed — everything is generated from oscillators
// and noise buffers.

export type SoundType =
  | "click"
  | "success"
  | "error"
  | "delete"
  | "notification"
  | "connect"
  | "simulate-start"
  | "simulate-stop"
  | "drop"
  | "hover"
  | "algo-compare"
  | "algo-swap"
  | "algo-sorted"
  | "algo-pivot"
  | "algo-backtrack"
  | "algo-complete";

type SoundFn = (ctx: AudioContext, volume: number) => void;

// ── Helpers ─────────────────────────────────────────────────────

function createGain(ctx: AudioContext, volume: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  return gain;
}

// ── Individual sounds ───────────────────────────────────────────

/** Short crisp click — 1ms white noise burst */
function click(ctx: AudioContext, volume: number): void {
  const bufferSize = Math.ceil(ctx.sampleRate * 0.001); // 1ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = createGain(ctx, volume * 0.3);
  source.connect(gain);
  source.start();
}

/** Rising two-tone — C5 then E5, 100ms each, sine wave */
function success(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.15);
  gain.gain.setValueAtTime(volume * 0.15, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.2);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Low buzz — 150Hz, 200ms, sawtooth wave with low-pass filter */
function error(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.12);
  gain.gain.setValueAtTime(volume * 0.12, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.2);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;
  filter.connect(gain);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 150;
  osc.connect(filter);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Falling tone — E5 to C4, 150ms */
function deleteFn(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.12);
  gain.gain.setValueAtTime(volume * 0.12, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.15);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(659.25, now); // E5
  osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15); // C4
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Gentle chime — G5, 300ms, triangle wave with decay */
function notification(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.15);
  gain.gain.setValueAtTime(volume * 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 783.99; // G5
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.3);
}

/** Quick rising sweep — 200Hz to 800Hz, 100ms */
function connect(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.12);
  gain.gain.setValueAtTime(volume * 0.12, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.1);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** Building tension tone — ascending C4 -> G4 -> C5, 200ms */
function simulateStart(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.1);
  gain.gain.setValueAtTime(volume * 0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.2);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(261.63, now);       // C4
  osc.frequency.setValueAtTime(392.0, now + 0.07);  // G4
  osc.frequency.setValueAtTime(523.25, now + 0.14); // C5
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Resolving tone — descending C5 -> G4 -> C4, 200ms */
function simulateStop(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.1);
  gain.gain.setValueAtTime(volume * 0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.2);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, now);        // C5
  osc.frequency.setValueAtTime(392.0, now + 0.07);  // G4
  osc.frequency.setValueAtTime(261.63, now + 0.14); // C4
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Soft thud — 80Hz, 50ms, sine with quick decay */
function drop(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.2);
  gain.gain.setValueAtTime(volume * 0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 80;
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.05);
}

/** Very subtle tick — nearly inaudible, 2ms */
function hover(ctx: AudioContext, volume: number): void {
  const bufferSize = Math.ceil(ctx.sampleRate * 0.002); // 2ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = createGain(ctx, volume * 0.05);
  source.connect(gain);
  source.start();
}

// ── Algorithm-specific sounds ───────────────────────────────────

/** Soft tick for comparisons — pitch varies with value distance */
function algoCompare(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.08);
  gain.gain.setValueAtTime(volume * 0.08, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.03);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  // Default mid-pitch; the hook can't pass params through SoundFn,
  // so we use a middle frequency (550Hz)
  osc.frequency.value = 550;
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.03);
}

/** Satisfying whoosh for swaps — sine sweep 400Hz->200Hz with stereo pan */
function algoSwap(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.1);
  gain.gain.setValueAtTime(volume * 0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.1);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

  // Stereo panning: sweep left to right
  if (typeof StereoPannerNode !== "undefined") {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(-0.8, now);
    panner.pan.linearRampToValueAtTime(0.8, now + 0.1);
    osc.connect(panner);
    panner.connect(gain);
  } else {
    osc.connect(gain);
  }

  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * Creates a sorted sound with pitch proportional to progress (0-1).
 * Base = C4 (261Hz), scales up to C6 (1046Hz).
 */
export function createSortedSound(progress: number): SoundFn {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return (ctx: AudioContext, volume: number): void => {
    const now = ctx.currentTime;
    const gain = createGain(ctx, volume * 0.12);
    gain.gain.setValueAtTime(volume * 0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    const freq = 261 + (1046 - 261) * clampedProgress;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.15);
  };
}

/** Default sorted sound at mid-progress */
const algoSorted: SoundFn = createSortedSound(0.5);

/** Short decisive snap — 800Hz square wave, 15ms */
function algoPivot(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.1);
  gain.gain.setValueAtTime(volume * 0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.015);

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 800;
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.015);
}

/** Descending womp — 400Hz->100Hz sawtooth through low-pass filter */
function algoBacktrack(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const gain = createGain(ctx, volume * 0.1);
  gain.gain.setValueAtTime(volume * 0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.2);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  filter.connect(gain);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
  osc.connect(filter);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Full ascending arpeggio: C4->E4->G4->C5, each note 100ms */
function algoComplete(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5

  notes.forEach((freq, i) => {
    const noteStart = now + i * 0.1;
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(volume * 0.15, noteStart);
    noteGain.gain.linearRampToValueAtTime(0, noteStart + 0.1);
    noteGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(noteGain);
    osc.start(noteStart);
    osc.stop(noteStart + 0.1);
  });
}

// ── Registry ────────────────────────────────────────────────────

export const SOUNDS: Record<SoundType, SoundFn> = {
  click,
  success,
  error,
  delete: deleteFn,
  notification,
  connect,
  "simulate-start": simulateStart,
  "simulate-stop": simulateStop,
  drop,
  hover,
  "algo-compare": algoCompare,
  "algo-swap": algoSwap,
  "algo-sorted": algoSorted,
  "algo-pivot": algoPivot,
  "algo-backtrack": algoBacktrack,
  "algo-complete": algoComplete,
};
