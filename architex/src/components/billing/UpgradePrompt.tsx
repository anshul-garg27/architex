'use client';

// ─────────────────────────────────────────────────────────────
// UpgradePrompt — Shown when the user hits a plan limit
// ─────────────────────────────────────────────────────────────
//
// Displays current usage vs limit, a clear CTA to upgrade,
// and a side-by-side comparison of current plan vs Pro.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from 'react';
import { ArrowRight, Check, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useBillingStore } from '@/stores/billing-store';
import { PLANS } from '@/lib/billing/plans';
import type { BillableFeature, PlanId } from '@/lib/billing/types';

// ── Feature display names ──────────────────────────────────

const FEATURE_LABELS: Record<BillableFeature, string> = {
  simulations: 'simulations',
  templates: 'templates',
  aiHints: 'AI hints',
  exports: 'exports',
  collaborators: 'collaborators',
};

function formatLimit(value: number): string {
  return value === Infinity ? 'Unlimited' : String(value);
}

// ── Props ──────────────────────────────────────────────────

export interface UpgradePromptProps {
  /** The feature that triggered the upgrade prompt. */
  feature: BillableFeature;
  /** Plan to recommend upgrading to (defaults to 'pro'). */
  upgradeTo?: PlanId;
  /** Called when the user clicks the upgrade CTA. */
  onUpgrade?: () => void;
  /** Called when the user dismisses the prompt. */
  onDismiss?: () => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────

export const UpgradePrompt = memo(function UpgradePrompt({
  feature,
  upgradeTo = 'pro',
  onUpgrade,
  onDismiss,
  className,
}: UpgradePromptProps) {
  const currentPlan = useBillingStore((s) => s.currentPlan);
  const checkFeatureAccess = useBillingStore((s) => s.checkFeatureAccess);
  const { used, limit } = checkFeatureAccess(feature);

  const currentPlanDef = PLANS[currentPlan];
  const targetPlanDef = PLANS[upgradeTo];

  const comparisonFeatures = useMemo(() => {
    const features: BillableFeature[] = [
      'simulations',
      'templates',
      'aiHints',
      'exports',
      'collaborators',
    ];
    return features.map((f) => ({
      key: f,
      label: FEATURE_LABELS[f],
      current: currentPlanDef.limits[f],
      target: targetPlanDef.limits[f],
    }));
  }, [currentPlanDef, targetPlanDef]);

  return (
    <Card
      className={cn(
        'border-state-warning/40 bg-state-warning/5',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-state-warning" />
          Limit reached
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage message */}
        <p className="text-sm text-muted-foreground">
          You&apos;ve used{' '}
          <span className="font-semibold text-foreground">
            {used}/{formatLimit(limit)}
          </span>{' '}
          {FEATURE_LABELS[feature]} this month.
        </p>

        {/* Feature comparison */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 grid grid-cols-3 text-xs font-medium text-muted-foreground">
            <span>Feature</span>
            <span className="text-center">{currentPlanDef.name}</span>
            <span className="text-center text-primary">
              {targetPlanDef.name}
            </span>
          </div>
          <ul className="space-y-1.5">
            {comparisonFeatures.map(({ key, label, current, target }) => (
              <li
                key={key}
                className={cn(
                  'grid grid-cols-3 text-xs',
                  key === feature && 'font-semibold text-state-warning',
                )}
              >
                <span className="capitalize">{label}</span>
                <span className="text-center">
                  {current === 0 ? (
                    <X className="mx-auto h-3 w-3 text-muted-foreground" />
                  ) : (
                    formatLimit(current)
                  )}
                </span>
                <span className="text-center text-primary">
                  {target === 0 ? (
                    <X className="mx-auto h-3 w-3 text-muted-foreground" />
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" />
                      {formatLimit(target)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button size="sm" onClick={onUpgrade}>
          Upgrade to {targetPlanDef.name}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Maybe later
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});
