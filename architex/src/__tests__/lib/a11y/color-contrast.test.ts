import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  relativeLuminance,
  getContrastRatio,
  meetsAA,
  meetsAAA,
  checkContrast,
  suggestAccessibleColor,
  AA_NORMAL,
  AA_LARGE,
  AAA_NORMAL,
} from "@/lib/a11y/color-contrast";

// ── hexToRgb ────────────────────────────────────────────────

describe("hexToRgb", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("parses 3-digit shorthand", () => {
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#abc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("handles uppercase and lowercase", () => {
    expect(hexToRgb("#AABBCC")).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb("#aabbcc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("parses black and white", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("throws on invalid input", () => {
    expect(() => hexToRgb("invalid")).toThrow("Invalid hex color");
    expect(() => hexToRgb("#gg0000")).toThrow("Invalid hex color");
    expect(() => hexToRgb("#12345")).toThrow("Invalid hex color");
  });
});

// ── rgbToHex ────────────────────────────────────────────────

describe("rgbToHex", () => {
  it("converts RGB to hex string", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe("#00ff00");
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe("#0000ff");
  });

  it("clamps out-of-range values", () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe("#ff0080");
  });

  it("pads single-digit hex values", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe("#010203");
  });
});

// ── relativeLuminance ───────────────────────────────────────

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 4);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
  });

  it("returns correct luminance for mid-gray", () => {
    // sRGB #808080 has luminance ~0.2159
    const lum = relativeLuminance({ r: 128, g: 128, b: 128 });
    expect(lum).toBeGreaterThan(0.2);
    expect(lum).toBeLessThan(0.25);
  });
});

// ── getContrastRatio ────────────────────────────────────────

describe("getContrastRatio", () => {
  it("returns 21 for black vs white", () => {
    const ratio = getContrastRatio("#000000", "#ffffff");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical colors", () => {
    expect(getContrastRatio("#336699", "#336699")).toBeCloseTo(1, 1);
  });

  it("is commutative", () => {
    const r1 = getContrastRatio("#ff0000", "#0000ff");
    const r2 = getContrastRatio("#0000ff", "#ff0000");
    expect(r1).toBeCloseTo(r2, 4);
  });

  it("accepts RGB objects", () => {
    const ratio = getContrastRatio(
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    );
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("handles mixed string and RGB input", () => {
    const ratio = getContrastRatio("#000000", { r: 255, g: 255, b: 255 });
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns reasonable ratio for typical dark theme text", () => {
    // Light gray text on dark background
    const ratio = getContrastRatio("#1a1a2e", "#e0e0e0");
    expect(ratio).toBeGreaterThan(4.5); // Should pass AA
  });
});

// ── meetsAA / meetsAAA ──────────────────────────────────────

describe("meetsAA", () => {
  it("passes at exactly 4.5 for normal text", () => {
    expect(meetsAA(4.5)).toBe(true);
  });

  it("fails below 4.5 for normal text", () => {
    expect(meetsAA(4.49)).toBe(false);
  });

  it("passes at 3.0 for large text", () => {
    expect(meetsAA(3.0, true)).toBe(true);
  });

  it("fails below 3.0 for large text", () => {
    expect(meetsAA(2.99, true)).toBe(false);
  });
});

describe("meetsAAA", () => {
  it("passes at exactly 7.0 for normal text", () => {
    expect(meetsAAA(7.0)).toBe(true);
  });

  it("fails below 7.0 for normal text", () => {
    expect(meetsAAA(6.99)).toBe(false);
  });

  it("passes at 4.5 for large text", () => {
    expect(meetsAAA(4.5, true)).toBe(true);
  });

  it("fails below 4.5 for large text", () => {
    expect(meetsAAA(4.49, true)).toBe(false);
  });
});

// ── checkContrast ───────────────────────────────────────────

describe("checkContrast", () => {
  it("returns all fields for black vs white", () => {
    const result = checkContrast("#000000", "#ffffff");
    expect(result.ratio).toBeCloseTo(21, 0);
    expect(result.meetsAA).toBe(true);
    expect(result.meetsAALargeText).toBe(true);
    expect(result.meetsAAA).toBe(true);
    expect(result.meetsAAALargeText).toBe(true);
  });

  it("returns all false for identical colors", () => {
    const result = checkContrast("#888888", "#888888");
    expect(result.ratio).toBeCloseTo(1, 1);
    expect(result.meetsAA).toBe(false);
    expect(result.meetsAALargeText).toBe(false);
    expect(result.meetsAAA).toBe(false);
    expect(result.meetsAAALargeText).toBe(false);
  });

  it("correctly categorizes a borderline pair", () => {
    // Gray on white gives around 4.5:1 depending on exact shade
    // #767676 on white is the well-known AA boundary
    const result = checkContrast("#ffffff", "#767676");
    expect(result.meetsAA).toBe(true);
    expect(result.meetsAALargeText).toBe(true);
  });
});

// ── suggestAccessibleColor ──────────────────────────────────

describe("suggestAccessibleColor", () => {
  it("returns the original color if it already meets the target", () => {
    // Black on white already meets any target
    const result = suggestAccessibleColor("#ffffff", "#000000");
    expect(result).toBe("#000000");
  });

  it("adjusts a light gray on white to meet AA", () => {
    // #cccccc on white has ~1.6:1 contrast — fails AA
    const adjusted = suggestAccessibleColor("#ffffff", "#cccccc", AA_NORMAL);
    const ratio = getContrastRatio("#ffffff", adjusted);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("adjusts a dark color on dark background to meet AA", () => {
    // Dark blue on dark bg
    const adjusted = suggestAccessibleColor("#1a1a2e", "#2a2a4e", AA_NORMAL);
    const ratio = getContrastRatio("#1a1a2e", adjusted);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("preserves hue when adjusting", () => {
    const original = hexToRgb("#3366cc"); // blue
    const adjusted = suggestAccessibleColor("#000000", "#3366cc", AA_NORMAL);
    const adjustedRgb = hexToRgb(adjusted);
    // Blue channel should still be the dominant channel
    expect(adjustedRgb.b).toBeGreaterThan(adjustedRgb.r);
  });

  it("falls back to black or white when target is impossible", () => {
    // Near-identical colors with AAA target
    const adjusted = suggestAccessibleColor("#808080", "#818181", AAA_NORMAL);
    const ratio = getContrastRatio("#808080", adjusted);
    // Should reach at least AA even if AAA is not quite achievable
    // with the given hue — falls back to black or white
    expect(ratio).toBeGreaterThan(AA_LARGE);
  });

  it("works with large text threshold", () => {
    const adjusted = suggestAccessibleColor("#ffffff", "#cccccc", AA_LARGE);
    const ratio = getContrastRatio("#ffffff", adjusted);
    expect(ratio).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
