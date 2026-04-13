'use client';

// ---------------------------------------------------------------------------
// GatedFeature -- Feature gate wrapper component (BIZ-003)
// ---------------------------------------------------------------------------
// Wraps children and conditionally renders them based on the user's
// subscription tier. Shows an UpgradePrompt when the user lacks access.
// ---------------------------------------------------------------------------

import { type ReactNode } from 'react';
import { useBillingStore } from '@/stores/billing-store';
import {
  hasAccess,
  getRequiredTier,
  getFeatureLabel,
  type FeatureGate,
} from '@/lib/billing/feature-gates';
import { GatedUpgradePrompt } from './GatedUpgradePrompt';

// ── Props ────────────────────────────────────────────────────────────────

export interface GatedFeatureProps {
  /** The feature gate to check against the user's tier. */
  gate: FeatureGate;
  /** Content to render when the user has access. */
  children: ReactNode;
  /** Optional custom fallback to render instead of the default UpgradePrompt. */
  fallback?: ReactNode;
  /** Optional description shown in the UpgradePrompt. */
  featureDescription?: string;
}

// ── Component ────────────────────────────────────────────────────────────

export function GatedFeature({
  gate,
  children,
  fallback,
  featureDescription,
}: GatedFeatureProps) {
  const currentPlan = useBillingStore((s) => s.currentPlan);

  if (hasAccess(currentPlan, gate)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <GatedUpgradePrompt
      gate={gate}
      featureDescription={
        featureDescription ?? `Unlock ${getFeatureLabel(gate)} to take your learning further.`
      }
      requiredTier={getRequiredTier(gate)}
    />
  );
}
