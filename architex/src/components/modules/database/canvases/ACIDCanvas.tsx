"use client";

import React, { memo } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type ACIDProperty = "atomicity" | "consistency" | "isolation" | "durability";

export interface ACIDStep {
  id: number;
  property: ACIDProperty;
  label: string;
  description: string;
  status: "pending" | "active" | "success" | "failure" | "crash";
  /** Optional key-value state shown as a "database" snapshot */
  dbState?: Record<string, number | string>;
}

// ── Step definitions for each property demo ─────────────────────

export function getAtomicitySteps(): ACIDStep[] {
  return [
    {
      id: 0,
      property: "atomicity",
      label: "BEGIN TRANSACTION",
      description: "Starting a bank transfer: move $100 from Account A to Account B.",
      status: "active",
      dbState: { "Account A": 500, "Account B": 200 },
    },
    {
      id: 1,
      property: "atomicity",
      label: "UPDATE accounts SET balance = balance - 100 WHERE id = 'A'",
      description: "Debit $100 from Account A. Balance goes from $500 to $400.",
      status: "success",
      dbState: { "Account A": 400, "Account B": 200 },
    },
    {
      id: 2,
      property: "atomicity",
      label: "--- CRASH! Server goes down ---",
      description:
        "The server crashes BEFORE crediting Account B. Without atomicity, Account A lost $100 and B never received it!",
      status: "crash",
      dbState: { "Account A": 400, "Account B": 200 },
    },
    {
      id: 3,
      property: "atomicity",
      label: "ROLLBACK (automatic recovery)",
      description:
        "Atomicity guarantee: the database rolls back the partial transaction. Account A is restored to $500. No money is lost.",
      status: "success",
      dbState: { "Account A": 500, "Account B": 200 },
    },
    {
      id: 4,
      property: "atomicity",
      label: "Retry: full transfer (debit A, credit B, COMMIT)",
      description:
        "Now the full transfer completes atomically. Both operations succeed or neither does.",
      status: "success",
      dbState: { "Account A": 400, "Account B": 300 },
    },
  ];
}

export function getConsistencySteps(): ACIDStep[] {
  return [
    {
      id: 0,
      property: "consistency",
      label: "CREATE TABLE accounts (balance INT CHECK (balance >= 0))",
      description: "Define a CHECK constraint: no account can have a negative balance.",
      status: "active",
      dbState: { "Account A": 500 },
    },
    {
      id: 1,
      property: "consistency",
      label: "UPDATE accounts SET balance = balance - 200 WHERE id = 'A'",
      description: "Withdraw $200 from Account A. Balance: $500 -> $300. Constraint satisfied.",
      status: "success",
      dbState: { "Account A": 300 },
    },
    {
      id: 2,
      property: "consistency",
      label: "UPDATE accounts SET balance = balance - 400 WHERE id = 'A'",
      description:
        "Attempt to withdraw $400. Balance would become -$100, violating CHECK (balance >= 0).",
      status: "failure",
      dbState: { "Account A": 300 },
    },
    {
      id: 3,
      property: "consistency",
      label: "ERROR: CHECK constraint violated. Transaction aborted.",
      description:
        "The database rejects the operation. Data remains in a valid, consistent state. The constraint is never broken.",
      status: "failure",
      dbState: { "Account A": 300 },
    },
  ];
}

export function getIsolationSteps(): ACIDStep[] {
  return [
    {
      id: 0,
      property: "isolation",
      label: "Concurrent transactions T1 and T2 run simultaneously",
      description:
        "Isolation ensures concurrent transactions don't interfere. Each sees a consistent view of data.",
      status: "active",
    },
    {
      id: 1,
      property: "isolation",
      label: "See isolation levels in detail",
      description:
        "Switch to the Transaction Isolation mode for an in-depth, step-by-step walkthrough of all four isolation levels and their anomalies.",
      status: "success",
    },
  ];
}

export function getDurabilitySteps(): ACIDStep[] {
  return [
    {
      id: 0,
      property: "durability",
      label: "INSERT INTO orders (id, total) VALUES (1, 99.99)",
      description: "A new order is written. First, it goes to the Write-Ahead Log (WAL).",
      status: "active",
      dbState: { "WAL": "WRITE order#1", "Disk": "(not yet)" },
    },
    {
      id: 1,
      property: "durability",
      label: "WAL: fsync() -- flushed to disk",
      description: "The WAL entry is fsynced to durable storage. Even if the server crashes now, the write is safe.",
      status: "success",
      dbState: { "WAL": "SYNCED order#1", "Disk": "(not yet)" },
    },
    {
      id: 2,
      property: "durability",
      label: "COMMIT -- transaction confirmed to client",
      description: "The client receives a commit confirmation. The data is guaranteed to be durable.",
      status: "success",
      dbState: { "WAL": "SYNCED order#1", "Disk": "(not yet)" },
    },
    {
      id: 3,
      property: "durability",
      label: "--- CRASH! Power failure ---",
      description: "The server crashes before the data page is written to the main data file!",
      status: "crash",
      dbState: { "WAL": "SYNCED order#1", "Disk": "LOST?" },
    },
    {
      id: 4,
      property: "durability",
      label: "Recovery: replay WAL entries",
      description:
        "On restart, the database replays the WAL. The committed order is restored. No data lost.",
      status: "success",
      dbState: { "WAL": "REPLAYED", "Disk": "order#1 = 99.99" },
    },
  ];
}

export function getStepsForProperty(prop: ACIDProperty): ACIDStep[] {
  switch (prop) {
    case "atomicity":
      return getAtomicitySteps();
    case "consistency":
      return getConsistencySteps();
    case "isolation":
      return getIsolationSteps();
    case "durability":
      return getDurabilitySteps();
  }
}

