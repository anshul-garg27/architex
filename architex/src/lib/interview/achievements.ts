// ── Gamification: achievements, XP, levels, and streaks ────────────

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'design' | 'streak' | 'mastery' | 'social' | 'exploration';
  condition: string;
  xpReward: number;
  rarity: AchievementRarity;
  /** For multi-step achievements, max progress value (e.g. 20 for "complete 20 challenges"). */
  maxProgress?: number;
}

export interface UserStats {
  challengesCompleted: number;
  challengesByDifficulty: Record<number, number>;
  challengesByCategory: Record<string, number>;
  averageScore: number;
  perfectScoreCount: number;       // scored 9+ on ALL dimensions
  totalHintsUsed: number;
  noHintCompletions: number;       // challenges completed with 0 hints
  streakDays: number;
  longestStreak: number;
  conceptsMastered: number;
  totalConcepts: number;
  chaosEventsSurvived: number;
  patternsUsed: string[];
  fastCompletions: number;         // completed hard+ in < 30 min
  sub5MinCompletions: number;      // completed any challenge in < 5 min
  totalXp: number;
  dimensionScores: Record<string, number[]>; // history of scores per dimension
  earnedAchievementIds: string[];
  modulesVisited: string[];        // distinct module IDs visited
  nodeTypesUsed: string[];         // distinct node types placed on canvas
  templatesLoaded: number;         // total templates loaded
  totalTimePracticedMinutes: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Completion (Learning) ────────────────────────────────
  {
    id: 'first-design',
    name: 'First Design',
    description: 'Complete your first system design challenge.',
    icon: 'Rocket',
    category: 'learning',
    condition: 'Complete 1 challenge.',
    xpReward: 50,
    rarity: 'common',
    maxProgress: 1,
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Complete 5 system design challenges.',
    icon: 'GraduationCap',
    category: 'learning',
    condition: 'Complete 5 challenges.',
    xpReward: 100,
    rarity: 'common',
    maxProgress: 5,
  },
  {
    id: 'ten-challenges',
    name: '10 Challenges',
    description: 'Complete 10 system design challenges.',
    icon: 'Award',
    category: 'learning',
    condition: 'Complete 10 challenges.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 10,
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Complete 20 system design challenges.',
    icon: 'BookOpen',
    category: 'learning',
    condition: 'Complete 20 challenges.',
    xpReward: 300,
    rarity: 'rare',
    maxProgress: 20,
  },
  {
    id: 'all-categories',
    name: 'All Categories',
    description: 'Complete challenges in all four categories: classic, modern, infrastructure, and advanced.',
    icon: 'Compass',
    category: 'learning',
    condition: 'Complete at least one classic, modern, infrastructure, and advanced challenge.',
    xpReward: 200,
    rarity: 'rare',
  },

  // ── Skill ────────────────────────────────────────────────
  {
    id: 'sub-5-minute',
    name: 'Sub-5-Minute Design',
    description: 'Complete any challenge in under 5 minutes.',
    icon: 'Timer',
    category: 'mastery',
    condition: 'Complete a challenge in under 5 minutes.',
    xpReward: 150,
    rarity: 'epic',
  },
  {
    id: 'perfectionist',
    name: 'Perfect Score',
    description: 'Score 9+ on all 6 dimensions in a single challenge.',
    icon: 'Star',
    category: 'mastery',
    condition: 'All 6 dimensions >= 9 in one evaluation.',
    xpReward: 500,
    rarity: 'legendary',
  },
  {
    id: 'no-hints-needed',
    name: 'No Hints Used',
    description: 'Complete a challenge without using any hints.',
    icon: 'Eye',
    category: 'mastery',
    condition: 'Complete a challenge with 0 hints used.',
    xpReward: 75,
    rarity: 'common',
  },
  {
    id: 'five-no-hints',
    name: 'Self-Reliant',
    description: 'Complete 5 challenges without using any hints.',
    icon: 'ShieldCheck',
    category: 'mastery',
    condition: 'Complete 5 challenges with 0 hints.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'hint-collector',
    name: 'Hint Collector',
    description: 'Use a total of 50 hints across all challenges.',
    icon: 'Lightbulb',
    category: 'learning',
    condition: 'Use 50 hints total.',
    xpReward: 50,
    rarity: 'common',
    maxProgress: 50,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a hard challenge (difficulty 4+) in under 30 minutes.',
    icon: 'Zap',
    category: 'mastery',
    condition: 'Finish a difficulty 4+ challenge in < 30 minutes.',
    xpReward: 250,
    rarity: 'epic',
  },

