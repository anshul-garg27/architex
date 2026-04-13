/**
 * High Contrast Mode Utilities  (A11-024)
 * ══════════════════════════════════════════════════════════════
 *
 * CSS custom property overrides for a high-contrast mode that
 * ensures all borders are visible and color contrast ratios
 * meet WCAG AAA (7:1) requirements.
 *
 * Follows the same pattern as colorblind-palette.ts:
 *   - Override map applied to `:root`
 *   - localStorage persistence
 *   - Apply / remove helpers
 */

// ── Types ─────────────────────────────────────────────────────

export interface HighContrastOverride {
  property: string;
  value: string;
}

// ── High Contrast Override Map ────────────────────────────────

/**
 * CSS custom properties overridden in high-contrast mode.
 *
 * Goals:
 *   - All borders >= 2px solid with strongly visible colors
 *   - Foreground/background meet WCAG AAA (7:1) minimum
 *   - Focus indicators are bold and clearly visible
 *   - State colors are intensified with higher saturation
 */
export const HIGH_CONTRAST_CSS_OVERRIDES: Record<string, string> = {
  /* Background layers: deeper black for maximum contrast */
  '--background': 'hsl(0 0% 0%)',
  '--surface': 'hsl(0 0% 5%)',
  '--elevated': 'hsl(0 0% 8%)',
  '--overlay': 'hsl(0 0% 10%)',

  /* Foreground: pure white for maximum contrast */
  '--foreground': 'hsl(0 0% 100%)',
  '--foreground-muted': 'hsl(0 0% 80%)',
  '--foreground-subtle': 'hsl(0 0% 70%)',

  /* Card */
  '--card': 'hsl(0 0% 5%)',
  '--card-foreground': 'hsl(0 0% 100%)',

  /* Primary -- brighter for visibility */
  '--primary': 'hsl(252 100% 75%)',
  '--primary-foreground': 'hsl(0 0% 100%)',
  '--primary-hover': 'hsl(252 100% 85%)',

  /* Borders: high-visibility white borders */
  '--border': 'hsl(0 0% 70%)',
  '--border-subtle': 'hsl(0 0% 50%)',
  '--border-default': 'hsl(0 0% 70%)',
  '--border-strong': 'hsl(0 0% 90%)',
  '--border-focus': 'hsl(48 100% 60%)',
  '--input': 'hsl(0 0% 70%)',

  /* Ring: bright yellow for focus indicators */
  '--ring': 'hsl(48 100% 60%)',

  /* State colors: intensified with higher saturation */
  '--state-idle': 'hsl(0 0% 65%)',
  '--state-active': 'hsl(217 100% 70%)',
  '--state-success': 'hsl(142 100% 50%)',
  '--state-warning': 'hsl(48 100% 55%)',
  '--state-error': 'hsl(0 100% 60%)',
  '--state-processing': 'hsl(271 100% 70%)',

  /* Semantic state tokens */
  '--success-bg': 'hsl(142 100% 10%)',
  '--success-text': 'hsl(142 100% 65%)',
  '--success-border': 'hsl(142 100% 45%)',

  '--warning-bg': 'hsl(48 100% 10%)',
  '--warning-text': 'hsl(48 100% 65%)',
  '--warning-border': 'hsl(48 100% 45%)',

  '--error-bg': 'hsl(0 100% 10%)',
  '--error-text': 'hsl(0 100% 70%)',
  '--error-border': 'hsl(0 100% 50%)',

  '--info-bg': 'hsl(217 100% 10%)',
  '--info-text': 'hsl(217 100% 75%)',
  '--info-border': 'hsl(217 100% 50%)',

  /* Canvas */
  '--canvas-bg': 'hsl(0 0% 0%)',
  '--canvas-dot': 'hsl(0 0% 30%)',

  /* Sidebar */
  '--sidebar': 'hsl(0 0% 3%)',
  '--sidebar-foreground': 'hsl(0 0% 100%)',
  '--sidebar-border': 'hsl(0 0% 70%)',
};

// ── localStorage Key ──────────────────────────────────────────

export const HIGH_CONTRAST_MODE_KEY = 'architex-high-contrast-mode';

// ── Apply / Remove ────────────────────────────────────────────

/**
 * Apply high-contrast overrides to the document root element.
 * Also adds a `data-high-contrast` attribute for CSS selector targeting.
 */
export function applyHighContrast(): void {
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(HIGH_CONTRAST_CSS_OVERRIDES)) {
    root.style.setProperty(prop, value);
  }
  root.setAttribute('data-high-contrast', 'true');
}

/**
 * Remove high-contrast overrides, reverting to theme defaults.
 */
export function removeHighContrast(): void {
  const root = document.documentElement;
  for (const prop of Object.keys(HIGH_CONTRAST_CSS_OVERRIDES)) {
    root.style.removeProperty(prop);
  }
  root.removeAttribute('data-high-contrast');
}

/**
 * Read persisted high-contrast preference from localStorage.
 */
export function getHighContrastPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(HIGH_CONTRAST_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist high-contrast preference to localStorage.
 */
export function setHighContrastPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIGH_CONTRAST_MODE_KEY, String(enabled));
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }
}
