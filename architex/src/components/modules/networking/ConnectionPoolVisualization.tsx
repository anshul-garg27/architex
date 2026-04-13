"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo, useReducer } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Network,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ChevronRight,
  Circle,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type ConnectionStatus = "idle" | "active" | "creating" | "destroyed" | "draining";

interface PoolConnection {
  id: number;
  status: ConnectionStatus;
  requestId: number | null;
  createdAt: number;
  lastUsedAt: number;
  usageCount: number;
}

interface QueuedRequest {
  id: number;
  enqueuedAt: number;
  waitMs: number;
  timedOut: boolean;
}

interface PoolConfig {
  minSize: number;
  maxSize: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
}

interface PoolMetrics {
  active: number;
  idle: number;
  waiting: number;
  total: number;
  timedOut: number;
  served: number;
  avgWaitMs: number;
}

// ── Constants ──────────────────────────────────────────────────

const DEFAULT_CONFIG: PoolConfig = {
  minSize: 2,
  maxSize: 8,
  idleTimeoutMs: 5000,
  acquireTimeoutMs: 3000,
};

const INITIAL_METRICS: PoolMetrics = {
  active: 0, idle: 0, waiting: 0, total: 0, timedOut: 0, served: 0, avgWaitMs: 0,
};

// ── Reducer ───────────────────────────────────────────────────

interface PoolState {
  connections: PoolConnection[];
  queue: QueuedRequest[];
  metrics: PoolMetrics;
  exhaustionWarning: boolean;
}

type PoolAction =
  | { type: 'INIT'; connections: PoolConnection[] }
  | { type: 'TICK'; now: number; requestRate: number; config: PoolConfig; nextConnId: () => number; nextReqId: () => number };

function poolReducer(state: PoolState, action: PoolAction): PoolState {
  switch (action.type) {
    case 'INIT':
      return {
        connections: action.connections,
        queue: [],
        metrics: INITIAL_METRICS,
        exhaustionWarning: false,
      };

    case 'TICK': {
      const { now, requestRate, config, nextConnId, nextReqId } = action;
      let conns = [...state.connections];
      let q = [...state.queue];
      let servedCount = 0;
      let timedOutCount = 0;
      let totalWait = 0;

      // 1) Complete some active requests (random chance)
      conns = conns.map((c) => {
        if (c.status === "active" && Math.random() < 0.3) {
          servedCount++;
          return { ...c, status: "idle" as const, requestId: null, lastUsedAt: now };
        }
        if (c.status === "creating" && Math.random() < 0.5) {
          return { ...c, status: "idle" as const };
        }
        return c;
      });

      // 2) Generate new requests
      const newRequestCount = Math.random() < (requestRate / 10) ? Math.ceil(requestRate / 3) : 0;
      for (let i = 0; i < newRequestCount; i++) {
        const rid = nextReqId();

        // Try to find idle connection
        const idleIdx = conns.findIndex((c) => c.status === "idle");
        if (idleIdx >= 0) {
          conns[idleIdx] = {
            ...conns[idleIdx],
            status: "active",
            requestId: rid,
            lastUsedAt: now,
            usageCount: conns[idleIdx].usageCount + 1,
          };
          servedCount++;
        } else if (conns.filter((c) => c.status !== "destroyed").length < config.maxSize) {
          // Create new connection
          conns.push({
            id: nextConnId(),
            status: "creating",
            requestId: rid,
            createdAt: now,
            lastUsedAt: now,
            usageCount: 0,
          });
        } else {
          // Queue the request
          q.push({ id: rid, enqueuedAt: now, waitMs: 0, timedOut: false });
        }
      }

      // 3) Process queue with idle connections
      q = q.map((req) => {
        if (req.timedOut) return req;
        const wait = now - req.enqueuedAt;
        if (wait > config.acquireTimeoutMs) {
          timedOutCount++;
          return { ...req, waitMs: wait, timedOut: true };
        }
        const idleIdx = conns.findIndex((c) => c.status === "idle");
        if (idleIdx >= 0) {
          conns[idleIdx] = {
            ...conns[idleIdx],
            status: "active",
            requestId: req.id,
            lastUsedAt: now,
            usageCount: conns[idleIdx].usageCount + 1,
          };
          totalWait += wait;
          servedCount++;
          return { ...req, waitMs: wait, timedOut: false };
        }
        return { ...req, waitMs: wait };
      }).filter((req) => {
        if (req.timedOut) return true; // keep for display
        // Remove served
        const isServed = conns.some((c) => c.requestId === req.id && c.status === "active");
        return !isServed;
      });

      // Keep only recent timed-out
      q = q.filter((req) => !req.timedOut || now - req.enqueuedAt < 5000);

      // 4) Destroy old idle connections above minimum
      const activeConns = conns.filter((c) => c.status !== "destroyed");
      if (activeConns.length > config.minSize) {
        conns = conns.map((c) => {
          if (c.status === "idle" && now - c.lastUsedAt > config.idleTimeoutMs && activeConns.length > config.minSize) {
            return { ...c, status: "destroyed" as const };
          }
          return c;
        });
      }

      // Remove long-destroyed
      conns = conns.filter((c) => c.status !== "destroyed" || now - c.lastUsedAt < 2000);

      // Compute metrics
      const active = conns.filter((c) => c.status === "active").length;
      const idle = conns.filter((c) => c.status === "idle").length;
      const waiting = q.filter((r) => !r.timedOut).length;
      const total = conns.filter((c) => c.status !== "destroyed").length;

      return {
        connections: conns,
        queue: q,
        metrics: {
          active,
          idle,
          waiting,
          total,
          timedOut: state.metrics.timedOut + timedOutCount,
          served: state.metrics.served + servedCount,
          avgWaitMs: totalWait > 0 ? Math.round(totalWait / Math.max(servedCount, 1)) : state.metrics.avgWaitMs,
        },
        exhaustionWarning: total >= config.maxSize && waiting > 0,
      };
    }

    default:
      return state;
  }
}

