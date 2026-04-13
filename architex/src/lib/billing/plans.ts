// ─────────────────────────────────────────────────────────────
// Architex — Plan Definitions
// ─────────────────────────────────────────────────────────────

import type { Plan, PlanId } from './types';

/** Use Infinity for "unlimited" so numeric comparisons just work. */
const INF = Infinity;

export const FREE_PLAN: Plan = {
  id: 'free',
  name: 'Free',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    '5 simulations per month',
    '10 design templates',
    '3 exports per month',
    'Community support',
  ],
  limits: {
    simulations: 5,
    templates: 10,
    aiHints: 0,
    exports: 3,
    collaborators: 0,
  },
};

export const STUDENT_PLAN: Plan = {
  id: 'student',
  name: 'Student',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    'All Pro features for free',
    'Unlimited simulations',
    'All design templates',
    '50 AI hints per month',
    'Unlimited exports',
    'Requires .edu email verification',
  ],
  limits: {
    simulations: INF,
    templates: INF,
    aiHints: 50,
    exports: INF,
    collaborators: 0,
  },
};

export const PRO_PLAN: Plan = {
  id: 'pro',
  name: 'Pro',
  monthlyPrice: 19,
  yearlyPrice: 190,
  features: [
    'Unlimited simulations',
    'All design templates',
    '50 AI hints per month',
    'Unlimited exports',
    'Priority support',
  ],
  limits: {
    simulations: INF,
    templates: INF,
    aiHints: 50,
    exports: INF,
    collaborators: 0,
  },
};

export const TEAM_PLAN: Plan = {
  id: 'team',
  name: 'Team',
  monthlyPrice: 49,
  yearlyPrice: 490,
  features: [
    'Everything in Pro',
    'Unlimited AI hints',
    '10 collaborators per seat',
    'Team dashboards',
    'Admin controls',
  ],
  limits: {
    simulations: INF,
    templates: INF,
    aiHints: INF,
    exports: INF,
    collaborators: 10,
  },
};

/** All plans indexed for quick lookup. */
export const PLANS: Record<PlanId, Plan> = {
  free: FREE_PLAN,
  student: STUDENT_PLAN,
  pro: PRO_PLAN,
  team: TEAM_PLAN,
};

/** Ordered list for display (cheapest first). */
export const PLAN_LIST: Plan[] = [FREE_PLAN, STUDENT_PLAN, PRO_PLAN, TEAM_PLAN];

/** Retrieve a plan definition by id. */
export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}
