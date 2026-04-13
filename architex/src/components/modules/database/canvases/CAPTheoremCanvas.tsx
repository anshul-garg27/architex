"use client";

import React, { memo, useMemo } from "react";
import {
  Database,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type CAPDatabase = "postgresql" | "cassandra" | "mongodb" | "dynamodb";
export type CAPCategory = "CP" | "AP" | "CA";

export interface CAPPartitionStep {
  id: number;
  label: string;
  description: string;
  status: "info" | "partition" | "cp-response" | "ap-response" | "resolution";
  nodes: {
    node1: { data: string; status: "healthy" | "stale" | "rejected" | "syncing" };
    node2: { data: string; status: "healthy" | "stale" | "rejected" | "syncing" };
  };
  networkStatus: "connected" | "partitioned" | "healing";
}

export interface CAPDatabaseInfo {
  id: CAPDatabase;
  name: string;
  category: CAPCategory;
  description: string;
  tradeoff: string;
  configurable?: string;
}

// ── Database classifications ────────────────────────────────────

export const CAP_DATABASES: CAPDatabaseInfo[] = [
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "CP",
    description: "Strong consistency with single-leader replication. May reject writes during partition.",
    tradeoff: "Sacrifices Availability for Consistency during network partitions.",
  },
  {
    id: "cassandra",
    name: "Cassandra",
    category: "AP",
    description: "Always available with tunable consistency. Eventual consistency by default.",
    tradeoff: "Sacrifices Consistency for Availability. Uses last-write-wins conflict resolution.",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "CP",
    description: "CP by default (w:majority). Can be configured for AP with lower write concern.",
    tradeoff: "Default: sacrifices Availability for Consistency. Configurable.",
    configurable: "w:majority = CP, w:1 = more available but weaker consistency",
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    category: "AP",
    description: "Eventually consistent by default. Supports strongly consistent reads as option.",
    tradeoff: "Default: AP (eventually consistent). Optional strongly consistent reads (CP-like).",
    configurable: "Eventually consistent reads = AP, Strongly consistent reads = CP-like",
  },
];

// ── Partition simulation steps ──────────────────────────────────

export function getCPPartitionSteps(): CAPPartitionStep[] {
  return [
    {
      id: 0,
      label: "Normal operation",
      description: "Both nodes are healthy and in sync. All reads and writes succeed.",
      status: "info",
      nodes: {
        node1: { data: "balance = $500", status: "healthy" },
        node2: { data: "balance = $500", status: "healthy" },
      },
      networkStatus: "connected",
    },
    {
      id: 1,
      label: "Network partition occurs!",
      description: "A network failure splits the cluster. Node 1 and Node 2 cannot communicate.",
      status: "partition",
      nodes: {
        node1: { data: "balance = $500", status: "healthy" },
        node2: { data: "balance = $500", status: "healthy" },
      },
      networkStatus: "partitioned",
    },
    {
      id: 2,
      label: "Client writes to Node 1: balance = $400",
      description:
        "CP system: Node 1 tries to replicate to Node 2 but can't reach it. The write is REJECTED to maintain consistency.",
      status: "cp-response",
      nodes: {
        node1: { data: "balance = $500 (write rejected)", status: "rejected" },
        node2: { data: "balance = $500", status: "healthy" },
      },
      networkStatus: "partitioned",
    },
    {
      id: 3,
      label: "Partition heals, system resumes",
      description:
        "When connectivity is restored, the system resumes normal operation. No inconsistency because the write was rejected.",
      status: "resolution",
      nodes: {
        node1: { data: "balance = $500", status: "syncing" },
        node2: { data: "balance = $500", status: "syncing" },
      },
      networkStatus: "healing",
    },
  ];
}

