'use client';

/**
 * LODContext — Level-of-Detail Context
 *
 * Provides a LOD tier based on the current zoom level, replacing ~50
 * individual viewport store subscriptions across node components.
 *
 * The DesignCanvas subscribes to zoom once and provides the tier via context.
 * All node components read from context instead of subscribing directly.
 *
 * LOD Tiers:
 *   - full:    zoom >= 0.8 — show everything (labels, metrics, handles, badges)
 *   - reduced: zoom >= 0.5 — hide minor details (metric badges, secondary labels)
 *   - minimal: zoom >= 0.2 — show only icon and primary label
 *   - hidden:  zoom < 0.2  — fully culled (for offscreen optimization)
 */

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useViewportStore } from '@/stores/viewport-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LODTier = 'full' | 'reduced' | 'minimal' | 'hidden';

// ---------------------------------------------------------------------------
// Zoom -> LODTier mapping
// ---------------------------------------------------------------------------

/**
 * Compute the LOD tier from a zoom level.
 * Uses hysteresis-free thresholds (simple cutoffs).
 */
export function zoomToLODTier(zoom: number): LODTier {
  if (zoom >= 0.8) return 'full';
  if (zoom >= 0.5) return 'reduced';
  if (zoom >= 0.2) return 'minimal';
  return 'hidden';
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const LODContext = createContext<LODTier>('full');

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface LODProviderProps {
  children: ReactNode;
  /** Optional override zoom (for testing). If not provided, reads from viewport store. */
  zoom?: number;
}

/**
 * Provides LODTier to all descendants based on the current viewport zoom.
 *
 * Wrap your canvas content in this provider:
 *   <LODProvider>
 *     <ReactFlow ...>
 *       {children}
 *     </ReactFlow>
 *   </LODProvider>
 */
export function LODProvider({ children, zoom: overrideZoom }: LODProviderProps) {
  const storeZoom = useViewportStore((s) => s.zoom);
  const zoom = overrideZoom ?? storeZoom;
  const tier = useMemo(() => zoomToLODTier(zoom), [zoom]);

  return <LODContext.Provider value={tier}>{children}</LODContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Read the current LOD tier.
 *
 * @returns The current LODTier based on viewport zoom
 *
 * @example
 *   const lod = useLOD();
 *   if (lod === 'minimal') return <IconOnlyNode />;
 */
export function useLOD(): LODTier {
  return useContext(LODContext);
}

// ---------------------------------------------------------------------------
// Utility helpers for conditional rendering
// ---------------------------------------------------------------------------

/** Whether to show full metric badges (only at full detail). */
export function showMetrics(tier: LODTier): boolean {
  return tier === 'full';
}

/** Whether to show secondary labels and descriptions. */
export function showDetails(tier: LODTier): boolean {
  return tier === 'full' || tier === 'reduced';
}

/** Whether to show the icon and primary label. */
export function showLabel(tier: LODTier): boolean {
  return tier !== 'hidden';
}

/** Whether the node should be rendered at all. */
export function isVisible(tier: LODTier): boolean {
  return tier !== 'hidden';
}
