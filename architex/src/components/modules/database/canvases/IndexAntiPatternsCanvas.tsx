"use client";

import React, { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type AntiPatternId =
  | "function-on-column"
  | "type-coercion"
  | "leading-wildcard"
  | "low-cardinality"
  | "over-indexing";

export interface IndexAntiPatternsCanvasProps {
  selectedPattern: AntiPatternId;
  onPatternChange: (p: AntiPatternId) => void;
}

// ── Data ─────────────────────────────────────────────────────────

interface QueryPlanStep {
  type: "SeqScan" | "IndexScan" | "Filter" | "Aggregate";
  table: string;
  cost: number;
  rows: number;
  description: string;
}

interface AntiPattern {
  id: AntiPatternId;
  title: string;
  subtitle: string;
  badQuery: string;
  badExplanation: string;
  badPlan: QueryPlanStep[];
  badCost: number;
  fixQuery: string;
  fixExplanation: string;
  fixPlan: QueryPlanStep[];
  fixCost: number;
  rule: string;
}

const ANTI_PATTERNS: AntiPattern[] = [
  {
    id: "function-on-column",
    title: "Function on Column",
    subtitle: "Wrapping an indexed column in a function prevents index use",
    badQuery: "SELECT * FROM orders\nWHERE YEAR(created_at) = 2026;",
    badExplanation:
      "The database must evaluate YEAR(created_at) for EVERY row because the index stores created_at values, not YEAR(created_at) results. It cannot binary-search the B-Tree for a computed value.",
    badPlan: [
      { type: "SeqScan", table: "orders", cost: 45.20, rows: 50000, description: "Sequential scan on orders" },
      { type: "Filter", table: "orders", cost: 52.80, rows: 8200, description: "Filter: YEAR(created_at) = 2026" },
    ],
    badCost: 52.80,
    fixQuery: "SELECT * FROM orders\nWHERE created_at >= '2026-01-01'\n  AND created_at < '2027-01-01';",
    fixExplanation:
      "The range condition uses the raw column value, so the B-Tree index on created_at can do a range scan directly. It jumps to 2026-01-01 and reads forward until 2027-01-01.",
    fixPlan: [
      { type: "IndexScan", table: "orders", cost: 4.15, rows: 8200, description: "Index scan on orders using idx_created_at" },
    ],
    fixCost: 4.15,
    rule: "Never apply functions to indexed columns in WHERE clauses. Rewrite as range conditions.",
  },
  {
    id: "type-coercion",
    title: "Type Coercion",
    subtitle: "Comparing mismatched types forces implicit casting",
    badQuery: "SELECT * FROM users\nWHERE id = '42';",
    badExplanation:
      "The column 'id' is an INTEGER, but '42' is a STRING. The database must cast every id to a string (or vice versa) before comparing. Since the cast changes the indexed value, the index is bypassed.",
    badPlan: [
      { type: "SeqScan", table: "users", cost: 32.50, rows: 100000, description: "Sequential scan on users" },
      { type: "Filter", table: "users", cost: 38.90, rows: 1, description: "Filter: CAST(id AS text) = '42'" },
    ],
    badCost: 38.90,
    fixQuery: "SELECT * FROM users\nWHERE id = 42;",
    fixExplanation:
      "Using the correct type (integer 42, not string '42') lets the primary key index do a direct B-Tree lookup. One comparison instead of a full table scan.",
    fixPlan: [
      { type: "IndexScan", table: "users", cost: 0.05, rows: 1, description: "Index scan on users using PRIMARY KEY" },
    ],
    fixCost: 0.05,
    rule: "Always match the type of your literal to the column type. Avoid implicit casts.",
  },
  {
    id: "leading-wildcard",
    title: "Leading Wildcard",
    subtitle: "LIKE '%suffix' cannot use a B-Tree index",
    badQuery: "SELECT * FROM customers\nWHERE name LIKE '%smith';",
    badExplanation:
      "B-Tree indexes sort data from left to right. Looking for '%smith' means 'anything ending in smith' -- the index cannot narrow down where to start. It must check every single row.",
    badPlan: [
      { type: "SeqScan", table: "customers", cost: 28.70, rows: 75000, description: "Sequential scan on customers" },
      { type: "Filter", table: "customers", cost: 33.10, rows: 150, description: "Filter: name LIKE '%smith'" },
    ],
    badCost: 33.10,
    fixQuery: "SELECT * FROM customers\nWHERE name LIKE 'Smith%';",
    fixExplanation:
      "A trailing wildcard 'Smith%' can use the index because the B-Tree can jump to where 'Smith' starts and scan forward. For suffix searches, consider a trigram index (pg_trgm) or full-text search.",
    fixPlan: [
      { type: "IndexScan", table: "customers", cost: 2.30, rows: 150, description: "Index scan on customers using idx_name" },
    ],
    fixCost: 2.30,
    rule: "Place wildcards at the end (suffix), not the beginning. Use pg_trgm or full-text for substring/suffix searches.",
  },
  {
    id: "low-cardinality",
    title: "Low Cardinality Index",
    subtitle: "Indexing a column with very few distinct values is useless",
    badQuery: "SELECT * FROM employees\nWHERE gender = 'M';",
    badExplanation:
      "With only 2 distinct values (M/F) split roughly 50/50, the index points to HALF the table. The query planner decides a full table scan is cheaper than jumping back and forth between the index and the table data.",
    badPlan: [
      { type: "SeqScan", table: "employees", cost: 18.40, rows: 20000, description: "Sequential scan on employees (index skipped -- low selectivity)" },
      { type: "Filter", table: "employees", cost: 21.60, rows: 10000, description: "Filter: gender = 'M'" },
    ],
    badCost: 21.60,
    fixQuery: "-- Option 1: Use a composite index\nSELECT * FROM employees\nWHERE gender = 'M'\n  AND department = 'Engineering';\n-- CREATE INDEX idx_gender_dept\n--   ON employees(gender, department);",
    fixExplanation:
      "A composite index on (gender, department) dramatically increases selectivity. Instead of 50% of rows, the combined filter might match 5%. Alternatively, remove the single-column gender index entirely to save write overhead.",
    fixPlan: [
      { type: "IndexScan", table: "employees", cost: 3.80, rows: 500, description: "Index scan on employees using idx_gender_dept" },
    ],
    fixCost: 3.80,
    rule: "Don't index columns with low cardinality alone. Use composite indexes to increase selectivity.",
  },
  {
    id: "over-indexing",
    title: "Over-Indexing",
    subtitle: "Too many indexes slow down every write operation",
    badQuery: "-- Table: products (10 indexes!)\nINSERT INTO products (name, price,\n  category, brand, sku, weight,\n  color, size, rating, stock)\nVALUES (...);",
    badExplanation:
      "Every INSERT must update ALL 10 indexes. Each index is a separate B-Tree that needs a new entry inserted and potentially split. This turns a single row insert into 11 separate write operations (1 table + 10 indexes).",
    badPlan: [
      { type: "SeqScan", table: "products", cost: 0, rows: 0, description: "Table INSERT: 1 row written" },
      { type: "Filter", table: "indexes", cost: 48.50, rows: 10, description: "UPDATE 10 indexes: idx_name, idx_price, idx_category, idx_brand, idx_sku, idx_weight, idx_color, idx_size, idx_rating, idx_stock" },
    ],
    badCost: 48.50,
    fixQuery: "-- Keep only indexes used by queries:\n-- 1. PRIMARY KEY (id)\n-- 2. idx_sku (unique lookups)\n-- 3. idx_category_price (filtered browsing)\n-- DROP unused: idx_color, idx_size,\n--   idx_weight, idx_rating, idx_stock\nINSERT INTO products (...)\nVALUES (...);",
    fixExplanation:
      "Audit with pg_stat_user_indexes to find unused indexes. Keep only 3 indexes that actually serve queries. Now each INSERT updates 4 structures (table + 3 indexes) instead of 11. Write throughput improves 2-3x.",
    fixPlan: [
      { type: "SeqScan", table: "products", cost: 0, rows: 0, description: "Table INSERT: 1 row written" },
      { type: "Filter", table: "indexes", cost: 14.50, rows: 3, description: "UPDATE 3 indexes: pk_id, idx_sku, idx_category_price" },
    ],
    fixCost: 14.50,
    rule: "Audit indexes regularly. Every unused index costs write performance. Use pg_stat_user_indexes to find dead weight.",
  },
];

const PATTERN_IDS = ANTI_PATTERNS.map((p) => p.id);

// ── Canvas ──────────────────────────────────────────────────────

const IndexAntiPatternsCanvas = memo(function IndexAntiPatternsCanvas({
  selectedPattern,
  onPatternChange,
}: IndexAntiPatternsCanvasProps) {
  const [showFix, setShowFix] = useState(false);
  const pattern = ANTI_PATTERNS.find((p) => p.id === selectedPattern) ?? ANTI_PATTERNS[0];

  const handlePatternSwitch = useCallback(
    (id: AntiPatternId) => {
      onPatternChange(id);
      setShowFix(false);
    },
    [onPatternChange],
  );

  const speedup = pattern.badCost > 0 ? (pattern.badCost / pattern.fixCost).toFixed(1) : "N/A";

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      {/* Pattern selector */}
      <div className="flex items-center gap-1 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2 overflow-x-auto">
        {ANTI_PATTERNS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => handlePatternSwitch(p.id)}
            className={cn(
              "flex-shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
              selectedPattern === p.id
                ? "bg-primary text-white"
                : "text-foreground-muted hover:bg-background hover:text-foreground",
            )}
          >
            <span className="mr-1.5 inline-block rounded-xl bg-background/20 px-1 py-0.5 text-[9px] font-bold">
              {i + 1}
            </span>
            {p.title}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {/* Header */}
        <div className="mx-auto mb-4 max-w-4xl text-center">
          <h3 className="text-sm font-bold text-foreground">{pattern.title}</h3>
          <p className="mt-0.5 text-[11px] text-foreground-subtle">{pattern.subtitle}</p>
        </div>

        {/* Bad / Fix toggle */}
        <div className="mx-auto mb-4 flex max-w-4xl justify-center">
          <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-1">
            <button
              onClick={() => setShowFix(false)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-medium transition-colors",
                !showFix
                  ? "bg-red-600 text-white"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              Bad Query (Anti-Pattern)
            </button>
            <button
              onClick={() => setShowFix(true)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-medium transition-colors",
                showFix
                  ? "bg-green-600 text-white"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              Fixed Query
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {/* Query panel */}
          <div
            className={cn(
              "rounded-xl border-2 p-4",
              showFix
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                  showFix
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400",
                )}
              >
                {showFix ? "Fixed" : "Anti-Pattern"}
              </span>
              <span className="text-[10px] text-foreground-subtle">SQL Query</span>
            </div>

            <pre className="mb-3 overflow-x-auto rounded-xl bg-[#0d1117] p-3 font-mono text-xs leading-relaxed text-foreground">
              {showFix ? pattern.fixQuery : pattern.badQuery}
            </pre>

            <p className="text-[11px] leading-relaxed text-foreground-muted">
              {showFix ? pattern.fixExplanation : pattern.badExplanation}
            </p>
          </div>

          {/* Plan panel */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Execution Plan
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 font-mono text-[10px] font-bold",
                  showFix
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400",
                )}
              >
                Cost: {showFix ? pattern.fixCost.toFixed(2) : pattern.badCost.toFixed(2)}
              </span>
            </div>

            {/* Plan nodes */}
            <div className="space-y-2">
              {(showFix ? pattern.fixPlan : pattern.badPlan).map((step, i) => (
                <PlanStepNode key={`${step.type}-${i}`} step={step} isGood={showFix} depth={i} />
              ))}
            </div>

            {/* Speedup indicator */}
            {showFix && (
              <div className="mt-4 flex items-center justify-center rounded-xl bg-green-500/10 p-3">
                <span className="text-sm font-bold text-green-400">
                  {speedup}x faster
                </span>
                <span className="ml-2 text-[10px] text-green-400/60">
                  (cost {pattern.badCost.toFixed(2)} {"->"} {pattern.fixCost.toFixed(2)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rule callout */}
        <div className="mx-auto mt-4 max-w-5xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-400">&#x26A0;</span>
            <div>
              <span className="block text-xs font-bold text-amber-400">Rule of Thumb</span>
              <p className="mt-0.5 text-[11px] text-amber-300/80">{pattern.rule}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Plan Step Node ──────────────────────────────────────────────

const PlanStepNode = memo(function PlanStepNode({
  step,
  isGood,
  depth,
}: {
  step: QueryPlanStep;
  isGood: boolean;
  depth: number;
}) {
  const typeColor = (() => {
    switch (step.type) {
      case "SeqScan":
        return "bg-red-500/20 text-red-400";
      case "IndexScan":
        return "bg-green-500/20 text-green-400";
      case "Filter":
        return "bg-amber-500/20 text-amber-400";
      case "Aggregate":
        return "bg-blue-500/20 text-blue-400";
    }
  })();

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border/30 bg-background p-3"
      style={{ marginLeft: depth * 16 }}
    >
      {/* Arrow connector for depth > 0 */}
      {depth > 0 && (
        <div className="flex items-center text-foreground-subtle">
          <span className="text-[10px]">{"\u2514\u2500"}</span>
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("rounded px-2 py-0.5 font-mono text-[10px] font-bold", typeColor)}>
            {step.type}
          </span>
          {step.table && (
            <span className="font-mono text-[10px] text-foreground-muted">{step.table}</span>
          )}
          {step.cost > 0 && (
            <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
              cost={step.cost.toFixed(2)} rows={step.rows.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-[10px] text-foreground-subtle">{step.description}</p>
      </div>
    </div>
  );
});

export default IndexAntiPatternsCanvas;
