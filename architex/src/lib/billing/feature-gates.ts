// ---------------------------------------------------------------------------
// Architex -- Feature Gating System (BIZ-001)
// ---------------------------------------------------------------------------
// Maps 22 feature gates to the minimum subscription tier required.
// The tier hierarchy is: free < student < pro < team.
// Student tier has the same feature access as Pro.
// ---------------------------------------------------------------------------

import type { PlanId } from './types';

// ── Tier type (re-exported for convenience) ──────────────────────────────

export type Tier = PlanId;

// ── Feature gate identifiers ─────────────────────────────────────────────

export type FeatureGate =
  | 'unlimited-designs'
  | 'ai-hints'
  | 'ai-review'
  | 'ai-generation'
  | 'ai-scoring'
  | 'simulation-advanced'
  | 'chaos-engineering'
  | 'export-terraform'
  | 'export-kubernetes'
  | 'export-c4'
  | 'import-terraform'
  | 'collaboration-realtime'
  | 'gallery-publish'
  | 'custom-templates'
  | 'simulation-recording'
  | 'priority-support'
  | 'team-dashboard'
  | 'sso'
  | 'api-access'
  | 'advanced-analytics'
  | 'white-label'
  | 'enterprise-sla';

// ── Tier ordering (for comparison) ───────────────────────────────────────

const TIER_RANK: Record<Tier, number> = {
  free: 0,
  student: 1,
  pro: 1, // student and pro are equivalent in rank
  team: 2,
};

// ── Feature matrix: maps each gate to the tiers that have access ─────────

export const FEATURE_MATRIX: Record<FeatureGate, Tier[]> = {
  // Pro / Student tier features
  'unlimited-designs':     ['student', 'pro', 'team'],
  'ai-hints':              ['student', 'pro', 'team'],
  'ai-review':             ['student', 'pro', 'team'],
  'ai-generation':         ['student', 'pro', 'team'],
  'ai-scoring':            ['student', 'pro', 'team'],
  'simulation-advanced':   ['student', 'pro', 'team'],
  'chaos-engineering':     ['student', 'pro', 'team'],
  'export-terraform':      ['student', 'pro', 'team'],
  'export-kubernetes':     ['student', 'pro', 'team'],
  'export-c4':             ['student', 'pro', 'team'],
  'import-terraform':      ['student', 'pro', 'team'],
  'gallery-publish':       ['student', 'pro', 'team'],
  'custom-templates':      ['student', 'pro', 'team'],
  'simulation-recording':  ['student', 'pro', 'team'],
  'priority-support':      ['student', 'pro', 'team'],

  // Team-only features
  'collaboration-realtime': ['team'],
  'team-dashboard':         ['team'],
  'sso':                    ['team'],
  'api-access':             ['team'],
  'advanced-analytics':     ['team'],
  'white-label':            ['team'],
  'enterprise-sla':         ['team'],
};

// ── Human-readable labels for gates ──────────────────────────────────────

export const FEATURE_LABELS: Record<FeatureGate, string> = {
  'unlimited-designs':      'Unlimited Designs',
  'ai-hints':               'AI Hints',
  'ai-review':              'AI Code Review',
  'ai-generation':          'AI Generation',
  'ai-scoring':             'AI Scoring',
  'simulation-advanced':    'Advanced Simulations',
  'chaos-engineering':      'Chaos Engineering',
  'export-terraform':       'Export to Terraform',
  'export-kubernetes':      'Export to Kubernetes',
  'export-c4':              'Export to C4 Diagrams',
  'import-terraform':       'Import from Terraform',
  'collaboration-realtime': 'Real-time Collaboration',
  'gallery-publish':        'Gallery Publishing',
  'custom-templates':       'Custom Templates',
  'simulation-recording':   'Simulation Recording',
  'priority-support':       'Priority Support',
  'team-dashboard':         'Team Dashboard',
  'sso':                    'SSO / SAML',
  'api-access':             'API Access',
  'advanced-analytics':     'Advanced Analytics',
  'white-label':            'White-label',
  'enterprise-sla':         'Enterprise SLA',
};

// ── Feature gates registry (all gate names as a typed array) ─────────────

export const FEATURE_GATES: FeatureGate[] = Object.keys(FEATURE_MATRIX) as FeatureGate[];

// ── Public API ───────────────────────────────────────────────────────────

/** Check whether a tier has access to a specific feature gate. */
export function hasAccess(tier: Tier, gate: FeatureGate): boolean {
  return FEATURE_MATRIX[gate].includes(tier);
}

/** Get all feature gates available to a tier. */
export function getAvailableFeatures(tier: Tier): FeatureGate[] {
  return FEATURE_GATES.filter((gate) => hasAccess(tier, gate));
}

/**
 * Get the minimum tier required to access a feature gate.
 * Returns the lowest-ranked tier in the allowed list.
 */
export function getRequiredTier(gate: FeatureGate): Tier {
  const allowed = FEATURE_MATRIX[gate];
  let minTier = allowed[0];
  let minRank = TIER_RANK[minTier];

  for (let i = 1; i < allowed.length; i++) {
    const rank = TIER_RANK[allowed[i]];
    if (rank < minRank) {
      minRank = rank;
      minTier = allowed[i];
    }
  }

  return minTier;
}

/** Get the human-readable label for a feature gate. */
export function getFeatureLabel(gate: FeatureGate): string {
  return FEATURE_LABELS[gate];
}
