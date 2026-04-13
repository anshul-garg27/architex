// ─────────────────────────────────────────────────────────────
// Architex — Bundle Size Budget
// ─────────────────────────────────────────────────────────────
//
// Defines size limits for the main bundle and individual page
// chunks. Used by CI checks and development tooling to catch
// regressions before they ship.
// ─────────────────────────────────────────────────────────────

// ── Budget Constants (in bytes) ────────────────────────────

/** Main JS bundle limit: 250 KB. */
export const MAIN_BUNDLE_LIMIT = 250 * 1024; // 256,000 bytes

/** Per-page chunk limit: 100 KB. */
export const PAGE_LIMIT = 100 * 1024; // 102,400 bytes

// ── Budget Check Result ────────────────────────────────────

export interface BudgetResult {
  /** Whether the actual size is within the budget. */
  pass: boolean;
  /** Actual size in bytes. */
  actualSize: number;
  /** Budget limit in bytes. */
  limit: number;
  /** Percentage of budget used (e.g. 85.3). */
  percentage: number;
  /** How many bytes over or under budget (negative = under). */
  delta: number;
}

// ── Public API ─────────────────────────────────────────────

/**
 * Checks whether `actualSize` fits within `limit`.
 *
 * @param actualSize Size in bytes
 * @param limit      Budget limit in bytes
 * @returns A `BudgetResult` with pass/fail and percentage
 */
export function checkBudget(actualSize: number, limit: number): BudgetResult {
  const percentage = limit > 0 ? (actualSize / limit) * 100 : 0;
  const delta = actualSize - limit;

  return {
    pass: actualSize <= limit,
    actualSize,
    limit,
    percentage: Math.round(percentage * 10) / 10,
    delta,
  };
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @example formatBytes(256000) → "250.0 KB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
