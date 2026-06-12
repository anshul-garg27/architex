/**
 * Prediction Scoring (Predict-Run-Compare loop)
 *
 * PURE functions that turn a completed simulation run into a RunOutcome
 * and grade a user's pre-run PredictionRecord against it, claim by claim.
 * The hypercorrection effect says confident errors, once corrected, are
 * the best-remembered lessons — so calibration copy is deliberately
 * strongest for confident-wrong runs. No store imports here: callers
 * assemble plain data from simulation-store / orchestrator accessors.
 */

// ---------------------------------------------------------------------------
// Bands & thresholds
// ---------------------------------------------------------------------------

export type Band = "healthy" | "elevated" | "concerning" | "critical";
export type Confidence = 1 | 2 | 3 | 4 | 5;

/** Ordered worst-last; adjacency in this list defines a "near-miss". */
export const BAND_ORDER: readonly Band[] = [
  "healthy",
  "elevated",
  "concerning",
  "critical",
];

export const BAND_TITLES: Record<Band, string> = {
  healthy: "Healthy",
  elevated: "Elevated",
  concerning: "Concerning",
  critical: "Critical",
};

/** p99 latency band upper bounds (ms). >= last bound -> critical. */
export const P99_THRESHOLDS_MS = {
  healthy: 200,
  elevated: 500,
  concerning: 1500,
} as const;

/** Error-rate band upper bounds (fraction, 0..1). */
export const ERROR_THRESHOLDS = {
  healthy: 0.001, // < 0.1%
  elevated: 0.01, // < 1%
  concerning: 0.05, // < 5%
} as const;

/**
 * Hourly cost band upper bounds (USD/hr), tuned to the cost-model's
 * BASE_COST_PER_HOUR table where a typical 8-15 node design lands
 * around $1-3/hr (~$700-2,200/mo).
 */
export const COST_THRESHOLDS_PER_HOUR = {
  healthy: 2,
  elevated: 8,
  concerning: 25,
} as const;

/** Human-readable range labels, shared with the prediction form UI. */
export const P99_BAND_LABELS: Record<Band, string> = {
  healthy: "< 200ms",
  elevated: "200–500ms",
  concerning: "0.5–1.5s",
  critical: "≥ 1.5s",
};

export const ERROR_BAND_LABELS: Record<Band, string> = {
  healthy: "< 0.1%",
  elevated: "0.1–1%",
  concerning: "1–5%",
  critical: "≥ 5%",
};

export const COST_BAND_LABELS: Record<Band, string> = {
  healthy: "< $2/hr",
  elevated: "$2–8/hr",
  concerning: "$8–25/hr",
  critical: "≥ $25/hr",
};

export function p99Band(p99Ms: number): Band {
  if (p99Ms < P99_THRESHOLDS_MS.healthy) return "healthy";
  if (p99Ms < P99_THRESHOLDS_MS.elevated) return "elevated";
  if (p99Ms < P99_THRESHOLDS_MS.concerning) return "concerning";
  return "critical";
}

export function errorBand(errorRate: number): Band {
  if (errorRate < ERROR_THRESHOLDS.healthy) return "healthy";
  if (errorRate < ERROR_THRESHOLDS.elevated) return "elevated";
  if (errorRate < ERROR_THRESHOLDS.concerning) return "concerning";
  return "critical";
}

export function costBand(costPerHour: number): Band {
  if (costPerHour < COST_THRESHOLDS_PER_HOUR.healthy) return "healthy";
  if (costPerHour < COST_THRESHOLDS_PER_HOUR.elevated) return "elevated";
  if (costPerHour < COST_THRESHOLDS_PER_HOUR.concerning) return "concerning";
  return "critical";
}

/** Number of band steps between two bands (0 = same, 1 = adjacent...). */
export function bandDistance(a: Band, b: Band): number {
  return Math.abs(BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b));
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface PredictionRecord {
  /** Node the user expects to saturate first; null = "nothing saturates". */
  firstBottleneckNodeId: string | null;
  p99Band: Band;
  errorBand: Band;
  costBand: Band;
  confidence: Confidence;
  /** Epoch ms when the prediction was locked. */
  predictedAt: number;
}

/** Minimal, store-agnostic description of what the run actually did. */
export interface RunOutcome {
  /** Node that saturated first (or null if nothing did). */
  firstBottleneckNodeId: string | null;
  /** Node ids ranked by sustained utilization, highest first. */
  saturationRanking: string[];
  finalP99Ms: number;
  /** 0..1 */
  finalErrorRate: number;
  costPerHour: number;
}

