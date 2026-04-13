// ── Progressive difficulty: adaptive challenge selection ────────────

import type { ChallengeDefinition } from './challenges';

// ── Types ──────────────────────────────────────────────────────────

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface PerformanceRecord {
  challengeId: string;
  difficulty: number;
  score: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number;
  hintsUsed: number;
  completedAt: string; // ISO date
}

export interface UserAssessment {
  level: DifficultyLevel;
  suggestedDifficultyRange: [min: number, max: number];
  confidence: number; // 0..1 — how confident the assessment is based on history size
  strengths: string[];
  weaknesses: string[];
  recentTrend: 'improving' | 'stable' | 'declining';
}

// ── Constants ──────────────────────────────────────────────────────

const DIFFICULTY_RANGES: Record<DifficultyLevel, [min: number, max: number]> = {
  beginner: [1, 2],
  intermediate: [2, 3],
  advanced: [3, 4],
  expert: [4, 5],
};

/** Score thresholds for assessment. */
const SCORE_THRESHOLDS = {
  failing: 4,
  passing: 6,
  good: 7.5,
  excellent: 9,
} as const;

/** Minimum attempts before confident assessment. */
const MIN_ATTEMPTS_CONFIDENT = 5;

/** Number of recent attempts to consider for trend detection. */
const TREND_WINDOW = 5;

/** Weight of recent vs older attempts (exponential decay). */
const RECENCY_DECAY = 0.85;

// ── Assessment ─────────────────────────────────────────────────────

/**
 * Analyze past performance history to determine the user's current level.
 *
 * Factors considered:
 *   1. Weighted average score (recent attempts weighted more heavily)
 *   2. Success rate (% of challenges with score >= 6)
 *   3. Average time efficiency (time used vs. time limit)
 *   4. Hints-per-challenge ratio
 *   5. Difficulty of challenges attempted
 */
export function assessUserLevel(history: PerformanceRecord[]): UserAssessment {
  if (history.length === 0) {
    return {
      level: 'beginner',
      suggestedDifficultyRange: [1, 2],
      confidence: 0,
      strengths: [],
      weaknesses: [],
      recentTrend: 'stable',
    };
  }

  // Sort by date ascending (oldest first)
  const sorted = [...history].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );

  // 1. Weighted average score (recent attempts weighted more heavily)
  let weightedScore = 0;
  let totalWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    const weight = Math.pow(RECENCY_DECAY, sorted.length - 1 - i);
    weightedScore += sorted[i].score * weight;
    totalWeight += weight;
  }
  const avgScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // 2. Success rate
  const passingAttempts = sorted.filter((r) => r.score >= SCORE_THRESHOLDS.passing).length;
  const successRate = sorted.length > 0 ? passingAttempts / sorted.length : 0;

  // 3. Time efficiency (lower is faster, 0..1 where 0.5 means used half the time)
  const timeEfficiencies = sorted.map((r) =>
    r.timeLimitSeconds > 0
      ? Math.min(r.timeSpentSeconds / r.timeLimitSeconds, 2)
      : 1,
  );
  const avgTimeEfficiency =
    timeEfficiencies.reduce((a, b) => a + b, 0) / timeEfficiencies.length;

  // 4. Hints ratio
  const avgHints =
    sorted.reduce((sum, r) => sum + r.hintsUsed, 0) / sorted.length;

  // 5. Average difficulty attempted
  const avgDifficulty =
    sorted.reduce((sum, r) => sum + r.difficulty, 0) / sorted.length;

  // ── Composite score (0..10 scale) ──────────────────────────────
  // Weighted combination of factors
  const composite =
    avgScore * 0.4 +                                    // Core competency
    successRate * 10 * 0.2 +                            // Consistency
    (1 - Math.min(avgTimeEfficiency, 1)) * 10 * 0.1 +  // Speed bonus
    Math.max(0, 3 - avgHints) * (10 / 3) * 0.1 +       // Hint independence
    avgDifficulty * 2 * 0.2;                            // Difficulty ambition

  // ── Determine level from composite ─────────────────────────────
  let level: DifficultyLevel;
  if (composite >= 8) {
    level = 'expert';
  } else if (composite >= 6) {
    level = 'advanced';
  } else if (composite >= 4) {
    level = 'intermediate';
  } else {
    level = 'beginner';
  }

  // ── Trend detection ────────────────────────────────────────────
  const recentTrend = detectTrend(sorted);

  // ── Adjust level based on trend ────────────────────────────────
  // If declining, pull back one level for safety
  if (recentTrend === 'declining' && level !== 'beginner') {
    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const idx = levels.indexOf(level);
    level = levels[Math.max(0, idx - 1)];
  }

  // ── Strengths and weaknesses ───────────────────────────────────
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (avgScore >= SCORE_THRESHOLDS.good) strengths.push('High average scores');
  if (successRate >= 0.8) strengths.push('Consistent pass rate');
  if (avgTimeEfficiency < 0.6) strengths.push('Fast completion times');
  if (avgHints < 1) strengths.push('Minimal hint usage');

  if (avgScore < SCORE_THRESHOLDS.passing) weaknesses.push('Scores below passing threshold');
  if (successRate < 0.5) weaknesses.push('Low success rate');
  if (avgTimeEfficiency > 1.0) weaknesses.push('Often exceeding time limits');
  if (avgHints > 2) weaknesses.push('Heavy reliance on hints');

  const confidence = Math.min(sorted.length / MIN_ATTEMPTS_CONFIDENT, 1);

  return {
    level,
    suggestedDifficultyRange: DIFFICULTY_RANGES[level],
    confidence,
    strengths,
    weaknesses,
    recentTrend,
  };
}

