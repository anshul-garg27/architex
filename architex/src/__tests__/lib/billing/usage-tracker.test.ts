import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackUsage,
  getUsage,
  getAllUsage,
  checkLimit,
  resetUsage,
  getPeriodStart,
} from '@/lib/billing/usage-tracker';

// ── Helpers ────────────────────────────────────────────────

/** Clear billing keys from localStorage before each test. */
function clearStorage() {
  localStorage.removeItem('architex:billing:usage');
  localStorage.removeItem('architex:billing:period-start');
}

// ── Tests ──────────────────────────────────────────────────

describe('usage-tracker', () => {
  beforeEach(() => {
    clearStorage();
  });

  // ── trackUsage ───────────────────────────────────────────

  describe('trackUsage', () => {
    it('increments a feature counter by 1 by default', () => {
      trackUsage('simulations');
      expect(getUsage('simulations')).toBe(1);
    });

    it('increments by a custom amount', () => {
      trackUsage('exports', 3);
      expect(getUsage('exports')).toBe(3);
    });

    it('accumulates across multiple calls', () => {
      trackUsage('aiHints');
      trackUsage('aiHints');
      trackUsage('aiHints');
      expect(getUsage('aiHints')).toBe(3);
    });

    it('returns the new usage count', () => {
      expect(trackUsage('simulations')).toBe(1);
      expect(trackUsage('simulations')).toBe(2);
      expect(trackUsage('simulations', 5)).toBe(7);
    });

    it('tracks features independently', () => {
      trackUsage('simulations', 2);
      trackUsage('exports', 1);
      expect(getUsage('simulations')).toBe(2);
      expect(getUsage('exports')).toBe(1);
      expect(getUsage('aiHints')).toBe(0);
    });
  });

  // ── getUsage ─────────────────────────────────────────────

  describe('getUsage', () => {
    it('returns 0 for a feature with no usage', () => {
      expect(getUsage('simulations')).toBe(0);
      expect(getUsage('templates')).toBe(0);
      expect(getUsage('collaborators')).toBe(0);
    });
  });

  // ── getAllUsage ──────────────────────────────────────────

  describe('getAllUsage', () => {
    it('returns a full usage map with all features', () => {
      trackUsage('simulations', 3);
      trackUsage('exports', 1);

      const all = getAllUsage();
      expect(all).toEqual({
        simulations: 3,
        templates: 0,
        aiHints: 0,
        exports: 1,
        collaborators: 0,
      });
    });
  });

  // ── checkLimit ───────────────────────────────────────────

  describe('checkLimit', () => {
    it('allows usage when under the free plan limit', () => {
      trackUsage('simulations', 3);
      const result = checkLimit('simulations', 'free');
      expect(result).toEqual({ allowed: true, used: 3, limit: 5 });
    });

    it('denies usage when at the free plan limit', () => {
      trackUsage('simulations', 5);
      const result = checkLimit('simulations', 'free');
      expect(result).toEqual({ allowed: false, used: 5, limit: 5 });
    });

    it('denies usage when over the limit', () => {
      trackUsage('exports', 4);
      const result = checkLimit('exports', 'free');
      expect(result).toEqual({ allowed: false, used: 4, limit: 3 });
    });

    it('always allows usage for unlimited (Infinity) limits', () => {
      trackUsage('simulations', 1000);
      const result = checkLimit('simulations', 'pro');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    });

    it('denies AI hints on the free plan (limit is 0)', () => {
      const result = checkLimit('aiHints', 'free');
      expect(result).toEqual({ allowed: false, used: 0, limit: 0 });
    });

    it('allows AI hints on the pro plan within limit', () => {
      trackUsage('aiHints', 30);
      const result = checkLimit('aiHints', 'pro');
      expect(result).toEqual({ allowed: true, used: 30, limit: 50 });
    });

    it('checks collaborators limit per plan', () => {
      expect(checkLimit('collaborators', 'free').limit).toBe(0);
      expect(checkLimit('collaborators', 'pro').limit).toBe(0);
      expect(checkLimit('collaborators', 'team').limit).toBe(10);
    });
  });

  // ── resetUsage ───────────────────────────────────────────

  describe('resetUsage', () => {
    it('resets all counters to zero', () => {
      trackUsage('simulations', 5);
      trackUsage('exports', 3);
      trackUsage('aiHints', 10);

      resetUsage();

      expect(getUsage('simulations')).toBe(0);
      expect(getUsage('exports')).toBe(0);
      expect(getUsage('aiHints')).toBe(0);
    });

    it('sets a new period start date', () => {
      const before = new Date().toISOString();
      resetUsage();
      const periodStart = getPeriodStart();
      expect(periodStart >= before).toBe(true);
    });
  });

  // ── getPeriodStart ───────────────────────────────────────

  describe('getPeriodStart', () => {
    it('returns a valid ISO date string', () => {
      resetUsage();
      const d = new Date(getPeriodStart());
      expect(d.getTime()).not.toBeNaN();
    });
  });
});
