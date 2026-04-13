import { describe, it, expect, beforeEach } from 'vitest';
import { useBillingStore } from '@/stores/billing-store';
import {
  selectPlanLimits,
  selectPlanName,
  selectUsagePercent,
} from '@/stores/billing-store';

// ── Helpers ────────────────────────────────────────────────

function resetStore() {
  const s = useBillingStore.getState();
  s.setPlan('free');
  s.resetUsage();
}

// ── Tests ──────────────────────────────────────────────────

describe('billing-store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Initial state ────────────────────────────────────────

  it('defaults to the free plan', () => {
    expect(useBillingStore.getState().currentPlan).toBe('free');
  });

  it('has an active subscription by default', () => {
    expect(useBillingStore.getState().subscription.status).toBe('active');
  });

  // ── setPlan ──────────────────────────────────────────────

  it('setPlan switches the current plan', () => {
    useBillingStore.getState().setPlan('pro');
    expect(useBillingStore.getState().currentPlan).toBe('pro');
    expect(useBillingStore.getState().subscription.planId).toBe('pro');
  });

  it('setPlan resets subscription to active', () => {
    useBillingStore.getState().setPlan('team');
    expect(useBillingStore.getState().subscription.status).toBe('active');
    expect(useBillingStore.getState().subscription.cancelAtPeriodEnd).toBe(
      false,
    );
  });

  // ── trackUsage ───────────────────────────────────────────

  it('trackUsage increments the usage snapshot', () => {
    useBillingStore.getState().trackUsage('simulations');
    useBillingStore.getState().trackUsage('simulations');
    expect(useBillingStore.getState().usage.simulations).toBe(2);
  });

  it('trackUsage accepts a custom amount', () => {
    useBillingStore.getState().trackUsage('exports', 3);
    expect(useBillingStore.getState().usage.exports).toBe(3);
  });

  // ── checkFeatureAccess ───────────────────────────────────

  it('checkFeatureAccess reflects free plan limits', () => {
    useBillingStore.getState().trackUsage('simulations', 4);
    const result = useBillingStore.getState().checkFeatureAccess('simulations');
    expect(result).toEqual({ allowed: true, used: 4, limit: 5 });
  });

  it('checkFeatureAccess denies when at limit', () => {
    useBillingStore.getState().trackUsage('simulations', 5);
    const result = useBillingStore.getState().checkFeatureAccess('simulations');
    expect(result.allowed).toBe(false);
  });

  it('checkFeatureAccess allows unlimited on pro plan', () => {
    useBillingStore.getState().setPlan('pro');
    useBillingStore.getState().trackUsage('simulations', 999);
    const result = useBillingStore.getState().checkFeatureAccess('simulations');
    expect(result.allowed).toBe(true);
  });

  // ── resetUsage ───────────────────────────────────────────

  it('resetUsage zeros all counters', () => {
    useBillingStore.getState().trackUsage('simulations', 5);
    useBillingStore.getState().trackUsage('exports', 3);
    useBillingStore.getState().resetUsage();

    const u = useBillingStore.getState().usage;
    expect(u.simulations).toBe(0);
    expect(u.exports).toBe(0);
  });

  // ── Selectors ────────────────────────────────────────────

  it('selectPlanLimits returns limits for the current plan', () => {
    useBillingStore.getState().setPlan('team');
    const limits = selectPlanLimits(useBillingStore.getState());
    expect(limits.collaborators).toBe(10);
  });

  it('selectPlanName returns the display name', () => {
    expect(selectPlanName(useBillingStore.getState())).toBe('Free');
    useBillingStore.getState().setPlan('pro');
    expect(selectPlanName(useBillingStore.getState())).toBe('Pro');
  });

  it('selectUsagePercent returns 0 for unlimited features', () => {
    useBillingStore.getState().setPlan('pro');
    useBillingStore.getState().trackUsage('simulations', 100);
    expect(
      selectUsagePercent(useBillingStore.getState(), 'simulations'),
    ).toBe(0);
  });

  it('selectUsagePercent computes correct percentage', () => {
    useBillingStore.getState().trackUsage('simulations', 3);
    // 3/5 = 60%
    expect(
      selectUsagePercent(useBillingStore.getState(), 'simulations'),
    ).toBe(60);
  });

  it('selectUsagePercent caps at 100%', () => {
    useBillingStore.getState().trackUsage('exports', 10);
    // 10/3 would be 333%, but capped at 100
    expect(selectUsagePercent(useBillingStore.getState(), 'exports')).toBe(
      100,
    );
  });
});
