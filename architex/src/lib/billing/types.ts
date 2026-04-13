// ─────────────────────────────────────────────────────────────
// Architex — Billing Type Definitions
// ─────────────────────────────────────────────────────────────
//
// Stripe SDK is NOT installed. These types form an abstraction
// layer that can later be wired to a Stripe integration without
// changing consuming code.
// ─────────────────────────────────────────────────────────────

/** Identifiers for the four available pricing tiers. */
export type PlanId = 'free' | 'student' | 'pro' | 'team';

/** Subscription lifecycle states (mirrors Stripe subscription statuses). */
export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'trialing';

/** Features whose consumption is tracked and limited. */
export type BillableFeature =
  | 'simulations'
  | 'templates'
  | 'aiHints'
  | 'exports'
  | 'collaborators';

// ── Plan ───────────────────────────────────────────────────

/** Numeric limits for every billable feature within a plan. */
export interface PlanLimits {
  simulations: number;
  templates: number;
  aiHints: number;
  exports: number;
  collaborators: number;
}

/** A pricing plan exposed to users. */
export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: PlanLimits;
}

// ── Subscription ───────────────────────────────────────────

/** Active subscription state for the current user. */
export interface Subscription {
  planId: PlanId;
  status: SubscriptionStatus;
  /** ISO-8601 date string for the end of the current billing period. */
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ── Usage ──────────────────────────────────────────────────

/** Per-feature usage record for the current billing period. */
export interface UsageRecord {
  feature: BillableFeature;
  used: number;
  limit: number;
  /** ISO-8601 date string for when this period started. */
  periodStart: string;
}

/** Result of checking whether a feature use is allowed. */
export interface LimitCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
}
