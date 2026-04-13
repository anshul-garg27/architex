import { describe, it, expect } from 'vitest';
import {
  checkAchievements,
  calculateLevel,
  getStreakStatus,
  getAchievementProgress,
  ACHIEVEMENTS,
} from '../achievements';
import type { UserStats, Achievement } from '../achievements';

// ── Helpers ──────────────────────────────────────────────────

function makeDefaultStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    challengesCompleted: 0,
    challengesByDifficulty: {},
    challengesByCategory: {},
    averageScore: 0,
    perfectScoreCount: 0,
    totalHintsUsed: 0,
    noHintCompletions: 0,
    streakDays: 0,
    longestStreak: 0,
    conceptsMastered: 0,
    totalConcepts: 100,
    chaosEventsSurvived: 0,
    patternsUsed: [],
    fastCompletions: 0,
    sub5MinCompletions: 0,
    totalXp: 0,
    dimensionScores: {},
    earnedAchievementIds: [],
    modulesVisited: [],
    nodeTypesUsed: [],
    templatesLoaded: 0,
    totalTimePracticedMinutes: 0,
    ...overrides,
  };
}

// ── XP & Level Calculation ───────────────────────────────────

describe('calculateLevel', () => {
  it('returns level 1 with 0 XP', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(0);
  });

  it('returns level 1 with 99 XP (below level 2 threshold)', () => {
    // Level 2 requires 50 * 2 * 1 = 100 XP
    const result = calculateLevel(99);
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(99);
  });

  it('returns level 2 at exactly 100 XP', () => {
    // xpForLevel(2) = 50 * 2 * 1 = 100
    const result = calculateLevel(100);
    expect(result.level).toBe(2);
    expect(result.xpInLevel).toBe(0);
  });

  it('returns level 3 at 300 XP', () => {
    // xpForLevel(3) = 50 * 3 * 2 = 300
    const result = calculateLevel(300);
    expect(result.level).toBe(3);
    expect(result.xpInLevel).toBe(0);
  });

  it('calculates correct xpForNextLevel', () => {
    // Level 2 requires 100, level 3 requires 300, so xpForNextLevel at level 2 = 200
    const result = calculateLevel(100);
    expect(result.xpForNextLevel).toBe(200);
  });

  it('handles mid-level XP correctly', () => {
    // 150 XP: level 2 (starts at 100), 50 into level, next at 300 so 200 span
    const result = calculateLevel(150);
    expect(result.level).toBe(2);
    expect(result.xpInLevel).toBe(50);
    expect(result.xpForNextLevel).toBe(200);
  });

  it('handles high XP values', () => {
    // xpForLevel(10) = 50 * 10 * 9 = 4500
    const result = calculateLevel(4500);
    expect(result.level).toBe(10);
    expect(result.xpInLevel).toBe(0);
  });

  it('returns positive xpForNextLevel for any level', () => {
    for (const xp of [0, 100, 500, 1000, 5000]) {
      const result = calculateLevel(xp);
      expect(result.xpForNextLevel).toBeGreaterThan(0);
    }
  });
});

// ── Streak Tracking ──────────────────────────────────────────

describe('getStreakStatus', () => {
  it('returns streakDays=1 and atRisk=false when last active is today', () => {
    const today = new Date();
    const result = getStreakStatus(today);
    expect(result.streakDays).toBe(1);
    expect(result.atRisk).toBe(false);
  });

  it('returns streakDays=1 and atRisk=true when last active was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = getStreakStatus(yesterday);
    expect(result.streakDays).toBe(1);
    expect(result.atRisk).toBe(true);
  });

  it('returns streakDays=0 when last active was 2 days ago (streak broken)', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const result = getStreakStatus(twoDaysAgo);
    expect(result.streakDays).toBe(0);
    expect(result.atRisk).toBe(false);
  });

  it('returns streakDays=0 when last active was a week ago', () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const result = getStreakStatus(weekAgo);
    expect(result.streakDays).toBe(0);
    expect(result.atRisk).toBe(false);
  });

  it('handles last active date earlier today (same calendar day)', () => {
    const earlierToday = new Date();
    earlierToday.setHours(0, 1, 0, 0); // 00:01 today
    const result = getStreakStatus(earlierToday);
    expect(result.streakDays).toBe(1);
    expect(result.atRisk).toBe(false);
  });
});

