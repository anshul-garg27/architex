// DST-101: Web Audio API sonification for DS operations
// Plays short tones when DS operations happen (compare, swap, insert, delete, found)
// Muted by default — user toggles via Volume icon in DSControls

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playTone(
  value: number,
  type: "compare" | "swap" | "insert" | "delete" | "found" = "compare",
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Map value to frequency (200Hz - 800Hz range)
    const freq = 200 + (value % 100) * 6;

    // Different waveforms for different operations
    const waves: Record<string, OscillatorType> = {
      compare: "sine",
      swap: "triangle",
      insert: "sine",
      delete: "sawtooth",
      found: "sine",
    };

    osc.type = waves[type] || "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.1; // Quiet
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.15,
    );

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Silently ignore audio errors (e.g. blocked autoplay)
  }
}

export function playSuccess() {
  // Rising chord for success
  [400, 500, 600].forEach((freq, i) => {
    setTimeout(() => {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.08;
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.2,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        // Silently ignore audio errors
      }
    }, i * 80);
  });
}

/** Derive an operation type from a DSStep mutation for sonification */
export function inferToneType(
  mutationProperty: string,
  mutationTo: string | number | boolean,
): "compare" | "swap" | "insert" | "delete" | "found" {
  if (mutationProperty === "highlight") {
    const val = String(mutationTo);
    if (val === "found" || val === "success") return "found";
    if (val === "delete" || val === "removed") return "delete";
    if (val === "swap") return "swap";
    if (val === "insert" || val === "inserted" || val === "active") return "insert";
    return "compare";
  }
  return "compare";
}

/** Extract a numeric value from a targetId for frequency mapping */
export function extractValueFromTargetId(targetId: string): number {
  const match = targetId.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 42;
}
