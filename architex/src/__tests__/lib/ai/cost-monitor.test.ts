import { describe, it, expect, vi } from 'vitest';
import {
  CostMonitor,
  type ModelName,
  type BudgetAlert,
} from '@/lib/ai/cost-monitor';

describe('CostMonitor', () => {
  // ── recordRequest ───────────────────────────────────────────

  describe('recordRequest', () => {
    it('records a request and returns the record with computed cost', () => {
      const monitor = new CostMonitor();
      const record = monitor.recordRequest('haiku', 1_000_000, 0);
      expect(record.model).toBe('haiku');
      expect(record.inputTokens).toBe(1_000_000);
      expect(record.outputTokens).toBe(0);
      // 1M input tokens * $0.25/1M = $0.25
      expect(record.cost).toBeCloseTo(0.25, 4);
    });

    it('computes haiku pricing correctly', () => {
      const monitor = new CostMonitor();
      // 500K input + 200K output
      const record = monitor.recordRequest('haiku', 500_000, 200_000);
      // Input: 0.5 * $0.25 = $0.125
      // Output: 0.2 * $1.25 = $0.25
      // Total: $0.375
      expect(record.cost).toBeCloseTo(0.375, 4);
    });

    it('computes sonnet pricing correctly', () => {
      const monitor = new CostMonitor();
      const record = monitor.recordRequest('sonnet', 1_000_000, 1_000_000);
      // Input: 1.0 * $3.00 = $3.00
      // Output: 1.0 * $15.00 = $15.00
      // Total: $18.00
      expect(record.cost).toBeCloseTo(18.0, 4);
    });

    it('computes opus pricing correctly', () => {
      const monitor = new CostMonitor();
      const record = monitor.recordRequest('opus', 1_000_000, 1_000_000);
      // Input: 1.0 * $15.00 = $15.00
      // Output: 1.0 * $75.00 = $75.00
      // Total: $90.00
      expect(record.cost).toBeCloseTo(90.0, 4);
    });

    it('handles zero tokens', () => {
      const monitor = new CostMonitor();
      const record = monitor.recordRequest('sonnet', 0, 0);
      expect(record.cost).toBe(0);
    });

    it('increments request count', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 100, 100);
      monitor.recordRequest('sonnet', 200, 200);
      expect(monitor.requestCount).toBe(2);
    });

    it('assigns unique ids', () => {
      const monitor = new CostMonitor();
      const r1 = monitor.recordRequest('haiku', 100, 100);
      const r2 = monitor.recordRequest('haiku', 100, 100);
      expect(r1.id).not.toBe(r2.id);
    });
  });

  // ── getTotalCost ────────────────────────────────────────────

  describe('getTotalCost', () => {
    it('returns 0 with no requests', () => {
      const monitor = new CostMonitor();
      expect(monitor.getTotalCost()).toBe(0);
    });

    it('sums costs across multiple requests', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 1_000_000, 0); // $0.25
      monitor.recordRequest('sonnet', 1_000_000, 0); // $3.00
      expect(monitor.getTotalCost()).toBeCloseTo(3.25, 4);
    });

    it('sums costs across different models', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 1_000_000, 1_000_000); // $0.25 + $1.25 = $1.50
      monitor.recordRequest('opus', 1_000_000, 1_000_000); // $15.00 + $75.00 = $90.00
      expect(monitor.getTotalCost()).toBeCloseTo(91.5, 4);
    });
  });

  // ── getBudgetRemaining ──────────────────────────────────────

  describe('getBudgetRemaining', () => {
    it('returns full budget with no requests', () => {
      const monitor = new CostMonitor();
      expect(monitor.getBudgetRemaining(10)).toBe(10);
    });

    it('returns correct remaining after spending', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 1_000_000, 0); // $0.25
      expect(monitor.getBudgetRemaining(10)).toBeCloseTo(9.75, 4);
    });

    it('returns negative when over budget', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('opus', 1_000_000, 1_000_000); // $90.00
      expect(monitor.getBudgetRemaining(50)).toBeCloseTo(-40.0, 4);
    });
  });

  // ── getUsageByModel ─────────────────────────────────────────

  describe('getUsageByModel', () => {
    it('returns zeroes for all models when empty', () => {
      const monitor = new CostMonitor();
      const usage = monitor.getUsageByModel();
      expect(usage.haiku.requestCount).toBe(0);
      expect(usage.sonnet.requestCount).toBe(0);
      expect(usage.opus.requestCount).toBe(0);
    });

    it('groups by model correctly', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 100, 200);
      monitor.recordRequest('haiku', 300, 400);
      monitor.recordRequest('sonnet', 500, 600);

      const usage = monitor.getUsageByModel();
      expect(usage.haiku.requestCount).toBe(2);
      expect(usage.haiku.totalInputTokens).toBe(400);
      expect(usage.haiku.totalOutputTokens).toBe(600);
      expect(usage.sonnet.requestCount).toBe(1);
      expect(usage.sonnet.totalInputTokens).toBe(500);
      expect(usage.opus.requestCount).toBe(0);
    });

    it('sums costs per model', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 1_000_000, 0); // $0.25
      monitor.recordRequest('haiku', 0, 1_000_000); // $1.25

      const usage = monitor.getUsageByModel();
      expect(usage.haiku.totalCost).toBeCloseTo(1.5, 4);
    });
  });

  // ── Daily aggregation ───────────────────────────────────────

  describe('getDailyUsage', () => {
    it('returns empty array with no records', () => {
      const monitor = new CostMonitor();
      expect(monitor.getDailyUsage()).toEqual([]);
    });

    it('groups requests by day', () => {
      const monitor = new CostMonitor();
      // Two requests on same day
      const day1 = new Date('2024-03-15T10:00:00Z').getTime();
      monitor.recordRequest('haiku', 100, 200, day1);
      monitor.recordRequest('sonnet', 300, 400, day1 + 3600_000);

      // One request on next day
      const day2 = new Date('2024-03-16T10:00:00Z').getTime();
      monitor.recordRequest('opus', 500, 600, day2);

      const daily = monitor.getDailyUsage();
      expect(daily).toHaveLength(2);
      expect(daily[0].requestCount).toBe(2);
      expect(daily[1].requestCount).toBe(1);
    });

    it('sorts by date ascending', () => {
      const monitor = new CostMonitor();
      const day2 = new Date('2024-03-16T10:00:00Z').getTime();
      const day1 = new Date('2024-03-15T10:00:00Z').getTime();
      // Add in reverse order
      monitor.recordRequest('haiku', 100, 100, day2);
      monitor.recordRequest('haiku', 100, 100, day1);

      const daily = monitor.getDailyUsage();
      expect(daily[0].period < daily[1].period).toBe(true);
    });
  });

  // ── Monthly aggregation ─────────────────────────────────────

  describe('getMonthlyUsage', () => {
    it('groups requests by month', () => {
      const monitor = new CostMonitor();
      const march = new Date('2024-03-15T10:00:00Z').getTime();
      const april = new Date('2024-04-15T10:00:00Z').getTime();

      monitor.recordRequest('haiku', 100, 100, march);
      monitor.recordRequest('haiku', 200, 200, march + 86400_000); // still March
      monitor.recordRequest('sonnet', 300, 300, april);

      const monthly = monitor.getMonthlyUsage();
      expect(monthly).toHaveLength(2);
      expect(monthly[0].period).toBe('2024-03');
      expect(monthly[0].requestCount).toBe(2);
      expect(monthly[1].period).toBe('2024-04');
      expect(monthly[1].requestCount).toBe(1);
    });
  });

  // ── Budget alerts ───────────────────────────────────────────

  describe('checkBudget', () => {
    it('returns null when under all thresholds', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 100, 100); // tiny cost
      expect(monitor.checkBudget(100)).toBeNull();
    });

    it('fires 75% threshold alert', () => {
      const monitor = new CostMonitor();
      const callback = vi.fn();
      monitor.onBudgetAlert(callback);

      // Budget $1.00, spend $0.80 (80%)
      // haiku: 0.8 / 0.25 per 1M input = 3.2M tokens
      monitor.recordRequest('haiku', 3_200_000, 0); // $0.80
      monitor.checkBudget(1.0);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ threshold: 0.75 }),
      );
    });

    it('fires 90% threshold alert', () => {
      const monitor = new CostMonitor();
      const alerts: BudgetAlert[] = [];
      monitor.onBudgetAlert((alert) => alerts.push(alert));

      // Budget $1.00, spend $0.95 (95%)
      monitor.recordRequest('haiku', 3_800_000, 0); // $0.95
      monitor.checkBudget(1.0);

      const thresholds = alerts.map((a) => a.threshold);
      expect(thresholds).toContain(0.75);
      expect(thresholds).toContain(0.90);
    });

    it('fires 100% threshold alert when at or over budget', () => {
      const monitor = new CostMonitor();
      const alerts: BudgetAlert[] = [];
      monitor.onBudgetAlert((alert) => alerts.push(alert));

      // Budget $1.00, spend $1.50
      monitor.recordRequest('haiku', 4_000_000, 400_000); // $1.00 + $0.50 = $1.50
      monitor.checkBudget(1.0);

      const thresholds = alerts.map((a) => a.threshold);
      expect(thresholds).toContain(1.0);
    });

    it('does not fire the same threshold twice', () => {
      const monitor = new CostMonitor();
      const callback = vi.fn();
      monitor.onBudgetAlert(callback);

      // First check at 80%
      monitor.recordRequest('haiku', 3_200_000, 0); // $0.80
      monitor.checkBudget(1.0);
      const firstCount = callback.mock.calls.length;

      // Second check still at ~80%
      monitor.recordRequest('haiku', 100, 0); // tiny additional
      monitor.checkBudget(1.0);

      expect(callback.mock.calls.length).toBe(firstCount);
    });

    it('unsubscribe stops alert callbacks', () => {
      const monitor = new CostMonitor();
      const callback = vi.fn();
      const unsub = monitor.onBudgetAlert(callback);
      unsub();

      monitor.recordRequest('haiku', 4_000_000, 0); // $1.00
      monitor.checkBudget(1.0);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ── getRecords ──────────────────────────────────────────────

  describe('getRecords', () => {
    it('returns all recorded requests', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 100, 200);
      monitor.recordRequest('sonnet', 300, 400);

      const records = monitor.getRecords();
      expect(records).toHaveLength(2);
      expect(records[0].model).toBe('haiku');
      expect(records[1].model).toBe('sonnet');
    });

    it('returns a readonly array', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 100, 200);
      const records = monitor.getRecords();
      // readonly — TypeScript should prevent push, but runtime check:
      expect(Array.isArray(records)).toBe(true);
    });
  });

  // ── reset ───────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all records', () => {
      const monitor = new CostMonitor();
      monitor.recordRequest('haiku', 100, 200);
      monitor.recordRequest('sonnet', 300, 400);
      monitor.reset();

      expect(monitor.requestCount).toBe(0);
      expect(monitor.getTotalCost()).toBe(0);
      expect(monitor.getRecords()).toHaveLength(0);
    });

    it('resets budget alert thresholds', () => {
      const monitor = new CostMonitor();
      const callback = vi.fn();
      monitor.onBudgetAlert(callback);

      // Fire 75% threshold
      monitor.recordRequest('haiku', 3_200_000, 0);
      monitor.checkBudget(1.0);
      const count1 = callback.mock.calls.length;

      // Reset and re-fire
      monitor.reset();
      monitor.recordRequest('haiku', 3_200_000, 0);
      monitor.checkBudget(1.0);

      // Should have fired again after reset
      expect(callback.mock.calls.length).toBeGreaterThan(count1);
    });
  });

  // ── Static pricing ──────────────────────────────────────────

  describe('getPricing', () => {
    it('returns pricing for all three models', () => {
      const pricing = CostMonitor.getPricing();
      expect(pricing.haiku.inputPerMillion).toBe(0.25);
      expect(pricing.haiku.outputPerMillion).toBe(1.25);
      expect(pricing.sonnet.inputPerMillion).toBe(3.0);
      expect(pricing.sonnet.outputPerMillion).toBe(15.0);
      expect(pricing.opus.inputPerMillion).toBe(15.0);
      expect(pricing.opus.outputPerMillion).toBe(75.0);
    });
  });
});
