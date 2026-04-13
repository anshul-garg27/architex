"use client";

import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type QueryType = "olap" | "oltp";

export interface RowColumnCanvasProps {
  queryType: QueryType;
  onQueryTypeChange: (q: QueryType) => void;
}

// ── Sample Data ─────────────────────────────────────────────────

const COLUMNS = ["id", "name", "age", "salary"] as const;
type ColumnKey = (typeof COLUMNS)[number];

interface EmployeeRow {
  id: number;
  name: string;
  age: number;
  salary: number;
}

const EMPLOYEES: EmployeeRow[] = [
  { id: 1, name: "Alice", age: 30, salary: 95000 },
  { id: 2, name: "Bob", age: 25, salary: 72000 },
  { id: 3, name: "Carol", age: 35, salary: 110000 },
  { id: 4, name: "Dave", age: 28, salary: 85000 },
  { id: 5, name: "Eve", age: 32, salary: 98000 },
];

// ── Helper: determine which cells are highlighted ───────────────

function getHighlightedCells(
  queryType: QueryType,
  storeType: "row" | "column",
): Set<string> {
  const set = new Set<string>();

  if (queryType === "olap") {
    // SELECT AVG(salary) FROM employees
    if (storeType === "row") {
      // Row store must read ALL data
      for (let r = 0; r < EMPLOYEES.length; r++) {
        for (const col of COLUMNS) {
          set.add(`${r}-${col}`);
        }
      }
    } else {
      // Column store reads only the salary column
      for (let r = 0; r < EMPLOYEES.length; r++) {
        set.add(`${r}-salary`);
      }
    }
  } else {
    // OLTP: SELECT * FROM employees WHERE id = 1
    if (storeType === "row") {
      // Row store reads just the first row
      for (const col of COLUMNS) {
        set.add(`0-${col}`);
      }
    } else {
      // Column store must read one entry from EVERY column
      for (const col of COLUMNS) {
        set.add(`0-${col}`);
      }
    }
  }

  return set;
}

function getDataReadPercentage(
  queryType: QueryType,
  storeType: "row" | "column",
): number {
  const totalCells = EMPLOYEES.length * COLUMNS.length;
  const highlighted = getHighlightedCells(queryType, storeType).size;
  return Math.round((highlighted / totalCells) * 100);
}

function getWinnerLabel(
  queryType: QueryType,
  storeType: "row" | "column",
): "fast" | "slow" | null {
  if (queryType === "olap") {
    return storeType === "column" ? "fast" : "slow";
  } else {
    return storeType === "row" ? "fast" : "slow";
  }
}

// ── Canvas Component ────────────────────────────────────────────

const RowColumnCanvas = memo(function RowColumnCanvas({
  queryType,
  onQueryTypeChange,
}: RowColumnCanvasProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const olapQuery = "SELECT AVG(salary) FROM employees";
  const oltpQuery = "SELECT * FROM employees WHERE id = 1";
  const currentQuery = queryType === "olap" ? olapQuery : oltpQuery;

  const rowHighlight = getHighlightedCells(queryType, "row");
  const colHighlight = getHighlightedCells(queryType, "column");
  const rowPct = getDataReadPercentage(queryType, "row");
  const colPct = getDataReadPercentage(queryType, "column");
  const rowWinner = getWinnerLabel(queryType, "row");
  const colWinner = getWinnerLabel(queryType, "column");

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-4">
      {/* Query toggle */}
      <div className="mx-auto mb-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-1">
          <button
            onClick={() => onQueryTypeChange("oltp")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-medium transition-colors",
              queryType === "oltp"
                ? "bg-primary text-white"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            OLTP Query
          </button>
          <button
            onClick={() => onQueryTypeChange("olap")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-medium transition-colors",
              queryType === "olap"
                ? "bg-primary text-white"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            OLAP Query
          </button>
        </div>

        <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-2">
          <code className="font-mono text-sm text-primary">{currentQuery}</code>
        </div>
      </div>

      {/* Side-by-side visualization */}
      <div className="mx-auto grid max-w-5xl flex-1 grid-cols-2 gap-6">
        {/* Row Store */}
        <StorePanel
          title="Row Store"
          subtitle="Rows stored together on disk"
          storeType="row"
          highlight={rowHighlight}
          readPct={rowPct}
          winner={rowWinner}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
        />

        {/* Column Store */}
        <StorePanel
          title="Column Store"
          subtitle="Columns stored together on disk"
          storeType="column"
          highlight={colHighlight}
          readPct={colPct}
          winner={colWinner}
          hoveredCell={hoveredCell}
          onHoverCell={setHoveredCell}
        />
      </div>

      {/* Metrics bar */}
      <div className="mx-auto mt-4 flex w-full max-w-5xl items-center justify-center gap-8">
        <MetricBadge
          label="Row Store"
          pct={rowPct}
          winner={rowWinner}
        />
        <MetricBadge
          label="Column Store"
          pct={colPct}
          winner={colWinner}
        />
      </div>
    </div>
  );
});

// ── Store Panel ─────────────────────────────────────────────────

const StorePanel = memo(function StorePanel({
  title,
  subtitle,
  storeType,
  highlight,
  readPct,
  winner,
  hoveredCell,
  onHoverCell,
}: {
  title: string;
  subtitle: string;
  storeType: "row" | "column";
  highlight: Set<string>;
  readPct: number;
  winner: "fast" | "slow" | null;
  hoveredCell: string | null;
  onHoverCell: (cell: string | null) => void;
}) {
  const badgeColor =
    winner === "fast"
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : winner === "slow"
        ? "bg-red-500/10 text-red-400 border-red-500/30"
        : "bg-neutral-800/30 text-foreground-muted border-border/30";

  return (
    <div className="flex flex-col rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-[10px] text-foreground-subtle">{subtitle}</p>
        </div>
        {winner && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
              badgeColor,
            )}
          >
            {winner === "fast" ? "Wins" : "Slow"}
          </span>
        )}
      </div>

      {/* Disk layout visualization */}
      <div className="flex-1">
        {storeType === "row" ? (
          <RowLayout highlight={highlight} hoveredCell={hoveredCell} onHoverCell={onHoverCell} />
        ) : (
          <ColumnLayout highlight={highlight} hoveredCell={hoveredCell} onHoverCell={onHoverCell} />
        )}
      </div>

      {/* Read percentage */}
      <div className="mt-3 pt-2 border-t border-border/30">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-foreground-subtle">Data read:</span>
          <span className={cn("font-bold font-mono", winner === "fast" ? "text-green-400" : "text-red-400")}>
            {readPct}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-background">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              winner === "fast" ? "bg-green-500" : "bg-red-500",
            )}
            style={{ width: `${readPct}%` }}
          />
        </div>
      </div>
    </div>
  );
});