// ── Helpers ────────────────────────────────────────────────────

function statusColor(status: ConnectionStatus): string {
  switch (status) {
    case "active": return "var(--state-success)";
    case "idle": return "var(--primary)";
    case "creating": return "var(--state-warning)";
    case "destroyed": return "var(--state-error)";
    case "draining": return "var(--foreground-muted)";
  }
}

// ── Component ──────────────────────────────────────────────────

export default function ConnectionPoolVisualization() {
  const [config, setConfig] = useState<PoolConfig>(DEFAULT_CONFIG);
  const [requestRate, setRequestRate] = useState(3); // per second
  const [isRunning, setIsRunning] = useState(false);
  const [poolState, dispatch] = useReducer(poolReducer, {
    connections: [],
    queue: [],
    metrics: INITIAL_METRICS,
    exhaustionWarning: false,
  });
  const connIdRef = useRef(0);
  const reqIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  const { connections, queue, metrics, exhaustionWarning } = poolState;

  // Initialize pool with min connections
  const initPool = useCallback(() => {
    const initial: PoolConnection[] = [];
    for (let i = 0; i < config.minSize; i++) {
      connIdRef.current++;
      initial.push({
        id: connIdRef.current,
        status: "idle",
        requestId: null,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: 0,
      });
    }
    return initial;
  }, [config.minSize]);

  useEffect(() => {
    dispatch({ type: 'INIT', connections: initPool() });
    tickRef.current = 0;
  }, [initPool]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    connIdRef.current = 0;
    reqIdRef.current = 0;
    tickRef.current = 0;
    dispatch({ type: 'INIT', connections: initPool() });
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [initPool]);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tickRef.current++;
      dispatch({
        type: 'TICK',
        now: Date.now(),
        requestRate,
        config,
        nextConnId: () => ++connIdRef.current,
        nextReqId: () => ++reqIdRef.current,
      });
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, requestRate, config]);

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Network className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Connection Pool Visualization
        </h3>
        {exhaustionWarning && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="ml-auto text-[10px] px-2 py-0.5 rounded font-medium"
            style={{ background: "var(--state-error)", color: "#fff" }}
          >
            POOL EXHAUSTED
          </motion.span>
        )}
      </div>

      {/* Config Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            Max Pool Size: <span style={{ color: "var(--foreground)" }}>{config.maxSize}</span>
          </label>
          <input
            type="range"
            min={2}
            max={16}
            value={config.maxSize}
            onChange={(e) => setConfig((c) => ({ ...c, maxSize: Number(e.target.value) }))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            Request Rate: <span style={{ color: "var(--foreground)" }}>{requestRate}/s</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={requestRate}
            onChange={(e) => setRequestRate(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            Min Pool Size: <span style={{ color: "var(--foreground)" }}>{config.minSize}</span>
          </label>
          <input
            type="range"
            min={1}
            max={config.maxSize}
            value={config.minSize}
            onChange={(e) => setConfig((c) => ({ ...c, minSize: Number(e.target.value) }))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
            Acquire Timeout: <span style={{ color: "var(--foreground)" }}>{config.acquireTimeoutMs}ms</span>
          </label>
          <input
            type="range"
            min={500}
            max={10000}
            step={500}
            value={config.acquireTimeoutMs}
            onChange={(e) => setConfig((c) => ({ ...c, acquireTimeoutMs: Number(e.target.value) }))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
      </div>

      {/* Pool Visualization */}
      <div
        className="rounded-md border p-3 mb-4"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <p className="text-[10px] font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
          CONNECTIONS
        </p>
        <div
          className="flex flex-wrap gap-2 min-h-[40px]"
          role="group"
          aria-label={`Connection pool: ${connections.filter((c) => c.status !== "destroyed").length} connections`}
        >
          <AnimatePresence>
            {connections
              .filter((c) => c.status !== "destroyed")
              .map((conn) => {
                const abbrev = conn.status === "active" ? "A" : conn.status === "idle" ? "I" : conn.status === "creating" ? "C" : conn.status === "draining" ? "D" : "X";
                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="w-12 h-12 rounded-lg border flex flex-col items-center justify-center"
                    style={{
                      borderColor: statusColor(conn.status),
                      background: conn.status === "active"
                        ? "hsla(142, 71%, 45%, 0.15)"
                        : conn.status === "creating"
                          ? "hsla(45, 93%, 47%, 0.15)"
                          : "var(--gray-4)",
                    }}
                    aria-label={`Connection #${conn.id}: ${conn.status}`}
                  >
                    <motion.div
                      className="w-3 h-3 rounded-full mb-0.5"
                      style={{ background: statusColor(conn.status) }}
                      animate={conn.status === "active" ? { scale: [1, 1.2, 1] } : {}}
                      transition={conn.status === "active" ? { repeat: Infinity, duration: 1 } : {}}
                    />
                    <span className="text-[8px] font-bold" style={{ color: statusColor(conn.status) }}>
                      {abbrev}
                    </span>
                    <span className="text-[7px] font-mono" style={{ color: "var(--foreground-muted)" }}>
                      #{conn.id}
                    </span>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3">
          {[
            { status: "active" as const, label: "Active" },
            { status: "idle" as const, label: "Idle" },
            { status: "creating" as const, label: "Creating" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: statusColor(status) }} />
              <span className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Queue */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-md border p-3 mb-4"
            style={{ background: "hsla(0, 72%, 51%, 0.05)", borderColor: "var(--state-warning)" }}
          >
            <p className="text-[10px] font-medium mb-1.5" style={{ color: "var(--state-warning)" }}>
              WAITING QUEUE ({queue.filter((r) => !r.timedOut).length} pending, {queue.filter((r) => r.timedOut).length} timed out)
            </p>
            <div className="flex flex-wrap gap-1">
              {queue.slice(0, 20).map((req) => (
                <span
                  key={req.id}
                  className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: req.timedOut ? "var(--state-error)" : "var(--state-warning)",
                    color: "#fff",
                  }}
                >
                  R{req.id}{req.timedOut ? " (timeout)" : ` ${req.waitMs}ms`}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Active", value: metrics.active, color: "var(--state-success)" },
          { label: "Idle", value: metrics.idle, color: "var(--primary)" },
          { label: "Waiting", value: metrics.waiting, color: "var(--state-warning)" },
          { label: "Timed Out", value: metrics.timedOut, color: "var(--state-error)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-md border p-2 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
            <p className="text-[9px]" style={{ color: "var(--foreground-muted)" }}>{label}</p>
            <p className="text-sm font-bold font-mono" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning((r) => !r)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Pause" : "Start Simulation"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className={cn(
            "flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium border",
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
