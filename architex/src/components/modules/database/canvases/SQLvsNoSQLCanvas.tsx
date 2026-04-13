"use client";

import React, { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type SQLvsNoSQLUseCase =
  | "social-media"
  | "banking"
  | "product-catalog"
  | "messaging"
  | "analytics"
  | "iot-logs"
  | null;

export interface SQLvsNoSQLCanvasProps {
  selectedUseCase: SQLvsNoSQLUseCase;
  onUseCaseChange: (uc: SQLvsNoSQLUseCase) => void;
}

// ── Data ─────────────────────────────────────────────────────────

interface ComparisonDimension {
  dimension: string;
  sql: string;
  nosql: string;
  sqlScore: number; // 1-5, higher is better for that criterion
  nosqlScore: number;
}

const COMPARISON_TABLE: ComparisonDimension[] = [
  {
    dimension: "Consistency",
    sql: "Strong ACID guarantees. Every read sees the latest committed write.",
    nosql: "Eventually consistent by default. Trades consistency for availability.",
    sqlScore: 5,
    nosqlScore: 2,
  },
  {
    dimension: "Scalability",
    sql: "Vertical scaling (bigger server). Horizontal sharding is complex.",
    nosql: "Built for horizontal scaling. Add nodes to distribute data.",
    sqlScore: 2,
    nosqlScore: 5,
  },
  {
    dimension: "Schema",
    sql: "Rigid schema defined upfront. ALTER TABLE for changes.",
    nosql: "Flexible/schemaless. Each document can have different fields.",
    sqlScore: 3,
    nosqlScore: 5,
  },
  {
    dimension: "Query Power",
    sql: "Full SQL: joins, subqueries, window functions, CTEs.",
    nosql: "Limited query language. Complex queries need application-side joins.",
    sqlScore: 5,
    nosqlScore: 2,
  },
  {
    dimension: "Joins",
    sql: "Native multi-table joins in a single query.",
    nosql: "No joins. Denormalize data or do application-side joins.",
    sqlScore: 5,
    nosqlScore: 1,
  },
  {
    dimension: "Use Case",
    sql: "Structured data with relationships: finance, ERP, CRM.",
    nosql: "Semi-structured data at scale: feeds, catalogs, real-time apps.",
    sqlScore: 4,
    nosqlScore: 4,
  },
];

interface UseCaseInfo {
  id: SQLvsNoSQLUseCase;
  name: string;
  icon: string;
  recommendation: "sql" | "nosql";
  database: string;
  company: string;
  reasoning: string;
}

const USE_CASES: UseCaseInfo[] = [
  {
    id: "banking",
    name: "Banking / Payments",
    icon: "bank",
    recommendation: "sql",
    database: "PostgreSQL",
    company: "Stripe",
    reasoning:
      "Financial transactions need ACID guarantees. A failed transfer must roll back atomically -- you cannot have money disappear. SQL databases provide the strong consistency and transaction isolation required.",
  },
  {
    id: "social-media",
    name: "Social Media Feed",
    icon: "feed",
    recommendation: "sql",
    database: "PostgreSQL",
    company: "Instagram",
    reasoning:
      "Instagram uses PostgreSQL for user data, relationships, and feed generation. The relational model handles follower graphs and complex feed queries well. At scale, they shard PostgreSQL horizontally.",
  },
  {
    id: "messaging",
    name: "Messaging at Scale",
    icon: "chat",
    recommendation: "nosql",
    database: "Cassandra",
    company: "WhatsApp / Discord",
    reasoning:
      "Billions of messages per day need massive write throughput and horizontal scaling. Cassandra's partition-key model makes writes fast (append-only) and reads efficient (partition scan). Eventual consistency is acceptable for chat.",
  },
  {
    id: "product-catalog",
    name: "Product Catalog",
    icon: "cart",
    recommendation: "nosql",
    database: "MongoDB",
    company: "eBay / Shopify",
    reasoning:
      "Products have wildly different attributes: a laptop has RAM/CPU specs, a shirt has size/color. Document databases let each product have its own schema. No need for 50 nullable columns or EAV patterns.",
  },
  {
    id: "analytics",
    name: "Analytics / BI",
    icon: "chart",
    recommendation: "sql",
    database: "ClickHouse / BigQuery",
    company: "Cloudflare",
    reasoning:
      "Analytical queries (aggregations, joins, window functions) need the full power of SQL. Column-oriented SQL databases like ClickHouse process billions of rows per second. SQL is the lingua franca of data analysis.",
  },
  {
    id: "iot-logs",
    name: "IoT / Time-Series Logs",
    icon: "sensor",
    recommendation: "nosql",
    database: "InfluxDB / TimescaleDB",
    company: "Tesla / DataDog",
    reasoning:
      "Millions of sensors writing data points every second. Append-heavy workloads with time-based queries. Time-series databases (NoSQL or specialized SQL) handle high-volume ingestion with time-partitioned storage.",
  },
];

// ── Decision Flowchart Node ─────────────────────────────────────

interface FlowNode {
  id: string;
  question: string;
  yesTo: string;
  noTo: string;
}

const FLOW_NODES: FlowNode[] = [
  { id: "acid", question: "Need ACID transactions?", yesTo: "joins", noTo: "scale" },
  { id: "joins", question: "Complex joins needed?", yesTo: "sql-result", noTo: "schema" },
  { id: "scale", question: "Need massive horizontal scale?", yesTo: "nosql-result", noTo: "schema" },
  { id: "schema", question: "Schema changes frequently?", yesTo: "nosql-result", noTo: "sql-result" },
];

// ── Canvas ──────────────────────────────────────────────────────

const SQLvsNoSQLCanvas = memo(function SQLvsNoSQLCanvas({
  selectedUseCase,
  onUseCaseChange,
}: SQLvsNoSQLCanvasProps) {
  const [activeTab, setActiveTab] = useState<"compare" | "flowchart" | "examples">("compare");
  const [flowPath, setFlowPath] = useState<string[]>([]);
  const [flowResult, setFlowResult] = useState<"sql" | "nosql" | null>(null);

  const handleFlowAnswer = useCallback(
    (nodeId: string, answer: "yes" | "no") => {
      const node = FLOW_NODES.find((n) => n.id === nodeId);
      if (!node) return;

      const nextId = answer === "yes" ? node.yesTo : node.noTo;
      setFlowPath((prev) => [...prev, `${nodeId}-${answer}`]);

      if (nextId === "sql-result") {
        setFlowResult("sql");
      } else if (nextId === "nosql-result") {
        setFlowResult("nosql");
      }
    },
    [],
  );

  const handleFlowReset = useCallback(() => {
    setFlowPath([]);
    setFlowResult(null);
  }, []);

  const currentFlowNode = (() => {
    if (flowResult) return null;
    if (flowPath.length === 0) return FLOW_NODES[0];
    const lastAnswer = flowPath[flowPath.length - 1];
    const [lastNodeId, ans] = lastAnswer.split("-");
    const lastNode = FLOW_NODES.find((n) => n.id === lastNodeId);
    if (!lastNode) return null;
    const nextId = ans === "yes" ? lastNode.yesTo : lastNode.noTo;
    if (nextId === "sql-result" || nextId === "nosql-result") return null;
    return FLOW_NODES.find((n) => n.id === nextId) ?? null;
  })();

  const selectedUseCaseInfo = USE_CASES.find((u) => u.id === selectedUseCase);

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-4">
      {/* Tab toggle */}
      <div className="mx-auto mb-4 flex items-center gap-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-1">
        {(["compare", "flowchart", "examples"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-medium transition-colors",
              activeTab === tab
                ? "bg-primary text-white"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {tab === "compare"
              ? "Comparison Table"
              : tab === "flowchart"
                ? "Decision Flowchart"
                : "Real-World Examples"}
          </button>
        ))}
      </div>

      {/* COMPARISON TABLE */}
      {activeTab === "compare" && (
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-4 text-center">
            <h3 className="text-sm font-bold text-foreground">SQL vs NoSQL: 6 Dimensions</h3>
            <p className="mt-1 text-[11px] text-foreground-subtle">
              Click any row to expand the details
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/30">
            {/* Header */}
            <div className="grid grid-cols-[160px_1fr_1fr] border-b border-border/30 bg-elevated/50 backdrop-blur-sm">
              <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Dimension
              </div>
              <div className="border-l border-border/30 px-4 py-3 text-center">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-400">
                  SQL (Relational)
                </span>
              </div>
              <div className="border-l border-border/30 px-4 py-3 text-center">
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-[10px] font-bold text-green-400">
                  NoSQL (Document/KV)
                </span>
              </div>
            </div>

            {/* Rows */}
            {COMPARISON_TABLE.map((row) => (
              <ComparisonRow key={row.dimension} row={row} />
            ))}
          </div>
        </div>
      )}

      {/* DECISION FLOWCHART */}
      {activeTab === "flowchart" && (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
          <h3 className="text-sm font-bold text-foreground">Which Database Type Should You Use?</h3>
          <p className="text-[11px] text-foreground-subtle">
            Answer the questions to find the right fit.
          </p>

          {/* Progress path */}
          {flowPath.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {flowPath.map((entry, i) => {
                const [nodeId, ans] = entry.split("-");
                const node = FLOW_NODES.find((n) => n.id === nodeId);
                return (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-medium",
                      ans === "yes"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400",
                    )}
                  >
                    {node?.question.replace("?", "")} {"->"} {ans === "yes" ? "Yes" : "No"}
                  </span>
                );
              })}
            </div>
          )}

          {/* Current question */}
          {currentFlowNode && (
            <div className="w-full max-w-md rounded-xl border-2 border-primary/40 bg-elevated/50 backdrop-blur-sm p-6 text-center">
              <p className="mb-4 text-sm font-semibold text-foreground">
                {currentFlowNode.question}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleFlowAnswer(currentFlowNode.id, "yes")}
                  className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleFlowAnswer(currentFlowNode.id, "no")}
                  className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {flowResult && (
            <div
              className={cn(
                "w-full max-w-md rounded-xl border-2 p-6 text-center",
                flowResult === "sql"
                  ? "border-blue-500/40 bg-blue-500/5"
                  : "border-green-500/40 bg-green-500/5",
              )}
            >
              <div className="mb-2 text-2xl font-black">
                {flowResult === "sql" ? "SQL Database" : "NoSQL Database"}
              </div>
              <p className="mb-1 text-sm font-medium text-foreground-muted">
                Recommended:{" "}
                <span
                  className={cn(
                    "font-bold",
                    flowResult === "sql" ? "text-blue-400" : "text-green-400",
                  )}
                >
                  {flowResult === "sql" ? "PostgreSQL, MySQL" : "MongoDB, Cassandra, DynamoDB"}
                </span>
              </p>
              <p className="mt-3 text-[11px] text-foreground-subtle">
                {flowResult === "sql"
                  ? "Your use case benefits from strong consistency, complex queries, and relational integrity. SQL databases excel when data relationships matter."
                  : "Your use case benefits from flexible schemas, horizontal scalability, and high write throughput. NoSQL databases excel when data volume and velocity matter."}
              </p>
              <button
                onClick={handleFlowReset}
                className="mt-4 rounded-xl border border-border/30 bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Start prompt */}
          {flowPath.length === 0 && !flowResult && (
            <div className="mt-4 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4 text-center text-[11px] text-foreground-subtle">
              Answer the first question above to start the decision process.
            </div>
          )}
        </div>
      )}

      {/* REAL-WORLD EXAMPLES */}
      {activeTab === "examples" && (
        <div className="mx-auto w-full max-w-4xl">
          <h3 className="mb-1 text-center text-sm font-bold text-foreground">
            Real-World Database Choices
          </h3>
          <p className="mb-4 text-center text-[11px] text-foreground-subtle">
            Click a use case to see why that database was chosen.
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {USE_CASES.map((uc) => (
              <button
                key={uc.id}
                onClick={() => onUseCaseChange(uc.id === selectedUseCase ? null : uc.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  selectedUseCase === uc.id
                    ? uc.recommendation === "sql"
                      ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                      : "border-green-500 bg-green-500/10 ring-1 ring-green-500/30"
                    : "border-border/30 bg-elevated/50 backdrop-blur-sm hover:border-foreground-subtle",
                )}
              >
                <div className="mb-1 text-lg">
                  {uc.icon === "bank" && "\uD83C\uDFE6"}
                  {uc.icon === "feed" && "\uD83D\uDCF1"}
                  {uc.icon === "chat" && "\uD83D\uDCAC"}
                  {uc.icon === "cart" && "\uD83D\uDED2"}
                  {uc.icon === "chart" && "\uD83D\uDCC8"}
                  {uc.icon === "sensor" && "\uD83D\uDCE1"}
                </div>
                <span className="block text-xs font-semibold text-foreground">{uc.name}</span>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                    uc.recommendation === "sql"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400",
                  )}
                >
                  {uc.recommendation === "sql" ? "SQL" : "NoSQL"} -- {uc.database}
                </span>
                <span className="mt-1 block text-[10px] text-foreground-subtle">{uc.company}</span>
              </button>
            ))}
          </div>

          {/* Expanded detail */}
          {selectedUseCaseInfo && (
            <div
              className={cn(
                "mt-4 rounded-xl border-2 p-5",
                selectedUseCaseInfo.recommendation === "sql"
                  ? "border-blue-500/30 bg-blue-500/5"
                  : "border-green-500/30 bg-green-500/5",
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-foreground">
                  {selectedUseCaseInfo.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase",
                    selectedUseCaseInfo.recommendation === "sql"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400",
                  )}
                >
                  {selectedUseCaseInfo.recommendation === "sql" ? "SQL" : "NoSQL"}:{" "}
                  {selectedUseCaseInfo.database}
                </span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {selectedUseCaseInfo.reasoning}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-foreground-subtle">Used by:</span>
                <span className="rounded bg-background px-2 py-0.5 text-[10px] font-medium text-foreground">
                  {selectedUseCaseInfo.company}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── Comparison Row ───────────────────────────────────────────────

const ComparisonRow = memo(function ComparisonRow({
  row,
}: {
  row: ComparisonDimension;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="grid w-full grid-cols-[160px_1fr_1fr] text-left hover:bg-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="text-[10px] text-foreground-subtle">{expanded ? "\u25BC" : "\u25B6"}</span>
          <span className="text-xs font-semibold text-foreground">{row.dimension}</span>
        </div>
        <div className="flex items-center border-l border-border/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <ScoreBar score={row.sqlScore} color="blue" />
            <span className="text-[10px] text-foreground-subtle">{row.sqlScore}/5</span>
          </div>
        </div>
        <div className="flex items-center border-l border-border/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <ScoreBar score={row.nosqlScore} color="green" />
            <span className="text-[10px] text-foreground-subtle">{row.nosqlScore}/5</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="grid grid-cols-[160px_1fr_1fr] border-t border-border/50 bg-background/50">
          <div className="px-4 py-2" />
          <div className="border-l border-border/50 px-4 py-2">
            <p className="text-[11px] text-blue-300/80">{row.sql}</p>
          </div>
          <div className="border-l border-border/50 px-4 py-2">
            <p className="text-[11px] text-green-300/80">{row.nosql}</p>
          </div>
        </div>
      )}
    </div>
  );
});

// ── Score Bar ────────────────────────────────────────────────────

const ScoreBar = memo(function ScoreBar({
  score,
  color,
}: {
  score: number;
  color: "blue" | "green";
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-4 rounded-xl",
            i < score
              ? color === "blue"
                ? "bg-blue-500"
                : "bg-green-500"
              : "bg-border",
          )}
        />
      ))}
    </div>
  );
});

export default SQLvsNoSQLCanvas;
export type { SQLvsNoSQLUseCase as SqlNoSqlUseCase };
