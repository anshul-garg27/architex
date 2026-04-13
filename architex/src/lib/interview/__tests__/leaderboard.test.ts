import { describe, it, expect } from 'vitest';
import {
  generateMockLeaderboard,
  calculateRank,
  getLeaderboardSlice,
  insertUserIntoLeaderboard,
} from '../leaderboard';
import type { LeaderboardEntry } from '../leaderboard';

// ── generateMockLeaderboard ─────────────────────────────────

describe('generateMockLeaderboard', () => {
  it('generates the correct number of entries', () => {
    const board = generateMockLeaderboard(20);
    expect(board).toHaveLength(20);
  });

  it('assigns consecutive ranks starting from 1', () => {
    const board = generateMockLeaderboard(10);
    for (let i = 0; i < board.length; i++) {
      expect(board[i].rank).toBe(i + 1);
    }
  });

  it('sorts entries by XP descending', () => {
    const board = generateMockLeaderboard(30);
    for (let i = 1; i < board.length; i++) {
      expect(board[i].xp).toBeLessThanOrEqual(board[i - 1].xp);
    }
  });

  it('generates deterministic results for the same period', () => {
    const board1 = generateMockLeaderboard(15, 'weekly');
    const board2 = generateMockLeaderboard(15, 'weekly');
    for (let i = 0; i < board1.length; i++) {
      expect(board1[i].username).toBe(board2[i].username);
      expect(board1[i].xp).toBe(board2[i].xp);
    }
  });

  it('generates different results for different periods', () => {
    const weekly = generateMockLeaderboard(10, 'weekly');
    const monthly = generateMockLeaderboard(10, 'monthly');
    // XP should differ because of different seeds and multipliers
    const sameXp = weekly.every((e, i) => e.xp === monthly[i].xp);
    expect(sameXp).toBe(false);
  });

  it('every entry has a positive XP', () => {
    const board = generateMockLeaderboard(50);
    for (const entry of board) {
      expect(entry.xp).toBeGreaterThan(0);
    }
  });

  it('every entry has a level >= 1', () => {
    const board = generateMockLeaderboard(50);
    for (const entry of board) {
      expect(entry.level).toBeGreaterThanOrEqual(1);
    }
  });

  it('every entry has a non-empty username', () => {
    const board = generateMockLeaderboard(50);
    for (const entry of board) {
      expect(entry.username.length).toBeGreaterThan(0);
    }
  });

  it('handles count of 0', () => {
    const board = generateMockLeaderboard(0);
    expect(board).toHaveLength(0);
  });

  it('handles count of 1', () => {
    const board = generateMockLeaderboard(1);
    expect(board).toHaveLength(1);
    expect(board[0].rank).toBe(1);
  });
});

// ── calculateRank ───────────────────────────────────────────

describe('calculateRank', () => {
  const board: LeaderboardEntry[] = [
    { rank: 1, username: 'A', avatarSeed: 'a', xp: 5000, level: 5, streak: 10, challengesCompleted: 20, badges: [] },
    { rank: 2, username: 'B', avatarSeed: 'b', xp: 3000, level: 4, streak: 5, challengesCompleted: 15, badges: [] },
    { rank: 3, username: 'C', avatarSeed: 'c', xp: 1000, level: 2, streak: 1, challengesCompleted: 5, badges: [] },
  ];

  it('returns rank 1 for XP higher than all entries', () => {
    expect(calculateRank(6000, board)).toBe(1);
  });

  it('returns rank 2 for XP between first and second', () => {
    expect(calculateRank(4000, board)).toBe(2);
  });

  it('returns last rank + 1 for XP lower than all entries', () => {
    expect(calculateRank(500, board)).toBe(4);
  });

  it('returns correct rank for XP equal to an entry', () => {
    // Equal XP means they are not strictly above us
    expect(calculateRank(3000, board)).toBe(2);
  });

  it('returns rank 1 for empty leaderboard', () => {
    expect(calculateRank(100, [])).toBe(1);
  });
});

// ── getLeaderboardSlice ─────────────────────────────────────

describe('getLeaderboardSlice', () => {
  const board = generateMockLeaderboard(50);

  it('returns full board when count exceeds board length', () => {
    const slice = getLeaderboardSlice(board, 25, 100);
    expect(slice).toHaveLength(50);
  });

  it('returns correct count for a middle position', () => {
    const slice = getLeaderboardSlice(board, 25, 10);
    expect(slice).toHaveLength(10);
  });

  it('does not go below index 0 for top ranks', () => {
    const slice = getLeaderboardSlice(board, 1, 10);
    expect(slice[0].rank).toBe(1);
    expect(slice).toHaveLength(10);
  });

  it('does not exceed array bounds for bottom ranks', () => {
    const slice = getLeaderboardSlice(board, 50, 10);
    expect(slice).toHaveLength(10);
    expect(slice[slice.length - 1].rank).toBe(50);
  });

  it('centers around the given rank when possible', () => {
    const slice = getLeaderboardSlice(board, 25, 10);
    const ranks = slice.map((e) => e.rank);
    expect(ranks).toContain(25);
  });
});

// ── insertUserIntoLeaderboard ───────────────────────────────

describe('insertUserIntoLeaderboard', () => {
  const board: LeaderboardEntry[] = [
    { rank: 1, username: 'A', avatarSeed: 'a', xp: 5000, level: 5, streak: 10, challengesCompleted: 20, badges: [] },
    { rank: 2, username: 'B', avatarSeed: 'b', xp: 3000, level: 4, streak: 5, challengesCompleted: 15, badges: [] },
    { rank: 3, username: 'C', avatarSeed: 'c', xp: 1000, level: 2, streak: 1, challengesCompleted: 5, badges: [] },
  ];

  it('inserts user at correct position', () => {
    const result = insertUserIntoLeaderboard(board, {
      username: 'Me',
      avatarSeed: 'me',
      xp: 4000,
      level: 4,
      streak: 3,
      challengesCompleted: 18,
      badges: [],
    });
    expect(result).toHaveLength(4);
    const me = result.find((e) => e.isCurrentUser);
    expect(me).toBeDefined();
    expect(me!.rank).toBe(2);
  });

  it('marks only the user entry as isCurrentUser', () => {
    const result = insertUserIntoLeaderboard(board, {
      username: 'Me',
      avatarSeed: 'me',
      xp: 100,
      level: 1,
      streak: 0,
      challengesCompleted: 1,
      badges: [],
    });
    const currentUsers = result.filter((e) => e.isCurrentUser);
    expect(currentUsers).toHaveLength(1);
  });

  it('re-ranks all entries after insertion', () => {
    const result = insertUserIntoLeaderboard(board, {
      username: 'Me',
      avatarSeed: 'me',
      xp: 6000,
      level: 6,
      streak: 15,
      challengesCompleted: 25,
      badges: [],
    });
    // User should be rank 1
    expect(result[0].isCurrentUser).toBe(true);
    expect(result[0].rank).toBe(1);
    // Previous rank 1 should be rank 2
    expect(result[1].username).toBe('A');
    expect(result[1].rank).toBe(2);
  });
});
