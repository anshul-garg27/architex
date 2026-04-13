/**
 * WCAG Color Contrast Utilities
 * ══════════════════════════════════════════════════════════════
 *
 * Implements the WCAG 2.x contrast ratio algorithm and provides
 * utilities for checking AA/AAA conformance and suggesting
 * accessible color adjustments.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

// ── Types ───────────────────────────────────────────────────

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface ContrastResult {
  ratio: number;
  meetsAA: boolean;
  meetsAALargeText: boolean;
  meetsAAA: boolean;
  meetsAAALargeText: boolean;
}

// ── Thresholds ──────────────────────────────────────────────

/** WCAG AA normal text minimum contrast ratio. */
export const AA_NORMAL = 4.5;
/** WCAG AA large text minimum contrast ratio. */
export const AA_LARGE = 3;
/** WCAG AAA normal text minimum contrast ratio. */
export const AAA_NORMAL = 7;
/** WCAG AAA large text minimum contrast ratio. */
export const AAA_LARGE = 4.5;

// ── Hex <-> RGB Conversion ──────────────────────────────────

/**
 * Parse a hex color string (`#RGB`, `#RRGGBB`) into RGB components.
 * Throws on invalid input.
 */
export function hexToRgb(hex: string): RGB {
  let clean = hex.replace(/^#/, "");

  // Expand shorthand (#RGB -> #RRGGBB)
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }

  if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * Convert RGB to hex string.
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Relative Luminance ──────────────────────────────────────

/**
 * Convert a single sRGB channel (0-255) to its linear value.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance (0-1) of a color.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(color: RGB): number {
  return (
    0.2126 * linearize(color.r) +
    0.7152 * linearize(color.g) +
    0.0722 * linearize(color.b)
  );
}

// ── Contrast Ratio ──────────────────────────────────────────

/**
 * Calculate the WCAG contrast ratio between two colors.
 *
 * The ratio is always >= 1, where 1:1 means no contrast and
 * 21:1 is maximum contrast (black vs white).
 *
 * Accepts hex strings (`#RGB` or `#RRGGBB`) or RGB objects.
 */
export function getContrastRatio(
  color1: string | RGB,
  color2: string | RGB,
): number {
  const rgb1 = typeof color1 === "string" ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === "string" ? hexToRgb(color2) : color2;

  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// ── AA / AAA Checks ─────────────────────────────────────────

/**
 * Check if a contrast ratio meets WCAG AA requirements.
 * @param ratio - contrast ratio (e.g. 4.5)
 * @param largeText - `true` for large text (>= 18pt or 14pt bold),
 *                    which has a lower threshold (3:1 vs 4.5:1).
 */
export function meetsAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? AA_LARGE : AA_NORMAL);
}

/**
 * Check if a contrast ratio meets WCAG AAA requirements.
 * @param ratio - contrast ratio
 * @param largeText - `true` for large text (lower threshold: 4.5:1 vs 7:1).
 */
export function meetsAAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? AAA_LARGE : AAA_NORMAL);
}

/**
 * Comprehensive contrast check returning all conformance levels.
 */
export function checkContrast(
  color1: string | RGB,
  color2: string | RGB,
): ContrastResult {
  const ratio = getContrastRatio(color1, color2);
  return {
    ratio,
    meetsAA: meetsAA(ratio),
    meetsAALargeText: meetsAA(ratio, true),
    meetsAAA: meetsAAA(ratio),
    meetsAAALargeText: meetsAAA(ratio, true),
  };
}

// ── Color Adjustment ────────────────────────────────────────

/**
 * Convert RGB to HSL (hue: 0-360, saturation: 0-1, lightness: 0-1).
 */
function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s, l };
}

/**
 * Convert HSL to RGB.
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

/**
 * Suggest an accessible foreground color by adjusting the lightness of `fg`
 * until it achieves the `targetRatio` against `bg`.
 *
 * Preserves hue and saturation of the original foreground color.
 * If the target ratio is impossible (e.g. both colors too similar in hue),
 * returns the closest achievable color (pure white or black).
 *
 * @param bg - Background color (hex string or RGB)
 * @param fg - Foreground color to adjust (hex string or RGB)
 * @param targetRatio - Desired minimum contrast ratio (default: 4.5 for AA)
 */
export function suggestAccessibleColor(
  bg: string | RGB,
  fg: string | RGB,
  targetRatio: number = AA_NORMAL,
): string {
  const bgRgb = typeof bg === "string" ? hexToRgb(bg) : bg;
  const fgRgb = typeof fg === "string" ? hexToRgb(fg) : fg;

  // Check if already meets target
  if (getContrastRatio(bgRgb, fgRgb) >= targetRatio) {
    return rgbToHex(fgRgb);
  }

  const bgLum = relativeLuminance(bgRgb);
  const fgHsl = rgbToHsl(fgRgb);

  // Try adjusting lightness with binary search
  // Determine direction: if bg is dark, we need fg to be lighter (increase L)
  // If bg is light, we need fg to be darker (decrease L)
  const makeLighter = bgLum < 0.5;

  let low = makeLighter ? fgHsl.l : 0;
  let high = makeLighter ? 1 : fgHsl.l;
  let bestHex = rgbToHex(fgRgb);
  let bestRatio = getContrastRatio(bgRgb, fgRgb);

  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2;
    const candidate = hslToRgb(fgHsl.h, fgHsl.s, mid);
    const ratio = getContrastRatio(bgRgb, candidate);

    if (ratio >= targetRatio) {
      bestHex = rgbToHex(candidate);
      bestRatio = ratio;
      // Narrow toward the original lightness (less aggressive change)
      if (makeLighter) {
        high = mid;
      } else {
        low = mid;
      }
    } else {
      // Need more contrast
      if (makeLighter) {
        low = mid;
      } else {
        high = mid;
      }
    }
  }

  // If binary search still did not meet target, try extremes
  if (bestRatio < targetRatio) {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const black: RGB = { r: 0, g: 0, b: 0 };
    const whiteRatio = getContrastRatio(bgRgb, white);
    const blackRatio = getContrastRatio(bgRgb, black);
    bestHex = whiteRatio >= blackRatio ? "#ffffff" : "#000000";
  }

  return bestHex;
}
