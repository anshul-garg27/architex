'use client';

// ---------------------------------------------------------------------------
// GatedUpgradePrompt -- Upgrade prompt for feature-gated content (BIZ-003)
// ---------------------------------------------------------------------------
// Shown when a user tries to access a feature their current tier doesn't
// include. Displays the feature name, description, required tier, and a
// CTA linking to the pricing page.
// ---------------------------------------------------------------------------

import { memo } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getFeatureLabel,
  type FeatureGate,
  type Tier,
} from '@/lib/billing/feature-gates';
import { PLANS } from '@/lib/billing/plans';

// ── Tier display helpers ─────────────────────────────────────────────────

function tierDisplayName(tier: Tier): string {
  return PLANS[tier].name;
}

function tierColor(tier: Tier): string {
  switch (tier) {
    case 'student':
      return 'text-emerald-500';
    case 'pro':
      return 'text-[var(--primary)]';
    case 'team':
      return 'text-violet-500';
    default:
      return 'text-[var(--foreground)]';
  }
}

// ── Props ────────────────────────────────────────────────────────────────

export interface GatedUpgradePromptProps {
  /** The feature gate that blocked the user. */
  gate: FeatureGate;
  /** Human-readable description of the feature. */
  featureDescription: string;
  /** The minimum tier that unlocks this feature. */
  requiredTier: Tier;
  /** Optional callback when the CTA is clicked. */
  onUpgrade?: () => void;
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────

export const GatedUpgradePrompt = memo(function GatedUpgradePrompt({
  gate,
  featureDescription,
  requiredTier,
  onUpgrade,
  className,
}: GatedUpgradePromptProps) {
  const featureName = getFeatureLabel(gate);
  const planName = tierDisplayName(requiredTier);

  return (
    <Card
      className={cn(
        'border-[var(--border)] bg-[var(--surface)]',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-[var(--foreground-muted)]" />
          {featureName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--foreground-muted)]">
          {featureDescription}
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-3 py-2">
          <Sparkles className="h-4 w-4 text-[var(--primary)]" />
          <span className="text-sm">
            Available on{' '}
            <span className={cn('font-semibold', tierColor(requiredTier))}>
              {planName}
            </span>
            {requiredTier === 'student' && (
              <span className="text-[var(--foreground-subtle)]">
                {' '}(free with .edu email)
              </span>
            )}
            {requiredTier !== 'team' && ' and above'}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button size="sm" asChild onClick={onUpgrade}>
          <Link href="/pricing">
            View Plans
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
});
