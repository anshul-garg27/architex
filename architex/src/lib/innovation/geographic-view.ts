// ─────────────────────────────────────────────────────────────
// Architex — Geographic View Integration (INO-025)
// ─────────────────────────────────────────────────────────────
//
// Wires the MultiRegionMap visualisation component into the
// innovation/system-design module as a selectable mode option.
//
// The MultiRegionMap component lives at:
//   src/components/visualization/MultiRegionMap.tsx
//
// This module provides configuration, mode metadata, and
// helper functions for managing geographic view state within
// the innovation system.
//
// Public API:
//   GEOGRAPHIC_VIEW_MODE       → mode metadata
//   createGeographicViewState  → initial state factory
//   toggleRegion               → add/remove a region selection
//   setProviderFilter          → filter by cloud provider
//   getSelectedLatencies       → latency info for selected pairs
// ─────────────────────────────────────────────────────────────

import type { CloudProvider } from '@/lib/visualization/world-map-data';

// ── Types ───────────────────────────────────────────────────

/** Mode metadata for the module switcher UI. */
export interface ViewMode {
  /** Machine-readable mode id. */
  id: string;
  /** Display label. */
  label: string;
  /** Short description shown in the mode picker. */
  description: string;
  /** lucide-react icon name for the mode. */
  icon: string;
  /** Whether this mode is available (e.g. feature-flag). */
  available: boolean;
}

/** Runtime state for the geographic view. */
export interface GeographicViewState {
  /** Currently selected data center IDs. */
  selectedIds: string[];
  /** Active provider filter (null = show all). */
  providerFilter: CloudProvider | null;
  /** Whether failover routes are shown. */
  showFailover: boolean;
}

/** Latency pair info returned by getSelectedLatencies. */
export interface LatencyPair {
  fromId: string;
  toId: string;
  latencyMs: number;
}

// ── Mode Metadata ──────────────────────────────────────────

/** Geographic view mode definition for the module switcher. */
export const GEOGRAPHIC_VIEW_MODE: ViewMode = {
  id: 'geographic',
  label: 'Geographic View',
  description: 'Visualise data centers, latencies, and failover routes on an interactive world map.',
  icon: 'globe-2',
  available: true,
};

// ── State Management ───────────────────────────────────────

/**
 * Create the initial geographic view state.
 */
export function createGeographicViewState(
  overrides?: Partial<GeographicViewState>,
): GeographicViewState {
  return {
    selectedIds: [],
    providerFilter: null,
    showFailover: false,
    ...overrides,
  };
}

/**
 * Toggle a data center region selection.
 * If the region is already selected it is removed;
 * otherwise it is added.
 */
export function toggleRegion(
  state: GeographicViewState,
  regionId: string,
): GeographicViewState {
  const exists = state.selectedIds.includes(regionId);
  return {
    ...state,
    selectedIds: exists
      ? state.selectedIds.filter((id) => id !== regionId)
      : [...state.selectedIds, regionId],
  };
}

/**
 * Set the provider filter. Pass null to show all providers.
 */
export function setProviderFilter(
  state: GeographicViewState,
  provider: CloudProvider | null,
): GeographicViewState {
  return { ...state, providerFilter: provider };
}

/**
 * Toggle failover route display.
 */
export function toggleFailover(
  state: GeographicViewState,
): GeographicViewState {
  return { ...state, showFailover: !state.showFailover };
}

/**
 * Compute latency info for all selected region pairs.
 * This is a pure function — the actual latency lookup is
 * deferred to the latency-matrix module at render time.
 * Here we just produce the pair combinations.
 */
export function getSelectedPairs(
  state: GeographicViewState,
): Array<{ fromId: string; toId: string }> {
  const pairs: Array<{ fromId: string; toId: string }> = [];
  const ids = state.selectedIds;

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push({ fromId: ids[i], toId: ids[j] });
    }
  }

  return pairs;
}

/**
 * All innovation view modes including the geographic view.
 * Other modes can be added here as the platform evolves.
 */
export const INNOVATION_VIEW_MODES: readonly ViewMode[] = [
  {
    id: 'canvas',
    label: 'Canvas',
    description: 'The default system-design canvas with drag-and-drop components.',
    icon: 'layout-dashboard',
    available: true,
  },
  GEOGRAPHIC_VIEW_MODE,
  {
    id: 'gallery',
    label: 'Architecture Gallery',
    description: 'Browse reference architectures from top tech companies.',
    icon: 'library',
    available: true,
  },
] as const;

/**
 * Get a view mode by its ID.
 */
export function getViewMode(id: string): ViewMode | undefined {
  return INNOVATION_VIEW_MODES.find((m) => m.id === id);
}
