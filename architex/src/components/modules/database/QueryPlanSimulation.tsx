"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/providers/ReducedMotionProvider";
import {
  Database,
  Search,
  GitBranch,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Zap,
  BarChart3,
  Clock,
  HardDrive,
  ArrowRight,
  X,
  Brain,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BTreeViz, type BTreeStep, type BTreeNode as BTreeNodeType } from "@/lib/database/btree-viz";

// ── Types ──────────────────────────────────────────────────────

interface Column {
  name: string;
  type: string;
}

interface TableSchema {
  name: string;
  columns: Column[];
  rowCount: number;
  rowSize: number; // bytes per row
}

interface IndexDef {
  id: string;
  table: string;
  column: string;
  enabled: boolean;
}

interface PlanNode {
  id: string;
  type: PlanNodeType;
  table?: string;
  column?: string;
  estimatedRows: number;
  estimatedCost: number;
  ioPages: number;
  children: PlanNode[];
}

type PlanNodeType =
  | "SeqScan"
  | "IndexScan"
  | "IndexOnlyScan"
  | "BitmapIndexScan"
  | "HashJoin"
  | "NestedLoop"
  | "MergeJoin"
  | "Sort"
  | "Aggregate"
  | "Filter"
  | "Result";

interface SampleQuery {
  id: string;
  label: string;
  sql: string;
  tables: string[];
  joinColumn?: string;
  filterColumn?: string;
  filterSelectivity: number;
  hasAggregate: boolean;
  hasSort: boolean;
}

// ── Sample Data ────────────────────────────────────────────────

const TABLES: TableSchema[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "BIGINT" },
      { name: "email", type: "VARCHAR" },
      { name: "name", type: "VARCHAR" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "status", type: "VARCHAR" },
    ],
    rowCount: 1_000_000,
    rowSize: 128,
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "BIGINT" },
      { name: "user_id", type: "BIGINT" },
      { name: "total", type: "DECIMAL" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "status", type: "VARCHAR" },
    ],
    rowCount: 5_000_000,
    rowSize: 96,
  },
  {
    name: "products",
    columns: [
      { name: "id", type: "BIGINT" },
      { name: "name", type: "VARCHAR" },
      { name: "category", type: "VARCHAR" },
      { name: "price", type: "DECIMAL" },
    ],
    rowCount: 50_000,
    rowSize: 256,
  },
];

const INITIAL_INDEXES: IndexDef[] = [
  { id: "idx-users-id", table: "users", column: "id", enabled: true },
  { id: "idx-users-email", table: "users", column: "email", enabled: false },
  { id: "idx-users-status", table: "users", column: "status", enabled: false },
  { id: "idx-orders-id", table: "orders", column: "id", enabled: true },
  { id: "idx-orders-user_id", table: "orders", column: "user_id", enabled: false },
  { id: "idx-orders-created_at", table: "orders", column: "created_at", enabled: false },
  { id: "idx-products-id", table: "products", column: "id", enabled: true },
  { id: "idx-products-category", table: "products", column: "category", enabled: false },
];

const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "q1",
    label: "Find user by email",
    sql: "SELECT * FROM users WHERE email = 'alice@example.com'",
    tables: ["users"],
    filterColumn: "email",
    filterSelectivity: 0.000001,
    hasAggregate: false,
    hasSort: false,
  },
  {
    id: "q2",
    label: "Orders by user",
    sql: "SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC",
    tables: ["orders"],
    filterColumn: "user_id",
    filterSelectivity: 0.001,
    hasAggregate: false,
    hasSort: true,
  },
  {
    id: "q3",
    label: "Join users+orders",
    sql: "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = 'active'",
    tables: ["users", "orders"],
    joinColumn: "user_id",
    filterColumn: "status",
    filterSelectivity: 0.3,
    hasAggregate: false,
    hasSort: false,
  },
  {
    id: "q4",
    label: "Aggregate by category",
    sql: "SELECT category, AVG(price) FROM products GROUP BY category",
    tables: ["products"],
    filterColumn: "category",
    filterSelectivity: 1.0,
    hasAggregate: true,
    hasSort: false,
  },
  {
    id: "q5",
    label: "Full table scan",
    sql: "SELECT * FROM orders WHERE total > 100 AND status = 'pending'",
    tables: ["orders"],
    filterColumn: "status",
    filterSelectivity: 0.15,
    hasAggregate: false,
    hasSort: false,
  },
];

// ── Plan Generation ────────────────────────────────────────────

const PAGE_SIZE = 8192; // 8KB

function getTable(name: string): TableSchema {
  return TABLES.find((t) => t.name === name) ?? TABLES[0];
}

