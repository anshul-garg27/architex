// ─────────────────────────────────────────────────────────────
// Architex — AI Difficulty Adaptation (INO-022)
// ─────────────────────────────────────────────────────────────
//
// Bayesian skill model that tracks P(skill_level) based on
// challenge results and selects optimal difficulty for
// maximum learning.
//
// Uses a beta distribution (alpha, beta) to model the
// probability that a learner can solve problems at each
// difficulty level. Higher alpha means more successes,
// higher beta means more failures.
//
// Public API:
//   createBeliefs()                         → initial beliefs
//   updateBeliefs(beliefs, result, diff)    → updated beliefs
//   selectOptimalDifficulty(beliefs)        → optimal difficulty
//   getConfidenceInterval(beliefs)          → [low, high]
//   getSkillEstimate(beliefs)               → point estimate
//   getRecommendedChallengeRange(beliefs)   → { min, max }
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Difficulty level on a 1-10 scale. */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Result of a challenge attempt. */
export type ChallengeResult = 'success' | 'failure' | 'partial';

/** Beta distribution parameters for Bayesian skill modelling. */
export interface BetaParams {
  /** Number of pseudo-successes (prior + observed). */
  alpha: number;
  /** Number of pseudo-failures (prior + observed). */
  beta: number;
}

/**
 * Full belief state about a learner's skill level.
 *
 * We keep per-difficulty beliefs so the model can reason about
 * competence across the full difficulty spectrum.
 */
export interface SkillBeliefs {
  /** Per-difficulty beta distribution parameters. */
  perDifficulty: Record<DifficultyLevel, BetaParams>;
  /** Total attempts across all difficulties. */
  totalAttempts: number;
  /** Total successes across all difficulties. */
  totalSuccesses: number;
  /** Timestamp of last update (ms since epoch). */
  lastUpdated: number;
}

/** Output of the optimal difficulty selector. */
export interface DifficultyRecommendation {
  /** The recommended difficulty level. */
  level: DifficultyLevel;
  /** Estimated probability of success at this level. */
  expectedSuccessRate: number;
  /** Why this difficulty was chosen. */
  rationale: string;
}

/** Confidence interval for skill estimate. */
export interface ConfidenceInterval {
  /** Lower bound of the 95% credible interval. */
  low: number;
  /** Upper bound of the 95% credible interval. */
  high: number;
  /** Point estimate (mean of the beta distribution). */
  mean: number;
}

// ── Constants ──────────────────────────────────────────────

/** All valid difficulty levels. */
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
] as const;

/**
 * Target success rate for optimal learning (the "zone of proximal
 * development"). Research suggests ~70-85% success rate maximises
 * learning — we aim for 75%.
 */
const OPTIMAL_SUCCESS_RATE = 0.75;

/**
 * Decay factor for temporal discounting. Older observations
 * matter slightly less so the model adapts to improving skill.
 * Applied per-update as: alpha' = 1 + decay*(alpha-1).
 */
const TEMPORAL_DECAY = 0.95;

/** Partial success counts as this fraction of a full success. */
const PARTIAL_SUCCESS_WEIGHT = 0.5;

// ── Helpers ────────────────────────────────────────────────

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Mean of a beta distribution: alpha / (alpha + beta).
 */
export function betaMean(params: BetaParams): number {
  return params.alpha / (params.alpha + params.beta);
}

/**
 * Variance of a beta distribution.
 */
