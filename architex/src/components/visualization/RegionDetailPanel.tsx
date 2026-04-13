'use client';

// -----------------------------------------------------------------
// RegionDetailPanel -- Sidebar for selected data center details
// -----------------------------------------------------------------
//
// Displays:
//   - Region name, provider, city
//   - Latency to all other active regions (sorted ascending)
//   - Service availability indicator
//   - Recommended failover region
//
// Rendering: HTML + motion/react for transitions
// Dark mode: fully supported via CSS variable design tokens
// -----------------------------------------------------------------

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/constants/motion';
import {
  DATA_CENTERS,
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  type DataCenterLocation,
} from '@/lib/visualization/world-map-data';
import {
  getLatency,
  getLatencyColor,
  getLatencyTier,
  getAllLatencies,
  getRecommendedFailover,
  type LatencyTierInfo,
} from '@/lib/visualization/latency-matrix';

// -- Types -----------------------------------------------------------

export interface RegionDetailPanelProps {
  /** ID of the data center to show details for. */
  selectedId: string | null;
  /** All currently active (selected) data center IDs. */
  activeIds: string[];
  /** Simulated service availability (0..1). Defaults to 0.999. */
  availability?: number;
  /** Additional CSS classes. */
  className?: string;
}

// -- Subcomponents ---------------------------------------------------

/** Colored badge for a cloud provider. */
const ProviderBadge = memo(function ProviderBadge({
  provider,
}: {
  provider: DataCenterLocation['provider'];
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: PROVIDER_COLORS[provider] }}
    >
      {provider.toUpperCase()}
    </span>
  );
});

ProviderBadge.displayName = 'ProviderBadge';

/** Availability indicator with color coding. */
const AvailabilityIndicator = memo(function AvailabilityIndicator({
  availability,
}: {
  availability: number;
}) {
  const pct = (availability * 100).toFixed(3);
  const nines = availability >= 0.9999 ? '4' : availability >= 0.999 ? '3' : availability >= 0.99 ? '2' : '1';
  const color =
    availability >= 0.999
      ? '#22C55E'
      : availability >= 0.99
        ? '#EAB308'
        : '#EF4444';

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-mono text-foreground-muted">
        {pct}%
      </span>
      <span className="text-xs text-foreground-subtle">
        ({nines} nines)
      </span>
    </div>
  );
});

AvailabilityIndicator.displayName = 'AvailabilityIndicator';

/** Single latency row to another region. */
const LatencyRow = memo(function LatencyRow({
  dc,
  latencyMs,
  tier,
}: {
  dc: DataCenterLocation;
  latencyMs: number;
  tier: LatencyTierInfo;
}) {
  const color = getLatencyColor(latencyMs);

  return (
    <motion.div
      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-elevated transition-colors"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: duration.normal }}
    >
      {/* Provider dot */}
      <span
        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: PROVIDER_COLORS[dc.provider] }}
      />

      {/* City + region */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate block">
          {dc.city}
        </span>
        <span className="text-xs text-foreground-subtle truncate block">
          {dc.region}
        </span>
      </div>

      {/* Latency bar */}
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (latencyMs / 350) * 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span
          className="text-xs font-mono font-medium w-12 text-right"
          style={{ color }}
        >
          {latencyMs}ms
        </span>
      </div>
    </motion.div>
  );
});

LatencyRow.displayName = 'LatencyRow';

// -- Main Component -------------------------------------------------

export const RegionDetailPanel = memo(function RegionDetailPanel({
  selectedId,
  activeIds,
  availability = 0.999,
  className,
}: RegionDetailPanelProps) {
  const selectedDC = useMemo(
    () => DATA_CENTERS.find((dc) => dc.id === selectedId) ?? null,
    [selectedId],
  );

  // Latencies to other active regions
  const activeLatencies = useMemo(() => {
    if (!selectedId) return [];
    const activeSet = new Set(activeIds);
    return getAllLatencies(selectedId).filter(
      (entry) => activeSet.has(entry.dc.id),
    );
  }, [selectedId, activeIds]);

  // Latencies to all regions (for full view)
  const allLatencies = useMemo(() => {
    if (!selectedId) return [];
    return getAllLatencies(selectedId).slice(0, 10); // top 10
  }, [selectedId]);

  const failover = useMemo(() => {
    if (!selectedId) return null;
    return getRecommendedFailover(selectedId);
  }, [selectedId]);

  const failoverLatency = useMemo(() => {
    if (!selectedId || !failover) return 0;
    return getLatency(selectedId, failover.id);
  }, [selectedId, failover]);

  return (
    <div
      className={cn(
        'w-full max-w-sm rounded-lg border overflow-hidden',
        'bg-surface',
        'border-border',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {selectedDC ? (
          <motion.div
            key={selectedDC.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: duration.normal }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedDC.city}
                </h3>
                <ProviderBadge provider={selectedDC.provider} />
              </div>
              <p className="text-xs text-foreground-subtle font-mono">
                {selectedDC.region}
              </p>
              <p className="text-xs text-foreground-subtle mt-0.5">
                {PROVIDER_LABELS[selectedDC.provider]}
              </p>
            </div>

            {/* Availability */}
            <div className="px-4 py-2.5 border-b border-border">
              <div className="text-xs font-medium text-foreground-subtle mb-1">
                Service Availability
              </div>
              <AvailabilityIndicator availability={availability} />
            </div>

            {/* Failover Region */}
            {failover && (
              <div className="px-4 py-2.5 border-b border-border">
                <div className="text-xs font-medium text-foreground-subtle mb-1">
                  Recommended Failover
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: PROVIDER_COLORS[failover.provider] }}
                  />
                  <span className="text-sm text-foreground-muted">
                    {failover.city}
                  </span>
                  <span className="text-xs font-mono text-foreground-subtle">
                    ({failover.region})
                  </span>
                  <span
                    className="ml-auto text-xs font-mono font-medium"
                    style={{ color: getLatencyColor(failoverLatency) }}
                  >
                    {failoverLatency}ms
                  </span>
                </div>
              </div>
            )}

            {/* Active Region Latencies */}
            {activeLatencies.length > 0 && (
              <div className="px-2 py-2 border-b border-border">
                <div className="px-2 text-xs font-medium text-foreground-subtle mb-1">
                  Latency to Active Regions
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {activeLatencies.map((entry) => (
                    <LatencyRow
                      key={entry.dc.id}
                      dc={entry.dc}
                      latencyMs={entry.latencyMs}
                      tier={entry.tier}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Region Latencies (top 10) */}
            <div className="px-2 py-2">
              <div className="px-2 text-xs font-medium text-foreground-subtle mb-1">
                Nearest Regions (Top 10)
              </div>
              <div className="max-h-52 overflow-y-auto">
                {allLatencies.map((entry) => (
                  <LatencyRow
                    key={entry.dc.id}
                    dc={entry.dc}
                    latencyMs={entry.latencyMs}
                    tier={entry.tier}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-8 text-center"
          >
            <div className="text-foreground-subtle mb-2">
              <svg
                className="w-10 h-10 mx-auto"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx={12} cy={12} r={10} />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <p className="text-sm text-foreground-subtle">
              Select a data center on the map to view details
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

RegionDetailPanel.displayName = "RegionDetailPanel";
