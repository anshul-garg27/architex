"use client";

import React, { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { JoinState, JoinStep, JoinRow, JoinMatch } from "@/lib/database/join-viz";

// -- Constants ----------------------------------------------------

const TABLE_COL_W = 80;
const TABLE_ROW_H = 28;
const TABLE_HEADER_H = 32;
const TABLE_PAD = 12;
const TABLE_GAP = 100;
const HASH_BUCKET_W = 120;
const HASH_BUCKET_H = 28;

// -- Colors -------------------------------------------------------

const COL = {
  bg: "#0f172a",
  tableBg: "#1e293b",
  tableHeader: "#334155",
  headerText: "#94a3b8",
  text: "#e2e8f0",
  textDim: "#64748b",
  highlight: "#3b82f6",
  highlightBg: "#1e3a5f",
  match: "#22c55e",
  matchBg: "#14532d",
  noMatch: "#ef4444",
  noMatchBg: "#450a0a",
  border: "#334155",
  pointer: "#f59e0b",
  hashBuild: "#8b5cf6",
  hashProbe: "#3b82f6",
  sortLine: "#f59e0b",
};

// -- Operation badge colors --------------------------------------

const OP_COLORS: Record<string, { bg: string; text: string }> = {
  setup: { bg: "#334155", text: "#94a3b8" },
  compare: { bg: "#1e3a5f", text: "#60a5fa" },
  match: { bg: "#14532d", text: "#4ade80" },
  sort: { bg: "#451a03", text: "#fbbf24" },
  "hash-build": { bg: "#2e1065", text: "#a78bfa" },
  "hash-probe": { bg: "#1e3a5f", text: "#60a5fa" },
  complete: { bg: "#14532d", text: "#4ade80" },
};

// -- Helper: render a table as SVG --------------------------------

interface TableSVGProps {
  table: { name: string; columns: string[]; rows: JoinRow[] };
  x: number;
  y: number;
  highlightRow?: number;
  highlightColor?: string;
  matches: JoinMatch[];
  side: "left" | "right";
  pointerRow?: number;
  pointerLabel?: string;
  sortedRows?: JoinRow[];
}

function renderTable({
  table,
  x,
  y,
  highlightRow,
  highlightColor,
  matches,
  side,
  pointerRow,
  pointerLabel,
  sortedRows,
}: TableSVGProps): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const rows = sortedRows ?? table.rows;
  const cols = table.columns;
  const tableW = cols.length * TABLE_COL_W + TABLE_PAD * 2;
  const tableH = TABLE_HEADER_H + rows.length * TABLE_ROW_H + TABLE_PAD;
  const key = `table-${side}`;

  // Table background
  elements.push(
    <rect
      key={`${key}-bg`}
      x={x}
      y={y}
      width={tableW}
      height={tableH}
      rx={8}
      fill={COL.tableBg}
      stroke={COL.border}
      strokeWidth={1}
    />,
  );

  // Table name
  elements.push(
    <text
      key={`${key}-name`}
      x={x + tableW / 2}
      y={y - 8}
      textAnchor="middle"
      fill={COL.headerText}
      fontSize={11}
      fontWeight={600}
      fontFamily="monospace"
    >
      {table.name}{sortedRows ? " (sorted)" : ""}
    </text>,
  );

  // Column headers
  elements.push(
    <rect
      key={`${key}-header`}
      x={x}
      y={y}
      width={tableW}
      height={TABLE_HEADER_H}
      rx={8}
      fill={COL.tableHeader}
    />,
  );
  // Bottom rect to fill corners
  elements.push(
    <rect
      key={`${key}-header-fill`}
      x={x}
      y={y + 8}
      width={tableW}
      height={TABLE_HEADER_H - 8}
      fill={COL.tableHeader}
    />,
  );

  cols.forEach((col, ci) => {
    elements.push(
      <text
        key={`${key}-hdr-${ci}`}
        x={x + TABLE_PAD + ci * TABLE_COL_W + TABLE_COL_W / 2}
        y={y + TABLE_HEADER_H / 2 + 4}
        textAnchor="middle"
        fill={COL.headerText}
        fontSize={10}
        fontWeight={700}
        fontFamily="monospace"
      >
        {col}
      </text>,
    );
  });

  // Rows
  rows.forEach((row, ri) => {
    const rowY = y + TABLE_HEADER_H + ri * TABLE_ROW_H;
    const isHighlighted = highlightRow === ri;
    const matchedPairs = matches.filter(
      (m) =>
        (side === "left" && m.leftRowIndex === ri) ||
        (side === "right" && m.rightRowIndex === ri),
    );
    const isMatched = matchedPairs.length > 0 && !isHighlighted;

    // Row background
    if (isHighlighted) {
      elements.push(
        <rect
          key={`${key}-row-bg-${ri}`}
          x={x + 1}
          y={rowY}
          width={tableW - 2}
          height={TABLE_ROW_H}
          fill={highlightColor === COL.match ? COL.matchBg : highlightColor === COL.noMatch ? COL.noMatchBg : COL.highlightBg}
          opacity={0.6}
        />,
      );
    } else if (isMatched) {
      elements.push(
        <rect
          key={`${key}-row-bg-${ri}`}
          x={x + 1}
          y={rowY}
          width={tableW - 2}
          height={TABLE_ROW_H}
          fill={COL.matchBg}
          opacity={0.3}
        />,
      );
    }

    // Row divider
    if (ri > 0) {
      elements.push(
        <line
          key={`${key}-div-${ri}`}
          x1={x + TABLE_PAD}
          y1={rowY}
          x2={x + tableW - TABLE_PAD}
          y2={rowY}
          stroke={COL.border}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />,
      );
    }

    // Cell values
    cols.forEach((col, ci) => {
      elements.push(
        <text
          key={`${key}-cell-${ri}-${ci}`}
          x={x + TABLE_PAD + ci * TABLE_COL_W + TABLE_COL_W / 2}
          y={rowY + TABLE_ROW_H / 2 + 4}
          textAnchor="middle"
          fill={isHighlighted ? "#ffffff" : COL.text}
          fontSize={11}
          fontFamily="monospace"
        >
          {String(row[col] ?? "")}
        </text>,
      );
    });

    // Pointer indicator (for sort-merge)
    if (pointerRow === ri) {
      const ptrX = side === "left" ? x - 20 : x + tableW + 6;
      elements.push(
        <g key={`${key}-ptr-${ri}`}>
          <polygon
            points={
              side === "left"
                ? `${ptrX + 14},${rowY + TABLE_ROW_H / 2} ${ptrX},${rowY + TABLE_ROW_H / 2 - 6} ${ptrX},${rowY + TABLE_ROW_H / 2 + 6}`
                : `${ptrX},${rowY + TABLE_ROW_H / 2} ${ptrX + 14},${rowY + TABLE_ROW_H / 2 - 6} ${ptrX + 14},${rowY + TABLE_ROW_H / 2 + 6}`
            }
            fill={COL.pointer}
          />
          {pointerLabel && (
            <text
              x={side === "left" ? ptrX - 4 : ptrX + 18}
              y={rowY + TABLE_ROW_H / 2 + 4}
              textAnchor={side === "left" ? "end" : "start"}
              fill={COL.pointer}
              fontSize={9}
              fontWeight={700}
              fontFamily="monospace"
            >
              {pointerLabel}
            </text>
          )}
        </g>,
      );
    }
  });

  return elements;
}

