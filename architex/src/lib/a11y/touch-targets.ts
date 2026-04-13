/**
 * Touch Target Enforcement Utilities
 * ══════════════════════════════════════════════════════════════
 *
 * WCAG 2.5.8 requires a minimum target size of 44x44 CSS pixels
 * for pointer inputs. These utilities help audit and enforce that
 * requirement across the Architex platform.
 *
 * @see https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
 */

// ── Constants ────────────────────────────────────────────────

/** Minimum touch target size in CSS pixels (WCAG 2.5.8). */
export const MIN_TOUCH_TARGET = 44;

// ── Types ───────────────────────────────────────────────────

export interface TouchTargetViolation {
  /** The violating element. */
  element: Element;
  /** Actual width in CSS pixels. */
  width: number;
  /** Actual height in CSS pixels. */
  height: number;
  /** Shortfall in width (0 if width meets minimum). */
  widthDeficit: number;
  /** Shortfall in height (0 if height meets minimum). */
  heightDeficit: number;
  /** CSS selector path for identification. */
  selector: string;
}

// ── Utilities ───────────────────────────────────────────────

/**
 * Check whether a single element meets the minimum touch target size.
 *
 * Returns `true` if both width and height are >= `MIN_TOUCH_TARGET`.
 */
export function ensureTouchTarget(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
}

/**
 * Build a simple CSS selector path for an element (for reporting).
 */
function buildSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const classes = el.className && typeof el.className === "string"
    ? `.${el.className.trim().split(/\s+/).join(".")}`
    : "";
  return `${tag}${id}${classes}`;
}

/**
 * Audit all interactive elements in the given root (defaults to `document.body`)
 * and return a list of elements that fail the minimum touch target size.
 *
 * Interactive elements checked:
 *   - `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`
 *   - Elements with `role="button"`, `role="link"`, `role="checkbox"`,
 *     `role="radio"`, `role="tab"`, `role="menuitem"`
 *   - Elements with `[tabindex]` (non-negative)
 *
 * Hidden or zero-area elements are excluded.
 */
export function auditTouchTargets(
  root: Element = document.body,
): TouchTargetViolation[] {
  const interactiveSelector = [
    "button",
    "a[href]",
    "input:not([type=hidden])",
    "select",
    "textarea",
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="tab"]',
    '[role="menuitem"]',
    "[tabindex]",
  ].join(", ");

  const elements = root.querySelectorAll(interactiveSelector);
  const violations: TouchTargetViolation[] = [];

  for (const el of elements) {
    // Skip elements with negative tabindex (programmatic focus only)
    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && parseInt(tabindex, 10) < 0) continue;

    const rect = el.getBoundingClientRect();

    // Skip hidden / zero-area elements
    if (rect.width === 0 || rect.height === 0) continue;

    const widthDeficit = Math.max(0, MIN_TOUCH_TARGET - rect.width);
    const heightDeficit = Math.max(0, MIN_TOUCH_TARGET - rect.height);

    if (widthDeficit > 0 || heightDeficit > 0) {
      violations.push({
        element: el,
        width: rect.width,
        height: rect.height,
        widthDeficit,
        heightDeficit,
        selector: buildSelector(el),
      });
    }
  }

  return violations;
}

/**
 * Compute the CSS padding needed to expand an element to the minimum
 * touch target size using invisible padding.
 *
 * Returns `{ horizontal, vertical }` in pixels. Values are 0 when
 * the element already meets the minimum on that axis.
 */
export function computeTouchTargetPadding(
  width: number,
  height: number,
): { horizontal: number; vertical: number } {
  return {
    horizontal: Math.max(0, Math.ceil((MIN_TOUCH_TARGET - width) / 2)),
    vertical: Math.max(0, Math.ceil((MIN_TOUCH_TARGET - height) / 2)),
  };
}