function hasIndex(indexes: IndexDef[], table: string, column: string): boolean {
  return indexes.some((idx) => idx.table === table && idx.column === column && idx.enabled);
}

function seqScanCost(table: TableSchema, selectivity: number): { cost: number; rows: number; io: number } {
  const pages = Math.ceil((table.rowCount * table.rowSize) / PAGE_SIZE);
  const cost = pages * 1.0 + table.rowCount * 0.01;
  return { cost: Math.round(cost), rows: Math.round(table.rowCount * selectivity), io: pages };
}

function indexScanCost(table: TableSchema, selectivity: number): { cost: number; rows: number; io: number } {
  const rows = Math.round(table.rowCount * selectivity);
  const pages = Math.max(1, Math.ceil(rows * table.rowSize / PAGE_SIZE));
  const treeDepth = Math.ceil(Math.log2(table.rowCount + 1) / Math.log2(100));
  const cost = treeDepth * 4.0 + pages * 1.5 + rows * 0.01;
  return { cost: Math.round(cost), rows, io: treeDepth + pages };
}

function buildPlanTree(query: SampleQuery, indexes: IndexDef[]): PlanNode {
  const mainTable = getTable(query.tables[0]);
  let nodeId = 0;
  const nextId = () => `node-${nodeId++}`;

  // Single-table queries
  if (query.tables.length === 1) {
    const useIndex = query.filterColumn && hasIndex(indexes, mainTable.name, query.filterColumn);
    const scanInfo = useIndex
      ? indexScanCost(mainTable, query.filterSelectivity)
      : seqScanCost(mainTable, query.filterSelectivity);

    let scanNode: PlanNode = {
      id: nextId(),
      type: useIndex ? "IndexScan" : "SeqScan",
      table: mainTable.name,
      column: query.filterColumn ?? undefined,
      estimatedRows: scanInfo.rows,
      estimatedCost: scanInfo.cost,
      ioPages: scanInfo.io,
      children: [],
    };

    // Wrap in filter if not using index but still filtering
    if (!useIndex && query.filterColumn) {
      scanNode = {
        id: nextId(),
        type: "Filter",
        column: query.filterColumn,
        estimatedRows: scanInfo.rows,
        estimatedCost: scanInfo.cost + scanInfo.rows * 0.005,
        ioPages: scanInfo.io,
        children: [scanNode],
      };
    }

    // Add sort if needed
    if (query.hasSort) {
      const sortHasIndex = query.tables[0] === "orders" && hasIndex(indexes, "orders", "created_at");
      if (!sortHasIndex) {
        scanNode = {
          id: nextId(),
          type: "Sort",
          column: "created_at",
          estimatedRows: scanInfo.rows,
          estimatedCost: scanInfo.cost + scanInfo.rows * Math.log2(Math.max(scanInfo.rows, 2)) * 0.05,
          ioPages: scanInfo.io + Math.ceil(scanInfo.rows / 100),
          children: [scanNode],
        };
      }
    }

    // Add aggregate if needed
    if (query.hasAggregate) {
      scanNode = {
        id: nextId(),
        type: "Aggregate",
        estimatedRows: Math.min(scanInfo.rows, 100),
        estimatedCost: scanInfo.cost + scanInfo.rows * 0.02,
        ioPages: scanInfo.io,
        children: [scanNode],
      };
    }

    return scanNode;
  }

  // Join queries
  const rightTable = getTable(query.tables[1]);
  const leftHasFilter = query.filterColumn && hasIndex(indexes, mainTable.name, query.filterColumn);
  const rightHasJoinIdx = query.joinColumn && hasIndex(indexes, rightTable.name, query.joinColumn);

  const leftScan = leftHasFilter
    ? indexScanCost(mainTable, query.filterSelectivity)
    : seqScanCost(mainTable, query.filterSelectivity);

  const leftNode: PlanNode = {
    id: nextId(),
    type: leftHasFilter ? "IndexScan" : "SeqScan",
    table: mainTable.name,
    column: query.filterColumn ?? undefined,
    estimatedRows: leftScan.rows,
    estimatedCost: leftScan.cost,
    ioPages: leftScan.io,
    children: [],
  };

  const rightScan = rightHasJoinIdx
    ? indexScanCost(rightTable, leftScan.rows / rightTable.rowCount)
    : seqScanCost(rightTable, 1.0);

  const rightNode: PlanNode = {
    id: nextId(),
    type: rightHasJoinIdx ? "IndexScan" : "SeqScan",
    table: rightTable.name,
    column: query.joinColumn ?? undefined,
    estimatedRows: rightScan.rows,
    estimatedCost: rightScan.cost,
    ioPages: rightScan.io,
    children: [],
  };

  const joinType: PlanNodeType = rightHasJoinIdx ? "NestedLoop" : "HashJoin";
  const joinRows = Math.round(leftScan.rows * (rightScan.rows / rightTable.rowCount));
  const joinCost = leftScan.cost + rightScan.cost + (joinType === "HashJoin" ? rightTable.rowCount * 0.01 : leftScan.rows * 4);

  return {
    id: nextId(),
    type: joinType,
    estimatedRows: Math.max(joinRows, 1),
    estimatedCost: Math.round(joinCost),
    ioPages: leftScan.io + rightScan.io,
    children: [leftNode, rightNode],
  };
}