// -- Helper: render hash table ------------------------------------

function renderHashTable(
  buckets: Array<{ key: number; entries: Array<{ key: number; rowIndex: number }> }>,
  rightTable: { name: string; columns: string[]; rows: JoinRow[] },
  x: number,
  y: number,
  phase: "build" | "probe" | "done" | undefined,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  if (!buckets || buckets.length === 0) return elements;

  elements.push(
    <text
      key="ht-title"
      x={x + 60}
      y={y - 8}
      textAnchor="middle"
      fill={phase === "build" ? COL.hashBuild : COL.hashProbe}
      fontSize={11}
      fontWeight={600}
      fontFamily="monospace"
    >
      Hash Table {phase === "build" ? "(building)" : phase === "probe" ? "(probing)" : "(complete)"}
    </text>,
  );

  buckets.forEach((bucket, bi) => {
    const bucketY = y + bi * (HASH_BUCKET_H + 8);

    elements.push(
      <rect
        key={`ht-bucket-${bi}`}
        x={x}
        y={bucketY}
        width={HASH_BUCKET_W}
        height={HASH_BUCKET_H}
        rx={4}
        fill={COL.tableBg}
        stroke={phase === "build" ? COL.hashBuild : COL.hashProbe}
        strokeWidth={1}
        opacity={0.8}
      />,
    );

    // Bucket key label
    elements.push(
      <text
        key={`ht-key-${bi}`}
        x={x + 8}
        y={bucketY + HASH_BUCKET_H / 2 + 4}
        fill={COL.pointer}
        fontSize={10}
        fontWeight={700}
        fontFamily="monospace"
      >
        [{bucket.key}]
      </text>,
    );

    // Entries
    const entryNames = bucket.entries
      .map((e) => rightTable.rows[e.rowIndex]?.name ?? `#${e.rowIndex}`)
      .join(", ");

    elements.push(
      <text
        key={`ht-entries-${bi}`}
        x={x + 40}
        y={bucketY + HASH_BUCKET_H / 2 + 4}
        fill={COL.text}
        fontSize={10}
        fontFamily="monospace"
      >
        {entryNames}
      </text>,
    );
  });

  return elements;
}