// ── Row Layout ──────────────────────────────────────────────────

const RowLayout = memo(function RowLayout({
  highlight,
  hoveredCell,
  onHoverCell,
}: {
  highlight: Set<string>;
  hoveredCell: string | null;
  onHoverCell: (cell: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
        Disk Pages (row-by-row)
      </div>
      {EMPLOYEES.map((emp, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-0.5">
          <span className="w-12 text-right text-[9px] text-foreground-subtle mr-1">
            Row {rowIdx + 1}:
          </span>
          {COLUMNS.map((col) => {
            const cellKey = `${rowIdx}-${col}`;
            const isHighlighted = highlight.has(cellKey);
            const isHovered = hoveredCell === cellKey;
            return (
              <div
                key={cellKey}
                onMouseEnter={() => onHoverCell(cellKey)}
                onMouseLeave={() => onHoverCell(null)}
                className={cn(
                  "flex-1 rounded-xl px-1.5 py-1 text-center font-mono text-[10px] transition-all duration-300 border",
                  isHighlighted
                    ? "bg-primary/20 border-primary/40 text-primary font-bold scale-105"
                    : "bg-background/50 border-border/50 text-foreground-subtle opacity-50",
                  isHovered && "ring-1 ring-primary/60",
                )}
              >
                {String(emp[col])}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

// ── Column Layout ───────────────────────────────────────────────

const ColumnLayout = memo(function ColumnLayout({
  highlight,
  hoveredCell,
  onHoverCell,
}: {
  highlight: Set<string>;
  hoveredCell: string | null;
  onHoverCell: (cell: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
        Disk Pages (column-by-column)
      </div>
      {COLUMNS.map((col) => (
        <div key={col} className="flex items-center gap-0.5">
          <span className="w-12 text-right text-[9px] text-foreground-subtle mr-1 capitalize">
            {col}:
          </span>
          {EMPLOYEES.map((emp, rowIdx) => {
            const cellKey = `${rowIdx}-${col}`;
            const isHighlighted = highlight.has(cellKey);
            const isHovered = hoveredCell === cellKey;
            return (
              <div
                key={cellKey}
                onMouseEnter={() => onHoverCell(cellKey)}
                onMouseLeave={() => onHoverCell(null)}
                className={cn(
                  "flex-1 rounded-xl px-1.5 py-1 text-center font-mono text-[10px] transition-all duration-300 border",
                  isHighlighted
                    ? "bg-primary/20 border-primary/40 text-primary font-bold scale-105"
                    : "bg-background/50 border-border/50 text-foreground-subtle opacity-50",
                  isHovered && "ring-1 ring-primary/60",
                )}
              >
                {String(emp[col])}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

// ── Metric Badge ────────────────────────────────────────────────

function MetricBadge({
  label,
  pct,
  winner,
}: {
  label: string;
  pct: number;
  winner: "fast" | "slow" | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-foreground-muted">{label}:</span>
      <span
        className={cn(
          "font-mono text-sm font-bold",
          winner === "fast" ? "text-green-400" : "text-red-400",
        )}
      >
        reads {pct}% of data
      </span>
      {winner === "fast" && (
        <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-400">
          OPTIMAL
        </span>
      )}
    </div>
  );
}

export default RowColumnCanvas;
export type { QueryType as RowColumnQueryType };