export function betaVariance(params: BetaParams): number {
  const { alpha, beta } = params;
  return (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
}

/**
 * Approximate quantile of a beta distribution using the normal
 * approximation (good enough for alpha,beta > 2).
 */
function betaQuantile(params: BetaParams, p: number): number {
  const mean = betaMean(params);
  const variance = betaVariance(params);
  const sd = Math.sqrt(variance);

  // Inverse normal approximation using Abramowitz & Stegun 26.2.23
  const t = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  let z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  if (p < 0.5) z = -z;

  return clamp(mean + z * sd, 0, 1);
}

// ── Public API ─────────────────────────────────────────────

/**
 * Create initial beliefs with a weak uniform prior.
 * alpha=2, beta=2 gives a gentle bell curve centred at 0.5.
 */
export function createBeliefs(): SkillBeliefs {
  const perDifficulty = {} as Record<DifficultyLevel, BetaParams>;
  for (const level of DIFFICULTY_LEVELS) {
    perDifficulty[level] = { alpha: 2, beta: 2 };
  }
  return {
    perDifficulty,
    totalAttempts: 0,
    totalSuccesses: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Update beliefs after a challenge result.
 *
 * The update:
 * 1. Applies temporal decay to existing beliefs (so old data
 *    fades and the model can track improving skill).
 * 2. Updates the beta parameters for the attempted difficulty.
 * 3. Propagates weaker updates to adjacent difficulties (a
 *    success at level 5 implies some competence at 4 and 3).
 */
export function updateBeliefs(
  beliefs: SkillBeliefs,
  result: ChallengeResult,
  challengeDifficulty: DifficultyLevel,
): SkillBeliefs {
  // Deep clone per-difficulty beliefs
  const updated: Record<DifficultyLevel, BetaParams> = {} as Record<DifficultyLevel, BetaParams>;
  for (const level of DIFFICULTY_LEVELS) {
    const old = beliefs.perDifficulty[level];
    // Temporal decay: shrink evidence towards prior
    updated[level] = {
      alpha: 1 + TEMPORAL_DECAY * (old.alpha - 1),
      beta: 1 + TEMPORAL_DECAY * (old.beta - 1),
    };
  }

  // Determine success weight
  const successWeight =
    result === 'success' ? 1 : result === 'partial' ? PARTIAL_SUCCESS_WEIGHT : 0;
  const failureWeight = 1 - successWeight;

  // Update the attempted difficulty directly
  updated[challengeDifficulty] = {
    alpha: updated[challengeDifficulty].alpha + successWeight,
    beta: updated[challengeDifficulty].beta + failureWeight,
  };

  // Propagate to adjacent difficulties with exponential decay
  for (const level of DIFFICULTY_LEVELS) {
    if (level === challengeDifficulty) continue;
    const distance = Math.abs(level - challengeDifficulty);
    const propagation = Math.pow(0.5, distance); // halves per level of distance

    if (level < challengeDifficulty && result !== 'failure') {
      // Success at harder level implies competence at easier levels
      updated[level] = {
        alpha: updated[level].alpha + successWeight * propagation,
        beta: updated[level].beta,
      };
    } else if (level > challengeDifficulty && result === 'failure') {
      // Failure at easier level implies difficulty at harder levels
      updated[level] = {
        alpha: updated[level].alpha,
        beta: updated[level].beta + failureWeight * propagation,
      };
    }
  }

  const isSuccess = result === 'success' || result === 'partial';

  return {
    perDifficulty: updated,
    totalAttempts: beliefs.totalAttempts + 1,
    totalSuccesses: beliefs.totalSuccesses + (isSuccess ? 1 : 0),
    lastUpdated: Date.now(),
  };
}

/**
 * Select the optimal difficulty that maximises learning.
 *
 * Strategy: find the difficulty level whose expected success
 * rate is closest to OPTIMAL_SUCCESS_RATE (75%). This places
 * the learner in their zone of proximal development.
 */
export function selectOptimalDifficulty(
  beliefs: SkillBeliefs,
): DifficultyRecommendation {
  let bestLevel: DifficultyLevel = 5;
  let bestDistance = Infinity;
  let bestRate = 0.5;

  for (const level of DIFFICULTY_LEVELS) {
    const rate = betaMean(beliefs.perDifficulty[level]);
    const distance = Math.abs(rate - OPTIMAL_SUCCESS_RATE);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestLevel = level;
      bestRate = rate;
    }
  }

  // Build a human-readable rationale
  let rationale: string;
  if (bestRate > 0.85) {
    rationale =
      `Level ${bestLevel} selected — your estimated success rate (${(bestRate * 100).toFixed(0)}%) ` +
      `is high; consider pushing higher for more challenge.`;
  } else if (bestRate < 0.6) {
    rationale =
      `Level ${bestLevel} selected — your estimated success rate (${(bestRate * 100).toFixed(0)}%) ` +
      `is lower here; this level will stretch your skills.`;
  } else {
    rationale =
      `Level ${bestLevel} selected — your estimated success rate (${(bestRate * 100).toFixed(0)}%) ` +
      `is in the optimal learning zone.`;
  }

  return {
    level: bestLevel,
    expectedSuccessRate: Math.round(bestRate * 1000) / 1000,
    rationale,
  };
}

/**
 * Get the 95% credible interval for overall skill.
 *
 * We compute the aggregate beta parameters across all
 * difficulties (weighted by difficulty level) and return
 * the interval.
 */
export function getConfidenceInterval(beliefs: SkillBeliefs): ConfidenceInterval {
  // Aggregate across all difficulties
  let totalAlpha = 0;
  let totalBeta = 0;

  for (const level of DIFFICULTY_LEVELS) {
    const params = beliefs.perDifficulty[level];
    totalAlpha += params.alpha;
    totalBeta += params.beta;
  }

  // Normalise to a single beta distribution
  const scale = 10; // keep it manageable
  const agg: BetaParams = {
    alpha: (totalAlpha / DIFFICULTY_LEVELS.length) * (scale / 4),
    beta: (totalBeta / DIFFICULTY_LEVELS.length) * (scale / 4),
  };

  const mean = betaMean(agg);
  const low = betaQuantile(agg, 0.025);
  const high = betaQuantile(agg, 0.975);

  return {
    low: Math.round(low * 1000) / 1000,
    high: Math.round(high * 1000) / 1000,
    mean: Math.round(mean * 1000) / 1000,
  };
}

/**
 * Point estimate of the learner's overall skill (0-1).
 *
 * Weighted average of per-difficulty means, with higher
 * difficulties weighted more (competence at harder levels
 * is a stronger signal).
 */
export function getSkillEstimate(beliefs: SkillBeliefs): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const level of DIFFICULTY_LEVELS) {
    const weight = level; // harder levels weigh more
    const rate = betaMean(beliefs.perDifficulty[level]);
    weightedSum += rate * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 1000) / 1000;
}

/**
 * Get the recommended difficulty range for challenge selection.
 *
 * Returns the min and max difficulty levels where the learner's
 * expected success rate falls within a reasonable range (50-90%).
 */
export function getRecommendedChallengeRange(
  beliefs: SkillBeliefs,
): { min: DifficultyLevel; max: DifficultyLevel } {
  let min: DifficultyLevel = 1;
  let max: DifficultyLevel = 10;

  // Find the range where success rate is between 50% and 90%
  for (const level of DIFFICULTY_LEVELS) {
    const rate = betaMean(beliefs.perDifficulty[level]);
    if (rate >= 0.5) {
      max = level;
    }
    if (rate > 0.9 && level < 10) {
      min = (level + 1) as DifficultyLevel;
    }
  }

  // Ensure min <= max
  if (min > max) {
    min = max;
  }

  return { min, max };
}
