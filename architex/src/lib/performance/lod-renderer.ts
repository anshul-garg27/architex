// ─────────────────────────────────────────────────────────────
// Architex — Level-of-Detail Renderer
// ─────────────────────────────────────────────────────────────
//
// Controls which visual details to render based on the current
// zoom level. When the user zooms out on a large diagram, tiny
// text and icons become unreadable — so we skip rendering them
// entirely, saving GPU fill rate and DOM mutations.
//
// Four LOD tiers:
//   Full    (zoom > 0.7)  — everything visible
//   Medium  (0.4 – 0.7)   — hide small text, simplify icons
//   Low     (0.2 – 0.4)   — rectangles with labels only
//   Minimal (< 0.2)       — colored dots only
// ─────────────────────────────────────────────────────────────

// ── LOD Levels ─────────────────────────────────────────────

export type LODLevel = 'full' | 'medium' | 'low' | 'minimal';

// ── Detail Types ───────────────────────────────────────────

export type DetailType =
  | 'icon'
  | 'label'
  | 'smallText'
  | 'metrics'
  | 'border'
  | 'shadow'
  | 'handles'
  | 'edgeLabel'
  | 'edgeAnimation'
  | 'gradient';

// ── LOD Configuration ──────────────────────────────────────

export interface LODConfig {
  /** Zoom threshold: above this → full detail. */
  fullThreshold: number;
  /** Zoom threshold: above this → medium detail. */
  mediumThreshold: number;
  /** Zoom threshold: above this → low detail. */
  lowThreshold: number;
  // Below lowThreshold → minimal detail.
}

/** Default thresholds. */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  fullThreshold: 0.7,
  mediumThreshold: 0.4,
  lowThreshold: 0.2,
};

// ── Detail Visibility Map ──────────────────────────────────

/**
 * Which detail types are visible at each LOD level.
 */
const LOD_VISIBILITY: Record<LODLevel, Set<DetailType>> = {
  full: new Set<DetailType>([
    'icon',
    'label',
    'smallText',
    'metrics',
    'border',
    'shadow',
    'handles',
    'edgeLabel',
    'edgeAnimation',
    'gradient',
  ]),
  medium: new Set<DetailType>([
    'icon',
    'label',
    'border',
    'handles',
    'edgeLabel',
    'edgeAnimation',
  ]),
  low: new Set<DetailType>([
    'label',
    'border',
  ]),
  minimal: new Set<DetailType>([]),
};

// ── Public API ─────────────────────────────────────────────

/**
 * Returns the LOD level for the given zoom value.
 *
 * @param zoom   Current viewport zoom (0…n, where 1 = 100%)
 * @param config Optional custom thresholds
 */
export function getLODLevel(
  zoom: number,
  config: LODConfig = DEFAULT_LOD_CONFIG,
): LODLevel {
  if (zoom > config.fullThreshold) return 'full';
  if (zoom > config.mediumThreshold) return 'medium';
  if (zoom > config.lowThreshold) return 'low';
  return 'minimal';
}

/**
 * Checks whether a specific detail type should be rendered at
 * the given zoom level.
 *
 * @param zoom       Current viewport zoom
 * @param detailType The detail to check
 * @param config     Optional custom thresholds
 */
export function shouldRenderDetail(
  zoom: number,
  detailType: DetailType,
  config: LODConfig = DEFAULT_LOD_CONFIG,
): boolean {
  const level = getLODLevel(zoom, config);
  return LOD_VISIBILITY[level].has(detailType);
}

/**
 * Returns the full set of visible detail types for the current
 * zoom level. Useful for batch-checking multiple details at once.
 */
export function getVisibleDetails(
  zoom: number,
  config: LODConfig = DEFAULT_LOD_CONFIG,
): ReadonlySet<DetailType> {
  const level = getLODLevel(zoom, config);
  return LOD_VISIBILITY[level];
}
