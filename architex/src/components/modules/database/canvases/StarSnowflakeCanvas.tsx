"use client";

import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type SchemaType = "star" | "snowflake";

export interface StarSnowflakeCanvasProps {
  schemaType: SchemaType;
  onSchemaTypeChange: (s: SchemaType) => void;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onStep: () => void;
  onStepBack: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

// ── Step definitions ────────────────────────────────────────────

export interface StarSnowflakeStep {
  id: number;
  label: string;
  description: string;
  /** Which table(s) are highlighted */
  highlightTables: string[];
  /** Which join paths are highlighted */
  highlightJoins: string[];
  /** Phase of the visualization */
  phase: "intro" | "query" | "join" | "compare" | "result";
}

function getStarSteps(): StarSnowflakeStep[] {
  return [
    {
      id: 0,
      label: "Star Schema overview",
      description:
        "A Star Schema has a central FACT table (orders) surrounded by DIMENSION tables. All dimensions connect directly to the fact table -- like a star.",
      highlightTables: ["fact_orders"],
      highlightJoins: [],
      phase: "intro",
    },
    {
      id: 1,
      label: "Fact Table: orders",
      description:
        "The fact table stores measurable events: order_id, amount, quantity, discount. It has foreign keys to every dimension. This table can have billions of rows.",
      highlightTables: ["fact_orders"],
      highlightJoins: [],
      phase: "intro",
    },
    {
      id: 2,
      label: "Dimension: customers",
      description:
        "Dimension tables describe WHO, WHAT, WHEN, WHERE. The customers dimension stores name, email, city, state, country -- all denormalized in one table.",
      highlightTables: ["dim_customers"],
      highlightJoins: ["fact_orders-dim_customers"],
      phase: "intro",
    },
    {
      id: 3,
      label: "Dimension: products",
      description:
        "The products dimension holds product_name, category, department, brand -- all in one flat table. This denormalization is intentional for query speed.",
      highlightTables: ["dim_products"],
      highlightJoins: ["fact_orders-dim_products"],
      phase: "intro",
    },
    {
      id: 4,
      label: "Dimension: time",
      description:
        "The time dimension pre-computes date parts: year, quarter, month, day_of_week, is_holiday. Avoids DATE_PART() in every query.",
      highlightTables: ["dim_time"],
      highlightJoins: ["fact_orders-dim_time"],
      phase: "intro",
    },
    {
      id: 5,
      label: "Dimension: stores",
      description:
        "The stores dimension has store_name, region, manager, square_footage. In a star schema, region info is stored directly here (denormalized).",
      highlightTables: ["dim_stores"],
      highlightJoins: ["fact_orders-dim_stores"],
      phase: "intro",
    },
    {
      id: 6,
      label: "Query: total sales by category",
      description:
        "SELECT category, SUM(amount) FROM fact_orders JOIN dim_products ON ... GROUP BY category; -- Only 1 JOIN needed because category lives in dim_products.",
      highlightTables: ["fact_orders", "dim_products"],
      highlightJoins: ["fact_orders-dim_products"],
      phase: "query",
    },
    {
      id: 7,
      label: "Star advantage: fewer joins",
      description:
        "Star schemas are optimized for OLAP (analytics). Each dimension connects directly to the fact table, so most queries need only 1-2 JOINs. This is why data warehouses use stars.",
      highlightTables: [
        "fact_orders",
        "dim_customers",
        "dim_products",
        "dim_time",
        "dim_stores",
      ],
      highlightJoins: [
        "fact_orders-dim_customers",
        "fact_orders-dim_products",
        "fact_orders-dim_time",
        "fact_orders-dim_stores",
      ],
      phase: "result",
    },
  ];
}

function getSnowflakeSteps(): StarSnowflakeStep[] {
  return [
    {
      id: 0,
      label: "Snowflake Schema overview",
      description:
        "A Snowflake Schema normalizes dimension tables further. Instead of storing category+department in products, it splits them into separate tables -- like a snowflake branching outward.",
      highlightTables: ["fact_orders"],
      highlightJoins: [],
      phase: "intro",
    },
    {
      id: 1,
      label: "Fact Table: same as star",
      description:
        "The fact table is identical to the star schema. It still stores order_id, amount, quantity, discount with foreign keys to dimensions.",
      highlightTables: ["fact_orders"],
      highlightJoins: [],
      phase: "intro",
    },
    {
      id: 2,
      label: "Dimension: customers (normalized)",
      description:
        "In snowflake, the customers table only stores name and email. City/state/country are moved to a separate 'locations' table to avoid repeating 'New York, NY, USA' for every NYC customer.",
      highlightTables: ["dim_customers", "dim_locations"],
      highlightJoins: [
        "fact_orders-dim_customers",
        "dim_customers-dim_locations",
      ],
      phase: "intro",
    },
    {
      id: 3,
      label: "Dimension: products (normalized)",
      description:
        "Products now only store product_name and a category_id FK. Categories have their own table with category_name and department_id. Departments are a third table.",
      highlightTables: ["dim_products", "dim_categories", "dim_departments"],
      highlightJoins: [
        "fact_orders-dim_products",
        "dim_products-dim_categories",
        "dim_categories-dim_departments",
      ],
      phase: "intro",
    },
    {
      id: 4,
      label: "Dimension: time (unchanged)",
      description:
        "Time dimensions are usually NOT further normalized because date components are inherently atomic. This dimension looks the same in both schemas.",
      highlightTables: ["dim_time"],
      highlightJoins: ["fact_orders-dim_time"],
      phase: "intro",
    },
    {
      id: 5,
      label: "Dimension: stores (normalized)",
      description:
        "Stores now reference a 'regions' table instead of storing region directly. This eliminates redundancy when many stores share the same region.",
      highlightTables: ["dim_stores", "dim_regions"],
      highlightJoins: ["fact_orders-dim_stores", "dim_stores-dim_regions"],
      phase: "intro",
    },
    {
      id: 6,
      label: "Query: total sales by department",
      description:
        "SELECT department_name, SUM(amount) FROM fact_orders JOIN dim_products ON ... JOIN dim_categories ON ... JOIN dim_departments ON ... -- Now needs 3 JOINs instead of 1!",
      highlightTables: [
        "fact_orders",
        "dim_products",
        "dim_categories",
        "dim_departments",
      ],
      highlightJoins: [
        "fact_orders-dim_products",
        "dim_products-dim_categories",
        "dim_categories-dim_departments",
      ],
      phase: "query",
    },
    {
      id: 7,
      label: "Snowflake tradeoff: less redundancy, more joins",
      description:
        "Snowflake schemas save storage and prevent update anomalies (change a department name in one place). But queries are slower due to more JOINs. Best when dimension data changes frequently.",
      highlightTables: [
        "fact_orders",
        "dim_customers",
        "dim_locations",
        "dim_products",
        "dim_categories",
        "dim_departments",
        "dim_time",
        "dim_stores",
        "dim_regions",
      ],
      highlightJoins: [
        "fact_orders-dim_customers",
        "fact_orders-dim_products",
        "fact_orders-dim_time",
        "fact_orders-dim_stores",
        "dim_customers-dim_locations",
        "dim_products-dim_categories",
        "dim_categories-dim_departments",
        "dim_stores-dim_regions",
      ],
      phase: "result",
    },
  ];
}

export function getStepsForSchema(schemaType: SchemaType): StarSnowflakeStep[] {
  return schemaType === "star" ? getStarSteps() : getSnowflakeSteps();
}

// ── Table definitions ─────────────────────────────────────────────

interface TableDef {
  id: string;
  label: string;
  columns: string[];
  x: number;
  y: number;
  type: "fact" | "dimension" | "sub-dimension";
}

const STAR_TABLES: TableDef[] = [
  {
    id: "fact_orders",
    label: "fact_orders",
    columns: ["order_id PK", "customer_id FK", "product_id FK", "time_id FK", "store_id FK", "amount", "quantity", "discount"],
    x: 500,
    y: 220,
    type: "fact",
  },
  {
    id: "dim_customers",
    label: "dim_customers",
    columns: ["customer_id PK", "name", "email", "city", "state", "country"],
    x: 130,
    y: 60,
    type: "dimension",
  },
  {
    id: "dim_products",
    label: "dim_products",
    columns: ["product_id PK", "product_name", "category", "department", "brand"],
    x: 870,
    y: 60,
    type: "dimension",
  },
  {
    id: "dim_time",
    label: "dim_time",
    columns: ["time_id PK", "date", "year", "quarter", "month", "day_of_week"],
    x: 130,
    y: 380,
    type: "dimension",
  },
  {
    id: "dim_stores",
    label: "dim_stores",
    columns: ["store_id PK", "store_name", "region", "manager", "sq_ft"],
    x: 870,
    y: 380,
    type: "dimension",
  },
];

const SNOWFLAKE_TABLES: TableDef[] = [
  {
    id: "fact_orders",
    label: "fact_orders",
    columns: ["order_id PK", "customer_id FK", "product_id FK", "time_id FK", "store_id FK", "amount", "quantity", "discount"],
    x: 500,
    y: 240,
    type: "fact",
  },
  {
    id: "dim_customers",
    label: "dim_customers",
    columns: ["customer_id PK", "name", "email", "location_id FK"],
    x: 120,
    y: 100,
    type: "dimension",
  },
  {
    id: "dim_locations",
    label: "dim_locations",
    columns: ["location_id PK", "city", "state", "country"],
    x: 120,
    y: 0,
    type: "sub-dimension",
  },
  {
    id: "dim_products",
    label: "dim_products",
    columns: ["product_id PK", "product_name", "category_id FK"],
    x: 880,
    y: 100,
    type: "dimension",
  },
  {
    id: "dim_categories",
    label: "dim_categories",
    columns: ["category_id PK", "category_name", "dept_id FK"],
    x: 880,
    y: 0,
    type: "sub-dimension",
  },
  {
    id: "dim_departments",
    label: "dim_departments",
    columns: ["dept_id PK", "department_name"],
    x: 1060,
    y: 0,
    type: "sub-dimension",
  },
  {
    id: "dim_time",
    label: "dim_time",
    columns: ["time_id PK", "date", "year", "quarter", "month", "day_of_week"],
    x: 120,
    y: 380,
    type: "dimension",
  },
  {
    id: "dim_stores",
    label: "dim_stores",
    columns: ["store_id PK", "store_name", "region_id FK", "manager"],
    x: 880,
    y: 380,
    type: "dimension",
  },
  {
    id: "dim_regions",
    label: "dim_regions",
    columns: ["region_id PK", "region_name", "country"],
    x: 1060,
    y: 380,
    type: "sub-dimension",
  },
];

// ── Join definitions ──────────────────────────────────────────────

interface JoinDef {
  id: string;
  from: string;
  to: string;
}

const STAR_JOINS: JoinDef[] = [
  { id: "fact_orders-dim_customers", from: "fact_orders", to: "dim_customers" },
  { id: "fact_orders-dim_products", from: "fact_orders", to: "dim_products" },
  { id: "fact_orders-dim_time", from: "fact_orders", to: "dim_time" },
  { id: "fact_orders-dim_stores", from: "fact_orders", to: "dim_stores" },
];

const SNOWFLAKE_JOINS: JoinDef[] = [
  { id: "fact_orders-dim_customers", from: "fact_orders", to: "dim_customers" },
  { id: "fact_orders-dim_products", from: "fact_orders", to: "dim_products" },
  { id: "fact_orders-dim_time", from: "fact_orders", to: "dim_time" },
  { id: "fact_orders-dim_stores", from: "fact_orders", to: "dim_stores" },
  { id: "dim_customers-dim_locations", from: "dim_customers", to: "dim_locations" },
  { id: "dim_products-dim_categories", from: "dim_products", to: "dim_categories" },
  { id: "dim_categories-dim_departments", from: "dim_categories", to: "dim_departments" },
  { id: "dim_stores-dim_regions", from: "dim_stores", to: "dim_regions" },
];

// ── Table rendering helpers ───────────────────────────────────────

const TABLE_WIDTH = 170;
const TABLE_HEADER_H = 24;
const TABLE_ROW_H = 16;

function getTableHeight(cols: number): number {
  return TABLE_HEADER_H + cols * TABLE_ROW_H + 6;
}

function getTableCenter(t: TableDef): { cx: number; cy: number } {
  return { cx: t.x + TABLE_WIDTH / 2, cy: t.y + getTableHeight(t.columns.length) / 2 };
}

// ── Color helpers ─────────────────────────────────────────────────

function getTableColors(type: TableDef["type"], isHighlighted: boolean) {
  if (type === "fact") {
    return {
      headerBg: isHighlighted ? "#1d4ed8" : "#1e3a5f",
      headerText: "#ffffff",
      bodyBg: isHighlighted ? "#1e3a8a" : "#0f172a",
      border: isHighlighted ? "#3b82f6" : "#334155",
      glow: isHighlighted ? "drop-shadow(0 0 12px rgba(59,130,246,0.6))" : "none",
    };
  }
  if (type === "sub-dimension") {
    return {
      headerBg: isHighlighted ? "#7c3aed" : "#3b1f6e",
      headerText: "#ffffff",
      bodyBg: isHighlighted ? "#4c1d95" : "#1a0533",
      border: isHighlighted ? "#8b5cf6" : "#4c1d95",
      glow: isHighlighted ? "drop-shadow(0 0 12px rgba(139,92,246,0.5))" : "none",
    };
  }
  // dimension
  return {
    headerBg: isHighlighted ? "#047857" : "#1a3a2f",
    headerText: "#ffffff",
    bodyBg: isHighlighted ? "#064e3b" : "#0f1f1a",
    border: isHighlighted ? "#10b981" : "#1e4038",
    glow: isHighlighted ? "drop-shadow(0 0 12px rgba(16,185,129,0.5))" : "none",
  };
}

// ── Canvas Component ──────────────────────────────────────────────

const StarSnowflakeCanvas = memo(function StarSnowflakeCanvas({
  schemaType,
  onSchemaTypeChange,
  stepIndex,
  totalSteps,
}: StarSnowflakeCanvasProps) {
  const steps = getStepsForSchema(schemaType);
  const currentStep = steps[stepIndex] ?? steps[0];

  const [showComparison, setShowComparison] = useState(false);

  const tables = schemaType === "star" ? STAR_TABLES : SNOWFLAKE_TABLES;
  const joins = schemaType === "star" ? STAR_JOINS : SNOWFLAKE_JOINS;

  // SVG viewBox: wider for snowflake to fit sub-dimension tables
  const viewBoxWidth = schemaType === "snowflake" ? 1240 : 1100;
  const viewBoxHeight = 520;

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-elevated/80 to-background">
      {/* Top bar: schema toggle + step info */}
      <div className="flex items-center justify-between border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm">
            <button
              onClick={() => onSchemaTypeChange("star")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors rounded-l-md",
                schemaType === "star"
                  ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              Star Schema
            </button>
            <button
              onClick={() => onSchemaTypeChange("snowflake")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors rounded-r-md border-l border-border/30",
                schemaType === "snowflake"
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              Snowflake Schema
            </button>
          </div>
          <span className="text-xs text-foreground-muted">
            Step {stepIndex + 1} / {steps.length}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              currentStep.phase === "query"
                ? "bg-amber-500/10 text-amber-400"
                : currentStep.phase === "result"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-blue-500/10 text-blue-400",
            )}
          >
            {currentStep.phase}
          </span>
        </div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={cn(
            "rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
            showComparison
              ? "bg-violet-500/10 text-violet-400 border border-violet-500/30"
              : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
          )}
        >
          {showComparison ? "Show Diagram" : "Show Comparison"}
        </button>
      </div>

      {showComparison ? (
        /* ── Comparison view ──────────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* OLAP vs OLTP */}
            <div className="rounded-xl border border-amber-500/30/50 bg-amber-950/20 p-4 text-center">
              <p className="text-sm font-semibold text-amber-300">
                OLAP vs OLTP
              </p>
              <p className="mt-1 text-[11px] text-amber-400/80">
                Star &amp; Snowflake schemas are for OLAP (analytics). Your
                OLTP (transactions) database uses normalized 3NF schemas instead.
              </p>
            </div>

            {/* Comparison table */}
            <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/30 bg-black/30">
                    <th className="px-3 py-2 text-left font-semibold text-foreground-muted">
                      Aspect
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-primary">
                      Star Schema
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-violet-400">
                      Snowflake Schema
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Query complexity", "Simple -- 1 JOIN per dimension", "Complex -- multiple JOINs through hierarchy"],
                    ["Query speed", "Faster (fewer joins)", "Slower (more joins)"],
                    ["Storage", "More (denormalized dimensions)", "Less (normalized, no redundancy)"],
                    ["Dimension updates", "Harder (update in many places)", "Easier (update in one place)"],
                    ["ETL complexity", "Simpler transforms", "More complex transforms"],
                    ["Used by", "Amazon Redshift, BigQuery, Snowflake DW", "Traditional data warehouses"],
                    ["Best for", "Read-heavy analytics dashboards", "Frequently changing dimension data"],
                  ].map(([aspect, star, snowflake], i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-none"
                    >
                      <td className="px-3 py-2 font-medium text-foreground">
                        {aspect}
                      </td>
                      <td className="px-3 py-2 text-foreground-subtle">
                        {star}
                      </td>
                      <td className="px-3 py-2 text-foreground-subtle">
                        {snowflake}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Query comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                  Star Schema Query
                </span>
                <pre className="whitespace-pre-wrap font-mono text-[10px] text-foreground-muted leading-relaxed">
{`SELECT
  p.department,
  SUM(o.amount) AS total
FROM fact_orders o
JOIN dim_products p
  ON o.product_id = p.product_id
GROUP BY p.department;

-- 1 JOIN: department is
-- denormalized in dim_products`}
                </pre>
              </div>
              <div className="rounded-xl border border-violet-500/30/40 bg-violet-500/5 p-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">
                  Snowflake Schema Query
                </span>
                <pre className="whitespace-pre-wrap font-mono text-[10px] text-foreground-muted leading-relaxed">
{`SELECT
  d.department_name,
  SUM(o.amount) AS total
FROM fact_orders o
JOIN dim_products p
  ON o.product_id = p.product_id
JOIN dim_categories c
  ON p.category_id = c.category_id
JOIN dim_departments d
  ON c.dept_id = d.dept_id
GROUP BY d.department_name;

-- 3 JOINs: normalized chain`}
                </pre>
              </div>
            </div>

            {/* Performance insight */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Interview Insight
              </span>
              <p className="text-[11px] text-foreground-subtle leading-relaxed">
                Modern cloud data warehouses (Snowflake, BigQuery, Redshift) are
                optimized for Star schemas. They use columnar storage and
                massively parallel processing, making the extra storage from
                denormalization a non-issue. The performance gain from fewer
                JOINs is significant at petabyte scale.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Schema diagram view ─────────────────────────────── */
        <div className="flex flex-1 flex-col">
          {/* SVG diagram */}
          <div className="relative flex-1 p-4">
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker
                  id="ssArrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker
                  id="ssArrowActive"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
                <marker
                  id="ssArrowViolet"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
                </marker>
              </defs>

              {/* Join lines */}
              {joins.map((join) => {
                const fromTable = tables.find((t) => t.id === join.from);
                const toTable = tables.find((t) => t.id === join.to);
                if (!fromTable || !toTable) return null;
                const fromC = getTableCenter(fromTable);
                const toC = getTableCenter(toTable);
                const isActive = currentStep.highlightJoins.includes(join.id);
                // Determine if this is a sub-dimension join
                const isSubDim =
                  toTable.type === "sub-dimension" ||
                  fromTable.type === "sub-dimension";
                return (
                  <line
                    key={join.id}
                    x1={fromC.cx}
                    y1={fromC.cy}
                    x2={toC.cx}
                    y2={toC.cy}
                    stroke={
                      isActive
                        ? isSubDim
                          ? "#8b5cf6"
                          : "#3b82f6"
                        : "#334155"
                    }
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? undefined : "6 4"}
                    opacity={isActive ? 1 : 0.5}
                    markerEnd={
                      isActive
                        ? isSubDim
                          ? "url(#ssArrowViolet)"
                          : "url(#ssArrowActive)"
                        : "url(#ssArrow)"
                    }
                  />
                );
              })}

              {/* Tables */}
              {tables.map((table) => {
                const isHighlighted =
                  currentStep.highlightTables.includes(table.id);
                const colors = getTableColors(table.type, isHighlighted);
                const h = getTableHeight(table.columns.length);
                return (
                  <g
                    key={table.id}
                    style={{ filter: colors.glow }}
                  >
                    {/* Body */}
                    <rect
                      x={table.x}
                      y={table.y}
                      width={TABLE_WIDTH}
                      height={h}
                      rx={4}
                      fill={colors.bodyBg}
                      stroke={colors.border}
                      strokeWidth={isHighlighted ? 2 : 1}
                    />
                    {/* Header */}
                    <rect
                      x={table.x}
                      y={table.y}
                      width={TABLE_WIDTH}
                      height={TABLE_HEADER_H}
                      rx={4}
                      fill={colors.headerBg}
                    />
                    {/* Fix bottom corners of header */}
                    <rect
                      x={table.x}
                      y={table.y + TABLE_HEADER_H - 4}
                      width={TABLE_WIDTH}
                      height={4}
                      fill={colors.headerBg}
                    />
                    {/* Table name */}
                    <text
                      x={table.x + TABLE_WIDTH / 2}
                      y={table.y + TABLE_HEADER_H / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={colors.headerText}
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="monospace"
                    >
                      {table.label}
                    </text>
                    {/* Columns */}
                    {table.columns.map((col, ci) => {
                      const isPK = col.includes("PK");
                      const isFK = col.includes("FK");
                      return (
                        <text
                          key={ci}
                          x={table.x + 8}
                          y={
                            table.y +
                            TABLE_HEADER_H +
                            6 +
                            ci * TABLE_ROW_H +
                            TABLE_ROW_H / 2
                          }
                          dominantBaseline="middle"
                          fill={
                            isPK
                              ? "#fbbf24"
                              : isFK
                                ? "#60a5fa"
                                : "#94a3b8"
                          }
                          fontSize={9}
                          fontFamily="monospace"
                        >
                          {isPK ? "\u{1F511} " : isFK ? "\u{1F517} " : "   "}
                          {col.replace(/ PK| FK/g, "")}
                        </text>
                      );
                    })}
                  </g>
                );
              })}

              {/* Schema type label */}
              <text
                x={viewBoxWidth / 2}
                y={viewBoxHeight - 10}
                textAnchor="middle"
                fill="#475569"
                fontSize={12}
                fontWeight={600}
              >
                {schemaType === "star"
                  ? "Star Schema -- all dimensions connect directly to fact table"
                  : "Snowflake Schema -- dimensions are further normalized into sub-tables"}
              </text>
            </svg>
          </div>

          {/* Step description bar */}
          <div className="border-t border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-3">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 shrink-0 rounded-xl px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  currentStep.phase === "query"
                    ? "bg-amber-500/10 text-amber-400"
                    : currentStep.phase === "result"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-blue-500/10 text-blue-400",
                )}
              >
                {currentStep.label}
              </span>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default StarSnowflakeCanvas;
