// ── AI Cost Monitor — token usage and budget tracking ────────────────
//
// Tracks API requests to Claude models with token counts, computes
// costs using per-model pricing, and provides budget alerting.
//
// Pricing (per 1M tokens):
//   Haiku:  $0.25  input, $1.25  output
//   Sonnet: $3.00  input, $15.00 output
//   Opus:   $15.00 input, $75.00 output
//
// Fully client-side, no API calls required.

// ── Types ───────────────────────────────────────────────────────────

export type ModelName = 'haiku' | 'sonnet' | 'opus';

export interface RequestRecord {
  id: string;
  model: ModelName;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
}

export interface ModelUsage {
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

export interface BudgetAlert {
  threshold: number; // 0.75, 0.90, or 1.00
  percentUsed: number;
  totalCost: number;
  budget: number;
}

export type BudgetAlertCallback = (alert: BudgetAlert) => void;

export interface AggregatedUsage {
  period: string; // 'YYYY-MM-DD' or 'YYYY-MM'
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

// ── Constants ───────────────────────────────────────────────────────

/** Cost per token (not per 1M — we divide by 1M in the computation). */
const PRICING: Record<ModelName, { inputPerMillion: number; outputPerMillion: number }> = {
  haiku:  { inputPerMillion: 0.25,  outputPerMillion: 1.25  },
  sonnet: { inputPerMillion: 3.00,  outputPerMillion: 15.00 },
  opus:   { inputPerMillion: 15.00, outputPerMillion: 75.00 },
};

const BUDGET_THRESHOLDS = [0.75, 0.90, 1.00] as const;

// ── Helpers ─────────────────────────────────────────────────────────

function computeCost(model: ModelName, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatMonth(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

let idCounter = 0;
function nextId(): string {
  return `req-${++idCounter}-${Date.now()}`;
}

// ── CostMonitor ─────────────────────────────────────────────────────

export class CostMonitor {
  private records: RequestRecord[] = [];
  private alertCallbacks: BudgetAlertCallback[] = [];
  private firedThresholds: Set<number> = new Set();

  // ── Recording ───────────────────────────────────────────────

  /**
   * Record an API request with its model and token usage.
   * Returns the computed cost for this request.
   */
  recordRequest(
    model: ModelName,
    inputTokens: number,
    outputTokens: number,
    timestamp?: number,
  ): RequestRecord {
    const cost = computeCost(model, inputTokens, outputTokens);
    const record: RequestRecord = {
      id: nextId(),
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: timestamp ?? Date.now(),
    };
    this.records.push(record);
    return record;
  }

  // ── Cost queries ────────────────────────────────────────────

  /**
   * Total cost across all recorded requests.
   */
  getTotalCost(): number {
    return this.records.reduce((sum, r) => sum + r.cost, 0);
  }

  /**
   * Remaining budget. Returns negative if over budget.
   */
  getBudgetRemaining(budget: number): number {
    return budget - this.getTotalCost();
  }

  /**
   * Usage breakdown by model.
   */
  getUsageByModel(): Record<ModelName, ModelUsage> {
    const result: Record<ModelName, ModelUsage> = {
      haiku:  { requestCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 },
      sonnet: { requestCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 },
      opus:   { requestCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 },
    };

    for (const r of this.records) {
      const usage = result[r.model];
      usage.requestCount++;
      usage.totalInputTokens += r.inputTokens;
      usage.totalOutputTokens += r.outputTokens;
      usage.totalCost += r.cost;
    }

    return result;
  }

  // ── Aggregation ─────────────────────────────────────────────

  /**
   * Aggregate usage by day (YYYY-MM-DD).
   */
  getDailyUsage(): AggregatedUsage[] {
    return this.aggregateBy(formatDate);
  }

  /**
   * Aggregate usage by month (YYYY-MM).
   */
  getMonthlyUsage(): AggregatedUsage[] {
    return this.aggregateBy(formatMonth);
  }

  private aggregateBy(keyFn: (ts: number) => string): AggregatedUsage[] {
    const map = new Map<string, AggregatedUsage>();

    for (const r of this.records) {
      const key = keyFn(r.timestamp);
      let agg = map.get(key);
      if (!agg) {
        agg = { period: key, requestCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 };
        map.set(key, agg);
      }
      agg.requestCount++;
      agg.totalInputTokens += r.inputTokens;
      agg.totalOutputTokens += r.outputTokens;
      agg.totalCost += r.cost;
    }

    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  // ── Budget alerts ───────────────────────────────────────────

  /**
   * Check budget against thresholds and fire alert callbacks.
   * Call this after recordRequest to trigger alerts.
   */
  checkBudget(budget: number): BudgetAlert | null {
    const totalCost = this.getTotalCost();
    const percentUsed = budget > 0 ? totalCost / budget : 0;

    let highestCrossed: BudgetAlert | null = null;

    for (const threshold of BUDGET_THRESHOLDS) {
      if (percentUsed >= threshold && !this.firedThresholds.has(threshold)) {
        this.firedThresholds.add(threshold);
        const alert: BudgetAlert = {
          threshold,
          percentUsed,
          totalCost,
          budget,
        };
        highestCrossed = alert;

        for (const cb of this.alertCallbacks) {
          cb(alert);
        }
      }
    }

    return highestCrossed;
  }

  /**
   * Register a callback for budget threshold alerts.
   * Returns an unsubscribe function.
   */
  onBudgetAlert(callback: BudgetAlertCallback): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter((cb) => cb !== callback);
    };
  }

  // ── Utility ─────────────────────────────────────────────────

  /**
   * Get all recorded requests.
   */
  getRecords(): readonly RequestRecord[] {
    return this.records;
  }

  /**
   * Total number of recorded requests.
   */
  get requestCount(): number {
    return this.records.length;
  }

  /**
   * Clear all records and reset alert state.
   */
  reset(): void {
    this.records = [];
    this.firedThresholds.clear();
  }

  /**
   * Get the model pricing table (useful for display).
   */
  static getPricing(): Record<ModelName, { inputPerMillion: number; outputPerMillion: number }> {
    return { ...PRICING };
  }
}