export type Verdict = "correct" | "near-miss" | "wrong";
export type ClaimKind = "bottleneck" | "p99" | "error" | "cost";

export interface ClaimScore {
  claim: ClaimKind;
  label: string;
  predicted: string;
  actual: string;
  verdict: Verdict;
}

export type CalibrationTone = "win" | "underconfident" | "mixed" | "miss" | "hypercorrection";

export interface ScoredPrediction {
  prediction: PredictionRecord;
  outcome: RunOutcome;
  claims: ClaimScore[];
  /** 0..1 — correct = 1, near-miss = 0.5, wrong = 0, averaged. */
  accuracy: number;
  calibration: string;
  calibrationTone: CalibrationTone;
  scoredAt: number;
}

// ---------------------------------------------------------------------------
// Deriving the actual outcome from raw run data
// ---------------------------------------------------------------------------

/** Subset of a TickRecord the outcome derivation needs. */
export interface OutcomeTick {
  nodeEvents: Array<{ nodeId: string; severity: string }>;
}

export interface NodeUtilization {
  nodeId: string;
  /** Peak/final utilization observed for the node, 0..1. */
  utilization: number;
}

export interface OutcomeInput {
  /** Chronological tick records (issue events carry node + severity). */
  ticks: OutcomeTick[];
  nodeUtilizations: NodeUtilization[];
  p99LatencyMs: number;
  /** 0..1 */
  errorRate: number;
  costPerHour: number;
}

/** Utilization at or above this counts as a saturated component. */
export const SATURATION_UTILIZATION = 0.85;

const BOTTLENECK_SEVERITIES = new Set(["critical", "high"]);

/**
 * Determine what actually happened in a run. First-bottleneck order:
 * earliest critical/high issue event -> most-utilized node if it crossed
 * SATURATION_UTILIZATION -> null (nothing saturated).
 */
