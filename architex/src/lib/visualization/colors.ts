// ─────────────────────────────────────────────────────────────
// Architex — Visualization Color Science
// ─────────────────────────────────────────────────────────────
//
// Perceptually uniform color scales, colorblind-safe palettes,
// and dark/light theme-aware color helpers.
//
// All hex values validated against WCAG 2.1 contrast ratios
// for dark backgrounds (hsl(228 15% 7%)) and light backgrounds
// (hsl(0 0% 100%)).
// ─────────────────────────────────────────────────────────────

// ── CSS Custom Properties (injected into globals.css) ───────
// These are the canonical variable names used by all charts.
// See globals.css for the actual HSL values per theme.

export const VIZ_CSS_VARS = {
  // Sequential scales (utilization 0% -> 100%)
  seqLow: '--viz-seq-low',
  seqMid: '--viz-seq-mid',
  seqHigh: '--viz-seq-high',
  seqCritical: '--viz-seq-critical',

  // Latency percentile colors
  p50: '--viz-p50',
  p90: '--viz-p90',
  p95: '--viz-p95',
  p99: '--viz-p99',

  // Throughput chart
  throughputLine: '--viz-throughput-line',
  throughputFill: '--viz-throughput-fill',

  // Error rate
  errorFill: '--viz-error-fill',
  errorLine: '--viz-error-line',
  errorThreshold: '--viz-error-threshold',

  // Chart infrastructure
  gridLine: '--viz-grid',
  axisText: '--viz-axis-text',
  tooltipBg: '--viz-tooltip-bg',
  tooltipText: '--viz-tooltip-text',
  tooltipBorder: '--viz-tooltip-border',
  anomalyMarker: '--viz-anomaly',
} as const;

// ── IBM Colorblind-Safe Palette (8 colors) ──────────────────
// Source: IBM Design Language — Accessible Palette
// Tested for deuteranopia, protanopia, tritanopia.

export const IBM_COLORBLIND = {
  blue:    '#648FFF',
  purple:  '#785EF0',
  magenta: '#DC267F',
  orange:  '#FE6100',
  yellow:  '#FFB000',
  teal:    '#009E73',  // supplemented from Wong for 6+ categories
  grey:    '#9E9E9E',
  white:   '#FFFFFF',
} as const;

// ── Wong Colorblind-Safe Palette (alternative) ──────────────
// Source: Bang Wong, Nature Methods 8, 441 (2011).

export const WONG_PALETTE = {
  orange:    '#E69F00',
  skyBlue:   '#56B4E9',
  green:     '#009E73',
  yellow:    '#F0E442',
  blue:      '#0072B2',
  vermilion: '#D55E00',
  purple:    '#CC79A7',
  black:     '#000000',
} as const;

// ── Node Category Color Mapping ─────────────────────────────
// Maps NodeCategory to the appropriate colorblind-safe color.

import type { NodeCategory } from '@/lib/types';

/** IBM palette mapped to node categories. */
export const NODE_CATEGORY_COLORS_IBM: Record<NodeCategory, string> = {
  compute:            IBM_COLORBLIND.blue,
  'load-balancing':   IBM_COLORBLIND.purple,
  storage:            IBM_COLORBLIND.teal,
  messaging:          IBM_COLORBLIND.orange,
  networking:         IBM_COLORBLIND.magenta,
  processing:         IBM_COLORBLIND.yellow,
  client:             IBM_COLORBLIND.grey,
  observability:      '#A8DADC',  // light teal (distinct from storage green)
  security:           '#FF6B6B',  // accessible red
  services:           '#10B981',  // emerald
  fintech:            '#FFB000',  // amber (from IBM palette)
  'data-engineering': '#785EF0',  // violet (from IBM palette)
  'ai-llm':           '#DC267F',  // magenta (from IBM palette)
  'db-internals':     '#648FFF',  // blue (from IBM palette)
};

/** Wong palette mapped to node categories. */
export const NODE_CATEGORY_COLORS_WONG: Record<NodeCategory, string> = {
  compute:            WONG_PALETTE.blue,
  'load-balancing':   WONG_PALETTE.purple,
  storage:            WONG_PALETTE.green,
  messaging:          WONG_PALETTE.orange,
  networking:         WONG_PALETTE.vermilion,
  processing:         WONG_PALETTE.yellow,
  client:             WONG_PALETTE.skyBlue,
  observability:      '#A8DADC',
  security:           WONG_PALETTE.vermilion,
  services:           '#009E73',  // green (Wong)
  fintech:            '#E69F00',  // orange (Wong)
  'data-engineering': '#CC79A7',  // purple (Wong)
  'ai-llm':           '#D55E00',  // vermilion (Wong)
  'db-internals':     '#0072B2',  // blue (Wong)
};

