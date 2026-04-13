// ─────────────────────────────────────────────────────────────
// Architex — Billing Zustand Store
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlanId,
  Subscription,
  BillableFeature,
  LimitCheckResult,
} from '@/lib/billing/types';
import { PLANS } from '@/lib/billing/plans';
import {
  trackUsage as trackUsageImpl,
  getUsage,
  getAllUsage,
  checkLimit,
  resetUsage as resetUsageImpl,
} from '@/lib/billing/usage-tracker';

// ── State shape ────────────────────────────────────────────

interface UsageSnapshot {
  simulations: number;
  templates: number;
  aiHints: number;
  exports: number;
  collaborators: number;
}

interface BillingState {
  currentPlan: PlanId;
  subscription: Subscription;
  usage: UsageSnapshot;

  // Actions
  setPlan: (planId: PlanId) => void;
  checkFeatureAccess: (feature: BillableFeature) => LimitCheckResult;
  trackUsage: (feature: BillableFeature, amount?: number) => void;
  refreshUsage: () => void;
  resetUsage: () => void;
}

// ── Default subscription ───────────────────────────────────

function defaultSubscription(): Subscription {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    planId: 'free',
    status: 'active',
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
  };
}

function snapshotUsage(): UsageSnapshot {
  return getAllUsage();
}

// ── Store ──────────────────────────────────────────────────

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      currentPlan: 'free',
      subscription: defaultSubscription(),
      usage: {
        simulations: 0,
        templates: 0,
        aiHints: 0,
        exports: 0,
        collaborators: 0,
      },

      setPlan: (planId: PlanId) => {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        set({
          currentPlan: planId,
          subscription: {
            planId,
            status: 'active',
            currentPeriodEnd: periodEnd.toISOString(),
            cancelAtPeriodEnd: false,
          },
        });
      },

      checkFeatureAccess: (feature: BillableFeature): LimitCheckResult => {
        return checkLimit(feature, get().currentPlan);
      },

      trackUsage: (feature: BillableFeature, amount?: number) => {
        trackUsageImpl(feature, amount);
        set({ usage: snapshotUsage() });
      },

      refreshUsage: () => {
        set({ usage: snapshotUsage() });
      },

      resetUsage: () => {
        resetUsageImpl();
        set({ usage: snapshotUsage() });
      },
    }),
    {
      name: 'architex:billing-store',
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        subscription: state.subscription,
      }),
    },
  ),
);

// ── Selectors ──────────────────────────────────────────────

export function selectPlanLimits(state: BillingState) {
  return PLANS[state.currentPlan].limits;
}

export function selectPlanName(state: BillingState) {
  return PLANS[state.currentPlan].name;
}

export function selectIsFeatureAvailable(
  state: BillingState,
  feature: BillableFeature,
): boolean {
  return state.checkFeatureAccess(feature).allowed;
}

/** Convenience: get the usage percentage for a feature (0-100, capped). */
export function selectUsagePercent(
  state: BillingState,
  feature: BillableFeature,
): number {
  const { used, limit } = state.checkFeatureAccess(feature);
  if (limit === Infinity) return 0;
  if (limit === 0) return 100;
  return Math.min(Math.round((used / limit) * 100), 100);
}
