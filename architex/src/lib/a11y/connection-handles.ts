/**
 * Connection Handle Touch Target Utilities  (A11-027)
 * ══════════════════════════════════════════════════════════════
 *
 * React Flow connection handles are typically 8x8px, well below
 * the WCAG 2.5.8 minimum touch target of 44x44 CSS pixels.
 *
 * This module provides utilities to ensure React Flow handles
 * meet the 44px minimum by adding an invisible hit area expansion
 * around each handle.
 */

// ── Constants ─────────────────────────────────────────────────

/**
 * Minimum touch/pointer target size in CSS pixels (WCAG 2.5.8).
 */
export const MIN_HANDLE_TARGET = 44;

/**
 * Default React Flow handle size in CSS pixels.
 */
export const DEFAULT_HANDLE_SIZE = 8;

// ── Types ─────────────────────────────────────────────────────

export interface HandleHitAreaStyle {
  /** CSS position (always 'absolute'). */
  position: 'absolute';
  /** Width of the invisible hit area in pixels. */
  width: string;
  /** Height of the invisible hit area in pixels. */
  height: string;
  /** Top offset to center the hit area over the handle. */
  top: string;
  /** Left offset to center the hit area over the handle. */
  left: string;
  /** Transparent background for invisibility. */
  background: 'transparent';
  /** z-index to ensure the hit area captures pointer events. */
  zIndex: number;
  /** Cursor to indicate interactivity. */
  cursor: 'crosshair';
  /** Border radius for a circular hit area. */
  borderRadius: string;
}

// ── Style Generator ───────────────────────────────────────────

/**
 * Generate inline styles for an invisible hit-area overlay that
 * expands a React Flow handle to meet the 44px minimum target size.
 *
 * Usage:
 *   Place a `<div>` with these styles as a sibling or wrapper of
 *   the handle element. The transparent overlay captures pointer
 *   events within the 44px area while the visible handle stays small.
 *
 * @param handleSize - The actual rendered handle size (default: 8px).
 * @param minTarget  - Minimum target size (default: 44px).
 * @returns CSS properties object suitable for React's `style` prop.
 */
export function getHandleHitAreaStyle(
  handleSize: number = DEFAULT_HANDLE_SIZE,
  minTarget: number = MIN_HANDLE_TARGET,
): HandleHitAreaStyle {
  const offset = (minTarget - handleSize) / 2;
  return {
    position: 'absolute',
    width: `${minTarget}px`,
    height: `${minTarget}px`,
    top: `-${offset}px`,
    left: `-${offset}px`,
    background: 'transparent',
    zIndex: 10,
    cursor: 'crosshair',
    borderRadius: '50%',
  };
}

/**
 * CSS class string for the hit area overlay.
 * Can be used with Tailwind/CSS modules as an alternative to inline styles.
 */
export const HANDLE_HIT_AREA_CLASS = 'architex-handle-hit-area';

/**
 * CSS text for the handle hit area class.
 * Inject this into a `<style>` tag or CSS module if you prefer
 * class-based styling over inline styles.
 */
export function getHandleHitAreaCSS(
  handleSize: number = DEFAULT_HANDLE_SIZE,
  minTarget: number = MIN_HANDLE_TARGET,
): string {
  const offset = (minTarget - handleSize) / 2;
  return `
.${HANDLE_HIT_AREA_CLASS} {
  position: absolute;
  width: ${minTarget}px;
  height: ${minTarget}px;
  top: -${offset}px;
  left: -${offset}px;
  background: transparent;
  z-index: 10;
  cursor: crosshair;
  border-radius: 50%;
  /* Debug: uncomment to visualize hit areas */
  /* outline: 2px dashed rgba(255, 0, 0, 0.3); */
}
`.trim();
}

/**
 * Check whether a given handle size meets the minimum touch target.
 *
 * @param handleSize - Current handle size in CSS pixels.
 * @param minTarget  - Minimum required size (default: 44px).
 * @returns `true` if the handle already meets the minimum.
 */
export function handleMeetsMinimum(
  handleSize: number,
  minTarget: number = MIN_HANDLE_TARGET,
): boolean {
  return handleSize >= minTarget;
}

/**
 * Compute the expansion needed in each direction to meet the minimum.
 *
 * @returns Padding in pixels needed on each side, or 0 if already sufficient.
 */
export function computeHandleExpansion(
  handleSize: number = DEFAULT_HANDLE_SIZE,
  minTarget: number = MIN_HANDLE_TARGET,
): { paddingEachSide: number; totalSize: number } {
  if (handleSize >= minTarget) {
    return { paddingEachSide: 0, totalSize: handleSize };
  }
  const paddingEachSide = Math.ceil((minTarget - handleSize) / 2);
  return { paddingEachSide, totalSize: handleSize + paddingEachSide * 2 };
}
