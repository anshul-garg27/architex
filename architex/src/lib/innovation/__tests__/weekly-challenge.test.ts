import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentWeeklyChallenge,
  getChallengeForWeek,
  submitDesign,
  voteForDesign,
  getWeekIndex,
  getWeekBounds,
  WEEKLY_CHALLENGE_POOL,
  type WeeklyChallenge,
  type DesignInput,
} from '../weekly-challenge';

// ── WEEKLY_CHALLENGE_POOL constant ───────────────────────────

describe('WEEKLY_CHALLENGE_POOL', () => {
  it('contains exactly 12 challenges', () => {
    expect(WEEKLY_CHALLENGE_POOL).toHaveLength(12);
  });

  it('each challenge has required fields', () => {
    for (const c of WEEKLY_CHALLENGE_POOL) {
      expect(c.id.length).toBeGreaterThan(0);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.constraints.length).toBeGreaterThan(0);
      expect(['beginner', 'intermediate', 'advanced']).toContain(c.difficulty);
    }
  });

  it('has unique IDs', () => {
    const ids = WEEKLY_CHALLENGE_POOL.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── getWeekIndex ─────────────────────────────────────────────

describe('getWeekIndex', () => {
  it('returns 0 for the epoch date (2025-01-06)', () => {
    const epoch = Date.UTC(2025, 0, 6);
    expect(getWeekIndex(epoch)).toBe(0);
  });

  it('returns 1 for one week after the epoch', () => {
    const oneWeekLater = Date.UTC(2025, 0, 13);
    expect(getWeekIndex(oneWeekLater)).toBe(1);
  });

  it('returns a positive number for current time', () => {
    expect(getWeekIndex()).toBeGreaterThan(0);
  });

  it('increments by 1 each week', () => {
    const base = Date.UTC(2025, 0, 6);
    const week1 = getWeekIndex(base);
    const week2 = getWeekIndex(base + 7 * 24 * 60 * 60 * 1000);
    expect(week2 - week1).toBe(1);
  });
});

// ── getWeekBounds ────────────────────────────────────────────

describe('getWeekBounds', () => {
  it('returns valid ISO strings', () => {
    const bounds = getWeekBounds(0);
    expect(() => new Date(bounds.start)).not.toThrow();
    expect(() => new Date(bounds.end)).not.toThrow();
  });

  it('end is approximately 7 days after start', () => {
    const bounds = getWeekBounds(5);
    const diff = new Date(bounds.end).getTime() - new Date(bounds.start).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    // Within 1 second tolerance (end is 1ms before next week)
    expect(Math.abs(diff - sevenDays)).toBeLessThan(1000);
  });
});

// ── getChallengeForWeek ──────────────────────────────────────

describe('getChallengeForWeek', () => {
  it('returns a WeeklyChallenge with dates and submissions', () => {
    const challenge = getChallengeForWeek(0);
    expect(challenge.id).toBeDefined();
    expect(challenge.startDate).toBeDefined();
    expect(challenge.endDate).toBeDefined();
    expect(challenge.submissions).toEqual([]);
    expect(challenge.votingOpen).toBe(true);
  });

  it('rotates through all 12 challenges', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 12; i++) {
      ids.add(getChallengeForWeek(i).id);
    }
    expect(ids.size).toBe(12);
  });

  it('repeats after 12 weeks', () => {
    const week0 = getChallengeForWeek(0);
    const week12 = getChallengeForWeek(12);
    expect(week12.id).toBe(week0.id);
  });

  it('handles negative week indices via modulo', () => {
    const neg = getChallengeForWeek(-1);
    // -1 % 12 should map to pool index 11
    expect(neg.id).toBe(WEEKLY_CHALLENGE_POOL[11].id);
  });
});

// ── getCurrentWeeklyChallenge ────────────────────────────────

describe('getCurrentWeeklyChallenge', () => {
  it('returns a valid challenge for the current week', () => {
    const challenge = getCurrentWeeklyChallenge();
    expect(challenge.id).toBeDefined();
    expect(challenge.title.length).toBeGreaterThan(0);
    expect(challenge.startDate).toBeDefined();
    expect(challenge.endDate).toBeDefined();
    expect(challenge.submissions).toEqual([]);
    expect(challenge.votingOpen).toBe(true);
  });

  it('matches getChallengeForWeek(getWeekIndex())', () => {
    const current = getCurrentWeeklyChallenge();
    const manual = getChallengeForWeek(getWeekIndex());
    expect(current.id).toBe(manual.id);
    expect(current.title).toBe(manual.title);
  });
});

// ── submitDesign ─────────────────────────────────────────────

describe('submitDesign', () => {
  const design: DesignInput = {
    userId: 'user-42',
    title: 'My URL Shortener Design',
    description: 'A distributed approach using consistent hashing...',
  };

  it('returns a successful result with a submission', () => {
    const result = submitDesign('wc-url-shortener', design);
    expect(result.success).toBe(true);
    expect(result.submission.challengeId).toBe('wc-url-shortener');
    expect(result.submission.userId).toBe('user-42');
    expect(result.submission.title).toBe('My URL Shortener Design');
    expect(result.submission.votes).toBe(0);
  });

  it('generates a unique submission ID', () => {
    const r1 = submitDesign('wc-url-shortener', design);
    const r2 = submitDesign('wc-url-shortener', design);
    expect(r1.submission.id).not.toBe(r2.submission.id);
  });

  it('sets submittedAt to a valid ISO string', () => {
    const result = submitDesign('wc-chat-system', design);
    expect(() => new Date(result.submission.submittedAt)).not.toThrow();
  });

  it('preserves the description', () => {
    const result = submitDesign('wc-url-shortener', design);
    expect(result.submission.description).toBe(design.description);
  });
});

// ── voteForDesign ────────────────────────────────────────────

describe('voteForDesign', () => {
  it('returns a successful vote result', () => {
    const result = voteForDesign('sub-1', 5);
    expect(result.success).toBe(true);
    expect(result.submissionId).toBe('sub-1');
    expect(result.newVoteCount).toBe(6);
  });

  it('defaults currentVotes to 0', () => {
    const result = voteForDesign('sub-2');
    expect(result.newVoteCount).toBe(1);
  });

  it('increments by exactly 1', () => {
    for (let i = 0; i < 10; i++) {
      const result = voteForDesign('sub-x', i);
      expect(result.newVoteCount).toBe(i + 1);
    }
  });
});
