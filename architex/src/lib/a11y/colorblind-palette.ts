/**
 * Colorblind-Safe Palette
 * ══════════════════════════════════════════════════════════════
 *
 * IBM Design colorblind-safe palette optimized for data
 * visualization. These colors are distinguishable across the
 * three most common forms of color vision deficiency:
 *   - Protanopia  (red-blind)
 *   - Deuteranopia (green-blind)
 *   - Tritanopia  (blue-blind)
 *
 * @see https://www.ibm.com/design/language/color
 * @see https://davidmathlogic.com/colorblind/
 */

// ── IBM Design Colorblind-Safe Colors ──────────────────────

export interface ColorblindColor {
  /** Display name for the color */
  name: string;
  /** Hex value */
  hex: string;
  /** HSL string for CSS custom properties */
  hsl: string;
}

/**
 * Core colorblind-safe palette — 8 distinct colors that remain
 * distinguishable under all three common forms of CVD.
 */
export const COLORBLIND_SAFE_PALETTE: readonly ColorblindColor[] = [
  { name: "ultramarine",  hex: "#648FFF", hsl: "220 100% 70%" },
  { name: "indigo",       hex: "#785EF0", hsl: "255 83% 65%" },
  { name: "magenta",      hex: "#DC267F", hsl: "334 73% 51%" },
  { name: "orange",       hex: "#FE6100", hsl: "23 100% 50%" },
  { name: "gold",         hex: "#FFB000", hsl: "41 100% 50%" },
  { name: "cyan",         hex: "#00B5E2", hsl: "193 100% 44%" },
  { name: "teal",         hex: "#009E73", hsl: "162 100% 31%" },
  { name: "warm-gray",    hex: "#A2845E", hsl: "30 28% 50%" },
] as const;

// ── CSS Custom Property Overrides ──────────────────────────

/**
 * Mapping from the default theme CSS custom properties to their
 * colorblind-safe replacements. When colorblind mode is active,
 * these values are applied to `:root`.
 */
export const COLORBLIND_CSS_OVERRIDES: Record<string, string> = {
  /* Node type colors */
  "--node-compute":        COLORBLIND_SAFE_PALETTE[0].hsl,  // ultramarine
  "--node-storage":        COLORBLIND_SAFE_PALETTE[6].hsl,  // teal
  "--node-messaging":      COLORBLIND_SAFE_PALETTE[3].hsl,  // orange
  "--node-networking":     COLORBLIND_SAFE_PALETTE[1].hsl,  // indigo
  "--node-security":       COLORBLIND_SAFE_PALETTE[2].hsl,  // magenta
  "--node-observability":  COLORBLIND_SAFE_PALETTE[4].hsl,  // gold
  "--node-client":         COLORBLIND_SAFE_PALETTE[5].hsl,  // cyan
  "--node-processing":     COLORBLIND_SAFE_PALETTE[7].hsl,  // warm-gray

  /* Simulation state colors */
  "--state-active":        COLORBLIND_SAFE_PALETTE[0].hsl,  // ultramarine
  "--state-success":       COLORBLIND_SAFE_PALETTE[6].hsl,  // teal
  "--state-warning":       COLORBLIND_SAFE_PALETTE[4].hsl,  // gold
  "--state-error":         COLORBLIND_SAFE_PALETTE[2].hsl,  // magenta
  "--state-processing":    COLORBLIND_SAFE_PALETTE[1].hsl,  // indigo

  /* Visualization sequential scale */
  "--viz-seq-low":         COLORBLIND_SAFE_PALETTE[6].hsl,  // teal
  "--viz-seq-mid":         COLORBLIND_SAFE_PALETTE[4].hsl,  // gold
  "--viz-seq-high":        COLORBLIND_SAFE_PALETTE[3].hsl,  // orange
  "--viz-seq-critical":    COLORBLIND_SAFE_PALETTE[2].hsl,  // magenta

  /* Latency percentile colors */
  "--viz-p50":             COLORBLIND_SAFE_PALETTE[6].hsl,  // teal
  "--viz-p90":             COLORBLIND_SAFE_PALETTE[4].hsl,  // gold
  "--viz-p95":             COLORBLIND_SAFE_PALETTE[3].hsl,  // orange
  "--viz-p99":             COLORBLIND_SAFE_PALETTE[2].hsl,  // magenta

  /* Chart lines */
  "--viz-throughput-line": COLORBLIND_SAFE_PALETTE[0].hsl,  // ultramarine
  "--viz-error-fill":      COLORBLIND_SAFE_PALETTE[2].hsl,  // magenta
  "--viz-error-line":      COLORBLIND_SAFE_PALETTE[2].hsl,  // magenta
  "--viz-anomaly":         COLORBLIND_SAFE_PALETTE[3].hsl,  // orange
  "--viz-cache-hit":       COLORBLIND_SAFE_PALETTE[6].hsl,  // teal
  "--viz-cache-miss":      COLORBLIND_SAFE_PALETTE[7].hsl,  // warm-gray
};

// ── localStorage Key ───────────────────────────────────────

export const COLORBLIND_MODE_KEY = "architex-colorblind-mode";

// ── Apply / Remove ─────────────────────────────────────────

/**
 * Apply colorblind-safe overrides to the document root element.
 */
export function applyColorblindPalette(): void {
  const root = document.documentElement;
  for (const [prop, hsl] of Object.entries(COLORBLIND_CSS_OVERRIDES)) {
    root.style.setProperty(prop, `hsl(${hsl})`);
  }
}

/**
 * Remove colorblind-safe overrides, reverting to theme defaults.
 */
export function removeColorblindPalette(): void {
  const root = document.documentElement;
  for (const prop of Object.keys(COLORBLIND_CSS_OVERRIDES)) {
    root.style.removeProperty(prop);
  }
}

/**
 * Read persisted preference from localStorage.
 */
export function getColorblindPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLORBLIND_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Persist preference to localStorage.
 */
export function setColorblindPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLORBLIND_MODE_KEY, String(enabled));
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }
}
