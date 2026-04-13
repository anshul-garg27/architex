// ── Leaderboard engine: rankings, mock data, and user positioning ──

import { calculateLevel } from './achievements';

// ── Types ──────────────────────────────────────────────────────────

export interface LeaderboardBadge {
  id: string;
  name: string;
  icon: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarSeed: string;
  xp: number;
  level: number;
  streak: number;
  challengesCompleted: number;
  badges: LeaderboardBadge[];
  isCurrentUser?: boolean;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

// ── Deterministic pseudo-random number generator ───────────────────

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Badge pool ─────────────────────────────────────────────────────

const BADGE_POOL: LeaderboardBadge[] = [
  { id: 'streak-7', name: 'Week Warrior', icon: 'Flame' },
  { id: 'streak-30', name: 'Month Marathoner', icon: 'Trophy' },
  { id: 'perfect', name: 'Perfectionist', icon: 'Star' },
  { id: 'speed', name: 'Speed Demon', icon: 'Zap' },
  { id: 'guru', name: 'System Design Guru', icon: 'Crown' },
  { id: 'explorer', name: 'Explorer', icon: 'Compass' },
];

// ── Name pool ──────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Morgan', 'Jamie', 'Riley',
  'Avery', 'Quinn', 'Drew', 'Reese', 'Blake', 'Skyler', 'Dakota', 'Emerson',
  'Phoenix', 'Hayden', 'Rowan', 'Parker', 'Sage', 'River', 'Kai', 'Finley',
  'Ari', 'Remy', 'Eden', 'Lane', 'Jules', 'Shay', 'Logan', 'Devon',
];

const LAST_INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ── Mock leaderboard generation ────────────────────────────────────

/**
 * Generate a realistic mock leaderboard with `count` entries.
 * Uses a seeded RNG for deterministic results per period.
 */
export function generateMockLeaderboard(
  count: number,
  period: LeaderboardPeriod = 'all-time',
): LeaderboardEntry[] {
  const periodSeed = period === 'weekly' ? 42 : period === 'monthly' ? 137 : 256;
  const rng = seedRandom(periodSeed);

  // XP multiplier per period (weekly has less XP than all-time)
  const xpMultiplier = period === 'weekly' ? 0.15 : period === 'monthly' ? 0.4 : 1;

  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    // Higher-ranked users have more XP; use power distribution
    const rankFraction = 1 - i / count;
    const baseXp = Math.floor(
      (2000 + rng() * 18000) * rankFraction * xpMultiplier + rng() * 500,
    );

    const xp = Math.max(baseXp, 50);
    const { level } = calculateLevel(xp);

    const streak = Math.floor(rng() * (rankFraction * 50 + 1));
    const challengesCompleted = Math.floor(
      rng() * rankFraction * 40 + rng() * 5 + 1,
    );

    // Assign badges based on stats
    const badges: LeaderboardBadge[] = [];
    if (streak >= 7) badges.push(BADGE_POOL[0]);
    if (streak >= 30) badges.push(BADGE_POOL[1]);
    if (rng() > 0.7 && rankFraction > 0.5) badges.push(BADGE_POOL[2]);
    if (rng() > 0.8) badges.push(BADGE_POOL[3]);
    if (challengesCompleted >= 30 && rng() > 0.6) badges.push(BADGE_POOL[4]);
    if (rng() > 0.5) badges.push(BADGE_POOL[5]);

    const nameIdx = Math.floor(rng() * FIRST_NAMES.length);
    const initialIdx = Math.floor(rng() * LAST_INITIALS.length);

    entries.push({
      rank: 0, // assigned after sort
      username: `${FIRST_NAMES[nameIdx]}${LAST_INITIALS[initialIdx]}`,
      avatarSeed: `${period}-${i}`,
      xp,
      level,
      streak,
      challengesCompleted,
      badges,
    });
  }

  // Sort by XP descending and assign ranks
  entries.sort((a, b) => b.xp - a.xp);
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}

// ── Rank calculation ───────────────────────────────────────────────

/**
 * Calculate where a user with `userXP` would rank in the leaderboard.
 * Returns a 1-based rank.
 */
export function calculateRank(
  userXP: number,
  leaderboard: LeaderboardEntry[],
): number {
  let rank = 1;
  for (const entry of leaderboard) {
    if (entry.xp > userXP) {
      rank++;
    }
  }
  return rank;
}

// ── Leaderboard slice around user position ─────────────────────────

/**
 * Get a slice of leaderboard entries centered around a specific rank.
 * Always returns `count` entries when possible.
 */
export function getLeaderboardSlice(
  leaderboard: LeaderboardEntry[],
  aroundRank: number,
  count: number,
): LeaderboardEntry[] {
  if (leaderboard.length <= count) return leaderboard;

  const halfCount = Math.floor(count / 2);
  // aroundRank is 1-based, convert to 0-based index
  const centerIdx = aroundRank - 1;

  let startIdx = Math.max(0, centerIdx - halfCount);
  let endIdx = startIdx + count;

  // Clamp to end of array
  if (endIdx > leaderboard.length) {
    endIdx = leaderboard.length;
    startIdx = Math.max(0, endIdx - count);
  }

  return leaderboard.slice(startIdx, endIdx);
}

/**
 * Insert the current user into a leaderboard at the correct position.
 * Returns a new leaderboard with the user entry marked with `isCurrentUser: true`.
 */
export function insertUserIntoLeaderboard(
  leaderboard: LeaderboardEntry[],
  user: Omit<LeaderboardEntry, 'rank' | 'isCurrentUser'>,
): LeaderboardEntry[] {
  const userEntry: LeaderboardEntry = {
    ...user,
    rank: 0,
    isCurrentUser: true,
  };

  const combined = [...leaderboard, userEntry];
  combined.sort((a, b) => b.xp - a.xp);
  combined.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return combined;
}