  // ── Streaks ──────────────────────────────────────────────
  {
    id: 'three-day-streak',
    name: '3-Day Streak',
    description: 'Practice for 3 consecutive days.',
    icon: 'Flame',
    category: 'streak',
    condition: 'Maintain a 3-day streak.',
    xpReward: 75,
    rarity: 'common',
  },
  {
    id: 'week-warrior',
    name: '7-Day Streak',
    description: 'Practice for 7 consecutive days.',
    icon: 'Calendar',
    category: 'streak',
    condition: 'Maintain a 7-day streak.',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'two-week-streak',
    name: '14-Day Streak',
    description: 'Practice for 14 consecutive days.',
    icon: 'CalendarCheck',
    category: 'streak',
    condition: 'Maintain a 14-day streak.',
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'month-marathoner',
    name: '30-Day Streak',
    description: 'Practice for 30 consecutive days.',
    icon: 'Trophy',
    category: 'streak',
    condition: 'Maintain a 30-day streak.',
    xpReward: 500,
    rarity: 'legendary',
  },

  // ── Exploration ──────────────────────────────────────────
  {
    id: 'try-all-modules',
    name: 'Try All Modules',
    description: 'Visit every module in the Architex platform.',
    icon: 'LayoutGrid',
    category: 'exploration',
    condition: 'Visit all 13 modules.',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'use-all-node-types',
    name: 'Use All Node Types',
    description: 'Place every type of node on the canvas at least once.',
    icon: 'Boxes',
    category: 'exploration',
    condition: 'Use 10+ distinct node types.',
    xpReward: 200,
    rarity: 'epic',
  },
  {
    id: 'template-explorer',
    name: '50 Templates Loaded',
    description: 'Load 50 system design templates.',
    icon: 'FileStack',
    category: 'exploration',
    condition: 'Load 50 templates total.',
    xpReward: 250,
    rarity: 'epic',
    maxProgress: 50,
  },
  {
    id: 'category-explorer',
    name: 'Category Explorer',
    description: 'Complete challenges in all four categories.',
    icon: 'Map',
    category: 'exploration',
    condition: 'Complete at least one classic, modern, infrastructure, and advanced challenge.',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'difficulty-climber',
    name: 'Difficulty Climber',
    description: 'Complete at least one challenge at every difficulty level (1-5).',
    icon: 'Mountain',
    category: 'exploration',
    condition: 'Complete challenges at difficulty 1, 2, 3, 4, and 5.',
    xpReward: 250,
    rarity: 'rare',
  },

  // ── Design Mastery ───────────────────────────────────────
  {
    id: 'api-architect',
    name: 'API Architect',
    description: 'Score 8+ on API Design in 5 different challenges.',
    icon: 'Code',
    category: 'design',
    condition: 'Score 8+ on API Design dimension 5 times.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'data-modeler',
    name: 'Data Modeler',
    description: 'Score 8+ on Data Model in 5 different challenges.',
    icon: 'Database',
    category: 'design',
    condition: 'Score 8+ on Data Model dimension 5 times.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'scale-master',
    name: 'Scale Master',
    description: 'Score 8+ on Scalability in 5 different challenges.',
    icon: 'TrendingUp',
    category: 'design',
    condition: 'Score 8+ on Scalability dimension 5 times.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'reliability-engineer',
    name: 'Reliability Engineer',
    description: 'Score 8+ on Reliability in 5 different challenges.',
    icon: 'Shield',
    category: 'design',
    condition: 'Score 8+ on Reliability dimension 5 times.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'tradeoff-thinker',
    name: 'Trade-off Thinker',
    description: 'Score 8+ on Trade-off Awareness in 5 different challenges.',
    icon: 'Scale',
    category: 'design',
    condition: 'Score 8+ on Trade-off Awareness dimension 5 times.',
    xpReward: 200,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'well-rounded',
    name: 'Well-Rounded',
    description: 'Score at least 6 on every dimension in a single challenge.',
    icon: 'CircleDot',
    category: 'design',
    condition: 'All 6 dimensions >= 6 in one evaluation.',
    xpReward: 150,
    rarity: 'rare',
  },

