'use client';

// ─────────────────────────────────────────────────────────────
// UsageMeter — Visual usage indicator for a billable feature
// ─────────────────────────────────────────────────────────────
//
// Displays a colour-coded progress bar with numeric labels.
//   green  (<75%)  — comfortable headroom
//   yellow (75-90%) — approaching limit
//   red    (>90%)  — near or at limit
// ─────────────────────────────────────────────────────────────

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { useBillingStore } from '@/stores/billing-store';
import type { BillableFeature } from '@/lib/billing/types';

// ── Feature display names ──────────────────────────────────

const FEATURE_LABELS: Record<BillableFeature, string> = {
  simulations: 'Simulations',
  templates: 'Templates',
  aiHints: 'AI Hints',
  exports: 'Exports',
  collaborators: 'Collaborators',
};

function formatLimit(value: number): string {
  return value === Infinity ? '\u221E' : String(value);
}

// ── Colour thresholds ──────────────────────────────────────

function getBarColor(percent: number): string {
  if (percent > 90) return 'bg-red-500';
  if (percent >= 75) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

function getLabelColor(percent: number): string {
  if (percent > 90) return 'text-red-400';
  if (percent >= 75) return 'text-yellow-400';
  return 'text-muted-foreground';
}

// ── Props ──────────────────────────────────────────────────

export interface UsageMeterProps {
  feature: BillableFeature;
  /** Override the label (defaults to FEATURE_LABELS mapping). */
  label?: string;
  className?: string;
}

// ── Component ──────────────────────────────────────────────

export const UsageMeter = memo(function UsageMeter({
  feature,
  label,
  className,
}: UsageMeterProps) {
  const checkFeatureAccess = useBillingStore((s) => s.checkFeatureAccess);
  const { used, limit } = checkFeatureAccess(feature);

  const isUnlimited = limit === Infinity;
  const percent = isUnlimited
    ? 0
    : limit === 0
      ? 100
      : Math.min(Math.round((used / limit) * 100), 100);

  const displayLabel = label ?? FEATURE_LABELS[feature];

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{displayLabel}</span>
        <span className={cn('tabular-nums', getLabelColor(percent))}>
          {used}
          {' / '}
          {formatLimit(limit)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-label={`${displayLabel} usage`}
        aria-valuemin={0}
        aria-valuemax={isUnlimited ? undefined : limit}
        aria-valuenow={used}
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isUnlimited ? 'bg-emerald-500' : getBarColor(percent),
          )}
          style={{ width: isUnlimited ? '0%' : `${percent}%` }}
        />
      </div>

      {/* Unlimited badge */}
      {isUnlimited && (
        <p className="text-[0.65rem] text-muted-foreground">Unlimited</p>
      )}
    </div>
  );
});