// -- Match lines --------------------------------------------------

function renderMatchLines(
  matches: JoinMatch[],
  leftX: number,
  rightX: number,
  tableY: number,
  leftRows: JoinRow[],
  rightRows: JoinRow[],
  leftCols: string[],
  rightCols: string[],
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const leftTableW = leftCols.length * TABLE_COL_W + TABLE_PAD * 2;

  matches.forEach((m, mi) => {
    const ly = tableY + TABLE_HEADER_H + m.leftRowIndex * TABLE_ROW_H + TABLE_ROW_H / 2;
    const ry = tableY + TABLE_HEADER_H + m.rightRowIndex * TABLE_ROW_H + TABLE_ROW_H / 2;

    elements.push(
      <line
        key={`match-line-${mi}`}
        x1={leftX + leftTableW}
        y1={ly}
        x2={rightX}
        y2={ry}
        stroke={COL.match}
        strokeWidth={1.5}
        strokeDasharray="4,4"
        opacity={0.5}
      />,
    );
  });

  return elements;
}

// -- Comparison counter -------------------------------------------

function renderCounter(
  comparisons: number,
  maxComparisons: number,
  x: number,
  y: number,
  algorithm: string,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const pct = maxComparisons > 0 ? Math.min(comparisons / maxComparisons, 1) : 0;
  const barW = 160;
  const barH = 8;

  elements.push(
    <text
      key="counter-label"
      x={x}
      y={y}
      fill={COL.headerText}
      fontSize={10}
      fontWeight={600}
      fontFamily="monospace"
    >
      Comparisons: {comparisons}{algorithm === "nested-loop" ? ` / ${maxComparisons}` : ""}
    </text>,
  );

  // Progress bar background
  elements.push(
    <rect
      key="counter-bg"
      x={x}
      y={y + 6}
      width={barW}
      height={barH}
      rx={4}
      fill={COL.border}
    />,
  );

  // Progress bar fill
  if (pct > 0) {
    elements.push(
      <rect
        key="counter-fill"
        x={x}
        y={y + 6}
        width={barW * pct}
        height={barH}
        rx={4}
        fill={pct > 0.7 ? COL.noMatch : pct > 0.4 ? COL.pointer : COL.match}
      />,
    );
  }

  return elements;
}

// -- Main Component -----------------------------------------------

interface JoinAlgorithmsCanvasProps {
  state: JoinState;
  steps: JoinStep[];
  stepIndex: number;
}