  // ── Distributed Systems ──────────────────────────────────
  {
    id: 'first-election',
    name: 'First Election',
    description: 'Watch your first Raft leader election.',
    icon: 'Vote',
    category: 'learning',
    condition: 'run_raft_election',
    xpReward: 50,
    rarity: 'common',
  },
  {
    id: 'consensus-master',
    name: 'Consensus Master',
    description: 'Complete all Raft scenarios (election, crash, replication).',
    icon: 'Crown',
    category: 'mastery',
    condition: 'complete_all_raft_scenarios',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'cap-scholar',
    name: 'CAP Scholar',
    description: 'Try all 3 CAP modes with partition injection.',
    icon: 'BookOpen',
    category: 'learning',
    condition: 'try_all_cap_modes',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'gossip-guru',
    name: 'Gossip Guru',
    description: 'Achieve gossip convergence with a killed node.',
    icon: 'MessageCircle',
    category: 'mastery',
    condition: 'gossip_convergence_with_failure',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'crdt-wizard',
    name: 'CRDT Wizard',
    description: 'Merge all 4 CRDT types and resolve a conflict.',
    icon: 'Merge',
    category: 'mastery',
    condition: 'merge_all_crdt_types',
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'partition-survivor',
    name: 'Partition Survivor',
    description: 'Inject and heal a network partition.',
    icon: 'Wifi',
    category: 'exploration',
    condition: 'inject_and_heal_partition',
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'protocol-polyglot',
    name: 'Protocol Polyglot',
    description: 'Visit all 11 distributed simulations.',
    icon: 'Globe',
    category: 'exploration',
    condition: 'visit_all_distributed_sims',
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'speed-convergence',
    name: 'Speed Convergence',
    description: 'Achieve gossip convergence in under 5 rounds.',
    icon: 'Zap',
    category: 'mastery',
    condition: 'gossip_convergence_under_5_rounds',
    xpReward: 150,
    rarity: 'rare',
  },
  {
    id: 'distributed-thinker',
    name: 'Distributed Thinker',
    description: 'Complete 7 consecutive daily distributed challenges.',
    icon: 'Flame',
    category: 'streak',
    condition: 'distributed_streak_7',
    xpReward: 250,
    rarity: 'epic',
  },
  {
    id: 'teaching-machine',
    name: 'Teaching Machine',
    description: 'Correctly predict 10 consecutive simulation outcomes.',
    icon: 'Brain',
    category: 'mastery',
    condition: 'predict_10_consecutive',
    xpReward: 500,
    rarity: 'legendary',
  },

  // ── Mastery ──────────────────────────────────────────────
  {
    id: 'master-caching',
    name: 'Master Caching',
    description: 'Complete all caching-related challenges with a score of 7+.',
    icon: 'HardDrive',
    category: 'mastery',
    condition: 'Complete caching challenges with average score 7+.',
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'master-databases',
    name: 'Master Databases',
    description: 'Score 8+ on Data Model in 10 different challenges.',
    icon: 'Database',
    category: 'mastery',
    condition: 'Score 8+ on Data Model dimension 10 times.',
    xpReward: 400,
    rarity: 'epic',
    maxProgress: 10,
  },
  {
    id: 'system-design-guru',
    name: 'System Design Guru',
    description: 'Complete 30 challenges with an average score of 8+.',
    icon: 'Crown',
    category: 'mastery',
    condition: 'Complete 30+ challenges with average score >= 8.',
    xpReward: 1000,
    rarity: 'legendary',
    maxProgress: 30,
  },
  {
    id: 'chaos-master',
    name: 'Chaos Master',
    description: 'Survive 10 chaos engineering events during challenges.',
    icon: 'Bomb',
    category: 'mastery',
    condition: 'Survive 10 chaos events.',
    xpReward: 300,
    rarity: 'epic',
    maxProgress: 10,
  },
  {
    id: 'pattern-expert',
    name: 'Pattern Expert',
    description: 'Use all classic design patterns in your solutions.',
    icon: 'Puzzle',
    category: 'mastery',
    condition: 'Use all GoF design patterns across challenges.',
    xpReward: 400,
    rarity: 'legendary',
  },
  {
    id: 'concept-master',
    name: 'Concept Master',
    description: 'Master 50 system design concepts via spaced repetition.',
    icon: 'Brain',
    category: 'mastery',
    condition: 'Have 50+ mastered SRS cards.',
    xpReward: 350,
    rarity: 'epic',
    maxProgress: 50,
  },
  {
    id: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Spend 100+ hours total in practice sessions.',
    icon: 'Clock',
    category: 'mastery',
    condition: 'Accumulate 6000 minutes of practice.',
    xpReward: 500,
    rarity: 'legendary',
  },
];