// ── Trend detection ────────────────────────────────────────────────

function detectTrend(
  sortedHistory: PerformanceRecord[],
): 'improving' | 'stable' | 'declining' {
  if (sortedHistory.length < 3) return 'stable';

  const recent = sortedHistory.slice(-TREND_WINDOW);
  if (recent.length < 2) return 'stable';

  // Simple linear regression on scores
  const n = recent.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recent[i].score;
    sumXY += i * recent[i].score;
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 'stable';

  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Threshold for significance
  if (slope > 0.3) return 'improving';
  if (slope < -0.3) return 'declining';
  return 'stable';
}

// ── Challenge selection ────────────────────────────────────────────

/**
 * Select the next most appropriate challenge based on user level.
 *
 * Strategy:
 *   1. Filter to appropriate difficulty range
 *   2. Exclude already-completed challenges (prefer fresh ones)
 *   3. Prioritize challenges the user hasn't attempted
 *   4. Add slight randomization for variety
 *
 * Adaptive behavior:
 *   - Too many recent failures -> suggest easier challenges
 *   - Consistent success -> suggest harder challenges
 */
export function selectNextChallenge(
  level: DifficultyLevel,
  completedIds: string[],
  available: ChallengeDefinition[],
  recentHistory?: PerformanceRecord[],
): ChallengeDefinition | null {
  if (available.length === 0) return null;

  const [minDiff, maxDiff] = DIFFICULTY_RANGES[level];
  const completedSet = new Set(completedIds);

  // Adaptive adjustment based on recent performance
  let adjustedMin = minDiff;
  let adjustedMax = maxDiff;

  if (recentHistory && recentHistory.length >= 3) {
    const lastThree = recentHistory.slice(-3);
    const recentAvg = lastThree.reduce((sum, r) => sum + r.score, 0) / lastThree.length;
    const recentFailures = lastThree.filter((r) => r.score < SCORE_THRESHOLDS.failing).length;

    // Too many failures -> ease up
    if (recentFailures >= 2) {
      adjustedMin = Math.max(1, minDiff - 1);
      adjustedMax = Math.max(adjustedMin, maxDiff - 1);
    }
    // Consistent excellence -> push harder
    else if (recentAvg >= SCORE_THRESHOLDS.excellent) {
      adjustedMin = Math.min(5, minDiff + 1);
      adjustedMax = Math.min(5, maxDiff + 1);
    }
  }

  // 1. Filter to difficulty range
  const inRange = available.filter(
    (c) => c.difficulty >= adjustedMin && c.difficulty <= adjustedMax,
  );

  // Fallback to anything if no challenges in range
  const pool = inRange.length > 0 ? inRange : available;

  // 2. Prefer uncompleted challenges
  const uncompleted = pool.filter((c) => !completedSet.has(c.id));
  const candidates = uncompleted.length > 0 ? uncompleted : pool;

  // 3. Score each candidate
  const scored = candidates.map((c) => {
    let score = 0;

    // Prefer challenges closer to the center of the difficulty range
    const center = (adjustedMin + adjustedMax) / 2;
    score -= Math.abs(c.difficulty - center) * 2;

    // Prefer uncompleted
    if (!completedSet.has(c.id)) score += 5;

    // Slight randomization for variety
    score += Math.random() * 2;

    return { challenge: c, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.challenge ?? null;
}

/**
 * Get a human-readable description of the difficulty level.
 */
export function getDifficultyLabel(level: DifficultyLevel): string {
  switch (level) {
    case 'beginner':
      return 'Beginner (Difficulty 1-2)';
    case 'intermediate':
      return 'Intermediate (Difficulty 2-3)';
    case 'advanced':
      return 'Advanced (Difficulty 3-4)';
    case 'expert':
      return 'Expert (Difficulty 4-5)';
  }
}

/**
 * Convert a numeric difficulty (1-5) to a DifficultyLevel.
 */
export function numericToDifficultyLevel(difficulty: number): DifficultyLevel {
  if (difficulty <= 1.5) return 'beginner';
  if (difficulty <= 2.5) return 'intermediate';
  if (difficulty <= 3.5) return 'advanced';
  return 'expert';
}