// ── Icon for each property ─────────────────────────────────────

const PROPERTY_ICON: Record<ACIDProperty, React.FC<{ className?: string }>> = {
  atomicity: Zap,
  consistency: Shield,
  isolation: Lock,
  durability: HardDrive,
};

const PROPERTY_COLOR: Record<ACIDProperty, string> = {
  atomicity: "text-amber-400",
  consistency: "text-blue-400",
  isolation: "text-violet-400",
  durability: "text-emerald-400",
};

const PROPERTY_BG: Record<ACIDProperty, string> = {
  atomicity: "bg-amber-500/5 border-amber-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)]",
  consistency: "bg-blue-500/5 border-blue-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.05)]",
  isolation: "bg-primary/5 border-primary/30 backdrop-blur-sm shadow-[0_0_15px_rgba(110,86,207,0.05)]",
  durability: "bg-emerald-500/5 border-emerald-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]",
};

// ── Step Card ──────────────────────────────────────────────────

const StepCard = memo(function StepCard({
  step,
  isVisible,
}: {
  step: ACIDStep;
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  const statusIcon =
    step.status === "success" ? (
      <CheckCircle2 className="h-4 w-4 text-green-400" />
    ) : step.status === "failure" ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : step.status === "crash" ? (
      <AlertTriangle className="h-4 w-4 text-red-400" />
    ) : (
      <ArrowRight className="h-4 w-4 text-foreground-subtle" />
    );

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all",
        step.status === "crash"
          ? "animate-pulse border-red-500/30 bg-red-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          : step.status === "failure"
            ? "border-red-500/30 bg-red-500/5 backdrop-blur-sm"
            : step.status === "success"
              ? "border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm"
              : "border-border/30 bg-elevated/50 backdrop-blur-sm",
      )}
      style={
        step.status === "crash"
          ? { animationDuration: "1.5s", animationIterationCount: "3" }
          : undefined
      }
    >
      <div className="mb-1 flex items-center gap-2">
        {statusIcon}
        <span className="font-mono text-xs text-foreground">{step.label}</span>
      </div>
      <p className="text-[11px] text-foreground-muted">{step.description}</p>
      {step.dbState && (
        <div className="mt-2 rounded-xl border border-border/30 bg-background/50 p-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
            Database State
          </span>
          <div className="flex flex-wrap gap-3">
            {Object.entries(step.dbState).map(([key, val]) => (
              <div key={key} className="text-[11px]">
                <span className="text-foreground-muted">{key}:</span>{" "}
                <span className="font-mono font-semibold text-foreground">
                  {typeof val === "number" ? `$${val}` : val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Main Canvas ────────────────────────────────────────────────

const ACIDCanvas = memo(function ACIDCanvas({
  activeProperty,
  stepIndex,
  onSelectProperty,
}: {
  activeProperty: ACIDProperty;
  stepIndex: number;
  onSelectProperty: (p: ACIDProperty) => void;
}) {
  const steps = getStepsForProperty(activeProperty);
  const Icon = PROPERTY_ICON[activeProperty];

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gradient-to-b from-elevated/80 to-background p-6">
      {/* Property cards at top */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {(["atomicity", "consistency", "isolation", "durability"] as const).map(
          (prop) => {
            const PropIcon = PROPERTY_ICON[prop];
            const isActive = prop === activeProperty;
            return (
              <button
                key={prop}
                onClick={() => onSelectProperty(prop)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  isActive
                    ? PROPERTY_BG[prop]
                    : "border-border/30 bg-elevated/50 backdrop-blur-sm hover:bg-elevated/80",
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <PropIcon
                    className={cn(
                      "h-5 w-5",
                      isActive ? PROPERTY_COLOR[prop] : "text-foreground-subtle",
                    )}
                  />
                  <span
                    className={cn(
                      "text-2xl font-black",
                      isActive ? PROPERTY_COLOR[prop] : "text-foreground-subtle",
                    )}
                  >
                    {prop[0].toUpperCase()}
                  </span>
                </div>
                <span
                  className={cn(
                    "block text-xs font-medium capitalize",
                    isActive ? "text-foreground" : "text-foreground-muted",
                  )}
                >
                  {prop}
                </span>
              </button>
            );
          },
        )}
      </div>

      {/* Active property header */}
      <div className={cn("mb-4 flex items-center gap-3 rounded-xl border p-4", PROPERTY_BG[activeProperty])}>
        <Icon className={cn("h-8 w-8", PROPERTY_COLOR[activeProperty])} />
        <div>
          <h3 className={cn("text-lg font-bold capitalize", PROPERTY_COLOR[activeProperty])}>
            {activeProperty}
          </h3>
          <p className="text-xs text-foreground-muted">
            {activeProperty === "atomicity" &&
              "All operations in a transaction succeed, or none do. No partial updates."}
            {activeProperty === "consistency" &&
              "Every transaction moves the database from one valid state to another. Constraints are never violated."}
            {activeProperty === "isolation" &&
              "Concurrent transactions execute as if they were run serially, preventing interference."}
            {activeProperty === "durability" &&
              "Once a transaction is committed, the data persists even if the system crashes."}
          </p>
        </div>
      </div>

      {/* Step timeline */}
      <div className="flex-1 space-y-3">
        {steps.map((step, i) => (
          <StepCard key={step.id} step={step} isVisible={i <= stepIndex} />
        ))}
        {stepIndex < steps.length - 1 && (
          <div className="py-2 text-center text-xs text-foreground-subtle">
            Click &quot;Step&quot; or &quot;Play&quot; to continue...
          </div>
        )}
      </div>
    </div>
  );
});

export default ACIDCanvas;
