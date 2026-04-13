"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/providers/ReducedMotionProvider";
import {
  Database,
  Play,
  Pause,
  RotateCcw,
  Wifi,
  WifiOff,
  ChevronRight,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

interface ReplicaState {
  id: string;
  label: string;
  lagMs: number;
  version: number;
  status: "synced" | "lagging" | "stale" | "partitioned";
  writesReceived: number;
}

interface WriteEvent {
  id: number;
  value: string;
  timestamp: number;
}

// ── Helpers ────────────────────────────────────────────────────

function getStatusColor(status: ReplicaState["status"]): string {
  switch (status) {
    case "synced": return "var(--state-success)";
    case "lagging": return "var(--state-warning)";
    case "stale": return "var(--viz-seq-high)";
    case "partitioned": return "var(--state-error)";
  }
}

function getStatusLabel(status: ReplicaState["status"]): string {
  switch (status) {
    case "synced": return "Fresh";
    case "lagging": return "Lagging";
    case "stale": return "Stale";
    case "partitioned": return "Partitioned";
  }
}

// ── Component ──────────────────────────────────────────────────

export default function ReplicationLagVisualizer() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = { duration: 0 } as const;
  const [writeRate, setWriteRate] = useState(5); // writes/sec
  const [replicaCount, setReplicaCount] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [partitionedReplica, setPartitionedReplica] = useState<string | null>(null);
  const [primaryVersion, setPrimaryVersion] = useState(0);
  const [replicas, setReplicas] = useState<ReplicaState[]>([]);
  const [writeLog, setWriteLog] = useState<WriteEvent[]>([]);
  const [readResult, setReadResult] = useState<{ value: string; stale: boolean } | null>(null);

  // Initialize replicas
  useEffect(() => {
    const initial: ReplicaState[] = [];
    for (let i = 0; i < replicaCount; i++) {
      initial.push({
        id: `replica-${i}`,
        label: `Replica ${i + 1}`,
        lagMs: 0,
        version: 0,
        status: "synced",
        writesReceived: 0,
      });
    }
    setReplicas(initial);
    setPrimaryVersion(0);
    setWriteLog([]);
    setPartitionedReplica(null);
    setReadResult(null);
  }, [replicaCount]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const writeIdRef = useRef(0);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      writeIdRef.current++;
      const wId = writeIdRef.current;

      setPrimaryVersion((v) => v + 1);

      setWriteLog((log) => [
        ...log.slice(-19),
        { id: wId, value: `v${wId}`, timestamp: Date.now() },
      ]);

      // Update replicas with lag
      setReplicas((prev) =>
        prev.map((r) => {
          if (r.id === partitionedReplica) {
            return {
              ...r,
              lagMs: r.lagMs + 200 + Math.random() * 300,
              status: "partitioned" as const,
            };
          }

          // Normal replication lag
          const baseLag = (1000 / writeRate) * 0.3;
          const jitter = Math.random() * baseLag * 0.5;
          const newLag = Math.max(0, baseLag + jitter - 50);
          const newVersion = r.version + 1;

          let status: ReplicaState["status"] = "synced";
          if (newLag > 500) status = "stale";
          else if (newLag > 100) status = "lagging";

          return {
            ...r,
            lagMs: Math.round(newLag),
            version: newVersion,
            status,
            writesReceived: r.writesReceived + 1,
          };
        }),
      );
    }, 1000 / writeRate);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, writeRate, partitionedReplica]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    writeIdRef.current = 0;
    setPrimaryVersion(0);
    setWriteLog([]);
    setReadResult(null);
    setPartitionedReplica(null);
    setReplicas((prev) =>
      prev.map((r) => ({
        ...r,
        lagMs: 0,
        version: 0,
        status: "synced" as const,
        writesReceived: 0,
      })),
    );
  }, []);

  const handleReadFromReplica = useCallback(
    (replicaId: string) => {
      const replica = replicas.find((r) => r.id === replicaId);
      if (!replica) return;
      const stale = replica.version < primaryVersion;
      setReadResult({
        value: `v${replica.version}`,
        stale,
      });
    },
    [replicas, primaryVersion],
  );

  const togglePartition = useCallback(
    (replicaId: string) => {
      setPartitionedReplica((prev) => (prev === replicaId ? null : replicaId));
    },
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
          Replication Lag Visualizer
        </h3>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        You post a photo on Instagram. Your friend refreshes — it&apos;s not there. 2 seconds later, it appears. That gap IS replication lag.
      </p>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Write Rate: <span style={{ color: "var(--foreground)" }}>{writeRate}/s</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={writeRate}
            onChange={(e) => setWriteRate(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            Replicas: <span style={{ color: "var(--foreground)" }}>{replicaCount}</span>
          </label>
          <input
            type="range"
            min={1}
            max={3}
            value={replicaCount}
            onChange={(e) => { setReplicaCount(Number(e.target.value)); setIsRunning(false); }}
            className="w-full accent-[var(--primary)]"
          />
        </div>
      </div>

      {/* Topology Visualization */}
      <p className="text-[10px] mb-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        The primary handles all writes. Replicas get copies — but not instantly. The delay between primary write and replica update is replication lag.
      </p>
      <div
        className="rounded-xl border p-4 mb-4"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-center gap-6">
          {/* Primary */}
          <div className="text-center">
            <motion.div
              animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: isRunning ? Infinity : 0, duration: 1 }}
              className="w-20 h-16 rounded-xl border-2 flex flex-col items-center justify-center"
              style={{
                background: "var(--violet-3)",
                borderColor: "var(--primary)",
              }}
            >
              <Database className="h-5 w-5 mb-1" style={{ color: "var(--primary)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--primary)" }}>
                Primary
              </span>
            </motion.div>
            <span className="text-[10px] mt-1 font-mono block" style={{ color: "var(--foreground-muted)" }}>
              v{primaryVersion}
            </span>
          </div>

          {/* Arrows */}
          <div className="flex flex-col justify-center pt-4 gap-3">
            {replicas.map((r) => (
              <ArrowRight
                key={r.id}
                className="h-4 w-4"
                style={{
                  color: r.id === partitionedReplica ? "var(--state-error)" : "var(--gray-7)",
                }}
              />
            ))}
          </div>

          {/* Replicas */}
          <div className="flex flex-col gap-3">
            {replicas.map((r) => (
              <motion.div
                key={r.id}
                layout
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{
                    opacity: r.id === partitionedReplica ? 0.5 : 1,
                  }}
                  className="w-24 h-14 rounded-xl border flex flex-col items-center justify-center cursor-pointer"
                  style={{
                    background: "var(--gray-4)",
                    borderColor: getStatusColor(r.status),
                  }}
                  onClick={() => handleReadFromReplica(r.id)}
                >
                  <span className="text-[10px] font-medium" style={{ color: "var(--foreground)" }}>
                    {r.label}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: getStatusColor(r.status) }}>
                    v{r.version} | {r.lagMs}ms
                  </span>
                </motion.div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--gray-4)",
                      color: getStatusColor(r.status),
                    }}
                  >
                    {getStatusLabel(r.status)}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => togglePartition(r.id)}
                    className="text-[9px] px-1.5 py-0.5 rounded-xl border flex items-center gap-1"
                    style={{
                      background: r.id === partitionedReplica ? "var(--state-error)" : "var(--gray-3)",
                      borderColor: r.id === partitionedReplica ? "var(--state-error)" : "var(--border)",
                      color: r.id === partitionedReplica ? "var(--primary-foreground)" : "var(--foreground-muted)",
                    }}
                  >
                    {r.id === partitionedReplica ? <WifiOff className="h-2.5 w-2.5" /> : <Wifi className="h-2.5 w-2.5" />}
                    {r.id === partitionedReplica ? "Heal" : "Partition"}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Read-after-write indicator */}
      {readResult && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-3 mb-4 flex items-center gap-3"
          style={{
            background: readResult.stale ? "hsla(0, 72%, 51%, 0.1)" : "hsla(142, 71%, 45%, 0.1)",
            borderColor: readResult.stale ? "var(--state-error)" : "var(--state-success)",
          }}
        >
          <span className="text-xs" style={{ color: readResult.stale ? "var(--state-error)" : "var(--state-success)" }}>
            Read returned: <span className="font-mono font-bold">{readResult.value}</span>
            {" "}(Primary at v{primaryVersion})
            {" "}{readResult.stale ? "STALE" : "FRESH"}
          </span>
        </motion.div>
      )}

      {/* Lag bars */}
      <div className="space-y-2 mb-4">
        {replicas.map((r) => {
          const lagPct = Math.min((r.lagMs / 1000) * 100, 100);
          return (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-20 text-[10px] shrink-0" style={{ color: "var(--foreground-muted)" }}>
                {r.label}
              </span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--gray-5)" }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ scaleX: lagPct / 100 }}
                  transition={prefersReducedMotion ? noMotion : { type: "spring", stiffness: 300, damping: 30 }}
                  style={{ width: "100%", transformOrigin: "left", background: getStatusColor(r.status) }}
                />
              </div>
              <span className="w-14 text-right text-[10px] font-mono shrink-0" style={{ color: getStatusColor(r.status) }}>
                {r.lagMs}ms
              </span>
            </div>
          );
        })}
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
          {isRunning ? "Pause" : "Start Writes"}
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
          Reset
        </motion.button>
      </div>
    </div>
  );
}