function estimateP95(totalCost: number): number {
  // Rough: 1 cost unit ~ 0.01ms
  return Math.round(totalCost * 0.01 * 100) / 100;
}

// ── Plan Comparison Helpers ────────────────────────────────────

interface NodeChange {
  table?: string;
  column?: string;
  beforeType: PlanNodeType;
  afterType: PlanNodeType;
}

function collectLeafTypes(node: PlanNode): { type: PlanNodeType; table?: string; column?: string }[] {
  if (node.children.length === 0) {
    return [{ type: node.type, table: node.table, column: node.column }];
  }
  return node.children.flatMap((c) => collectLeafTypes(c));
}

function findNodeChanges(before: PlanNode, after: PlanNode): NodeChange[] {
  const beforeLeaves = collectLeafTypes(before);
  const afterLeaves = collectLeafTypes(after);
  const changes: NodeChange[] = [];
  const len = Math.max(beforeLeaves.length, afterLeaves.length);
  for (let i = 0; i < len; i++) {
    const b = beforeLeaves[i];
    const a = afterLeaves[i];
    if (b && a && b.type !== a.type) {
      changes.push({ table: a.table ?? b.table, column: a.column ?? b.column, beforeType: b.type, afterType: a.type });
    }
  }
  return changes;
}

// ── Plan Node Colors ───────────────────────────────────────────

function nodeColor(type: PlanNodeType): string {
  switch (type) {
    case "SeqScan": return "var(--state-error)";
    case "IndexScan":
    case "IndexOnlyScan":
    case "BitmapIndexScan": return "var(--state-success)";
    case "HashJoin":
    case "NestedLoop":
    case "MergeJoin": return "var(--viz-seq-high)";
    case "Sort": return "var(--state-warning)";
    case "Aggregate": return "var(--primary)";
    case "Filter": return "var(--foreground-muted)";
    default: return "var(--foreground)";
  }
}

function nodeIcon(type: PlanNodeType): string {
  switch (type) {
    case "SeqScan": return "Seq";
    case "IndexScan": return "Idx";
    case "IndexOnlyScan": return "IO";
    case "HashJoin": return "HJ";
    case "NestedLoop": return "NL";
    case "MergeJoin": return "MJ";
    case "Sort": return "Srt";
    case "Aggregate": return "Agg";
    case "Filter": return "Flt";
    default: return "?";
  }
}

// ── Mini B-Tree Traversal Visualization ───────────────────────

const SAMPLE_KEYS = [5, 12, 23, 31, 42, 56, 67, 78, 85, 93];

interface TreeLayout {
  x: number;
  y: number;
  node: BTreeNodeType;
  children: TreeLayout[];
}

function layoutTree(node: BTreeNodeType, x: number, y: number, xSpread: number): TreeLayout {
  const childLayouts: TreeLayout[] = node.children.map((child, i) => {
    const childCount = node.children.length;
    const offset = (i - (childCount - 1) / 2) * xSpread;
    return layoutTree(child, x + offset, y + 36, xSpread * 0.45);
  });
  return { x, y, node, children: childLayouts };
}