// ── Achievement Checking ──────────────────────────────────────────

/**
 * Check which achievements have been newly earned based on current stats.
 * Returns only achievements not already in `stats.earnedAchievementIds`.
 */
export function checkAchievements(stats: UserStats): Achievement[] {
  const earned: Achievement[] = [];
  const already = new Set(stats.earnedAchievementIds);

  for (const achievement of ACHIEVEMENTS) {
    if (already.has(achievement.id)) continue;
    if (isAchievementMet(achievement, stats)) {
      earned.push(achievement);
    }
  }

  return earned;
}

function isAchievementMet(achievement: Achievement, stats: UserStats): boolean {
  switch (achievement.id) {
    // ── Completion (Learning) ────────────────────────────────
    case 'first-design':
      return stats.challengesCompleted >= 1;
    case 'getting-started':
      return stats.challengesCompleted >= 5;
    case 'ten-challenges':
      return stats.challengesCompleted >= 10;
    case 'dedicated-learner':
      return stats.challengesCompleted >= 20;
    case 'all-categories': {
      const cats = ['classic', 'modern', 'infrastructure', 'advanced'];
      return cats.every((c) => (stats.challengesByCategory[c] ?? 0) >= 1);
    }
    case 'hint-collector':
      return stats.totalHintsUsed >= 50;

    // ── Skill ────────────────────────────────────────────────
    case 'sub-5-minute':
      return stats.sub5MinCompletions >= 1;
    case 'perfectionist':
      return stats.perfectScoreCount >= 1;
    case 'no-hints-needed':
      return stats.noHintCompletions >= 1;
    case 'five-no-hints':
      return stats.noHintCompletions >= 5;
    case 'speed-demon':
      return stats.fastCompletions >= 1;

    // ── Streaks ──────────────────────────────────────────────
    case 'three-day-streak':
      return stats.streakDays >= 3 || stats.longestStreak >= 3;
    case 'week-warrior':
      return stats.streakDays >= 7 || stats.longestStreak >= 7;
    case 'two-week-streak':
      return stats.streakDays >= 14 || stats.longestStreak >= 14;
    case 'month-marathoner':
      return stats.streakDays >= 30 || stats.longestStreak >= 30;

    // ── Exploration ──────────────────────────────────────────
    case 'try-all-modules':
      return stats.modulesVisited.length >= 13;
    case 'use-all-node-types':
      return stats.nodeTypesUsed.length >= 10;
    case 'template-explorer':
      return stats.templatesLoaded >= 50;
    case 'category-explorer': {
      const allCats = ['classic', 'modern', 'infrastructure', 'advanced'];
      return allCats.every((c) => (stats.challengesByCategory[c] ?? 0) >= 1);
    }
    case 'difficulty-climber':
      return [1, 2, 3, 4, 5].every((d) => (stats.challengesByDifficulty[d] ?? 0) >= 1);

    // ── Design Mastery ───────────────────────────────────────
    case 'api-architect':
      return (stats.dimensionScores['api']?.filter((s) => s >= 8).length ?? 0) >= 5;
    case 'data-modeler':
      return (stats.dimensionScores['dataModel']?.filter((s) => s >= 8).length ?? 0) >= 5;
    case 'scale-master':
      return (stats.dimensionScores['scalability']?.filter((s) => s >= 8).length ?? 0) >= 5;
    case 'reliability-engineer':
      return (stats.dimensionScores['reliability']?.filter((s) => s >= 8).length ?? 0) >= 5;
    case 'tradeoff-thinker':
      return (stats.dimensionScores['tradeoffs']?.filter((s) => s >= 8).length ?? 0) >= 5;
    case 'well-rounded':
      return stats.averageScore >= 6 && allDimensionsAbove(stats, 6);

    // ── Distributed Systems ──────────────────────────────────
    // These achievements are event-driven — triggered by the distributed module
    // via condition strings. They return false here because UserStats does not
    // yet carry distributed-specific counters; the distributed module will grant
    // them directly by adding the id to earnedAchievementIds.
    case 'first-election':
    case 'consensus-master':
    case 'cap-scholar':
    case 'gossip-guru':
    case 'crdt-wizard':
    case 'partition-survivor':
    case 'protocol-polyglot':
    case 'speed-convergence':
    case 'distributed-thinker':
    case 'teaching-machine':
      return false;

    // ── Mastery ──────────────────────────────────────────────
    case 'master-caching':
      return (stats.challengesByCategory['infrastructure'] ?? 0) >= 3 && stats.averageScore >= 7;
    case 'master-databases':
      return (stats.dimensionScores['dataModel']?.filter((s) => s >= 8).length ?? 0) >= 10;
    case 'system-design-guru':
      return stats.challengesCompleted >= 30 && stats.averageScore >= 8;
    case 'chaos-master':
      return stats.chaosEventsSurvived >= 10;
    case 'pattern-expert':
      return stats.patternsUsed.length >= 23; // 23 GoF patterns
    case 'concept-master':
      return stats.conceptsMastered >= 50;
    case 'marathon-runner':
      return stats.totalTimePracticedMinutes >= 6000;

    default:
      return false;
  }
}

