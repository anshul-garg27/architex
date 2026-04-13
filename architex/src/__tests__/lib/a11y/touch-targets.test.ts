import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MIN_TOUCH_TARGET,
  ensureTouchTarget,
  auditTouchTargets,
  computeTouchTargetPadding,
} from "@/lib/a11y/touch-targets";

// ── Helpers ─────────────────────────────────────────────────

/**
 * Create a DOM element with a mocked bounding rect.
 */
function createElementWithSize(
  tag: string,
  width: number,
  height: number,
  options?: {
    role?: string;
    tabindex?: string;
    href?: string;
    type?: string;
    hidden?: boolean;
  },
): HTMLElement {
  const el = document.createElement(tag);
  if (options?.role) el.setAttribute("role", options.role);
  if (options?.tabindex) el.setAttribute("tabindex", options.tabindex);
  if (options?.href && el instanceof HTMLAnchorElement) el.href = options.href;
  if (options?.type && el instanceof HTMLInputElement) el.type = options.type;

  // Mock getBoundingClientRect
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  return el;
}

// ── MIN_TOUCH_TARGET ────────────────────────────────────────

describe("MIN_TOUCH_TARGET", () => {
  it("is 44 (WCAG 2.5.8)", () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });
});

// ── ensureTouchTarget ───────────────────────────────────────

describe("ensureTouchTarget", () => {
  it("returns true for elements meeting the minimum", () => {
    const el = createElementWithSize("button", 44, 44);
    expect(ensureTouchTarget(el)).toBe(true);
  });

  it("returns true for elements larger than the minimum", () => {
    const el = createElementWithSize("button", 100, 60);
    expect(ensureTouchTarget(el)).toBe(true);
  });

  it("returns false when width is below minimum", () => {
    const el = createElementWithSize("button", 30, 44);
    expect(ensureTouchTarget(el)).toBe(false);
  });

  it("returns false when height is below minimum", () => {
    const el = createElementWithSize("button", 44, 30);
    expect(ensureTouchTarget(el)).toBe(false);
  });

  it("returns false when both dimensions are below minimum", () => {
    const el = createElementWithSize("button", 20, 20);
    expect(ensureTouchTarget(el)).toBe(false);
  });
});

// ── computeTouchTargetPadding ───────────────────────────────

describe("computeTouchTargetPadding", () => {
  it("returns zero padding for elements meeting the minimum", () => {
    expect(computeTouchTargetPadding(44, 44)).toEqual({
      horizontal: 0,
      vertical: 0,
    });
  });

  it("returns zero padding for oversized elements", () => {
    expect(computeTouchTargetPadding(100, 100)).toEqual({
      horizontal: 0,
      vertical: 0,
    });
  });

  it("computes correct padding for undersized width", () => {
    const result = computeTouchTargetPadding(30, 44);
    expect(result.horizontal).toBe(7); // ceil((44 - 30) / 2) = 7
    expect(result.vertical).toBe(0);
  });

  it("computes correct padding for undersized height", () => {
    const result = computeTouchTargetPadding(44, 20);
    expect(result.horizontal).toBe(0);
    expect(result.vertical).toBe(12); // ceil((44 - 20) / 2) = 12
  });

  it("computes correct padding for both axes undersized", () => {
    const result = computeTouchTargetPadding(24, 24);
    expect(result.horizontal).toBe(10); // ceil((44 - 24) / 2) = 10
    expect(result.vertical).toBe(10);
  });
});

// ── auditTouchTargets ───────────────────────────────────────

describe("auditTouchTargets", () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("returns empty array when all targets meet minimum", () => {
    const btn = createElementWithSize("button", 48, 48);
    root.appendChild(btn);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(0);
  });

  it("detects undersized button", () => {
    const btn = createElementWithSize("button", 30, 30);
    root.appendChild(btn);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(1);
    expect(violations[0].width).toBe(30);
    expect(violations[0].height).toBe(30);
    expect(violations[0].widthDeficit).toBe(14);
    expect(violations[0].heightDeficit).toBe(14);
    expect(violations[0].selector).toContain("button");
  });

  it("detects undersized anchor with href", () => {
    const a = document.createElement("a");
    a.href = "#test";
    vi.spyOn(a, "getBoundingClientRect").mockReturnValue({
      width: 20, height: 20,
      top: 0, left: 0, right: 20, bottom: 20, x: 0, y: 0,
      toJSON: () => ({}),
    });
    root.appendChild(a);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(1);
  });

  it("detects elements with role=button", () => {
    const div = createElementWithSize("div", 20, 20, { role: "button" });
    root.appendChild(div);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(1);
  });

  it("skips hidden (zero-area) elements", () => {
    const btn = createElementWithSize("button", 0, 0);
    root.appendChild(btn);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(0);
  });

  it("skips elements with negative tabindex", () => {
    const div = createElementWithSize("div", 20, 20, { tabindex: "-1" });
    root.appendChild(div);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(0);
  });

  it("returns empty array for root with no interactive elements", () => {
    const p = document.createElement("p");
    p.textContent = "Just text";
    root.appendChild(p);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(0);
  });

  it("reports multiple violations", () => {
    const btn1 = createElementWithSize("button", 20, 20);
    const btn2 = createElementWithSize("button", 30, 30);
    const btn3 = createElementWithSize("button", 50, 50); // meets minimum
    root.appendChild(btn1);
    root.appendChild(btn2);
    root.appendChild(btn3);

    const violations = auditTouchTargets(root);
    expect(violations).toHaveLength(2);
  });
});