function MiniTreeSvg({
  layout,
  highlightNodeId,
  highlightKey,
}: {
  layout: TreeLayout;
  highlightNodeId?: string;
  highlightKey?: number;
}) {
  const isHighlighted = layout.node.id === highlightNodeId;
  const nodeWidth = Math.max(layout.node.keys.length * 16, 24);

  return (
    <g>
      {/* Lines to children */}
      {layout.children.map((child, i) => (
        <line
          key={`line-${i}`}
          x1={layout.x}
          y1={layout.y + 10}
          x2={child.x}
          y2={child.y - 6}
          stroke={isHighlighted || child.node.id === highlightNodeId ? "var(--primary)" : "var(--border)"}
          strokeWidth={isHighlighted || child.node.id === highlightNodeId ? 1.5 : 0.75}
        />
      ))}

      {/* Node box */}
      <rect
        x={layout.x - nodeWidth / 2}
        y={layout.y - 8}
        width={nodeWidth}
        height={16}
        rx={3}
        fill={isHighlighted ? "var(--violet-3)" : "var(--gray-4)"}
        stroke={isHighlighted ? "var(--primary)" : "var(--border)"}
        strokeWidth={isHighlighted ? 1.5 : 0.75}
      />

      {/* Key labels */}
      {layout.node.keys.map((key, ki) => {
        const keyX = layout.x + (ki - (layout.node.keys.length - 1) / 2) * 16;
        const isKeyHighlighted = isHighlighted && key === highlightKey;
        return (
          <text
            key={`key-${ki}`}
            x={keyX}
            y={layout.y + 3}
            textAnchor="middle"
            fontSize={8}
            fontFamily="monospace"
            fontWeight={isKeyHighlighted ? "bold" : "normal"}
            fill={isKeyHighlighted ? "var(--primary)" : "var(--foreground-muted)"}
          >
            {key}
          </text>
        );
      })}

      {/* Render children */}
      {layout.children.map((child, i) => (
        <MiniTreeSvg
          key={`child-${i}`}
          layout={child}
          highlightNodeId={highlightNodeId}
          highlightKey={highlightKey}
        />
      ))}
    </g>
  );
}

function InlineBTreeTraversal({ filterValue }: { filterValue?: number }) {
  const [steps, setSteps] = useState<BTreeStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [treeLayout, setTreeLayout] = useState<TreeLayout | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build tree and search on mount
  useEffect(() => {
    const tree = new BTreeViz(3);
    for (const key of SAMPLE_KEYS) {
      tree.insert(key);
    }

    const searchKey = filterValue ?? 42;
    const searchSteps = tree.search(searchKey);
    setSteps(searchSteps);
    setCurrentStep(0);

    // Layout the final tree state for SVG rendering
    const rootLayout = layoutTree(tree.getTree(), 100, 16, 50);
    setTreeLayout(rootLayout);

    // Auto-play
    setIsPlaying(true);
  }, [filterValue]);

  // Animate steps
  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const stepDuration = Math.min(1000, 4000 / Math.max(steps.length, 1));
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, steps.length]);

  if (!treeLayout || steps.length === 0) return null;

  const step = steps[currentStep];

  // Re-layout with the step's tree snapshot for accurate highlight
  const stepLayout = layoutTree(step.tree, 100, 16, 50);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-1.5 rounded-xl border p-2 overflow-hidden"
      style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
    >
      <svg width={200} height={120} viewBox="0 0 200 120" className="block">
        <MiniTreeSvg
          layout={stepLayout}
          highlightNodeId={step.highlightNodeId}
          highlightKey={step.highlightKey}
        />
      </svg>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--gray-5)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ scaleX: (currentStep + 1) / steps.length }}
            style={{ width: "100%", transformOrigin: "left", background: "var(--primary)" }}
          />
        </div>
        <span className="text-[9px] font-mono shrink-0" style={{ color: "var(--foreground-muted)" }}>
          {currentStep + 1}/{steps.length}
        </span>
      </div>
      <p className="text-[9px] mt-1 leading-snug line-clamp-2" style={{ color: "var(--foreground-muted)" }}>
        {step.description.split(" — ")[0]}
      </p>
    </motion.div>
  );
}

// ── Sub-Components ─────────────────────────────────────────────