// ── Achievement Checking ─────────────────────────────────────

describe('checkAchievements', () => {
  it('returns empty array for brand-new user with no activity', () => {
    const stats = makeDefaultStats();
    const earned = checkAchievements(stats);
    expect(earned).toEqual([]);
  });

  it('unlocks first-design after completing 1 challenge', () => {
    const stats = makeDefaultStats({ challengesCompleted: 1 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('first-design');
  });

  it('unlocks getting-started after completing 5 challenges', () => {
    const stats = makeDefaultStats({ challengesCompleted: 5 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('getting-started');
  });

  it('unlocks dedicated-learner after completing 20 challenges', () => {
    const stats = makeDefaultStats({ challengesCompleted: 20 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('dedicated-learner');
  });

  it('does not return already-earned achievements', () => {
    const stats = makeDefaultStats({
      challengesCompleted: 5,
      earnedAchievementIds: ['first-design', 'getting-started'],
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).not.toContain('first-design');
    expect(ids).not.toContain('getting-started');
  });

  it('unlocks three-day-streak at 3 streak days', () => {
    const stats = makeDefaultStats({ streakDays: 3 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('three-day-streak');
  });

  it('unlocks week-warrior at 7 streak days', () => {
    const stats = makeDefaultStats({ streakDays: 7 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('week-warrior');
  });

  it('unlocks month-marathoner at 30 streak days', () => {
    const stats = makeDefaultStats({ streakDays: 30 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('month-marathoner');
  });

  it('unlocks perfectionist when perfectScoreCount >= 1', () => {
    const stats = makeDefaultStats({ perfectScoreCount: 1 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('perfectionist');
  });

  it('unlocks speed-demon when fastCompletions >= 1', () => {
    const stats = makeDefaultStats({ fastCompletions: 1 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('speed-demon');
  });

  it('unlocks chaos-master when chaosEventsSurvived >= 10', () => {
    const stats = makeDefaultStats({ chaosEventsSurvived: 10 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('chaos-master');
  });

  it('unlocks concept-master when conceptsMastered >= 50', () => {
    const stats = makeDefaultStats({ conceptsMastered: 50 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('concept-master');
  });

  it('unlocks difficulty-climber when all difficulty levels completed', () => {
    const stats = makeDefaultStats({
      challengesByDifficulty: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('difficulty-climber');
  });

  it('does not unlock difficulty-climber when a level is missing', () => {
    const stats = makeDefaultStats({
      challengesByDifficulty: { 1: 1, 2: 1, 3: 1, 5: 1 },
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).not.toContain('difficulty-climber');
  });

  it('unlocks hint-collector when totalHintsUsed >= 50', () => {
    const stats = makeDefaultStats({ totalHintsUsed: 50 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('hint-collector');
  });

  it('unlocks api-architect with 5+ high API scores', () => {
    const stats = makeDefaultStats({
      dimensionScores: { api: [8, 9, 8, 10, 8] },
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('api-architect');
  });

  it('does not unlock api-architect with only 4 high API scores', () => {
    const stats = makeDefaultStats({
      dimensionScores: { api: [8, 9, 8, 10] },
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).not.toContain('api-architect');
  });
});

// ── New achievements tests ──────────────────────────────────

describe('new achievement categories', () => {
  it('unlocks ten-challenges after completing 10 challenges', () => {
    const stats = makeDefaultStats({ challengesCompleted: 10 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('ten-challenges');
  });

  it('unlocks all-categories when all four categories completed', () => {
    const stats = makeDefaultStats({
      challengesByCategory: { classic: 1, modern: 1, infrastructure: 1, advanced: 1 },
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('all-categories');
  });

  it('does not unlock all-categories when a category is missing', () => {
    const stats = makeDefaultStats({
      challengesByCategory: { classic: 1, modern: 1, infrastructure: 1 },
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).not.toContain('all-categories');
  });

  it('unlocks sub-5-minute when sub5MinCompletions >= 1', () => {
    const stats = makeDefaultStats({ sub5MinCompletions: 1 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('sub-5-minute');
  });

  it('unlocks five-no-hints when noHintCompletions >= 5', () => {
    const stats = makeDefaultStats({ noHintCompletions: 5 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('five-no-hints');
  });

  it('unlocks two-week-streak at 14 streak days', () => {
    const stats = makeDefaultStats({ streakDays: 14 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('two-week-streak');
  });

  it('unlocks try-all-modules when 13 modules visited', () => {
    const stats = makeDefaultStats({
      modulesVisited: Array.from({ length: 13 }, (_, i) => `module-${i}`),
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('try-all-modules');
  });

  it('unlocks use-all-node-types when 10+ node types used', () => {
    const stats = makeDefaultStats({
      nodeTypesUsed: Array.from({ length: 10 }, (_, i) => `type-${i}`),
    });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('use-all-node-types');
  });

  it('unlocks template-explorer when 50 templates loaded', () => {
    const stats = makeDefaultStats({ templatesLoaded: 50 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('template-explorer');
  });

  it('unlocks system-design-guru at 30 challenges with avg 8+', () => {
    const stats = makeDefaultStats({ challengesCompleted: 30, averageScore: 8.5 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('system-design-guru');
  });

  it('does not unlock system-design-guru if avg score too low', () => {
    const stats = makeDefaultStats({ challengesCompleted: 30, averageScore: 7 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).not.toContain('system-design-guru');
  });

  it('unlocks marathon-runner at 6000 minutes practiced', () => {
    const stats = makeDefaultStats({ totalTimePracticedMinutes: 6000 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('marathon-runner');
  });

  it('unlocks streak via longestStreak even if current streak is lower', () => {
    const stats = makeDefaultStats({ streakDays: 1, longestStreak: 30 });
    const earned = checkAchievements(stats);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('month-marathoner');
  });
});

// ── Achievement progress ────────────────────────────────────

describe('getAchievementProgress', () => {
  it('returns progress for multi-step achievements', () => {
    const stats = makeDefaultStats({ challengesCompleted: 3 });
    const tenChallenges = ACHIEVEMENTS.find((a) => a.id === 'ten-challenges')!;
    const result = getAchievementProgress(tenChallenges, stats);
    expect(result).toEqual([3, 10]);
  });

  it('caps progress at max', () => {
    const stats = makeDefaultStats({ challengesCompleted: 25 });
    const tenChallenges = ACHIEVEMENTS.find((a) => a.id === 'ten-challenges')!;
    const result = getAchievementProgress(tenChallenges, stats);
    expect(result).toEqual([10, 10]);
  });

  it('returns null for achievements without maxProgress', () => {
    const stats = makeDefaultStats();
    const perfectionist = ACHIEVEMENTS.find((a) => a.id === 'perfectionist')!;
    const result = getAchievementProgress(perfectionist, stats);
    expect(result).toBeNull();
  });
});

// ── ACHIEVEMENTS constant ────────────────────────────────────

describe('ACHIEVEMENTS constant', () => {
  it('contains at least 30 achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(30);
  });

  it('every achievement has a unique id', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every achievement has a positive xpReward', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.xpReward).toBeGreaterThan(0);
    }
  });

  it('every achievement has a valid rarity', () => {
    const validRarities = ['common', 'rare', 'epic', 'legendary'];
    for (const a of ACHIEVEMENTS) {
      expect(validRarities).toContain(a.rarity);
    }
  });

  it('has achievements in all expected categories', () => {
    const categories = new Set(ACHIEVEMENTS.map((a) => a.category));
    expect(categories).toContain('learning');
    expect(categories).toContain('design');
    expect(categories).toContain('streak');
    expect(categories).toContain('mastery');
    expect(categories).toContain('exploration');
  });
});
