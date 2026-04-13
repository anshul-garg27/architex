// ── FSRS (Free Spaced Repetition Scheduler) implementation ─────────

export interface ReviewCard {
  id: string;
  conceptName: string;
  difficulty: number;       // 0.0-1.0, higher = harder
  stability: number;        // days until 90% recall probability
  interval: number;         // days until next review
  reps: number;             // successful review count
  lapses: number;           // failed review count
  lastReview: Date | null;
  nextReview: Date;
  state: 'new' | 'learning' | 'review' | 'relearning';
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

// ── FSRS Constants ─────────────────────────────────────────────────

const RATING_VALUE: Record<Rating, number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

/** Initial stability values by rating for new cards (in days). */
const INITIAL_STABILITY: Record<Rating, number> = {
  again: 0.4,
  hard: 0.9,
  good: 2.5,
  easy: 6.0,
};

/** Multiplier applied to interval based on rating. */
const INTERVAL_MODIFIER: Record<Rating, number> = {
  again: 0,      // reset
  hard: 1.2,
  good: 2.5,
  easy: 4.0,
};

/** Target retention probability (90%). */
const TARGET_RETENTION = 0.9;

/** Minimum interval in days. */
const MIN_INTERVAL = 1;

/** Maximum interval in days (~1 year). */
const MAX_INTERVAL = 365;

// ── Core scheduling ────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + Math.round(days));
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Update difficulty based on rating.
 * Difficulty increases on failure, decreases on easy.
 */
function updateDifficulty(current: number, rating: Rating): number {
  const ratingVal = RATING_VALUE[rating];
  // Mean reversion towards 0.5 + adjustment based on rating
  const delta = (ratingVal - 3) * 0.1;
  const newDifficulty = current - delta + 0.05 * (0.5 - current);
  return clamp(newDifficulty, 0.01, 0.99);
}

/**
 * Update stability based on rating, current stability, difficulty, and elapsed time.
 */
function updateStability(
  currentStability: number,
  difficulty: number,
  rating: Rating,
  elapsedDays: number,
): number {
  const ratingVal = RATING_VALUE[rating];

  if (rating === 'again') {
    // Stability drops significantly on failure, but retains a fraction
    return Math.max(0.4, currentStability * 0.3 * (1 - difficulty * 0.5));
  }

  // Retrievability at the time of review
  const retrievability = Math.exp(-elapsedDays / currentStability);

  // Stability increase factor: harder cards grow stability slower
  const difficultyPenalty = 1 - difficulty * 0.3;
  const ratingBonus = 0.5 + ratingVal * 0.5;
  const retrievabilityBonus = 1 + (1 - retrievability) * 2; // Harder recalls boost stability more

  const growthFactor = ratingBonus * difficultyPenalty * retrievabilityBonus;

  return Math.max(currentStability + 0.1, currentStability * growthFactor);
}

/**
 * Calculate the next interval from stability and target retention.
 */
function stabilityToInterval(stability: number): number {
  // interval = stability * -ln(target_retention)
  // For 90% retention: -ln(0.9) ~ 0.1054
  const interval = stability * (-Math.log(TARGET_RETENTION));
  return clamp(Math.round(interval), MIN_INTERVAL, MAX_INTERVAL);
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Schedule the next review for a card based on the user's rating.
 * Returns a new card object (immutable update).
 */
export function scheduleReview(card: ReviewCard, rating: Rating): ReviewCard {
  const now = new Date();
  const elapsedDays = card.lastReview ? daysBetween(card.lastReview, now) : 0;

  let newState: ReviewCard['state'];
  let newStability: number;
  let newDifficulty: number;
  let newInterval: number;
  let newReps: number;
  let newLapses: number;

  if (card.state === 'new') {
    // First review of a new card
    newStability = INITIAL_STABILITY[rating];
    newDifficulty = rating === 'again' ? 0.7 : rating === 'hard' ? 0.5 : rating === 'good' ? 0.3 : 0.15;

    if (rating === 'again') {
      newState = 'learning';
      newInterval = 0; // review again same session
      newReps = 0;
      newLapses = 1;
    } else {
      newState = 'review';
      newInterval = stabilityToInterval(newStability);
      newReps = 1;
      newLapses = 0;
    }
  } else if (rating === 'again') {
    // Lapse: card forgotten
    newDifficulty = updateDifficulty(card.difficulty, rating);
    newStability = updateStability(card.stability, newDifficulty, rating, elapsedDays);
    newInterval = MIN_INTERVAL;
    newState = card.state === 'learning' ? 'learning' : 'relearning';
    newReps = 0;
    newLapses = card.lapses + 1;
  } else {
    // Successful review
    newDifficulty = updateDifficulty(card.difficulty, rating);
    newStability = updateStability(card.stability, newDifficulty, rating, elapsedDays);
    newInterval = stabilityToInterval(newStability);

    // Apply interval modifier for hard/easy
    if (rating === 'hard') {
      newInterval = Math.max(MIN_INTERVAL, Math.round(newInterval * 0.8));
    } else if (rating === 'easy') {
      newInterval = Math.min(MAX_INTERVAL, Math.round(newInterval * 1.3));
    }

    newState = 'review';
    newReps = card.reps + 1;
    newLapses = card.lapses;
  }

  return {
    ...card,
    difficulty: newDifficulty,
    stability: Math.round(newStability * 100) / 100,
    interval: newInterval,
    reps: newReps,
    lapses: newLapses,
    lastReview: now,
    nextReview: addDays(now, newInterval),
    state: newState,
  };
}

/**
 * Get all cards that are due for review (nextReview <= now).
 * Sorted by most overdue first.
 */
export function getDueCards(cards: ReviewCard[], now?: Date): ReviewCard[] {
  const cutoff = now ?? new Date();
  return cards
    .filter((c) => c.nextReview.getTime() <= cutoff.getTime())
    .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());
}

/**
 * Create a new review card for a concept.
 */
export function createCard(conceptName: string): ReviewCard {
  const id = `card-${conceptName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  return {
    id,
    conceptName,
    difficulty: 0.3,
    stability: 0,
    interval: 0,
    reps: 0,
    lapses: 0,
    lastReview: null,
    nextReview: new Date(), // due immediately
    state: 'new',
  };
}

/**
 * Get retention statistics across all cards.
 */
export function getRetentionStats(cards: ReviewCard[]): {
  totalCards: number;
  dueToday: number;
  masteredCount: number;
  averageRetention: number;
  streakDays: number;
} {
  const now = new Date();
  const dueCards = getDueCards(cards, now);

  // A card is "mastered" if it has 5+ successful reps and stability > 30 days
  const masteredCount = cards.filter(
    (c) => c.reps >= 5 && c.stability > 30 && c.state === 'review',
  ).length;

  // Estimate average retention probability across all review cards
  let totalRetention = 0;
  let reviewCardCount = 0;
  for (const card of cards) {
    if (card.state !== 'new' && card.lastReview && card.stability > 0) {
      const elapsed = daysBetween(card.lastReview, now);
      const retention = Math.exp(-elapsed / card.stability);
      totalRetention += retention;
      reviewCardCount++;
    }
  }
  const averageRetention = reviewCardCount > 0 ? Math.round((totalRetention / reviewCardCount) * 100) : 0;

  // Calculate streak: count consecutive days (going backwards) that had at least one review
  let streakDays = 0;
  const reviewDates = new Set(
    cards
      .filter((c) => c.lastReview !== null)
      .map((c) => {
        const d = c.lastReview as Date;
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
  );

  const checkDate = new Date(now);
  // Start from today
  for (let i = 0; i < 365; i++) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (reviewDates.has(key)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Today hasn't been reviewed yet -- check if yesterday was
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    } else {
      break;
    }
  }

  return {
    totalCards: cards.length,
    dueToday: dueCards.length,
    masteredCount,
    averageRetention,
    streakDays,
  };
}
