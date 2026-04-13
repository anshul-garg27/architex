// ─────────────────────────────────────────────────────────────
// Architex — ML Design: Model Serving Patterns
// ─────────────────────────────────────────────────────────────
//
// Simulation utilities for common model-serving deployment
// strategies: A/B testing, canary rollout, and shadow mode.
// Each simulator produces a time-stepped sequence describing
// traffic distribution and observed metrics.
// ─────────────────────────────────────────────────────────────

export interface ServingStep {
  tick: number;
  description: string;
  metrics?: Record<string, number>;
}

export interface ServingPattern {
  id: string;
  name: string;
  description: string;
  trafficSplit: Record<string, number>; // model name -> percentage (0-100)
  steps: ServingStep[];
}

// ── Deterministic pseudo-random for reproducible demos ──────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── A/B Test Simulation ──────────────────────────────────────

/**
 * Simulates an A/B test between Model A (control) and Model B (treatment).
 *
 * @param split - Percentage of traffic routed to Model B (0-100)
 * @param totalRequests - Total requests to simulate
 */
export function simulateABTest(
  split: number,
  totalRequests: number
): ServingPattern {
  const bPct = Math.max(0, Math.min(100, split));
  const aPct = 100 - bPct;
  const rand = seededRandom(42);

  const batchSize = Math.max(1, Math.floor(totalRequests / 10));
  const steps: ServingStep[] = [];

  let totalA = 0;
  let totalB = 0;
  let successA = 0;
  let successB = 0;

  for (let tick = 1; tick <= 10; tick++) {
    const count = tick < 10 ? batchSize : totalRequests - batchSize * 9;
    let batchA = 0;
    let batchB = 0;
    let batchSuccessA = 0;
    let batchSuccessB = 0;

    for (let i = 0; i < count; i++) {
      if (rand() * 100 < bPct) {
        batchB++;
        // Model B has 3% higher conversion
        if (rand() < 0.153) batchSuccessB++;
      } else {
        batchA++;
        if (rand() < 0.12) batchSuccessA++;
      }
    }

    totalA += batchA;
    totalB += batchB;
    successA += batchSuccessA;
    successB += batchSuccessB;

    const convA = totalA > 0 ? successA / totalA : 0;
    const convB = totalB > 0 ? successB / totalB : 0;

    steps.push({
      tick,
      description:
        tick < 5
          ? `Collecting data: ${totalA + totalB} requests processed`
          : tick < 8
            ? `Measuring significance: p-value converging`
            : `Results stabilising: lift = ${((convB - convA) / Math.max(convA, 0.001) * 100).toFixed(1)}%`,
      metrics: {
        requestsA: totalA,
        requestsB: totalB,
        conversionA: parseFloat(convA.toFixed(4)),
        conversionB: parseFloat(convB.toFixed(4)),
        lift: parseFloat(
          ((convB - convA) / Math.max(convA, 0.001) * 100).toFixed(1)
        ),
      },
    });
  }

  return {
    id: "ab-test",
    name: "A/B Test",
    description:
      `Splits traffic ${aPct}/${bPct} between Model A (control) and ` +
      `Model B (treatment). Measures conversion lift with statistical ` +
      `significance before promoting the winner.`,
    trafficSplit: { "Model A (control)": aPct, "Model B (treatment)": bPct },
    steps,
  };
}

// ── Canary Rollout Simulation ────────────────────────────────

/**
 * Simulates a progressive canary rollout.
 *
 * @param rolloutSteps - Array of traffic percentages for the new model,
 *                       e.g. [1, 5, 25, 50, 100]
 */
export function simulateCanary(
  rolloutSteps: number[] = [1, 5, 25, 50, 100]
): ServingPattern {
  const rand = seededRandom(99);
  const steps: ServingStep[] = [];

  // The final traffic split reflects the last rollout step
  const finalPct = rolloutSteps[rolloutSteps.length - 1] ?? 100;

  for (let i = 0; i < rolloutSteps.length; i++) {
    const pct = rolloutSteps[i];
    const tick = i + 1;

    // Simulate error rate (new model slightly better after warm-up)
    const oldErrorRate = 0.02 + rand() * 0.005;
    const newErrorRate =
      i < 2
        ? 0.025 + rand() * 0.01 // slightly higher initially
        : 0.015 + rand() * 0.005; // stabilises lower

    const latencyOld = 45 + rand() * 10;
    const latencyNew = 42 + rand() * 8;

    steps.push({
      tick,
      description:
        pct < 100
          ? `Canary at ${pct}%: monitoring error rate and latency`
          : `Full rollout: new model serving 100% of traffic`,
      metrics: {
        canaryPct: pct,
        errorRateOld: parseFloat(oldErrorRate.toFixed(4)),
        errorRateNew: parseFloat(newErrorRate.toFixed(4)),
        p50LatencyOld: parseFloat(latencyOld.toFixed(1)),
        p50LatencyNew: parseFloat(latencyNew.toFixed(1)),
      },
    });
  }

  return {
    id: "canary",
    name: "Canary Rollout",
    description:
      `Gradually shifts traffic from old model to new model through ` +
      `stages: ${rolloutSteps.join("% -> ")}%. At each stage error rate ` +
      `and latency are checked before proceeding.`,
    trafficSplit: {
      "Old Model": 100 - finalPct,
      "New Model (canary)": finalPct,
    },
    steps,
  };
}

// ── Shadow Mode Simulation ───────────────────────────────────

/**
 * Simulates shadow (dark launch) deployment where the new model
 * receives a copy of production traffic but its responses are
 * discarded. Only metrics are collected.
 */
export function simulateShadow(): ServingPattern {
  const rand = seededRandom(77);
  const steps: ServingStep[] = [];

  for (let tick = 1; tick <= 8; tick++) {
    const agreementRate = Math.min(
      0.98,
      0.85 + tick * 0.015 + rand() * 0.01
    );
    const latencyProd = 48 + rand() * 12;
    const latencyShadow = 44 + rand() * 10;
    const divergenceRate = 1 - agreementRate;

    steps.push({
      tick,
      description:
        tick <= 3
          ? `Shadow warm-up: collecting prediction agreement data`
          : tick <= 6
            ? `Analysing divergences: ${(divergenceRate * 100).toFixed(1)}% disagreement`
            : `Shadow stable: ready for promotion decision`,
      metrics: {
        agreementRate: parseFloat(agreementRate.toFixed(4)),
        divergenceRate: parseFloat(divergenceRate.toFixed(4)),
        p50LatencyProd: parseFloat(latencyProd.toFixed(1)),
        p50LatencyShadow: parseFloat(latencyShadow.toFixed(1)),
        requestsMirrored: tick * 12500,
      },
    });
  }

  return {
    id: "shadow",
    name: "Shadow Mode",
    description:
      `Mirrors 100% of production traffic to the new model without ` +
      `affecting user responses. Compares predictions to measure ` +
      `agreement rate and latency before any live switch.`,
    trafficSplit: {
      "Production Model": 100,
      "Shadow Model (no live traffic)": 100,
    },
    steps,
  };
}
