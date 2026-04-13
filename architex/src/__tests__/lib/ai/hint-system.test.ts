import { describe, it, expect } from 'vitest';
import {
  generateHint,
  canUnlockTier,
  createHintBudget,
  spendCredits,
  TIER_CREDIT_COST,
  TIER_ORDER,
  type HintTier,
  type HintBudget,
} from '@/lib/ai/hint-system';

describe('hint-system', () => {
  // ── generateHint ─────────────────────────────────────────────

  describe('generateHint', () => {
    const challenge = { id: 'test-1', title: 'Design a Cache', category: 'caching' as const };

    it('returns a nudge hint for tier "nudge"', () => {
      const hint = generateHint(challenge, '', 'nudge');
      expect(hint.tier).toBe('nudge');
      expect(hint.content).toBeTruthy();
      expect(hint.creditCost).toBe(1);
    });

    it('returns a guided hint for tier "guided"', () => {
      const hint = generateHint(challenge, '', 'guided');
      expect(hint.tier).toBe('guided');
      expect(hint.content).toBeTruthy();
      expect(hint.creditCost).toBe(3);
      expect(hint.followUp).toBeTruthy();
    });

    it('returns a full-explanation hint with diagram suggestions', () => {
      const hint = generateHint(challenge, '', 'full-explanation');
      expect(hint.tier).toBe('full-explanation');
      expect(hint.content).toBeTruthy();
      expect(hint.creditCost).toBe(5);
      expect(hint.diagramSuggestions).toBeDefined();
      expect(hint.diagramSuggestions!.length).toBeGreaterThan(0);
    });

    it('includes a generatedAt timestamp', () => {
      const before = Date.now();
      const hint = generateHint(challenge, '', 'nudge');
      expect(hint.generatedAt).toBeGreaterThanOrEqual(before);
      expect(hint.generatedAt).toBeLessThanOrEqual(Date.now());
    });

    it('infers category from title when not provided', () => {
      const inferredChallenge = { id: 'test-2', title: 'Design a Rate Limiter' };
      // Rate limiter maps to "security" via keyword "rate limit"
      const hint = generateHint(inferredChallenge, '', 'nudge');
      expect(hint.tier).toBe('nudge');
      expect(hint.content).toBeTruthy();
    });

    it('falls back to general category for unknown titles', () => {
      const unknownChallenge = { id: 'test-3', title: 'Build Something Unusual' };
      const hint = generateHint(unknownChallenge, '', 'nudge');
      expect(hint.content).toBeTruthy();
    });
  });

  // ── TIER_CREDIT_COST ─────────────────────────────────────────

  describe('TIER_CREDIT_COST', () => {
    it('nudge costs 1 credit', () => {
      expect(TIER_CREDIT_COST.nudge).toBe(1);
    });

    it('guided costs 3 credits', () => {
      expect(TIER_CREDIT_COST.guided).toBe(3);
    });

    it('full-explanation costs 5 credits', () => {
      expect(TIER_CREDIT_COST['full-explanation']).toBe(5);
    });
  });

  // ── canUnlockTier ────────────────────────────────────────────

  describe('canUnlockTier', () => {
    it('nudge is always unlockable', () => {
      expect(canUnlockTier('nudge', [])).toBe(true);
    });

    it('guided requires nudge to be used first', () => {
      expect(canUnlockTier('guided', [])).toBe(false);
      expect(canUnlockTier('guided', ['nudge'])).toBe(true);
    });

    it('full-explanation requires nudge and guided', () => {
      expect(canUnlockTier('full-explanation', [])).toBe(false);
      expect(canUnlockTier('full-explanation', ['nudge'])).toBe(false);
      expect(canUnlockTier('full-explanation', ['nudge', 'guided'])).toBe(true);
    });

    it('order of usedTiers does not matter', () => {
      expect(canUnlockTier('full-explanation', ['guided', 'nudge'])).toBe(true);
    });
  });

  // ── createHintBudget ─────────────────────────────────────────

  describe('createHintBudget', () => {
    it('creates a budget with default 15 credits', () => {
      const budget = createHintBudget();
      expect(budget.totalCredits).toBe(15);
      expect(budget.usedCredits).toBe(0);
      expect(budget.remainingCredits).toBe(15);
      expect(budget.hintsUsed).toEqual([]);
    });

    it('creates a budget with custom credits', () => {
      const budget = createHintBudget(20);
      expect(budget.totalCredits).toBe(20);
      expect(budget.remainingCredits).toBe(20);
    });
  });

  // ── spendCredits ─────────────────────────────────────────────

  describe('spendCredits', () => {
    it('deducts the correct amount for nudge', () => {
      const budget = createHintBudget(15);
      const updated = spendCredits(budget, 'nudge');
      expect(updated).not.toBeNull();
      expect(updated!.usedCredits).toBe(1);
      expect(updated!.remainingCredits).toBe(14);
      expect(updated!.hintsUsed).toEqual(['nudge']);
    });

    it('deducts the correct amount for guided', () => {
      const budget = createHintBudget(15);
      const updated = spendCredits(budget, 'guided');
      expect(updated).not.toBeNull();
      expect(updated!.usedCredits).toBe(3);
      expect(updated!.remainingCredits).toBe(12);
    });

    it('deducts the correct amount for full-explanation', () => {
      const budget = createHintBudget(15);
      const updated = spendCredits(budget, 'full-explanation');
      expect(updated).not.toBeNull();
      expect(updated!.usedCredits).toBe(5);
      expect(updated!.remainingCredits).toBe(10);
    });

    it('returns null when not enough credits', () => {
      const budget = createHintBudget(2);
      const result = spendCredits(budget, 'guided'); // costs 3
      expect(result).toBeNull();
    });

    it('allows spending exactly the remaining credits', () => {
      const budget = createHintBudget(5);
      const result = spendCredits(budget, 'full-explanation'); // costs 5
      expect(result).not.toBeNull();
      expect(result!.remainingCredits).toBe(0);
    });

    it('chains multiple spends correctly', () => {
      let budget: HintBudget | null = createHintBudget(15);
      budget = spendCredits(budget, 'nudge'); // 15 - 1 = 14
      expect(budget).not.toBeNull();
      budget = spendCredits(budget!, 'guided'); // 14 - 3 = 11
      expect(budget).not.toBeNull();
      budget = spendCredits(budget!, 'full-explanation'); // 11 - 5 = 6
      expect(budget).not.toBeNull();
      expect(budget!.remainingCredits).toBe(6);
      expect(budget!.hintsUsed).toEqual(['nudge', 'guided', 'full-explanation']);
    });
  });

  // ── TIER_ORDER ───────────────────────────────────────────────

  describe('TIER_ORDER', () => {
    it('has 3 tiers in progressive order', () => {
      expect(TIER_ORDER).toEqual(['nudge', 'guided', 'full-explanation']);
    });
  });
});
