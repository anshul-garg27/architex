'use client';

// -----------------------------------------------------------------
// MultiRegionMap -- Interactive SVG World Map Visualization
// -----------------------------------------------------------------
//
// Dimensions: 100% width, aspect ratio 2:1
// Rendering: SVG with motion/react animations
// Features:
//   - Simplified world map as background
//   - Data center markers colored by provider
//   - Click to select/deselect regions
//   - Latency lines between selected regions (animated dashed)
//   - Hover tooltips with latency info
//   - Pulse animation on active regions
//   - Failover route indicators (dashed)
//   - Dark mode support via CSS variables
//
// Performance: SVG fine for 24 markers + ~50 lines
// Accessibility: aria-labels on markers, role=img on map
// Responsive: SVG viewBox scales to container
// -----------------------------------------------------------------

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  CONTINENT_PATHS,
  DATA_CENTERS,
  MAP_VIEWBOX,
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  type CloudProvider,
  type DataCenterLocation,
} from '@/lib/visualization/world-map-data';
import {
  getLatency,
  getLatencyColor,
  getLatencyTier,
  getRecommendedFailover,
} from '@/lib/visualization/latency-matrix';

// -- Types -----------------------------------------------------------

export interface MultiRegionMapProps {
  /** IDs of active (selected) data centers. */
  selectedIds?: string[];
  /** Called when a data center marker is clicked. */
  onSelect?: (dcId: string) => void;
  /** Whether to show failover routes for selected regions. */
  showFailover?: boolean;
  /** Filter by provider. null = show all. */
  providerFilter?: CloudProvider | null;
  /** Additional CSS classes. */
  className?: string;
}

interface TooltipState {
  x: number;
  y: number;
  fromId: string;
  toId: string;
  latencyMs: number;
}

// -- Constants -------------------------------------------------------

const MARKER_RADIUS = 6;
const PULSE_RADIUS = 14;

// -- Subcomponents ---------------------------------------------------

/** Render simplified continent outlines. */
const ContinentLayer = memo(function ContinentLayer() {
  return (
    <g className="continents">
      {CONTINENT_PATHS.map((continent) => (
        <path
          key={continent.id}
          d={continent.d}
          className="fill-surface stroke-border"
          strokeWidth={0.5}
        />
      ))}
    </g>
  );
});

ContinentLayer.displayName = 'ContinentLayer';

