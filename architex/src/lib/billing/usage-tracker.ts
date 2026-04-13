// ─────────────────────────────────────────────────────────────
// Architex — Client-side Usage Tracker
// ─────────────────────────────────────────────────────────────
//
// Persists usage counters in localStorage so they survive
// page reloads. A real backend would store this server-side;
// this module is the client-side abstraction layer.
// ─────────────────────────────────────────────────────────────

import type { BillableFeature, LimitCheckResult, PlanId } from './types';
import { PLANS } from './plans';

const STORAGE_KEY = 'architex:billing:usage';
const PERIOD_KEY = 'architex:billing:period-start';

// ── Internal helpers ───────────────────────────────────────

interface UsageMap {
  simulations: number;
  templates: number;
  aiHints: number;
  exports: number;
  collaborators: number;
}

function defaultUsage(): UsageMap {
  return {
    simulations: 0,
    templates: 0,
    aiHints: 0,
    exports: 0,
    collaborators: 0,
  };
}

function readUsage(): UsageMap {
  if (typeof window === 'undefined') return defaultUsage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUsage();
    return { ...defaultUsage(), ...(JSON.parse(raw) as Partial<UsageMap>) };
  } catch {
    return defaultUsage();
  }
}

function writeUsage(usage: UsageMap): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

// ── Public API ─────────────────────────────────────────────

/**
 * Increment the counter for a billable feature by 1 (or a custom amount).
 * Returns the new count.
 */
export function trackUsage(feature: BillableFeature, amount = 1): number {
  const usage = readUsage();
  usage[feature] += amount;
  writeUsage(usage);
  return usage[feature];
}

/** Get the current usage count for a feature. */
export function getUsage(feature: BillableFeature): number {
  return readUsage()[feature];
}

/** Get the full usage map for all features. */
export function getAllUsage(): UsageMap {
  return readUsage();
}

/**
 * Check whether the user can consume one more unit of `feature`
 * under the given plan.
 */
export function checkLimit(
  feature: BillableFeature,
  planId: PlanId,
): LimitCheckResult {
  const used = getUsage(feature);
  const limit = PLANS[planId].limits[feature];
  return {
    allowed: used < limit,
    used,
    limit,
  };
}

/** Reset all usage counters (call at the start of a new billing period). */
export function resetUsage(): void {
  writeUsage(defaultUsage());
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERIOD_KEY, new Date().toISOString());
  }
}

/** Get the ISO-8601 date string of when the current period started. */
export function getPeriodStart(): string {
  if (typeof window === 'undefined') return new Date().toISOString();
  return localStorage.getItem(PERIOD_KEY) ?? new Date().toISOString();
}