function PlanTreeNode({ node, depth = 0 }: { node: PlanNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const [showTraversal, setShowTraversal] = useState(false);
  const color = nodeColor(node.type);
  const hasChildren = node.children.length > 0;
  const isIndexScan = node.type === "IndexScan" || node.type === "IndexOnlyScan";

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
        className="flex items-center gap-2 py-1 cursor-pointer"
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3 w-3" style={{ color: "var(--foreground-muted)" }} />
          ) : (
            <ChevronRight className="h-3 w-3" style={{ color: "var(--foreground-muted)" }} />
          )
        ) : (
          <span className="w-3" />
        )}

        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-xl font-mono"
          style={{ background: color, color: "#fff" }}
        >
          {nodeIcon(node.type)}
        </span>

        <span className="text-xs font-medium" style={{ color }}>
          {node.type}
        </span>

        {node.table && (
          <span className="text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>
            on {node.table}
            {node.column ? `.${node.column}` : ""}
          </span>
        )}

        {isIndexScan && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTraversal((v) => !v);
            }}
            className="text-[9px] px-1.5 py-0.5 rounded-xl border transition-colors"
            style={{
              background: showTraversal ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: showTraversal ? "var(--primary)" : "var(--border)",
              color: showTraversal ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            <span className="flex items-center gap-1">
              <GitBranch className="h-2.5 w-2.5" />
              {showTraversal ? "Hide" : "See"} traversal
            </span>
          </motion.button>
        )}

        <span className="ml-auto flex items-center gap-3 text-[10px] font-mono">
          <span style={{ color: "var(--foreground-muted)" }}>
            rows: <span style={{ color: "var(--foreground)" }}>{node.estimatedRows.toLocaleString()}</span>
          </span>
          <span style={{ color: "var(--foreground-muted)" }}>
            cost: <span style={{ color }}>{node.estimatedCost.toLocaleString()}</span>
          </span>
          <span style={{ color: "var(--foreground-muted)" }}>
            io: <span style={{ color: "var(--foreground)" }}>{node.ioPages}</span>
          </span>
        </span>
      </motion.div>

      {/* Inline B-Tree traversal for IndexScan nodes */}
      <AnimatePresence>
        {isIndexScan && showTraversal && (
          <InlineBTreeTraversal filterValue={42} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && node.children.map((child) => (
          <PlanTreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CompactPlanNode({ node, depth = 0, highlightChanges }: { node: PlanNode; depth?: number; highlightChanges?: Set<PlanNodeType> }) {
  const color = nodeColor(node.type);
  const isChanged = highlightChanges?.has(node.type);

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div className="flex items-center gap-1.5 py-0.5">
        <span
          className={cn(
            "text-[9px] font-bold px-1 py-0.5 rounded-xl font-mono",
            isChanged && "ring-2 ring-offset-1",
          )}
          style={{
            background: color,
            color: "#fff",
            ...(isChanged ? { ringColor: color } : {}),
          }}
        >
          {nodeIcon(node.type)}
        </span>
        <span className="text-[10px] font-medium" style={{ color }}>
          {node.type}
        </span>
        {node.table && (
          <span className="text-[9px] font-mono" style={{ color: "var(--foreground-muted)" }}>
            {node.table}
          </span>
        )}
        <span className="ml-auto text-[9px] font-mono" style={{ color }}>
          {node.estimatedCost.toLocaleString()}
        </span>
      </div>
      {node.children.map((child) => (
        <CompactPlanNode key={child.id} node={child} depth={depth + 1} highlightChanges={highlightChanges} />
      ))}
    </div>
  );
}

// ── Prediction Helpers ────────────────────────────────────────

type PredictionChoice = "SeqScan" | "IndexScan" | "HashJoin" | "Sort" | "Aggregate";

const PREDICTION_CHOICES: PredictionChoice[] = ["SeqScan", "IndexScan", "HashJoin", "Sort", "Aggregate"];

function getPlanRootScanType(node: PlanNode): PlanNodeType {
  // Walk down to find the "dominant" access pattern
  // For joins, use the join type itself; for single-table, walk through wrappers
  if (node.type === "HashJoin" || node.type === "NestedLoop" || node.type === "MergeJoin") {
    return "HashJoin"; // Simplify all join types to HashJoin for prediction
  }
  if (node.type === "Aggregate") return "Aggregate";
  if (node.type === "Sort" && node.children.length > 0) {
    const childType = getPlanRootScanType(node.children[0]);
    // If child is a scan, the sort is the dominant operation
    if (childType === "SeqScan" || childType === "IndexScan") return childType;
    return childType;
  }
  if (node.type === "Filter" && node.children.length > 0) {
    return getPlanRootScanType(node.children[0]);
  }
  return node.type;
}

function getPredictionExplanation(
  predicted: PredictionChoice,
  actual: PlanNodeType,
  query: SampleQuery,
  indexes: IndexDef[],
): string {
  const hasFilterIndex = query.filterColumn
    ? indexes.some((idx) => idx.table === query.tables[0] && idx.column === query.filterColumn && idx.enabled)
    : false;

  if (predicted === actual) {
    switch (actual) {
      case "IndexScan":
        return `The optimizer chose IndexScan because an index exists on ${query.tables[0]}.${query.filterColumn}. The low selectivity (${(query.filterSelectivity * 100).toFixed(4)}%) makes the index worthwhile.`;
      case "SeqScan":
        return `The optimizer chose SeqScan because ${!query.filterColumn ? "there is no filter condition" : `there is no index on ${query.tables[0]}.${query.filterColumn}`}. A full table scan is needed.`;
      case "HashJoin":
        return `The optimizer chose a hash-based join because the join between ${query.tables.join(" and ")} requires matching rows from both tables.`;
      case "Aggregate":
        return `The optimizer uses an Aggregate node because the query has GROUP BY, requiring rows to be grouped before computing AVG/SUM/COUNT.`;
      default:
        return `Correct! The optimizer chose ${actual} for this query.`;
    }
  }

  // Wrong prediction
  switch (actual) {
    case "SeqScan":
      return `The optimizer chose SeqScan, not ${predicted}. ${hasFilterIndex ? "Even though an index exists, the high selectivity makes a full scan cheaper." : `There is no index on ${query.tables[0]}.${query.filterColumn ?? "the filter column"}. Try enabling one!`}`;
    case "IndexScan":
      return `The optimizer chose IndexScan, not ${predicted}. An index on ${query.tables[0]}.${query.filterColumn} exists, and the selectivity is low enough (${(query.filterSelectivity * 100).toFixed(4)}%) to justify using it.`;
    case "HashJoin":
      return `The optimizer chose a HashJoin, not ${predicted}. This is a multi-table query that requires joining ${query.tables.join(" and ")} -- the optimizer builds a hash table for efficient matching.`;
    case "Aggregate":
      return `The optimizer chose Aggregate, not ${predicted}. The GROUP BY clause requires aggregation before returning results.`;
    default:
      return `The optimizer chose ${actual}, not ${predicted}. Check the index configuration and filter selectivity.`;
  }
}

// ── Main Component ─────────────────────────────────────────────

export default function QueryPlanSimulation() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = { duration: 0 } as const;
  const [selectedQuery, setSelectedQuery] = useState(SAMPLE_QUERIES[0]);
  const [indexes, setIndexes] = useState<IndexDef[]>(INITIAL_INDEXES);
  const [beforePlan, setBeforePlan] = useState<PlanNode | null>(null);
  const currentPlanRef = useRef<PlanNode | null>(null);

  // Prediction mode state
  const [predictionMode, setPredictionMode] = useState(false);
  const [predictionState, setPredictionState] = useState<"waiting" | "predicted" | "revealed">("waiting");
  const [userPrediction, setUserPrediction] = useState<PredictionChoice | null>(null);
  const [predictionScore, setPredictionScore] = useState({ correct: 0, total: 0 });

  const toggleIndex = useCallback((id: string) => {
    // Snapshot current plan before toggling
    if (currentPlanRef.current) {
      setBeforePlan(currentPlanRef.current);
    }
    setIndexes((prev) =>
      prev.map((idx) => (idx.id === id ? { ...idx, enabled: !idx.enabled } : idx)),
    );
  }, []);

  const dismissComparison = useCallback(() => {
    setBeforePlan(null);
  }, []);

  const handleSelectQuery = useCallback((q: SampleQuery) => {
    setSelectedQuery(q);
    setBeforePlan(null);
    if (predictionMode) {
      setPredictionState("waiting");
      setUserPrediction(null);
    }
  }, [predictionMode]);

  const plan = useMemo(
    () => buildPlanTree(selectedQuery, indexes),
    [selectedQuery, indexes],
  );

  // Keep ref in sync for next toggle snapshot
  currentPlanRef.current = plan;

  const actualPlanType = useMemo(() => getPlanRootScanType(plan), [plan]);

  const handlePrediction = useCallback((choice: PredictionChoice) => {
    setUserPrediction(choice);
    setPredictionState("predicted");
    // Small delay before revealing for suspense
    setTimeout(() => {
      const isCorrect = choice === actualPlanType;
      setPredictionScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
      setPredictionState("revealed");
    }, 600);
  }, [actualPlanType]);

  const p95 = useMemo(() => estimateP95(plan.estimatedCost), [plan]);
  const totalIO = useMemo(() => plan.ioPages, [plan]);

  const costRating = useMemo(() => {
    if (p95 < 1) return { label: "Excellent", color: "var(--state-success)" };
    if (p95 < 10) return { label: "Good", color: "var(--state-success)" };
    if (p95 < 100) return { label: "Moderate", color: "var(--state-warning)" };
    return { label: "Expensive", color: "var(--state-error)" };
  }, [p95]);

  // Before/after comparison data
  const comparison = useMemo(() => {
    if (!beforePlan) return null;
    const beforeCost = beforePlan.estimatedCost;
    const afterCost = plan.estimatedCost;
    if (beforeCost === afterCost) return null;
    const deltaPct = ((afterCost - beforeCost) / beforeCost) * 100;
    const nodeChanges = findNodeChanges(beforePlan, plan);
    const beforeHighlight = new Set(nodeChanges.map((c) => c.beforeType));
    const afterHighlight = new Set(nodeChanges.map((c) => c.afterType));
    return { beforeCost, afterCost, deltaPct, nodeChanges, beforeHighlight, afterHighlight };
  }, [beforePlan, plan]);

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Query Plan Simulator
        </h3>
        <div className="ml-auto flex items-center gap-2">
          {predictionMode && predictionScore.total > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-xl font-mono"
              style={{ background: "var(--gray-4)", color: "var(--foreground-muted)" }}
            >
              {predictionScore.correct}/{predictionScore.total}
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPredictionMode((v) => !v);
              setPredictionState("waiting");
              setUserPrediction(null);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-medium border transition-colors"
            style={{
              background: predictionMode ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: predictionMode ? "var(--primary)" : "var(--border)",
              color: predictionMode ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {predictionMode ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
            <Brain className="h-3 w-3" />
            Predict
          </motion.button>
          <span
            className="text-[10px] px-2 py-0.5 rounded-xl font-medium"
            style={{ background: costRating.color, color: "#fff" }}
          >
            {costRating.label}
          </span>
        </div>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        This query scans 5 million rows. Add ONE index and it reads 5 rows. Same result, 1,000,000x less work. Watch.
      </p>

      {/* Query Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SAMPLE_QUERIES.map((q) => (
          <motion.button
            key={q.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelectQuery(q)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
            style={{
              background: q.id === selectedQuery.id ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: q.id === selectedQuery.id ? "var(--primary)" : "var(--border)",
              color: q.id === selectedQuery.id ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {q.label}
          </motion.button>
        ))}
      </div>

      {/* SQL Display */}
      <div
        className="rounded-xl p-3 mb-4 font-mono text-xs overflow-x-auto"
        style={{ background: "var(--gray-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
      >
        {selectedQuery.sql}
      </div>

      {/* Prediction Panel */}
      <AnimatePresence>
        {predictionMode && predictionState === "waiting" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border p-4 mb-4 overflow-hidden"
            style={{ background: "var(--violet-3)", borderColor: "var(--primary)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4" style={{ color: "var(--primary)" }} />
              <p className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                What plan will the optimizer choose?
              </p>
            </div>
            <p className="text-[10px] mb-3" style={{ color: "var(--foreground-muted)" }}>
              Look at the query, the table sizes, and which indexes are enabled. Predict the root access method:
            </p>
            <div className="flex flex-wrap gap-2">
              {PREDICTION_CHOICES.map((choice) => (
                <motion.button
                  key={choice}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePrediction(choice)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                  style={{
                    background: "var(--gray-3)",
                    borderColor: "var(--border)",
                    color: nodeColor(choice as PlanNodeType),
                  }}
                >
                  <span
                    className="inline-block text-[9px] font-bold px-1 py-0.5 rounded-xl font-mono mr-1.5"
                    style={{ background: nodeColor(choice as PlanNodeType), color: "#fff" }}
                  >
                    {nodeIcon(choice as PlanNodeType)}
                  </span>
                  {choice}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction Thinking */}
      <AnimatePresence>
        {predictionMode && predictionState === "predicted" && userPrediction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border p-4 mb-4 overflow-hidden text-center"
            style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
          >
            <motion.div
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
              transition={prefersReducedMotion ? noMotion : { repeat: Infinity, duration: 1 }}
            >
              <Brain className="h-5 w-5 mx-auto mb-2" style={{ color: "var(--primary)" }} />
            </motion.div>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              You predicted <span className="font-bold" style={{ color: nodeColor(userPrediction as PlanNodeType) }}>{userPrediction}</span>. Revealing plan...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction Feedback */}
      <AnimatePresence>
        {predictionMode && predictionState === "revealed" && userPrediction && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border p-4 mb-4"
            style={{
              background: userPrediction === actualPlanType ? "hsla(142, 71%, 45%, 0.08)" : "hsla(0, 72%, 51%, 0.08)",
              borderColor: userPrediction === actualPlanType ? "var(--state-success)" : "var(--state-error)",
            }}
          >
            <div className="flex items-start gap-2">
              {userPrediction === actualPlanType ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--state-success)" }} />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--state-error)" }} />
              )}
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: userPrediction === actualPlanType ? "var(--state-success)" : "var(--state-error)" }}>
                  {userPrediction === actualPlanType ? "Correct!" : "Not quite..."}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                  {getPredictionExplanation(userPrediction, actualPlanType, selectedQuery, indexes)}
                </p>
                {userPrediction !== actualPlanType && (
                  <p className="text-[10px] mt-1.5 font-mono" style={{ color: "var(--foreground-muted)" }}>
                    Your prediction: <span style={{ color: nodeColor(userPrediction as PlanNodeType) }}>{userPrediction}</span>
                    {" | "}
                    Actual: <span style={{ color: nodeColor(actualPlanType) }}>{actualPlanType}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Index Toggles */}
      <div className="mb-4">
        <p className="text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>
          Indexes
        </p>
        <p className="text-[10px] mb-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          Toggle an index below and watch the plan transform.
        </p>
        <div className="flex flex-wrap gap-2">
          {indexes
            .filter((idx) => selectedQuery.tables.includes(idx.table))
            .map((idx) => (
              <motion.button
                key={idx.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleIndex(idx.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono border transition-colors"
                style={{
                  background: idx.enabled ? "var(--state-success)" : "var(--gray-3)",
                  borderColor: idx.enabled ? "var(--state-success)" : "var(--border)",
                  color: idx.enabled ? "#fff" : "var(--foreground-muted)",
                }}
              >
                {idx.enabled ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {idx.table}.{idx.column}
              </motion.button>
            ))}
        </div>
      </div>

      {/* Before/After Comparison — hidden during prediction */}
      <AnimatePresence>
        {(!predictionMode || predictionState === "revealed") && comparison && beforePlan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border p-3 mb-4 overflow-hidden"
            style={{ background: "var(--gray-2)", borderColor: "var(--primary)" }}
          >
            {/* Comparison header with delta badge */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium" style={{ color: "var(--foreground-muted)" }}>
                INDEX IMPACT COMPARISON
              </p>
              <div className="flex items-center gap-2">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: comparison.deltaPct < 0 ? "var(--state-success)" : "var(--state-error)",
                    color: "#fff",
                  }}
                >
                  {comparison.deltaPct > 0 ? "+" : ""}{comparison.deltaPct.toFixed(1)}% cost
                </motion.span>
                <button
                  onClick={dismissComparison}
                  className="p-0.5 rounded-xl hover:opacity-70 transition-opacity"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Side-by-side plans */}
            <div className="grid grid-cols-2 gap-3">
              {/* Before */}
              <div
                className="rounded-xl border p-2"
                style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
              >
                <p className="text-[9px] font-medium mb-1.5" style={{ color: "var(--state-error)" }}>
                  BEFORE
                </p>
                <CompactPlanNode node={beforePlan} highlightChanges={comparison.beforeHighlight} />
                <div className="mt-2 pt-1.5 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                    Cost:{" "}
                    <span style={{ color: "var(--foreground)" }}>
                      {comparison.beforeCost.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>

              {/* After */}
              <div
                className="rounded-xl border p-2"
                style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}
              >
                <p className="text-[9px] font-medium mb-1.5" style={{ color: "var(--state-success)" }}>
                  AFTER
                </p>
                <CompactPlanNode node={plan} highlightChanges={comparison.afterHighlight} />
                <div className="mt-2 pt-1.5 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                    Cost:{" "}
                    <motion.span
                      key={comparison.afterCost}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ color: comparison.deltaPct < 0 ? "var(--state-success)" : "var(--state-error)" }}
                    >
                      {comparison.afterCost.toLocaleString()}
                    </motion.span>
                  </span>
                </div>
              </div>
            </div>

            {/* Node type changes */}
            {comparison.nodeChanges.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {comparison.nodeChanges.map((change, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-mono"
                    style={{ background: "var(--gray-4)" }}
                  >
                    <span style={{ color: nodeColor(change.beforeType) }}>{change.beforeType}</span>
                    <ArrowRight className="h-3 w-3" style={{ color: "var(--foreground-muted)" }} />
                    <span style={{ color: nodeColor(change.afterType) }}>{change.afterType}</span>
                    {change.table && (
                      <span style={{ color: "var(--foreground-muted)" }}>on {change.table}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Tree — hidden during prediction until revealed */}
      {(!predictionMode || predictionState === "revealed") && (
        <div
          className="rounded-xl border p-3 mb-4 overflow-x-auto"
          style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
            EXECUTION PLAN
          </p>
          <PlanTreeNode node={plan} />
        </div>
      )}

      {/* Metrics — hidden during prediction until revealed */}
      {(!predictionMode || predictionState === "revealed") && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
            <Clock className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: costRating.color }} />
            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>P95 Latency</p>
            <p className="text-sm font-bold font-mono" style={{ color: costRating.color }}>
              {p95 < 1 ? `${(p95 * 1000).toFixed(0)}us` : `${p95.toFixed(1)}ms`}
            </p>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
            <HardDrive className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>I/O Pages</p>
            <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>
              {totalIO.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
            <BarChart3 className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Total Cost</p>
            <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>
              {plan.estimatedCost.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Bridge — disabled until canvas integration is implemented */}
      <div className="relative group">
        <motion.button
          disabled
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "rounded-xl px-4 py-2.5 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "opacity-50 cursor-not-allowed",
          )}
        >
          <Zap className="h-4 w-4" />
          Apply Index Strategy to Canvas
          <span className="text-[10px] ml-1 opacity-80">(Coming Soon)</span>
        </motion.button>
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5",
            "rounded-xl text-xs whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          )}
          style={{ background: "var(--gray-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
        >
          This feature is coming soon — it will create the topology on the System Design canvas.
        </div>
      </div>
    </div>
  );
}
