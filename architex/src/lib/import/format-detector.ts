// ─────────────────────────────────────────────────────────────
// Format Detector (INF-015)
// Auto-detects the diagram format from raw text content.
// ─────────────────────────────────────────────────────────────

/** Supported import formats. */
export type DiagramFormat = "json" | "drawio" | "mermaid" | "yaml" | "unknown";

/**
 * Detect the format of a diagram from its raw text content.
 *
 * Heuristics (applied in order):
 *   1. Starts with `{` or `[` → JSON
 *   2. Starts with `<?xml` or contains `<mxGraphModel` → draw.io
 *   3. Starts with `graph ` (TD/LR/TB/RL/BT) → Mermaid
 *   4. Contains a `services:` line → YAML architecture format
 *   5. Otherwise → unknown
 */
export function detectFormat(content: string): DiagramFormat {
  if (!content || content.trim().length === 0) {
    return "unknown";
  }

  const trimmed = content.trim();

  // ── JSON ────────────────────────────────────────────────────
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }

  // ── draw.io (mxGraph XML) ──────────────────────────────────
  if (
    trimmed.startsWith("<?xml") ||
    trimmed.startsWith("<mxGraphModel") ||
    trimmed.includes("<mxGraphModel")
  ) {
    return "drawio";
  }

  // ── Mermaid ────────────────────────────────────────────────
  // Match `graph TD`, `graph LR`, etc. at the beginning of content
  if (/^graph\s+(TD|TB|LR|RL|BT)\b/im.test(trimmed)) {
    return "mermaid";
  }

  // ── YAML (architecture format) ─────────────────────────────
  // Look for a `services:` key which is the expected top-level section
  if (/^services\s*:/m.test(trimmed)) {
    return "yaml";
  }

  return "unknown";
}