export function getAPPartitionSteps(): CAPPartitionStep[] {
  return [
    {
      id: 0,
      label: "Normal operation",
      description: "Both nodes are healthy and in sync. All reads and writes succeed.",
      status: "info",
      nodes: {
        node1: { data: "balance = $500", status: "healthy" },
        node2: { data: "balance = $500", status: "healthy" },
      },
      networkStatus: "connected",
    },
    {
      id: 1,
      label: "Network partition occurs!",
      description: "A network failure splits the cluster. Node 1 and Node 2 cannot communicate.",
      status: "partition",
      nodes: {
        node1: { data: "balance = $500", status: "healthy" },
        node2: { data: "balance = $500", status: "healthy" },
      },
      networkStatus: "partitioned",
    },
    {
      id: 2,
      label: "Client writes to Node 1: balance = $400",
      description:
        "AP system: Node 1 ACCEPTS the write even though it can't replicate. The system stays available but nodes diverge.",
      status: "ap-response",
      nodes: {
        node1: { data: "balance = $400", status: "healthy" },
        node2: { data: "balance = $500 (stale!)", status: "stale" },
      },
      networkStatus: "partitioned",
    },
    {
      id: 3,
      label: "Partition heals, conflict resolution needed",
      description:
        "When connectivity is restored, the nodes have different data! AP systems use conflict resolution (last-write-wins, vector clocks, etc.) to converge.",
      status: "resolution",
      nodes: {
        node1: { data: "balance = $400", status: "syncing" },
        node2: { data: "balance = $400 (resolved)", status: "syncing" },
      },
      networkStatus: "healing",
    },
  ];
}

// ── Node visualization ─────────────────────────────────────────

const NodeBox = memo(function NodeBox({
  label,
  data,
  status,
}: {
  label: string;
  data: string;
  status: "healthy" | "stale" | "rejected" | "syncing";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border p-4 transition-all",
        status === "healthy"
          ? "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm"
          : status === "stale"
            ? "border-amber-500/30 bg-amber-500/5"
            : status === "rejected"
              ? "border-red-500/30 bg-red-500/5"
              : "border-blue-500/30 bg-blue-500/5",
      )}
    >
      <Database
        className={cn(
          "mb-2 h-8 w-8",
          status === "healthy"
            ? "text-green-400"
            : status === "stale"
              ? "text-amber-400"
              : status === "rejected"
                ? "text-red-400"
                : "text-blue-400",
        )}
      />
      <span className="mb-1 text-xs font-bold text-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-[11px]",
          status === "stale"
            ? "text-amber-300"
            : status === "rejected"
              ? "text-red-300"
              : "text-foreground-muted",
        )}
      >
        {data}
      </span>
      <span
        className={cn(
          "mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
          status === "healthy"
            ? "bg-green-500/10 text-green-400"
            : status === "stale"
              ? "bg-amber-500/10 text-amber-400"
              : status === "rejected"
                ? "bg-red-500/10 text-red-400"
                : "bg-blue-500/10 text-blue-400",
        )}
      >
        {status}
      </span>
    </div>
  );
});

// ── SVG Triangle ───────────────────────────────────────────────