const JoinAlgorithmsCanvas = memo(function JoinAlgorithmsCanvas({
  state,
  steps,
  stepIndex,
}: JoinAlgorithmsCanvasProps) {
  const currentStep = steps[stepIndex] as JoinStep | undefined;
  const displayState = currentStep?.state ?? state;

  const {
    leftTable,
    rightTable,
    algorithm,
    matches,
    comparisons,
    highlightLeft,
    highlightRight,
    isMatch,
    phase,
    sortedLeft,
    sortedRight,
    leftPointer,
    rightPointer,
    hashBuckets,
    hashPhase,
  } = displayState;

  const leftCols = leftTable.columns;
  const rightCols = rightTable.columns;
  const leftTableW = leftCols.length * TABLE_COL_W + TABLE_PAD * 2;
  const rightTableW = rightCols.length * TABLE_COL_W + TABLE_PAD * 2;

  // Layout
  const leftX = 40;
  const tableY = 80;
  const rightX = leftX + leftTableW + TABLE_GAP;
  const hashTableX = rightX + rightTableW + 40;
  const maxComparisons = leftTable.rows.length * rightTable.rows.length;

  // SVG dimensions
  const svgW = algorithm === "hash-join"
    ? hashTableX + HASH_BUCKET_W + 40
    : rightX + rightTableW + 60;
  const svgH = tableY + TABLE_HEADER_H + Math.max(leftTable.rows.length, rightTable.rows.length) * TABLE_ROW_H + TABLE_PAD + 80;

  // Determine highlight color
  const highlightColor = isMatch === true ? COL.match : isMatch === false ? COL.noMatch : COL.highlight;

  // For sort-merge, use sorted rows
  const leftDisplayRows = algorithm === "sort-merge" && sortedLeft ? sortedLeft : undefined;
  const rightDisplayRows = algorithm === "sort-merge" && sortedRight ? sortedRight : undefined;

  const svgElements = useMemo(() => {
    const els: React.ReactNode[] = [];

    // Left table
    els.push(
      ...renderTable({
        table: leftTable,
        x: leftX,
        y: tableY,
        highlightRow: highlightLeft,
        highlightColor,
        matches,
        side: "left",
        pointerRow: algorithm === "sort-merge" ? leftPointer : undefined,
        pointerLabel: algorithm === "sort-merge" ? "L" : undefined,
        sortedRows: leftDisplayRows,
      }),
    );

    // Right table
    els.push(
      ...renderTable({
        table: rightTable,
        x: rightX,
        y: tableY,
        highlightRow: highlightRight,
        highlightColor,
        matches,
        side: "right",
        pointerRow: algorithm === "sort-merge" ? rightPointer : undefined,
        pointerLabel: algorithm === "sort-merge" ? "R" : undefined,
        sortedRows: rightDisplayRows,
      }),
    );

    // Match lines
    els.push(
      ...renderMatchLines(
        matches,
        leftX,
        rightX,
        tableY,
        leftTable.rows,
        rightTable.rows,
        leftCols,
        rightCols,
      ),
    );

    // Hash table (for hash-join)
    if (algorithm === "hash-join" && hashBuckets) {
      els.push(
        ...renderHashTable(hashBuckets, rightTable, hashTableX, tableY, hashPhase),
      );
    }

    // Comparison counter
    const counterY = tableY + TABLE_HEADER_H + Math.max(leftTable.rows.length, rightTable.rows.length) * TABLE_ROW_H + TABLE_PAD + 20;
    els.push(
      ...renderCounter(comparisons, maxComparisons, leftX, counterY, algorithm),
    );

    // Matches count
    els.push(
      <text
        key="match-count"
        x={leftX + 200}
        y={counterY}
        fill={COL.match}
        fontSize={10}
        fontWeight={600}
        fontFamily="monospace"
      >
        Matches: {matches.length}
      </text>,
    );

    // JOIN condition label
    els.push(
      <text
        key="join-label"
        x={leftX + leftTableW + TABLE_GAP / 2}
        y={tableY - 20}
        textAnchor="middle"
        fill={COL.textDim}
        fontSize={10}
        fontFamily="monospace"
      >
        ON dept_id = id
      </text>,
    );

    return els;
  }, [
    leftTable, rightTable, algorithm, matches, comparisons,
    highlightLeft, highlightRight, highlightColor,
    leftPointer, rightPointer, hashBuckets, hashPhase,
    leftDisplayRows, rightDisplayRows,
    leftX, rightX, hashTableX, tableY, maxComparisons,
    leftCols, rightCols, leftTableW,
  ]);

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      {/* Step description bar */}
      {currentStep && (
        <div className="flex items-start gap-2 border-b border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-3">
          <span
            className="mt-0.5 shrink-0 rounded-xl px-1.5 py-0.5 text-[10px] font-bold uppercase"
            style={{
              backgroundColor: OP_COLORS[currentStep.operation]?.bg ?? "#334155",
              color: OP_COLORS[currentStep.operation]?.text ?? "#94a3b8",
            }}
          >
            {currentStep.operation}
          </span>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {currentStep.description}
          </p>
          <span className="ml-auto shrink-0 font-mono text-[10px] text-foreground-subtle">
            {stepIndex + 1}/{steps.length}
          </span>
        </div>
      )}

      {/* Phase label */}
      {phase && (
        <div className="flex items-center gap-2 border-b border-border/30 px-4 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
            {algorithm.replace("-", " ")}
          </span>
          <span className="text-[10px] text-foreground-muted">
            {phase}
          </span>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="flex-1 overflow-auto p-4">
        {steps.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-foreground-muted">
                Select a join algorithm and click <strong>Run Join</strong> to start the visualization.
              </p>
              <p className="mt-2 text-xs text-foreground-subtle">
                Watch how Nested Loop, Sort-Merge, and Hash Join differ in their approach to matching rows.
              </p>
            </div>
          </div>
        ) : (
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="mx-auto"
          >
            {/* Background */}
            <rect width={svgW} height={svgH} fill="transparent" />

            {/* Algorithm title */}
            <text
              x={svgW / 2}
              y={30}
              textAnchor="middle"
              fill={COL.text}
              fontSize={14}
              fontWeight={700}
              fontFamily="monospace"
            >
              {algorithm === "nested-loop"
                ? "Nested Loop Join  O(n\u00B7m)"
                : algorithm === "sort-merge"
                  ? "Sort-Merge Join  O(n log n + m log m)"
                  : "Hash Join  O(n + m)"}
            </text>
            <text
              x={svgW / 2}
              y={48}
              textAnchor="middle"
              fill={COL.textDim}
              fontSize={10}
              fontFamily="monospace"
            >
              SELECT * FROM employees e JOIN departments d ON e.dept_id = d.id
            </text>

            {svgElements}
          </svg>
        )}
      </div>
    </div>
  );
});

export default JoinAlgorithmsCanvas;
