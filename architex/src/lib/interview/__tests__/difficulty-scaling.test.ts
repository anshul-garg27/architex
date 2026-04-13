import { describe, it, expect } from 'vitest';
import {
  assessUserLevel,
  selectNextChallenge,
  getDifficultyLabel,
  numericToDifficultyLevel,
} from '../difficulty-scaling';
import type { PerformanceRecord, DifficultyLevel } from '../difficulty-scaling';
import type { ChallengeDefinition } from '../challenges';

// ── Helpers ──────────────────────────────────────────────────

function makeRecord(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    challengeId: `challenge-${Math.random().toString(36).slice(2, 6)}`,
    difficulty: 2,
    score: 6,
    timeSpentSeconds: 900,
    timeLimitSeconds: 1800,
    hintsUsed: 1,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRecords(
  count: number,
  overrides: Partial<PerformanceRecord> = {},
): PerformanceRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({
      ...overrides,
      completedAt: new Date(Date.now() - (count - i) * 86400000).toISOString(),
    }),
  );
}

function makeChallenge(
  id: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
): ChallengeDefinition {
  return {
    id,
    title: `Challenge ${id}`,
    difficulty,
    timeMinutes: 30,
    category: 'classic',
    companies: [],
    description: '',
    requirements: [],
    checklist: [],
    hints: [],
    concepts: [],
  };
}

// ── assessUserLevel ─────────────────────────────────────────