const CAPTriangle = memo(function CAPTriangle({
  selectedDb,
}: {
  selectedDb: CAPDatabase | null;
}) {
  const dbInfo = selectedDb
    ? CAP_DATABASES.find((d) => d.id === selectedDb) ?? null
    : null;

  // Triangle vertices (equilateral, centered)
  const cx = 200;
  const cy = 170;
  const r = 130;
  const cPos = { x: cx, y: cy - r }; // top: Consistency
  const aPos = { x: cx - r * 0.866, y: cy + r * 0.5 }; // bottom-left: Availability
  const pPos = { x: cx + r * 0.866, y: cy + r * 0.5 }; // bottom-right: Partition tolerance

  const highlightEdge = dbInfo?.category;

  return (
    <svg viewBox="0 0 400 340" className="mx-auto w-full max-w-[400px]">
      {/* Triangle edges */}
      {/* C-A edge (CA) */}
      <line
        x1={cPos.x}
        y1={cPos.y}
        x2={aPos.x}
        y2={aPos.y}
        stroke={highlightEdge === "CA" ? "#facc15" : "#444"}
        strokeWidth={highlightEdge === "CA" ? 3 : 2}
        strokeDasharray={highlightEdge === "CA" ? undefined : "6,4"}
      />
      {/* C-P edge (CP) */}
      <line
        x1={cPos.x}
        y1={cPos.y}
        x2={pPos.x}
        y2={pPos.y}
        stroke={highlightEdge === "CP" ? "#60a5fa" : "#444"}
        strokeWidth={highlightEdge === "CP" ? 3 : 2}
        strokeDasharray={highlightEdge === "CP" ? undefined : "6,4"}
      />
      {/* A-P edge (AP) */}
      <line
        x1={aPos.x}
        y1={aPos.y}
        x2={pPos.x}
        y2={pPos.y}
        stroke={highlightEdge === "AP" ? "#34d399" : "#444"}
        strokeWidth={highlightEdge === "AP" ? 3 : 2}
        strokeDasharray={highlightEdge === "AP" ? undefined : "6,4"}
      />

      {/* Edge labels */}
      <text
        x={(cPos.x + aPos.x) / 2 - 18}
        y={(cPos.y + aPos.y) / 2}
        fill={highlightEdge === "CA" ? "#facc15" : "#666"}
        fontSize="11"
        fontWeight="bold"
      >
        CA
      </text>
      <text
        x={(cPos.x + pPos.x) / 2 + 8}
        y={(cPos.y + pPos.y) / 2}
        fill={highlightEdge === "CP" ? "#60a5fa" : "#666"}
        fontSize="11"
        fontWeight="bold"
      >
        CP
      </text>
      <text
        x={(aPos.x + pPos.x) / 2 - 6}
        y={(aPos.y + pPos.y) / 2 + 18}
        fill={highlightEdge === "AP" ? "#34d399" : "#666"}
        fontSize="11"
        fontWeight="bold"
      >
        AP
      </text>

      {/* Vertex circles */}
      <circle cx={cPos.x} cy={cPos.y} r={28} fill="#1e293b" stroke="#60a5fa" strokeWidth={2} />
      <text x={cPos.x} y={cPos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#60a5fa" fontSize="18" fontWeight="bold">
        C
      </text>
      <text x={cPos.x} y={cPos.y - 38} textAnchor="middle" fill="#94a3b8" fontSize="10">
        Consistency
      </text>

      <circle cx={aPos.x} cy={aPos.y} r={28} fill="#1e293b" stroke="#34d399" strokeWidth={2} />
      <text x={aPos.x} y={aPos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#34d399" fontSize="18" fontWeight="bold">
        A
      </text>
      <text x={aPos.x} y={aPos.y + 42} textAnchor="middle" fill="#94a3b8" fontSize="10">
        Availability
      </text>

      <circle cx={pPos.x} cy={pPos.y} r={28} fill="#1e293b" stroke="#f59e0b" strokeWidth={2} />
      <text x={pPos.x} y={pPos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#f59e0b" fontSize="18" fontWeight="bold">
        P
      </text>
      <text x={pPos.x} y={pPos.y + 42} textAnchor="middle" fill="#94a3b8" fontSize="10">
        Partition Tolerance
      </text>

      {/* "Pick 2" label */}
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#64748b" fontSize="11" fontStyle="italic">
        Pick 2 of 3
      </text>

      {/* Database position indicator */}
      {dbInfo && (
        <>
          {dbInfo.category === "CP" && (
            <circle
              cx={(cPos.x + pPos.x) / 2}
              cy={(cPos.y + pPos.y) / 2}
              r={8}
              fill="#60a5fa"
              className="animate-pulse"
            />
          )}
          {dbInfo.category === "AP" && (
            <circle
              cx={(aPos.x + pPos.x) / 2}
              cy={(aPos.y + pPos.y) / 2}
              r={8}
              fill="#34d399"
              className="animate-pulse"
            />
          )}
          {dbInfo.category === "CA" && (
            <circle
              cx={(cPos.x + aPos.x) / 2}
              cy={(cPos.y + aPos.y) / 2}
              r={8}
              fill="#facc15"
              className="animate-pulse"
            />
          )}
        </>
      )}
    </svg>
  );
});

// ── Partition Simulation Step Card ──────────────────────────────

const PartitionStepCard = memo(function PartitionStepCard({
  step,
  isVisible,
}: {
  step: CAPPartitionStep;
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        step.status === "partition"
          ? "animate-pulse border-red-500/30 bg-red-500/10"
          : step.status === "cp-response"
            ? "border-blue-500/30 bg-blue-500/5"
            : step.status === "ap-response"
              ? "border-green-500/30 bg-green-500/5"
              : step.status === "resolution"
                ? "border-violet-500/30 bg-violet-500/5"
                : "border-border/30 bg-elevated/50 backdrop-blur-sm",
      )}
      style={
        step.status === "partition"
          ? { animationDuration: "1.5s", animationIterationCount: "3" }
          : undefined
      }
    >
      <div className="mb-2 flex items-center gap-2">
        {step.networkStatus === "connected" ? (
          <Wifi className="h-4 w-4 text-green-400" />
        ) : step.networkStatus === "partitioned" ? (
          <WifiOff className="h-4 w-4 text-red-400" />
        ) : (
          <Wifi className="h-4 w-4 text-blue-400" />
        )}
        <span className="text-xs font-bold text-foreground">{step.label}</span>
      </div>
      <p className="mb-3 text-[11px] text-foreground-muted">{step.description}</p>

      {/* Node visualization */}
      <div className="flex items-center justify-center gap-4">
        <NodeBox label="Node 1" data={step.nodes.node1.data} status={step.nodes.node1.status} />
        <div className="flex flex-col items-center gap-1">
          {step.networkStatus === "connected" ? (
            <div className="h-0.5 w-12 bg-green-600" />
          ) : step.networkStatus === "partitioned" ? (
            <>
              <div className="h-0.5 w-12 bg-red-600" style={{ backgroundImage: "repeating-linear-gradient(90deg, #dc2626, #dc2626 4px, transparent 4px, transparent 8px)" }} />
              <XCircle className="h-3 w-3 text-red-400" />
            </>
          ) : (
            <div className="h-0.5 w-12 bg-blue-600" />
          )}
        </div>
        <NodeBox label="Node 2" data={step.nodes.node2.data} status={step.nodes.node2.status} />
      </div>
    </div>
  );
});

// ── Main Canvas ────────────────────────────────────────────────

const CAPTheoremCanvas = memo(function CAPTheoremCanvas({
  selectedDb,
  onSelectDb,
  simulationType,
  simulationStepIndex,
}: {
  selectedDb: CAPDatabase | null;
  onSelectDb: (db: CAPDatabase) => void;
  simulationType: "cp" | "ap";
  simulationStepIndex: number;
}) {
  const dbInfo = selectedDb
    ? CAP_DATABASES.find((d) => d.id === selectedDb) ?? null
    : null;

  const simSteps = useMemo(
    () => (simulationType === "cp" ? getCPPartitionSteps() : getAPPartitionSteps()),
    [simulationType],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-6">
      {/* CAP Triangle */}
      <div className="mb-4">
        <CAPTriangle selectedDb={selectedDb} />
      </div>

      {/* Database selector cards */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {CAP_DATABASES.map((db) => (
          <button
            key={db.id}
            onClick={() => onSelectDb(db.id)}
            className={cn(
              "rounded-xl border p-2.5 text-left transition-all",
              selectedDb === db.id
                ? db.category === "CP"
                  ? "border-blue-500/30 bg-blue-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                  : "border-green-500/30 bg-green-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.05)]"
                : "border-border/30 bg-elevated/50 backdrop-blur-sm hover:bg-elevated/80",
            )}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Database
                className={cn(
                  "h-3.5 w-3.5",
                  selectedDb === db.id
                    ? db.category === "CP"
                      ? "text-blue-400"
                      : "text-green-400"
                    : "text-foreground-subtle",
                )}
              />
              <span className="text-xs font-bold text-foreground">{db.name}</span>
            </div>
            <span
              className={cn(
                "inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                db.category === "CP"
                  ? "border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                  : "border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.1)]",
              )}
            >
              {db.category}
            </span>
          </button>
        ))}
      </div>

      {/* Selected DB info */}
      {dbInfo && (
        <div
          className={cn(
            "mb-4 rounded-xl border p-3",
            dbInfo.category === "CP"
              ? "border-blue-500/30 bg-blue-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.05)]"
              : "border-green-500/30 bg-green-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.05)]",
          )}
        >
          <h4 className="mb-1 text-sm font-bold text-foreground">{dbInfo.name}</h4>
          <p className="mb-1 text-[11px] text-foreground-muted">{dbInfo.description}</p>
          <p className="text-[11px] font-medium text-foreground-muted">
            <ArrowRight className="mr-1 inline h-3 w-3" />
            {dbInfo.tradeoff}
          </p>
          {dbInfo.configurable && (
            <p className="mt-1 text-[10px] text-foreground-subtle italic">
              Configurable: {dbInfo.configurable}
            </p>
          )}
        </div>
      )}

      {/* Partition simulation */}
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-bold text-foreground">
          Partition Simulation:{" "}
          <span
            className={cn(
              "font-mono",
              simulationType === "cp" ? "text-blue-400" : "text-green-400",
            )}
          >
            {simulationType === "cp" ? "CP System" : "AP System"}
          </span>
        </h3>
      </div>
      <div className="flex-1 space-y-3">
        {simSteps.map((step, i) => (
          <PartitionStepCard key={step.id} step={step} isVisible={i <= simulationStepIndex} />
        ))}
        {simulationStepIndex < simSteps.length - 1 && (
          <div className="py-2 text-center text-xs text-foreground-subtle">
            Click &quot;Step&quot; or &quot;Play&quot; to continue the partition simulation...
          </div>
        )}
      </div>
    </div>
  );
});

export default CAPTheoremCanvas;