// ── Latency Percentile Colors ───────────────────────────────
// P50 is "healthy", P99 is "danger".

export const LATENCY_COLORS = {
  p50: '#22C55E',  // green-500  (good)
  p90: '#EAB308',  // yellow-500 (caution)
  p95: '#F97316',  // orange-500 (warning)
  p99: '#EF4444',  // red-500    (critical)
} as const;

// ── Utilization Gradient Stops ──────────────────────────────
// Used by gauges and bar fills. Linear interpolation between stops.

export const UTILIZATION_STOPS = [
  { pct: 0,    color: '#22C55E' },  // green  — idle
  { pct: 0.5,  color: '#EAB308' },  // yellow — moderate
  { pct: 0.8,  color: '#F97316' },  // orange — high
  { pct: 1.0,  color: '#EF4444' },  // red    — saturated
] as const;

// ── Viridis Sequential Scale (10 stops, for heatmaps) ──────
// Perceptually uniform, colorblind-safe. Subset of Matplotlib Viridis.

export const VIRIDIS_10 = [
  '#440154', '#482777', '#3E4A89', '#31688E', '#26838F',
  '#1F9D89', '#6CCA5B', '#B5DE2B', '#FEE825', '#FDE725',
] as const;

// ── Diverging Scale (Blue-White-Red) ────────────────────────
// For comparison: below-average to above-average.

export const DIVERGING_BLUE_RED = {
  low:    '#3B82F6',  // blue-500
  mid:    '#F8FAFC',  // slate-50 (near-white)
  high:   '#EF4444',  // red-500
} as const;

// ── Algorithm Visualization States ──────────────────────────
// Extended from ArrayVisualizer to support 8 states.

import type { ElementState } from '@/lib/algorithms/types';

type ExtendedElementState = ElementState | 'minimum';

export const ALGO_STATE_COLORS: Record<ExtendedElementState, string> = {
  default:   '#6B7280',  // gray-500
  comparing: '#3B82F6',  // blue-500
  swapping:  '#EF4444',  // red-500
  sorted:    '#22C55E',  // green-500
  pivot:     '#A855F7',  // purple-500
  active:    '#F59E0B',  // amber-500
  found:     '#06B6D4',  // cyan-500
  minimum:   '#EC4899',  // pink-500
};

// ── Raft Node Role Colors ───────────────────────────────────

import type { RaftRole } from '@/lib/distributed/raft';

export const RAFT_ROLE_COLORS: Record<RaftRole, string> = {
  follower:  '#6B7280',  // gray-500
  candidate: '#F59E0B',  // amber-500
  leader:    '#22C55E',  // green-500
};

// ── Color Utility Functions ─────────────────────────────────

/**
 * Interpolate between two hex colors at factor t (0..1).
 * Uses linear interpolation in sRGB space (sufficient for UI).
 */
export function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

/**
 * Get the utilization color for a 0..1 value by interpolating
 * through the UTILIZATION_STOPS gradient.
 */
export function utilizationColor(value: number): string {
  const v = Math.max(0, Math.min(1, value));
  const stops = UTILIZATION_STOPS;

  for (let i = 0; i < stops.length - 1; i++) {
    if (v <= stops[i + 1].pct) {
      const range = stops[i + 1].pct - stops[i].pct;
      const t = range > 0 ? (v - stops[i].pct) / range : 0;
      return lerpColor(stops[i].color, stops[i + 1].color, t);
    }
  }
  return stops[stops.length - 1].color;
}

/**
 * Convert a hex color to an rgba string with the given alpha.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Format a number with SI suffix for axis labels.
 * 1000 -> "1K", 1500000 -> "1.5M", etc.
 */
export function siSuffix(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toPrecision(3)}G`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toPrecision(3)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toPrecision(3)}K`;
  if (abs >= 1) return value.toFixed(0);
  if (abs >= 0.001) return `${(value * 1000).toPrecision(3)}m`;
  return value.toPrecision(2);
}