/**
 * Get the current progress toward a multi-step achievement.
 * Returns [current, max] or null if not multi-step.
 */
export function getAchievementProgress(
  achievement: Achievement,
  stats: UserStats,
): [current: number, max: number] | null {
  if (achievement.maxProgress == null) return null;
  const max = achievement.maxProgress;
  let current = 0;

  switch (achievement.id) {
    case 'first-design':
    case 'getting-started':
    case 'ten-challenges':
    case 'dedicated-learner':
      current = stats.challengesCompleted;
      break;
    case 'hint-collector':
      current = stats.totalHintsUsed;
      break;
    case 'five-no-hints':
      current = stats.noHintCompletions;
      break;
    case 'template-explorer':
      current = stats.templatesLoaded;
      break;
    case 'api-architect':
      current = stats.dimensionScores['api']?.filter((s) => s >= 8).length ?? 0;
      break;
    case 'data-modeler':
      current = stats.dimensionScores['dataModel']?.filter((s) => s >= 8).length ?? 0;
      break;
    case 'scale-master':
      current = stats.dimensionScores['scalability']?.filter((s) => s >= 8).length ?? 0;
      break;
    case 'reliability-engineer':
      current = stats.dimensionScores['reliability']?.filter((s) => s >= 8).length ?? 0;
      break;
    case 'tradeoff-thinker':
      current = stats.dimensionScores['tradeoffs']?.filter((s) => s >= 8).length ?? 0;
      break;
    case 'master-databases':
      current = stats.dimensionScores['dataModel']?.filter((s) => s >= 8).length ?? 0;
      break;
    case 'system-design-guru':
      current = stats.challengesCompleted;
      break;
    case 'chaos-master':
      current = stats.chaosEventsSurvived;
      break;
    case 'concept-master':
      current = stats.conceptsMastered;
      break;
    default:
      return null;
  }

  return [Math.min(current, max), max];
}

function allDimensionsAbove(stats: UserStats, threshold: number): boolean {
  const dimensions = ['functional', 'api', 'dataModel', 'scalability', 'reliability', 'tradeoffs'];
  return dimensions.every((dim) => {
    const scores = stats.dimensionScores[dim];
    if (!scores || scores.length === 0) return false;
    return scores[scores.length - 1] >= threshold;
  });
}

// ── XP & Leveling ─────────────────────────────────────────────────

/**
 * XP thresholds per level. Each level requires more XP than the last.
 * Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, etc.
 * Formula: xpForLevel(n) = 50 * n * (n - 1)
 */
function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

/**
 * Calculate the user's current level, XP progress in the current level,
 * and XP needed for the next level.
 */
export function calculateLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }

  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);

  return {
    level,
    xpInLevel: totalXp - currentLevelXp,
    xpForNextLevel: nextLevelXp - currentLevelXp,
  };
}

// ── Streak Tracking ───────────────────────────────────────────────

/**
 * Determine the current streak status and whether the streak is at risk
 * (user hasn't practiced today but still has time).
 */
export function getStreakStatus(lastActiveDate: Date): {
  streakDays: number;
  atRisk: boolean;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActive = new Date(
    lastActiveDate.getFullYear(),
    lastActiveDate.getMonth(),
    lastActiveDate.getDate(),
  );

  const diffMs = today.getTime() - lastActive.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Active today -- streak is safe
    return { streakDays: 1, atRisk: false };
  }

  if (diffDays === 1) {
    // Last active yesterday -- streak continues but at risk if not practiced today
    return { streakDays: 1, atRisk: true };
  }

  // More than 1 day gap -- streak broken
  return { streakDays: 0, atRisk: false };
}