/** Animated pulse ring behind active markers. */
const PulseRing = memo(function PulseRing({
  cx,
  cy,
  color,
}: {
  cx: number;
  cy: number;
  color: string;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={PULSE_RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      initial={{ r: MARKER_RADIUS, opacity: 0.8 }}
      animate={{
        r: [MARKER_RADIUS, PULSE_RADIUS, MARKER_RADIUS],
        opacity: [0.8, 0, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

PulseRing.displayName = 'PulseRing';

/** Single data center marker. */
const DCMarker = memo(function DCMarker({
  dc,
  isSelected,
  isFiltered,
  onSelect,
}: {
  dc: DataCenterLocation;
  isSelected: boolean;
  isFiltered: boolean;
  onSelect: (id: string) => void;
}) {
  const color = PROVIDER_COLORS[dc.provider];
  const opacity = isFiltered ? 1 : 0.25;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${dc.city} (${dc.region}, ${PROVIDER_LABELS[dc.provider]})`}
      onClick={() => onSelect(dc.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(dc.id);
        }
      }}
      className="cursor-pointer focus:outline-none"
    >
      {/* Pulse animation for selected markers */}
      {isSelected && (
        <PulseRing cx={dc.x} cy={dc.y} color={color} />
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.circle
          cx={dc.x}
          cy={dc.y}
          r={MARKER_RADIUS + 3}
          fill="none"
          stroke={color}
          strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          style={{ originX: `${dc.x}px`, originY: `${dc.y}px` }}
        />
      )}

      {/* Main dot */}
      <motion.circle
        cx={dc.x}
        cy={dc.y}
        r={isSelected ? MARKER_RADIUS : MARKER_RADIUS - 1}
        fill={color}
        opacity={opacity}
        stroke="white"
        strokeWidth={1}
        whileHover={{ r: MARKER_RADIUS + 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />

      {/* Label (only shown for selected) */}
      <AnimatePresence>
        {isSelected && (
          <motion.text
            x={dc.x}
            y={dc.y - MARKER_RADIUS - 6}
            textAnchor="middle"
            className="fill-foreground"
            fontSize={9}
            fontWeight={600}
            initial={{ opacity: 0, y: dc.y - MARKER_RADIUS }}
            animate={{ opacity: 1, y: dc.y - MARKER_RADIUS - 6 }}
            exit={{ opacity: 0 }}
          >
            {dc.city}
          </motion.text>
        )}
      </AnimatePresence>
    </g>
  );
});

DCMarker.displayName = 'DCMarker';

/** Latency connection line between two data centers. */
const LatencyLine = memo(function LatencyLine({
  from,
  to,
  latencyMs,
  isFailover,
  onHover,
  onLeave,
}: {
  from: DataCenterLocation;
  to: DataCenterLocation;
  latencyMs: number;
  isFailover: boolean;
  onHover: (tooltip: TooltipState) => void;
  onLeave: () => void;
}) {
  const color = getLatencyColor(latencyMs);
  const tier = getLatencyTier(latencyMs);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const gradientId = `latency-grad-${from.id}-${to.id}`;

  return (
    <g
      onMouseEnter={() =>
        onHover({
          x: midX,
          y: midY,
          fromId: from.id,
          toId: to.id,
          latencyMs,
        })
      }
      onMouseLeave={onLeave}
      aria-label={`${from.city} to ${to.city}: ${latencyMs}ms (${tier.label})`}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={PROVIDER_COLORS[from.provider]} stopOpacity={0.6} />
          <stop offset="50%" stopColor={color} stopOpacity={0.8} />
          <stop offset="100%" stopColor={PROVIDER_COLORS[to.provider]} stopOpacity={0.6} />
        </linearGradient>
      </defs>

      {/* Invisible wide hit area for hovering */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="transparent"
        strokeWidth={8}
        className="cursor-pointer"
      />

      {/* Visible line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={`url(#${gradientId})`}
        strokeWidth={isFailover ? 1.5 : 2}
        strokeDasharray={isFailover ? '6 4' : '8 4'}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-24"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </motion.line>
    </g>
  );
});

LatencyLine.displayName = 'LatencyLine';

// -- Main Component -------------------------------------------------

export const MultiRegionMap = memo(function MultiRegionMap({
  selectedIds = [],
  onSelect,
  showFailover = false,
  providerFilter = null,
  className,
}: MultiRegionMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleSelect = useCallback(
    (dcId: string) => {
      onSelect?.(dcId);
    },
    [onSelect],
  );

  const handleLineHover = useCallback((state: TooltipState) => {
    setTooltip(state);
  }, []);

  const handleLineLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Visible data centers (respecting filter)
  const visibleDCs = useMemo(() => {
    if (!providerFilter) return DATA_CENTERS;
    return DATA_CENTERS.filter((dc) => dc.provider === providerFilter);
  }, [providerFilter]);

  // Latency lines between all selected pairs
  const latencyPairs = useMemo(() => {
    const selected = DATA_CENTERS.filter((dc) => selectedSet.has(dc.id));
    const pairs: Array<{
      from: DataCenterLocation;
      to: DataCenterLocation;
      latencyMs: number;
      isFailover: boolean;
    }> = [];

    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const latencyMs = getLatency(selected[i].id, selected[j].id);
        pairs.push({
          from: selected[i],
          to: selected[j],
          latencyMs,
          isFailover: false,
        });
      }
    }

    return pairs;
  }, [selectedSet]);

  // Failover routes for selected regions
  const failoverPairs = useMemo(() => {
    if (!showFailover) return [];

    const pairs: Array<{
      from: DataCenterLocation;
      to: DataCenterLocation;
      latencyMs: number;
      isFailover: boolean;
    }> = [];

    const selected = DATA_CENTERS.filter((dc) => selectedSet.has(dc.id));
    for (const dc of selected) {
      const failover = getRecommendedFailover(dc.id);
      if (failover && !selectedSet.has(failover.id)) {
        const latencyMs = getLatency(dc.id, failover.id);
        pairs.push({
          from: dc,
          to: failover,
          latencyMs,
          isFailover: true,
        });
      }
    }

    return pairs;
  }, [selectedSet, showFailover]);

  const allLines = useMemo(
    () => [...latencyPairs, ...failoverPairs],
    [latencyPairs, failoverPairs],
  );

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        'bg-surface',
        'border border-border',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Multi-region data center map"
      >
        {/* Grid lines for visual reference */}
        <g className="opacity-10">
          {/* Equator */}
          <line
            x1={0}
            y1={250}
            x2={1000}
            y2={250}
            className="stroke-foreground-subtle"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
          {/* Prime Meridian */}
          <line
            x1={500}
            y1={0}
            x2={500}
            y2={500}
            className="stroke-foreground-subtle"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        </g>

        {/* Continent outlines */}
        <ContinentLayer />

        {/* Latency connection lines */}
        <AnimatePresence>
          {allLines.map((pair) => (
            <LatencyLine
              key={`${pair.from.id}-${pair.to.id}`}
              from={pair.from}
              to={pair.to}
              latencyMs={pair.latencyMs}
              isFailover={pair.isFailover}
              onHover={handleLineHover}
              onLeave={handleLineLeave}
            />
          ))}
        </AnimatePresence>

        {/* Data center markers */}
        <AnimatePresence>
          {visibleDCs.map((dc) => (
            <DCMarker
              key={dc.id}
              dc={dc}
              isSelected={selectedSet.has(dc.id)}
              isFiltered={!providerFilter || dc.provider === providerFilter}
              onSelect={handleSelect}
            />
          ))}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <rect
                x={tooltip.x - 55}
                y={tooltip.y - 28}
                width={110}
                height={24}
                rx={4}
                className="fill-foreground"
                opacity={0.9}
              />
              <text
                x={tooltip.x}
                y={tooltip.y - 13}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                className="fill-background"
              >
                {tooltip.latencyMs}ms
                {' '}
                ({getLatencyTier(tooltip.latencyMs).label})
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 text-xs border-t border-border">
        <span className="font-medium text-foreground-muted">
          Providers:
        </span>
        {(Object.entries(PROVIDER_COLORS) as Array<[CloudProvider, string]>).map(
          ([provider, color]) => (
            <span key={provider} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-foreground-muted uppercase">
                {provider}
              </span>
            </span>
          ),
        )}
        <span className="ml-auto text-foreground-subtle">
          Click markers to select regions
        </span>
      </div>
    </div>
  );
});

MultiRegionMap.displayName = "MultiRegionMap";
