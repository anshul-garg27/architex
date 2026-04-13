/**
 * FSRS-5 spaced repetition algorithm — pure functions, no dependencies.
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

// ── Constants ───────────────────────────────────────────────

const DECAY = -0.5;
/** Derived from 0.9^(1/DECAY) - 1 = 19/81 */
const FACTOR = 19 / 81;
const DESIRED_RETENTION = 0.9;

/** Default FSRS-5 parameters W[0..16]. */
const W = [
  0.4, 0.6, 2.4, 5.8, // W[0..3]: initial stability per rating
  4.93,                 // W[4]: initial difficulty mean
  0.94,                 // W[5]: initial difficulty spread
  0.86,                 // W[6]: difficulty delta factor
  0.01,                 // W[7]: difficulty mean reversion weight
  1.49,                 // W[8]: recall stability base
  0.14,                 // W[9]: recall stability–difficulty interaction
  0.94,                 // W[10]: recall stability–retrievability interaction
  2.18,                 // W[11]: lapse stability base
  0.05,                 // W[12]: lapse difficulty factor
  0.34,                 // W[13]: lapse stability factor
  1.26,                 // W[14]: lapse retrievability factor
  0.29,                 // W[15]: hard penalty
  2.61,                 // W[16]: easy bonus
] as const;

// ── Types ───────────────────────────────────────────────────

export const FSRSState = {
  New: 0,
  Learning: 1,
  Review: 2,
  Relearning: 3,
} as const;
export type FSRSState = (typeof FSRSState)[keyof typeof FSRSState];

export const Rating = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const;
export type Rating = (typeof Rating)[keyof typeof Rating];

export interface FSRSCard {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  fsrsState: FSRSState;
  lastReviewAt: Date;
}

export interface ScheduleResult {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  fsrsState: FSRSState;
  nextReviewAt: Date;
}

// ── Internal helpers ────────────────────────────────────────

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

// ── Core FSRS-5 formulas ────────────────────────────────────

/** Power forgetting curve: recall probability after `elapsedDays` with given `stability`. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

/** Optimal review interval (days) for a given stability at DESIRED_RETENTION. */
function nextInterval(stability: number): number {
  return Math.max(
    1,
    Math.round(
      (stability / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1),
    ),
  );
}

/** Initial stability for a brand-new card based on first rating. */
function initStability(rating: Rating): number {
  return Math.max(0.1, W[rating - 1]);
}

/** Initial difficulty for a brand-new card based on first rating. */
function initDifficulty(rating: Rating): number {
  return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10);
}

/** Updated difficulty after a review (with mean reversion toward D0(Good)). */
function nextDifficulty(d: number, rating: Rating): number {
  const deltaD = d - W[6] * (rating - 3);
  const d0Good = clamp(W[4] - Math.exp(W[5] * 2) + 1, 1, 10);
  return clamp(W[7] * d0Good + (1 - W[7]) * deltaD, 1, 10);
}

/** Stability after successful recall (Review state, rating >= Hard). */
function recallStability(
  d: number,
  s: number,
  r: number,
  rating: Rating,
): number {
  const hardPenalty = rating === Rating.Hard ? W[15] : 1;
  const easyBonus = rating === Rating.Easy ? W[16] : 1;
  return (
    s *
    (Math.exp(W[8]) *
      (11 - d) *
      Math.pow(s, -W[9]) *
      (Math.exp(W[10] * (1 - r)) - 1) *
      hardPenalty *
      easyBonus +
      1)
  );
}

/** Stability after forgetting (lapse — rating = Again in Review state). */
function forgetStability(d: number, s: number, r: number): number {
  return Math.min(
    s,
    W[11] *
      Math.pow(d, -W[12]) *
      (Math.pow(s + 1, W[13]) - 1) *
      Math.exp(W[14] * (1 - r)),
  );
}

// ── Main scheduler ──────────────────────────────────────────

/**
 * Schedule the next review for a card.
 *
 * @param card - Existing card state, or `null` for a brand-new item.
 * @param rating - 1=Again, 2=Hard, 3=Good, 4=Easy.
 */
export function scheduleFSRS(
  card: FSRSCard | null,
  rating: Rating,
): ScheduleResult {
  const now = new Date();

  // ── New card (first ever review) ──────────────────────────
  if (!card || card.fsrsState === FSRSState.New) {
    const s = initStability(rating);
    const d = initDifficulty(rating);

    if (rating <= Rating.Hard) {
      const scheduledDays = rating === Rating.Again ? 0 : 1;
      return {
        stability: s,
        difficulty: d,
        elapsedDays: 0,
        scheduledDays,
        reps: 1,
        lapses: rating === Rating.Again ? 1 : 0,
        fsrsState: FSRSState.Learning,
        nextReviewAt: addDays(now, scheduledDays),
      };
    }

    // Good or Easy → graduate straight to Review
    const scheduledDays = nextInterval(s);
    return {
      stability: s,
      difficulty: d,
      elapsedDays: 0,
      scheduledDays,
      reps: 1,
      lapses: 0,
      fsrsState: FSRSState.Review,
      nextReviewAt: addDays(now, scheduledDays),
    };
  }

  // ── Existing card ─────────────────────────────────────────
  const elapsedDays = daysBetween(card.lastReviewAt, now);

  // ── Learning / Relearning ─────────────────────────────────
  if (
    card.fsrsState === FSRSState.Learning ||
    card.fsrsState === FSRSState.Relearning
  ) {
    const d = nextDifficulty(card.difficulty, rating);

    if (rating === Rating.Again) {
      return {
        stability: Math.max(0.1, card.stability * 0.5),
        difficulty: d,
        elapsedDays,
        scheduledDays: 0,
        reps: card.reps + 1,
        lapses: card.lapses + 1,
        fsrsState: card.fsrsState,
        nextReviewAt: now,
      };
    }

    if (rating === Rating.Hard) {
      return {
        stability: card.stability,
        difficulty: d,
        elapsedDays,
        scheduledDays: 1,
        reps: card.reps + 1,
        lapses: card.lapses,
        fsrsState: card.fsrsState,
        nextReviewAt: addDays(now, 1),
      };
    }

    // Good or Easy → graduate to Review
    const scheduledDays = nextInterval(card.stability);
    return {
      stability: card.stability,
      difficulty: d,
      elapsedDays,
      scheduledDays,
      reps: card.reps + 1,
      lapses: card.lapses,
      fsrsState: FSRSState.Review,
      nextReviewAt: addDays(now, scheduledDays),
    };
  }

  // ── Review state — full FSRS scheduling ───────────────────
  const r = retrievability(elapsedDays, card.stability);
  const d = nextDifficulty(card.difficulty, rating);

  if (rating === Rating.Again) {
    const s = forgetStability(d, card.stability, r);
    return {
      stability: s,
      difficulty: d,
      elapsedDays,
      scheduledDays: 0,
      reps: card.reps + 1,
      lapses: card.lapses + 1,
      fsrsState: FSRSState.Relearning,
      nextReviewAt: now,
    };
  }

  // Hard, Good, or Easy → stay in Review with updated stability
  const s = recallStability(d, card.stability, r, rating);
  const scheduledDays = nextInterval(s);
  return {
    stability: s,
    difficulty: d,
    elapsedDays,
    scheduledDays,
    reps: card.reps + 1,
    lapses: card.lapses,
    fsrsState: FSRSState.Review,
    nextReviewAt: addDays(now, scheduledDays),
  };
}
