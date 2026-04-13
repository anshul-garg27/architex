/**
 * Shared state color tokens for all algorithm visualizers.
 * ─────────────────────────────────────────────────────────
 *
 * Every visualizer imports colors from here instead of defining
 * local hex maps. CSS custom properties with hex fallbacks ensure
 * correct rendering in both light and dark themes.
 */

import type { ElementState } from './types';
import type { GraphElementState } from './graph/types';
import type { TreeElementState } from './tree/types';
import type { GeometryElementState } from './geometry/types';
import type { DPCell } from './dp/types';

// ── Sorting ─────────────────────────────────────────────────

export const SORTING_STATE_COLORS: Record<ElementState, string> = {
  default: 'var(--foreground-subtle, #6b7280)',
  comparing: 'var(--state-active, #3b82f6)',
  swapping: 'var(--state-error, #ef4444)',
  sorted: 'var(--state-success, #22c55e)',
  pivot: '#a855f7',
  active: '#f59e0b',
  found: '#06b6d4',
} as const;

// ALG-241: Subtle bottom-to-top gradients for bar visualizer backgrounds
export const SORTING_STATE_GRADIENTS: Record<string, string> = {
  default: 'var(--foreground-subtle, #6b7280)',
  comparing: 'linear-gradient(to top, #2563eb, #3b82f6)',
  swapping: 'linear-gradient(to top, #dc2626, #ef4444)',
  sorted: 'linear-gradient(to top, #16a34a, #22c55e)',
  pivot: 'linear-gradient(to top, #7c3aed, #a855f7)',
  active: 'linear-gradient(to top, #d97706, #f59e0b)',
  found: 'linear-gradient(to top, #0891b2, #06b6d4)',
};

// ── Graph ───────────────────────────────────────────────────

export const GRAPH_NODE_STATE_COLORS: Record<GraphElementState, string> = {
  default: 'var(--foreground-subtle, #6b7280)',
  visiting: '#f59e0b',
  visited: 'var(--state-success, #22c55e)',
  current: 'var(--state-active, #3b82f6)',
  'in-queue': '#a855f7',
  'in-path': 'var(--state-error, #ef4444)',
  discovered: '#06b6d4',
} as const;

export const GRAPH_EDGE_STATE_COLORS: Record<string, string> = {
  default: '#374151',
  visiting: '#f59e0b',
  visited: 'var(--foreground-subtle, #6b7280)',
  current: 'var(--state-error, #ef4444)',
  'in-path': 'var(--state-error, #ef4444)',
} as const;

// ── Tree ────────────────────────────────────────────────────

export const TREE_NODE_STATE_COLORS: Record<TreeElementState, string> = {
  default: 'var(--foreground-subtle, #6b7280)',
  visiting: '#f59e0b',
  visited: 'var(--state-success, #22c55e)',
  current: 'var(--state-active, #3b82f6)',
  found: '#06b6d4',
  inserting: '#a855f7',
  deleting: 'var(--state-error, #ef4444)',
  rotating: '#f97316',
} as const;

// ── Dynamic Programming ─────────────────────────────────────

export const DP_STATE_COLORS: Record<DPCell['state'], string> = {
  default: '#374151',
  computing: 'var(--state-active, #3b82f6)',
  computed: '#4b5563',
  optimal: 'var(--state-success, #22c55e)',
  dependency: '#eab308',
} as const;

export const DP_STATE_BORDERS: Record<DPCell['state'], string> = {
  default: '#1f2937',
  computing: '#60a5fa',
  computed: '#374151',
  optimal: '#16a34a',
  dependency: '#ca8a04',
} as const;

export const DP_STATE_TEXT: Record<DPCell['state'], string> = {
  default: '#9ca3af',
  computing: '#ffffff',
  computed: '#d1d5db',
  optimal: '#ffffff',
  dependency: '#fef08a',
} as const;

// ── String Match ────────────────────────────────────────────

type CharState = 'default' | 'comparing' | 'sorted' | 'swapping' | 'active' | 'found';

export const STRING_CHAR_STATE_COLORS: Record<CharState, string> = {
  default: '#374151',
  comparing: 'var(--state-active, #3b82f6)',
  sorted: 'var(--state-success, #22c55e)',
  swapping: 'var(--state-error, #ef4444)',
  active: '#f59e0b',
  found: '#06b6d4',
} as const;

export const STRING_CHAR_STATE_TEXT: Record<CharState, string> = {
  default: '#d1d5db',
  comparing: '#ffffff',
  sorted: '#ffffff',
  swapping: '#ffffff',
  active: '#ffffff',
  found: '#ffffff',
} as const;

// ── Grid (Backtracking) ────────────────────────────────────

type GridCellState =
  | 'empty'
  | 'queen'
  | 'conflict'
  | 'safe'
  | 'trying'
  | 'backtrack'
  | 'given';

export const GRID_STATE_BG: Record<GridCellState, string> = {
  empty: '#1f2937',
  queen: '#a78bfa',
  conflict: 'var(--state-error, #ef4444)',
  safe: '#374151',
  trying: 'var(--state-active, #3b82f6)',
  backtrack: '#f59e0b',
  given: '#6366f1',
} as const;

export const GRID_STATE_BORDER: Record<GridCellState, string> = {
  empty: '#374151',
  queen: '#c4b5fd',
  conflict: '#fca5a5',
  safe: '#4b5563',
  trying: '#93c5fd',
  backtrack: '#fcd34d',
  given: '#818cf8',
} as const;

export const GRID_STATE_TEXT: Record<GridCellState, string> = {
  empty: 'var(--foreground-subtle, #6b7280)',
  queen: '#ffffff',
  conflict: '#ffffff',
  safe: '#9ca3af',
  trying: '#ffffff',
  backtrack: '#1f2937',
  given: '#ffffff',
} as const;

// ── Geometry (Convex Hull) ─────────────────────────────────

export const GEOMETRY_POINT_STATE_COLORS: Record<GeometryElementState, string> = {
  default: 'var(--foreground-subtle, #6b7280)',
  pivot: '#f59e0b',
  processing: '#a855f7',
  hull: 'var(--state-success, #22c55e)',
  rejected: 'var(--state-error, #ef4444)',
  current: 'var(--state-active, #3b82f6)',
  closest: '#ec4899',
} as const;