export function deriveRunOutcome(input: OutcomeInput): RunOutcome {
  const ranking = [...input.nodeUtilizations]
    .sort((a, b) => b.utilization - a.utilization)
    .map((n) => n.nodeId);

  let firstBottleneckNodeId: string | null = null;

  for (const tick of input.ticks) {
    const evt = tick.nodeEvents.find((e) => BOTTLENECK_SEVERITIES.has(e.severity));
    if (evt) {
      firstBottleneckNodeId = evt.nodeId;
      break;
    }
  }

  if (firstBottleneckNodeId === null) {
    const top = [...input.nodeUtilizations].sort(
      (a, b) => b.utilization - a.utilization,
    )[0];
    if (top && top.utilization >= SATURATION_UTILIZATION) {
      firstBottleneckNodeId = top.nodeId;
    }
  }

  return {
    firstBottleneckNodeId,
    saturationRanking: ranking,
    finalP99Ms: input.p99LatencyMs,
    finalErrorRate: input.errorRate,
    costPerHour: input.costPerHour,
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreBandClaim(predicted: Band, actual: Band): Verdict {
  const distance = bandDistance(predicted, actual);
  if (distance === 0) return "correct";
  if (distance === 1) return "near-miss";
  return "wrong";
}

/** Top-N rank in the saturation ordering that still counts as a near-miss. */
const NEAR_MISS_RANK = 3;

function scoreBottleneckClaim(
  predicted: string | null,
  outcome: RunOutcome,
): Verdict {
  if (predicted === outcome.firstBottleneckNodeId) return "correct";
  if (predicted === null) return "wrong"; // said nothing saturates, something did
  if (outcome.firstBottleneckNodeId === null) {
    // Nothing saturated, but the pick was still the most-stressed component.
    return outcome.saturationRanking[0] === predicted ? "near-miss" : "wrong";
  }
  const rank = outcome.saturationRanking.indexOf(predicted);
  return rank > -1 && rank < NEAR_MISS_RANK ? "near-miss" : "wrong";
}

const VERDICT_WEIGHT: Record<Verdict, number> = {
  correct: 1,
  "near-miss": 0.5,
  wrong: 0,
};

const HIGH_CONFIDENCE: Confidence = 4;
const LOW_CONFIDENCE: Confidence = 2;
const WIN_ACCURACY = 0.75; // >= -> "win" copy
const MISS_ACCURACY = 0.4; // < -> "miss"/hypercorrection copy

/** Confidence-aware coaching line; confident-wrong gets the strongest copy. */
export function buildCalibrationLine(
  accuracy: number,
  confidence: Confidence,
): { tone: CalibrationTone; line: string } {
  const confident = confidence >= HIGH_CONFIDENCE;
  const hesitant = confidence <= LOW_CONFIDENCE;

  if (accuracy >= WIN_ACCURACY) {
    if (confident) {
      return {
        tone: "win",
        line: "High confidence, high accuracy. Your mental model of this architecture is holding — raise the stakes: add chaos or 10x the traffic next run.",
      };
    }
    if (hesitant) {
      return {
        tone: "underconfident",
        line: "You called it, but hedged. Your instincts were better than your confidence — trust the model you clearly already have.",
      };
    }
    return {
      tone: "win",
      line: "Solid read. Most claims landed — sharpen the one that drifted and push confidence up a notch next time.",
    };
  }

  if (accuracy >= MISS_ACCURACY) {
    if (confident) {
      return {
        tone: "mixed",
        line: "Confidence outran accuracy. Before the next run, find the claim that broke and trace why the system disagreed with you.",
      };
    }
    return {
      tone: "mixed",
      line: "Half right, half guessing — normal at this stage. Replay the run, watch where the pressure actually built, then predict again.",
    };
  }

  if (confident) {
    return {
      tone: "hypercorrection",
      line: "You were confident and wrong — the single most valuable outcome this loop can produce. Your model said one thing; the system did another. Hold onto this miss: re-trace the run node by node until you can explain the gap, and the correction will stick harder than any correct guess ever would.",
    };
  }
  if (hesitant) {
    return {
      tone: "miss",
      line: "Low confidence, low accuracy — you knew this was a guess. Watch the replay, form an actual theory of where load piles up, then commit to it.",
    };
  }
  return {
    tone: "miss",
    line: "The system disagreed with most of your claims. That gap is the lesson — find which assumption (capacity, fan-out, caching) was off before the next run.",
  };
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(rate < 0.01 ? 2 : 1)}%`;
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function formatCost(perHour: number): string {
  return `$${perHour.toFixed(2)}/hr`;
}

/**
 * Grade a locked prediction against a derived run outcome.
 * @param nodeLabels optional id -> display-label map for readable verdict rows.
 */
export function scorePrediction(
  prediction: PredictionRecord,
  outcome: RunOutcome,
  nodeLabels?: Record<string, string>,
): ScoredPrediction {
  const labelOf = (id: string | null): string => {
    if (id === null) return "Nothing saturates";
    return nodeLabels?.[id] ?? id;
  };

  const actualP99 = p99Band(outcome.finalP99Ms);
  const actualError = errorBand(outcome.finalErrorRate);
  const actualCost = costBand(outcome.costPerHour);

  const claims: ClaimScore[] = [
    {
      claim: "bottleneck",
      label: "First bottleneck",
      predicted: labelOf(prediction.firstBottleneckNodeId),
      actual: labelOf(outcome.firstBottleneckNodeId),
      verdict: scoreBottleneckClaim(prediction.firstBottleneckNodeId, outcome),
    },
    {
      claim: "p99",
      label: "p99 latency",
      predicted: `${BAND_TITLES[prediction.p99Band]} (${P99_BAND_LABELS[prediction.p99Band]})`,
      actual: `${BAND_TITLES[actualP99]} (${formatMs(outcome.finalP99Ms)})`,
      verdict: scoreBandClaim(prediction.p99Band, actualP99),
    },
    {
      claim: "error",
      label: "Error rate",
      predicted: `${BAND_TITLES[prediction.errorBand]} (${ERROR_BAND_LABELS[prediction.errorBand]})`,
      actual: `${BAND_TITLES[actualError]} (${formatPercent(outcome.finalErrorRate)})`,
      verdict: scoreBandClaim(prediction.errorBand, actualError),
    },
    {
      claim: "cost",
      label: "Run cost",
      predicted: `${BAND_TITLES[prediction.costBand]} (${COST_BAND_LABELS[prediction.costBand]})`,
      actual: `${BAND_TITLES[actualCost]} (${formatCost(outcome.costPerHour)})`,
      verdict: scoreBandClaim(prediction.costBand, actualCost),
    },
  ];

  const accuracy =
    claims.reduce((sum, c) => sum + VERDICT_WEIGHT[c.verdict], 0) /
    claims.length;

  const { tone, line } = buildCalibrationLine(accuracy, prediction.confidence);

  return {
    prediction,
    outcome,
    claims,
    accuracy,
    calibration: line,
    calibrationTone: tone,
    scoredAt: Date.now(),
  };
}
