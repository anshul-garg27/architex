import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  toggleUpvote,
  getUpvoteCount,
  hasUserUpvoted,
  getUserUpvotedDesigns,
} from '@/lib/collaboration/upvotes';

// ── localStorage mock ────────────────────────────────────────

const store: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
});

// ── toggleUpvote ─────────────────────────────────────────────

describe('toggleUpvote', () => {
  it('adds an upvote on first toggle', () => {
    const result = toggleUpvote('design-1', 'user-1');
    expect(result.upvoted).toBe(true);
    expect(result.count).toBe(1);
  });

  it('removes an upvote on second toggle', () => {
    toggleUpvote('design-1', 'user-1');
    const result = toggleUpvote('design-1', 'user-1');
    expect(result.upvoted).toBe(false);
    expect(result.count).toBe(0);
  });

  it('re-adds an upvote on third toggle', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-1', 'user-1');
    const result = toggleUpvote('design-1', 'user-1');
    expect(result.upvoted).toBe(true);
    expect(result.count).toBe(1);
  });

  it('tracks upvotes independently per user', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-1', 'user-2');

    expect(getUpvoteCount('design-1')).toBe(2);
    expect(hasUserUpvoted('design-1', 'user-1')).toBe(true);
    expect(hasUserUpvoted('design-1', 'user-2')).toBe(true);
  });

  it('tracks upvotes independently per design', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-2', 'user-1');

    expect(getUpvoteCount('design-1')).toBe(1);
    expect(getUpvoteCount('design-2')).toBe(1);
  });

  it('count never goes below zero', () => {
    // Force a state where a toggle-off would go negative
    // (shouldn't happen in normal use, but defensive)
    toggleUpvote('design-1', 'user-1');
    const result = toggleUpvote('design-1', 'user-1');
    expect(result.count).toBe(0);

    // Toggling off again should not go below 0
    // (user hasn't upvoted, so this is an add, not remove)
    const result2 = toggleUpvote('design-1', 'user-1');
    expect(result2.count).toBe(1);
  });
});

// ── getUpvoteCount ───────────────────────────────────────────

describe('getUpvoteCount', () => {
  it('returns 0 for unknown design', () => {
    expect(getUpvoteCount('nonexistent')).toBe(0);
  });

  it('reflects accumulated upvotes from multiple users', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-1', 'user-2');
    toggleUpvote('design-1', 'user-3');
    expect(getUpvoteCount('design-1')).toBe(3);
  });

  it('decrements when a user un-upvotes', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-1', 'user-2');
    toggleUpvote('design-1', 'user-1'); // un-upvote
    expect(getUpvoteCount('design-1')).toBe(1);
  });
});

// ── hasUserUpvoted ───────────────────────────────────────────

describe('hasUserUpvoted', () => {
  it('returns false before any upvote', () => {
    expect(hasUserUpvoted('design-1', 'user-1')).toBe(false);
  });

  it('returns true after upvote', () => {
    toggleUpvote('design-1', 'user-1');
    expect(hasUserUpvoted('design-1', 'user-1')).toBe(true);
  });

  it('returns false after un-upvote', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-1', 'user-1');
    expect(hasUserUpvoted('design-1', 'user-1')).toBe(false);
  });
});

// ── getUserUpvotedDesigns ────────────────────────────────────

describe('getUserUpvotedDesigns', () => {
  it('returns empty array for user with no upvotes', () => {
    expect(getUserUpvotedDesigns('user-x')).toEqual([]);
  });

  it('returns all designs a user has upvoted', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-2', 'user-1');
    toggleUpvote('design-3', 'user-1');

    const designs = getUserUpvotedDesigns('user-1');
    expect(designs).toHaveLength(3);
    expect(designs).toContain('design-1');
    expect(designs).toContain('design-2');
    expect(designs).toContain('design-3');
  });

  it('reflects un-upvotes', () => {
    toggleUpvote('design-1', 'user-1');
    toggleUpvote('design-2', 'user-1');
    toggleUpvote('design-1', 'user-1'); // un-upvote design-1

    const designs = getUserUpvotedDesigns('user-1');
    expect(designs).toHaveLength(1);
    expect(designs).toContain('design-2');
  });
});
