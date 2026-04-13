"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/providers/ReducedMotionProvider";
import {
  Database,
  Play,
  Pause,
  RotateCcw,
  Eye,
  PenLine,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type ConsistencyLevel = "strong" | "eventual" | "causal";

interface ReplicaNode {
  id: string;
  label: string;
  value: string;
  version: number;
  synced: boolean;
  latencyMs: number;
}

interface Operation {
  type: "write" | "read";
  value?: string;
  replicaId?: string;
  timestamp: number;
}

interface EventLogEntry {
  time: number;
  message: string;
  type: "write" | "read" | "sync" | "stale";
}

// ── Constants ──────────────────────────────────────────────────

const CONSISTENCY_INFO: Record<
  ConsistencyLevel,
  { name: string; description: string; latencyRange: string; tradeoff: string }
> = {
  strong: {
    name: "Strong Consistency",
    description: "Like calling your bank's headquarters before showing your balance. Slow, but always correct. Every replica confirms before the write completes.",
    latencyRange: "50-200ms",
    tradeoff: "High latency, no stale reads",
  },
  eventual: {
    name: "Eventual Consistency",
    description: "Like an ATM showing a cached balance. Fast, but might be slightly stale. Write returns immediately — replicas catch up asynchronously.",
    latencyRange: "5-20ms",
    tradeoff: "Low latency, stale reads possible",
  },
  causal: {
    name: "Causal Consistency",
    description: "Ordered updates — if event A caused event B, everyone sees A before B. A middle ground: faster than strong, more predictable than eventual.",
    latencyRange: "20-80ms",
    tradeoff: "Moderate latency, causal ordering guaranteed",
  },
};

const INITIAL_VALUE = "v0";

// ── Component ──────────────────────────────────────────────────

export default function ConsistencyLevelDemo() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = { duration: 0 } as const;
  const [level, setLevel] = useState<ConsistencyLevel>("strong");
  const [isRunning, setIsRunning] = useState(false);
  const [writeCount, setWriteCount] = useState(0);
  const [replicas, setReplicas] = useState<ReplicaNode[]>([
    { id: "r1", label: "Replica 1", value: INITIAL_VALUE, version: 0, synced: true, latencyMs: 0 },
    { id: "r2", label: "Replica 2", value: INITIAL_VALUE, version: 0, synced: true, latencyMs: 0 },
    { id: "r3", label: "Replica 3", value: INITIAL_VALUE, version: 0, synced: true, latencyMs: 0 },
  ]);
  const [primaryValue, setPrimaryValue] = useState(INITIAL_VALUE);
  const [primaryVersion, setPrimaryVersion] = useState(0);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [lastReadResult, setLastReadResult] = useState<{ value: string; stale: boolean; replicaId: string } | null>(null);
  const [pendingWrite, setPendingWrite] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  const addLog = useCallback((message: string, type: EventLogEntry["type"]) => {
    setEventLog((prev) => [
      ...prev.slice(-14),
      { time: Date.now(), message, type },
    ]);
  }, []);

  // Reset
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setWriteCount(0);
    stepRef.current = 0;
    setPrimaryValue(INITIAL_VALUE);
    setPrimaryVersion(0);
    setReplicas([
      { id: "r1", label: "Replica 1", value: INITIAL_VALUE, version: 0, synced: true, latencyMs: 0 },
      { id: "r2", label: "Replica 2", value: INITIAL_VALUE, version: 0, synced: true, latencyMs: 0 },
      { id: "r3", label: "Replica 3", value: INITIAL_VALUE, version: 0, synced: true, latencyMs: 0 },
    ]);
    setEventLog([]);
    setLastReadResult(null);
    setPendingWrite(false);
  }, []);

  // Write operation
  const doWrite = useCallback(() => {
    const newVersion = primaryVersion + 1;
    const newValue = `v${newVersion}`;
    setPrimaryVersion(newVersion);
    setPrimaryValue(newValue);
    setWriteCount((c) => c + 1);
    setPendingWrite(true);
    addLog(`WRITE: ${newValue} to primary`, "write");

    if (level === "strong") {
      // Sync all replicas before returning
      setTimeout(() => {
        setReplicas((prev) =>
          prev.map((r) => ({
            ...r,
            value: newValue,
            version: newVersion,
            synced: true,
            latencyMs: 50 + Math.round(Math.random() * 150),
          })),
        );
        addLog(`All replicas synced to ${newValue} (strong)`, "sync");
        setPendingWrite(false);
      }, 800);
    } else if (level === "eventual") {
      // Immediate return, async sync
      setPendingWrite(false);
      // Stagger replica updates
      setReplicas((prev) =>
        prev.map((r) => ({ ...r, synced: false })),
      );

      const delays = [500, 1200, 2000];
      delays.forEach((delay, i) => {
        setTimeout(() => {
          setReplicas((prev) =>
            prev.map((r, ri) => {
              if (ri === i) {
                return {
                  ...r,
                  value: newValue,
                  version: newVersion,
                  synced: true,
                  latencyMs: delay,
                };
              }
              return r;
            }),
          );
          addLog(`${["Replica 1", "Replica 2", "Replica 3"][i]} synced to ${newValue} (+${delay}ms)`, "sync");
        }, delay);
      });
    } else {
      // Causal: first replica syncs fast, others follow in order
      setPendingWrite(false);
      setReplicas((prev) =>
        prev.map((r) => ({ ...r, synced: false })),
      );

      const delays = [300, 600, 900];
      delays.forEach((delay, i) => {
        setTimeout(() => {
          setReplicas((prev) =>
            prev.map((r, ri) => {
              if (ri === i) {
                return {
                  ...r,
                  value: newValue,
                  version: newVersion,
                  synced: true,
                  latencyMs: delay,
                };
              }
              return r;
            }),
          );
          addLog(`${["Replica 1", "Replica 2", "Replica 3"][i]} synced (causal order) +${delay}ms`, "sync");
        }, delay);
      });
    }
  }, [level, primaryVersion, addLog]);

  // Read operation
  const doRead = useCallback(
    (replicaId: string) => {
      const replica = replicas.find((r) => r.id === replicaId);
      if (!replica) return;

      const stale = replica.version < primaryVersion;
      setLastReadResult({ value: replica.value, stale, replicaId });

      if (stale) {
        addLog(`READ from ${replica.label}: ${replica.value} (STALE, primary at v${primaryVersion})`, "stale");
      } else {
        addLog(`READ from ${replica.label}: ${replica.value} (FRESH)`, "read");
      }
    },
    [replicas, primaryVersion, addLog],
  );

  // Auto-run: alternate writes and reads
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      stepRef.current++;
      if (stepRef.current % 3 === 0) {
        // Write
        doWrite();
      } else {
        // Read from random replica
        const rIdx = Math.floor(Math.random() * 3);
        doRead(`r${rIdx + 1}`);
      }

      if (stepRef.current >= 15) {
        setIsRunning(false);
      }
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, doWrite, doRead]);

  const info = CONSISTENCY_INFO[level];

  // Latency comparison
  const latencyData = useMemo(
    () => [
      { level: "strong" as const, label: "Strong", writeMs: 150, readMs: 50 },
      { level: "eventual" as const, label: "Eventual", writeMs: 10, readMs: 5 },
      { level: "causal" as const, label: "Causal", writeMs: 60, readMs: 20 },
    ],
    [],
  );

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Consistency Level Demo
        </h3>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        You check your bank balance on your phone and see $1,000. Your partner checks on theirs and sees $950. Who&apos;s right? It depends on the consistency level.
      </p>

      {/* Level selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(CONSISTENCY_INFO) as ConsistencyLevel[]).map((l) => (
          <motion.button
            key={l}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setLevel(l); handleReset(); }}
            className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors capitalize"
            style={{
              background: l === level ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: l === level ? "var(--primary)" : "var(--border)",
              color: l === level ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {l}
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {info.description}
      </p>

      {/* Replica state visualization */}
      <div
        className="rounded-xl border p-4 mb-4"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          {/* Primary */}
          <motion.div
            animate={{ scale: pendingWrite ? [1, 1.05, 1] : 1 }}
            transition={prefersReducedMotion ? noMotion : { duration: 0.3 }}
            className="w-20 h-16 rounded-xl border-2 flex flex-col items-center justify-center"
            style={{ background: "var(--violet-3)", borderColor: "var(--primary)" }}
          >
            <PenLine className="h-4 w-4 mb-0.5" style={{ color: "var(--primary)" }} />
            <span className="text-[10px] font-medium" style={{ color: "var(--primary)" }}>
              Primary
            </span>
            <span className="text-[9px] font-mono" style={{ color: "var(--foreground-muted)" }}>
              {primaryValue}
            </span>
          </motion.div>

          <div className="flex flex-col gap-1">
            <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--gray-7)" }} />
            <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--gray-7)" }} />
            <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--gray-7)" }} />
          </div>

          {/* Replicas */}
          <div className="flex flex-col gap-2">
            {replicas.map((r) => (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => doRead(r.id)}
                animate={{
                  borderColor: r.synced ? "var(--state-success)" : "var(--state-warning)",
                }}
                className="w-28 h-12 rounded-xl border flex flex-col items-center justify-center cursor-pointer"
                style={{ background: "var(--gray-4)" }}
              >
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" style={{ color: "var(--foreground-muted)" }} />
                  <span className="text-[10px]" style={{ color: "var(--foreground)" }}>
                    {r.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-mono" style={{ color: r.synced ? "var(--state-success)" : "var(--state-warning)" }}>
                    {r.value}
                  </span>
                  {!r.synced && (
                    <motion.div
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
                      transition={prefersReducedMotion ? noMotion : { repeat: Infinity, duration: 1 }}
                    >
                      <Clock className="h-2.5 w-2.5" style={{ color: "var(--state-warning)" }} />
                    </motion.div>
                  )}
                  {r.synced && r.version === primaryVersion && (
                    <CheckCircle2 className="h-2.5 w-2.5" style={{ color: "var(--state-success)" }} />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <p className="text-[10px] text-center" style={{ color: "var(--foreground-muted)" }}>
          Click a replica to read from it
        </p>
      </div>

      {/* Read result */}
      <AnimatePresence>
        {lastReadResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border p-3 mb-4 flex items-center gap-2"
            style={{
              background: lastReadResult.stale ? "hsla(0, 72%, 51%, 0.08)" : "hsla(142, 71%, 45%, 0.08)",
              borderColor: lastReadResult.stale ? "var(--state-error)" : "var(--state-success)",
            }}
          >
            {lastReadResult.stale ? (
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--state-error)" }} />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--state-success)" }} />
            )}
            <span className="text-xs" style={{ color: lastReadResult.stale ? "var(--state-error)" : "var(--state-success)" }}>
              Read from {lastReadResult.replicaId}: <span className="font-mono font-bold">{lastReadResult.value}</span>
              {" "}{lastReadResult.stale ? "(STALE)" : "(FRESH)"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latency comparison table */}
      <div className="mb-4">
        <p className="text-xs font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Latency Comparison
        </p>
        <div className="space-y-1">
          {latencyData.map((ld) => (
            <div
              key={ld.level}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl",
                ld.level === level ? "ring-1 ring-[var(--primary)]" : "",
              )}
              style={{
                background: ld.level === level ? "var(--gray-4)" : "var(--gray-3)",
              }}
            >
              <span className="w-16 text-xs capitalize" style={{ color: "var(--foreground-muted)" }}>
                {ld.label}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] w-12" style={{ color: "var(--foreground-muted)" }}>Write:</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-5)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (ld.writeMs / 200) }}
                    style={{ width: "100%", transformOrigin: "left", background: ld.writeMs > 100 ? "var(--state-error)" : ld.writeMs > 30 ? "var(--state-warning)" : "var(--state-success)" }}
                  />
                </div>
                <span className="text-[10px] font-mono w-10 text-right" style={{ color: "var(--foreground-muted)" }}>
                  {ld.writeMs}ms
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] w-10" style={{ color: "var(--foreground-muted)" }}>Read:</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-5)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (ld.readMs / 60) }}
                    style={{ width: "100%", transformOrigin: "left", background: ld.readMs > 30 ? "var(--state-warning)" : "var(--state-success)" }}
                  />
                </div>
                <span className="text-[10px] font-mono w-10 text-right" style={{ color: "var(--foreground-muted)" }}>
                  {ld.readMs}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div
        className="rounded-xl border p-3 mb-4 h-28 overflow-y-auto font-mono text-[10px]"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        {eventLog.length === 0 ? (
          <span style={{ color: "var(--gray-8)" }}>
            Press Run for auto-demo or click Write/Read manually...
          </span>
        ) : (
          eventLog.map((entry, i) => (
            <div
              key={i}
              className="py-0.5"
              style={{
                color:
                  entry.type === "stale"
                    ? "var(--state-error)"
                    : entry.type === "write"
                      ? "var(--primary)"
                      : entry.type === "sync"
                        ? "var(--state-success)"
                        : "var(--foreground-muted)",
              }}
            >
              {entry.message}
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning((r) => !r)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-xl px-4 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Pause" : "Auto Run"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={doWrite}
          disabled={pendingWrite}
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-xl px-4 py-2 text-sm font-medium border",
            pendingWrite && "opacity-50",
          )}
          style={{ background: "var(--gray-3)", borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <PenLine className="h-4 w-4" />
          Write
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-xl px-4 py-2 text-sm font-medium border",
          )}
          style={{ background: "var(--gray-3)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}
        >
          <RotateCcw className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