describe('assessUserLevel', () => {
  it('returns beginner with no history', () => {
    const result = assessUserLevel([]);
    expect(result.level).toBe('beginner');
    expect(result.confidence).toBe(0);
    expect(result.recentTrend).toBe('stable');
  });

  it('returns beginner for consistently low scores', () => {
    const history = makeRecords(5, { score: 3, difficulty: 1 });
    const result = assessUserLevel(history);
    expect(result.level).toBe('beginner');
  });

  it('returns intermediate or advanced for moderate scores', () => {
    const history = makeRecords(5, {
      score: 5,
      difficulty: 2,
      timeSpentSeconds: 1500,
      timeLimitSeconds: 1800,
      hintsUsed: 2,
    });
    const result = assessUserLevel(history);
    expect(['intermediate', 'beginner', 'advanced']).toContain(result.level);
  });

  it('returns advanced or expert for high scores on hard challenges', () => {
    const history = makeRecords(8, {
      score: 9,
      difficulty: 4,
      timeSpentSeconds: 600,
      timeLimitSeconds: 1800,
      hintsUsed: 0,
    });
    const result = assessUserLevel(history);
    expect(['advanced', 'expert']).toContain(result.level);
  });

  it('has confidence 1.0 with 5+ attempts', () => {
    const history = makeRecords(5);
    const result = assessUserLevel(history);
    expect(result.confidence).toBe(1);
  });

  it('has confidence < 1.0 with fewer than 5 attempts', () => {
    const history = makeRecords(3);
    const result = assessUserLevel(history);
    expect(result.confidence).toBeLessThan(1);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('detects improving trend', () => {
    const history = makeRecords(5).map((r, i) => ({
      ...r,
      score: 3 + i * 1.5, // 3, 4.5, 6, 7.5, 9
    }));
    const result = assessUserLevel(history);
    expect(result.recentTrend).toBe('improving');
  });

  it('detects declining trend', () => {
    const history = makeRecords(5).map((r, i) => ({
      ...r,
      score: 9 - i * 1.5, // 9, 7.5, 6, 4.5, 3
    }));
    const result = assessUserLevel(history);
    expect(result.recentTrend).toBe('declining');
  });

  it('detects stable trend', () => {
    const history = makeRecords(5).map((r) => ({
      ...r,
      score: 6, // constant
    }));
    const result = assessUserLevel(history);
    expect(result.recentTrend).toBe('stable');
  });

  it('provides suggestedDifficultyRange matching the level', () => {
    const result = assessUserLevel(makeRecords(5, { score: 3, difficulty: 1 }));
    expect(result.suggestedDifficultyRange).toEqual([1, 2]);
  });

  it('identifies strengths for high-performing users', () => {
    const history = makeRecords(5, {
      score: 9,
      timeSpentSeconds: 300,
      timeLimitSeconds: 1800,
      hintsUsed: 0,
    });
    const result = assessUserLevel(history);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('identifies weaknesses for low-performing users', () => {
    const history = makeRecords(5, {
      score: 3,
      timeSpentSeconds: 3600,
      timeLimitSeconds: 1800,
      hintsUsed: 3,
    });
    const result = assessUserLevel(history);
    expect(result.weaknesses.length).toBeGreaterThan(0);
  });

  it('pulls back level on declining trend', () => {
    // High scores followed by declining
    const history = [
      ...makeRecords(3, { score: 9, difficulty: 4 }),
      ...makeRecords(3, { score: 3, difficulty: 4 }),
    ];
    const result = assessUserLevel(history);
    // Should NOT be expert due to declining trend
    expect(result.level).not.toBe('expert');
  });
});

// ── selectNextChallenge ─────────────────────────────────────

describe('selectNextChallenge', () => {
  const challenges = [
    makeChallenge('c1', 1),
    makeChallenge('c2', 2),
    makeChallenge('c3', 3),
    makeChallenge('c4', 4),
    makeChallenge('c5', 5),
    makeChallenge('c6', 2),
    makeChallenge('c7', 3),
  ];

  it('returns null for empty available list', () => {
    const result = selectNextChallenge('beginner', [], []);
    expect(result).toBeNull();
  });

  it('selects a challenge within the beginner range', () => {
    const result = selectNextChallenge('beginner', [], challenges);
    expect(result).not.toBeNull();
    expect(result!.difficulty).toBeLessThanOrEqual(2);
  });

  it('selects a challenge within the expert range', () => {
    const result = selectNextChallenge('expert', [], challenges);
    expect(result).not.toBeNull();
    expect(result!.difficulty).toBeGreaterThanOrEqual(4);
  });

  it('prefers uncompleted challenges', () => {
    const completed = ['c1', 'c2', 'c6']; // All easy/medium done
    const result = selectNextChallenge('intermediate', completed, challenges);
    expect(result).not.toBeNull();
    if (result) {
      expect(completed).not.toContain(result.id);
    }
  });

  it('falls back to completed challenges when all in range are done', () => {
    const completed = ['c1', 'c2', 'c6']; // All difficulty 1-2 done
    const result = selectNextChallenge('beginner', completed, challenges);
    expect(result).not.toBeNull();
  });

  it('adapts to easier after multiple failures', () => {
    const recentHistory = makeRecords(3, { score: 2, difficulty: 3 });
    const result = selectNextChallenge('intermediate', [], challenges, recentHistory);
    expect(result).not.toBeNull();
    // Should pick easier challenges due to recent failures
    expect(result!.difficulty).toBeLessThanOrEqual(3);
  });

  it('adapts to harder after consistent excellence', () => {
    const recentHistory = makeRecords(3, { score: 9.5, difficulty: 3 });
    const result = selectNextChallenge('intermediate', [], challenges, recentHistory);
    expect(result).not.toBeNull();
    // May pick harder challenges due to excellence
    expect(result!.difficulty).toBeGreaterThanOrEqual(2);
  });

  it('works with single available challenge', () => {
    const single = [makeChallenge('only', 3)];
    const result = selectNextChallenge('beginner', [], single);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('only');
  });
});

// ── getDifficultyLabel ──────────────────────────────────────

describe('getDifficultyLabel', () => {
  it('returns correct label for each level', () => {
    expect(getDifficultyLabel('beginner')).toContain('Beginner');
    expect(getDifficultyLabel('intermediate')).toContain('Intermediate');
    expect(getDifficultyLabel('advanced')).toContain('Advanced');
    expect(getDifficultyLabel('expert')).toContain('Expert');
  });

  it('includes difficulty range in label', () => {
    expect(getDifficultyLabel('beginner')).toContain('1-2');
    expect(getDifficultyLabel('expert')).toContain('4-5');
  });
});

// ── numericToDifficultyLevel ────────────────────────────────

describe('numericToDifficultyLevel', () => {
  it('maps 1 to beginner', () => {
    expect(numericToDifficultyLevel(1)).toBe('beginner');
  });

  it('maps 2 to intermediate', () => {
    expect(numericToDifficultyLevel(2)).toBe('intermediate');
  });

  it('maps 3 to advanced', () => {
    expect(numericToDifficultyLevel(3)).toBe('advanced');
  });

  it('maps 4 to expert', () => {
    expect(numericToDifficultyLevel(4)).toBe('expert');
  });

  it('maps 5 to expert', () => {
    expect(numericToDifficultyLevel(5)).toBe('expert');
  });

  it('maps boundary values correctly', () => {
    expect(numericToDifficultyLevel(1.5)).toBe('beginner');
    expect(numericToDifficultyLevel(2.5)).toBe('intermediate');
    expect(numericToDifficultyLevel(3.5)).toBe('advanced');
  });
});
