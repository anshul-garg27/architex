import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRateLimiter, type RateLimiter } from '../rate-limiter';

describe('rate-limiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    limiter?.destroy();
    vi.useRealTimers();
  });

  // ── Token depletion ─────────────────────────────────────

  describe('token depletion', () => {
    it('allows requests up to maxTokens', () => {
      limiter = createRateLimiter({
        maxTokens: 3,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.checkLimit('ip-1').allowed).toBe(true);  // 3 -> 2
      expect(limiter.checkLimit('ip-1').allowed).toBe(true);  // 2 -> 1
      expect(limiter.checkLimit('ip-1').allowed).toBe(true);  // 1 -> 0
    });

    it('denies requests after tokens are exhausted', () => {
      limiter = createRateLimiter({
        maxTokens: 2,
        refillRate: 1,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1'); // 2 -> 1
      limiter.checkLimit('ip-1'); // 1 -> 0

      const result = limiter.checkLimit('ip-1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('returns correct remaining count', () => {
      limiter = createRateLimiter({
        maxTokens: 5,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.checkLimit('ip-1').remaining).toBe(4);
      expect(limiter.checkLimit('ip-1').remaining).toBe(3);
      expect(limiter.checkLimit('ip-1').remaining).toBe(2);
      expect(limiter.checkLimit('ip-1').remaining).toBe(1);
      expect(limiter.checkLimit('ip-1').remaining).toBe(0);
    });

    it('tracks keys independently', () => {
      limiter = createRateLimiter({
        maxTokens: 1,
        refillRate: 1,
        refillInterval: 1000,
      });

      expect(limiter.checkLimit('ip-a').allowed).toBe(true);
      expect(limiter.checkLimit('ip-a').allowed).toBe(false);

      // Different key should still have tokens
      expect(limiter.checkLimit('ip-b').allowed).toBe(true);
    });
  });

  // ── Token refill ────────────────────────────────────────

  describe('token refill', () => {
    it('refills tokens after the refill interval', () => {
      limiter = createRateLimiter({
        maxTokens: 2,
        refillRate: 1,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1'); // 2 -> 1
      limiter.checkLimit('ip-1'); // 1 -> 0
      expect(limiter.checkLimit('ip-1').allowed).toBe(false);

      // Advance past one refill interval
      vi.advanceTimersByTime(1000);

      const result = limiter.checkLimit('ip-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0); // refilled 1, consumed 1
    });

    it('does not exceed maxTokens on refill', () => {
      limiter = createRateLimiter({
        maxTokens: 3,
        refillRate: 2,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1'); // 3 -> 2

      // Advance 10 intervals — should refill well past max
      vi.advanceTimersByTime(10_000);

      const result = limiter.checkLimit('ip-1');
      // Tokens were capped at maxTokens (3), then consumed 1 => 2
      expect(result.remaining).toBe(2);
    });

    it('returns resetAt timestamp', () => {
      limiter = createRateLimiter({
        maxTokens: 1,
        refillRate: 1,
        refillInterval: 5000,
      });

      const now = Date.now();
      limiter.checkLimit('ip-1'); // 1 -> 0

      const result = limiter.checkLimit('ip-1');
      expect(result.allowed).toBe(false);
      expect(result.resetAt).toBeGreaterThanOrEqual(now);
    });
  });

  // ── Cleanup ─────────────────────────────────────────────

  describe('cleanup', () => {
    it('removes stale entries after cleanup runs', () => {
      limiter = createRateLimiter({
        maxTokens: 10,
        refillRate: 1,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1');
      expect(limiter.size()).toBe(1);

      // Advance past stale threshold (120s) + cleanup interval (60s)
      vi.advanceTimersByTime(200_000);

      expect(limiter.size()).toBe(0);
    });

    it('does not remove recently active entries', () => {
      limiter = createRateLimiter({
        maxTokens: 10,
        refillRate: 1,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1');

      // Advance 30s — well before the 120s stale threshold
      vi.advanceTimersByTime(30_000);
      limiter.checkLimit('ip-1'); // Touch the entry

      // Advance past the cleanup interval but not stale threshold from last touch
      vi.advanceTimersByTime(65_000);

      // Key should still exist (last touched ~65s ago, threshold is 120s)
      // However cleanup looks at lastRefill, not last access.
      // At 95s total, with refillInterval=1000ms, the bucket would project full.
      // But elapsed from lastRefill (~30s mark) is ~65s < 120s, so it survives.
      expect(limiter.size()).toBe(1);
    });

    it('reset removes a specific key', () => {
      limiter = createRateLimiter({
        maxTokens: 5,
        refillRate: 1,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1');
      limiter.checkLimit('ip-2');
      expect(limiter.size()).toBe(2);

      limiter.reset('ip-1');
      expect(limiter.size()).toBe(1);
    });

    it('destroy clears all state', () => {
      limiter = createRateLimiter({
        maxTokens: 5,
        refillRate: 1,
        refillInterval: 1000,
      });

      limiter.checkLimit('ip-1');
      limiter.checkLimit('ip-2');
      limiter.destroy();

      expect(limiter.size()).toBe(0);
    });
  });
});
