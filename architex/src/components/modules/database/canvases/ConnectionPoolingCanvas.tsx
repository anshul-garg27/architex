"use client";

import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type PoolingMode = "no-pooling" | "with-pooling";
export type PgBouncerMode = "session" | "transaction" | "statement";

export interface ConnectionPoolingCanvasProps {
  poolingMode: PoolingMode;
  onPoolingModeChange: (m: PoolingMode) => void;
  poolSize: number;
  onPoolSizeChange: (s: number) => void;
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

export interface ConnectionPoolingStep {
  id: number;
  label: string;
  description: string;
  /** Which part of the pipeline is active */
  activePhase: "idle" | "connect" | "auth" | "query" | "response" | "close" | "borrow" | "return" | "queue" | "exhaustion";
  /** Active arrows */
  activeArrows: string[];
  /** Connection count stats */
  stats: {
    activeConns: number;
    idleConns: number;
    queuedRequests: number;
    latencyMs: string;
  };
}

function getNoPoolingSteps(): ConnectionPoolingStep[] {
  return [
    {
      id: 0,
      label: "Request arrives",
      description: "A new HTTP request arrives at the application server. It needs to read user data from the database.",
      activePhase: "idle",
      activeArrows: [],
      stats: { activeConns: 0, idleConns: 0, queuedRequests: 0, latencyMs: "0ms" },
    },
    {
      id: 1,
      label: "TCP handshake",
      description: "Without a pool, the app must open a new TCP connection to the database. TCP requires a 3-way handshake: SYN, SYN-ACK, ACK. Over a network, this adds ~1-5ms.",
      activePhase: "connect",
      activeArrows: ["app-db-tcp"],
      stats: { activeConns: 1, idleConns: 0, queuedRequests: 0, latencyMs: "~3ms" },
    },
    {
      id: 2,
      label: "TLS negotiation",
      description: "For encrypted connections (required in production), TLS adds another round-trip. Certificate exchange, key agreement, cipher negotiation. Another ~5-15ms.",
      activePhase: "connect",
      activeArrows: ["app-db-tls"],
      stats: { activeConns: 1, idleConns: 0, queuedRequests: 0, latencyMs: "~13ms" },
    },
    {
      id: 3,
      label: "Authentication",
      description: "PostgreSQL authenticates the client: check username, verify password (scram-sha-256), load role permissions, set session defaults. Another ~2-5ms.",
      activePhase: "auth",
      activeArrows: ["app-db-auth"],
      stats: { activeConns: 1, idleConns: 0, queuedRequests: 0, latencyMs: "~17ms" },
    },
    {
      id: 4,
      label: "Execute query",
      description: "Finally! The actual query runs: SELECT * FROM users WHERE id = 42. This is the ONLY part that does useful work. Takes ~1ms.",
      activePhase: "query",
      activeArrows: ["app-db-query"],
      stats: { activeConns: 1, idleConns: 0, queuedRequests: 0, latencyMs: "~18ms" },
    },
    {
      id: 5,
      label: "Receive response",
      description: "Database returns the result set. Application processes the rows and prepares the HTTP response.",
      activePhase: "response",
      activeArrows: ["db-app-response"],
      stats: { activeConns: 1, idleConns: 0, queuedRequests: 0, latencyMs: "~19ms" },
    },
    {
      id: 6,
      label: "Close connection",
      description: "Connection is closed: TCP FIN handshake, release server-side resources. ALL that setup work is thrown away. Next request starts from scratch!",
      activePhase: "close",
      activeArrows: ["app-db-close"],
      stats: { activeConns: 0, idleConns: 0, queuedRequests: 0, latencyMs: "~20ms total" },
    },
    {
      id: 7,
      label: "The problem at scale",
      description: "With 1000 concurrent requests, you need 1000 TCP+TLS+Auth cycles per second. PostgreSQL default max_connections = 100. You'll hit the limit and requests will FAIL.",
      activePhase: "exhaustion",
      activeArrows: [],
      stats: { activeConns: 100, idleConns: 0, queuedRequests: 900, latencyMs: "TIMEOUT!" },
    },
  ];
}

function getWithPoolingSteps(): ConnectionPoolingStep[] {
  return [
    {
      id: 0,
      label: "Pool initialization",
      description: "At startup, the pool pre-creates N connections (e.g., 10). Each one does TCP + TLS + Auth ONCE. These connections stay open and ready.",
      activePhase: "idle",
      activeArrows: ["pool-db-init"],
      stats: { activeConns: 0, idleConns: 10, queuedRequests: 0, latencyMs: "0ms (ready)" },
    },
    {
      id: 1,
      label: "Request arrives",
      description: "A new HTTP request arrives. Instead of opening a new connection, the app asks the pool for a pre-warmed one.",
      activePhase: "idle",
      activeArrows: ["app-pool-request"],
      stats: { activeConns: 0, idleConns: 10, queuedRequests: 0, latencyMs: "0ms" },
    },
    {
      id: 2,
      label: "Borrow connection",
      description: "The pool hands over an idle connection instantly. No TCP, no TLS, no auth. The connection is already established and authenticated. Time: ~0.1ms.",
      activePhase: "borrow",
      activeArrows: ["pool-app-conn"],
      stats: { activeConns: 1, idleConns: 9, queuedRequests: 0, latencyMs: "~0.1ms" },
    },
    {
      id: 3,
      label: "Execute query",
      description: "The query runs immediately on the borrowed connection: SELECT * FROM users WHERE id = 42. Same ~1ms as before, but we skipped ~17ms of setup!",
      activePhase: "query",
      activeArrows: ["app-db-query"],
      stats: { activeConns: 1, idleConns: 9, queuedRequests: 0, latencyMs: "~1.1ms" },
    },
    {
      id: 4,
      label: "Receive response",
      description: "Result comes back through the borrowed connection. Application processes it.",
      activePhase: "response",
      activeArrows: ["db-app-response"],
      stats: { activeConns: 1, idleConns: 9, queuedRequests: 0, latencyMs: "~2ms" },
    },
    {
      id: 5,
      label: "Return connection",
      description: "Instead of closing, the connection is RETURNED to the pool. It stays open, authenticated, and ready for the next request. Total: ~2ms vs ~20ms without pooling!",
      activePhase: "return",
      activeArrows: ["app-pool-return"],
      stats: { activeConns: 0, idleConns: 10, queuedRequests: 0, latencyMs: "~2ms total" },
    },
    {
      id: 6,
      label: "Concurrent requests",
      description: "1000 requests share 10 connections. Each request borrows briefly (~2ms), then returns. Pool handles 5000 req/sec with just 10 database connections!",
      activePhase: "idle",
      activeArrows: [],
      stats: { activeConns: 8, idleConns: 2, queuedRequests: 0, latencyMs: "~2ms avg" },
    },
    {
      id: 7,
      label: "Pool queuing",
      description: "If all connections are busy, new requests wait in a queue. When a connection is returned, the next queued request gets it. Slight delay but no connection storm.",
      activePhase: "queue",
      activeArrows: ["app-pool-queue"],
      stats: { activeConns: 10, idleConns: 0, queuedRequests: 5, latencyMs: "~10ms (queued)" },
    },
  ];
}

export function getStepsForPooling(mode: PoolingMode): ConnectionPoolingStep[] {
  return mode === "no-pooling" ? getNoPoolingSteps() : getWithPoolingSteps();
}

// ── PgBouncer mode data ─────────────────────────────────────────

interface PgBouncerInfo {
  id: PgBouncerMode;
  name: string;
  description: string;
  connReuse: string;
  bestFor: string;
  tradeoff: string;
}

const PGBOUNCER_MODES: PgBouncerInfo[] = [
  {
    id: "session",
    name: "Session Pooling",
    description: "Client gets a server connection for the entire session. Connection is returned when the client disconnects.",
    connReuse: "Low -- one client = one connection for full session",
    bestFor: "Apps that use session-level features (LISTEN/NOTIFY, prepared statements, temp tables)",
    tradeoff: "Least efficient pooling, but most compatible. Similar to no pooling for long sessions.",
  },
  {
    id: "transaction",
    name: "Transaction Pooling",
    description: "Client gets a server connection only for the duration of a transaction. Between transactions, the connection is returned to the pool.",
    connReuse: "High -- connection freed after each COMMIT/ROLLBACK",
    bestFor: "Most web applications. Short transactions, many concurrent users. The default choice.",
    tradeoff: "Cannot use session-level features between transactions. Most common mode in production.",
  },
  {
    id: "statement",
    name: "Statement Pooling",
    description: "Client gets a server connection only for a single SQL statement. Immediately returned after each query.",
    connReuse: "Maximum -- connection freed after every query",
    bestFor: "Simple autocommit workloads (single-query requests)",
    tradeoff: "Cannot use multi-statement transactions! Very restrictive. Rarely used.",
  },
];

// ── SVG layout constants ────────────────────────────────────────

const SVG_W = 1000;
const SVG_H = 480;

const APP_X = 80;
const APP_Y = 160;
const POOL_X = 400;
const POOL_Y = 140;
const DB_X = 760;
const DB_Y = 160;

const BOX_W = 150;
const BOX_H = 120;

// ── Phase colors ────────────────────────────────────────────────

function getPhaseColor(phase: ConnectionPoolingStep["activePhase"]): { fill: string; stroke: string; text: string } {
  switch (phase) {
    case "connect":
      return { fill: "#1e3a5f", stroke: "#3b82f6", text: "#60a5fa" };
    case "auth":
      return { fill: "#3b1f6e", stroke: "#8b5cf6", text: "#a78bfa" };
    case "query":
      return { fill: "#064e3b", stroke: "#10b981", text: "#34d399" };
    case "response":
      return { fill: "#064e3b", stroke: "#10b981", text: "#34d399" };
    case "close":
      return { fill: "#450a0a", stroke: "#ef4444", text: "#f87171" };
    case "borrow":
      return { fill: "#1e3a5f", stroke: "#3b82f6", text: "#60a5fa" };
    case "return":
      return { fill: "#1e3a5f", stroke: "#3b82f6", text: "#60a5fa" };
    case "queue":
      return { fill: "#451a03", stroke: "#f59e0b", text: "#fbbf24" };
    case "exhaustion":
      return { fill: "#450a0a", stroke: "#ef4444", text: "#f87171" };
    default:
      return { fill: "#1e293b", stroke: "#475569", text: "#94a3b8" };
  }
}

// ── Canvas Component ──────────────────────────────────────────────

const ConnectionPoolingCanvas = memo(function ConnectionPoolingCanvas({
  poolingMode,
  onPoolingModeChange,
  poolSize,
  onPoolSizeChange,
  stepIndex,
}: ConnectionPoolingCanvasProps) {
  const steps = getStepsForPooling(poolingMode);
  const currentStep = steps[stepIndex] ?? steps[0];
  const phaseColors = getPhaseColor(currentStep.activePhase);

  const [showPgBouncer, setShowPgBouncer] = useState(false);
  const [selectedPgMode, setSelectedPgMode] = useState<PgBouncerMode>("transaction");

  const showPool = poolingMode === "with-pooling";

  // Compute pool visual slots
  const poolSlots = Array.from({ length: poolSize }, (_, i) => {
    if (i < currentStep.stats.activeConns) return "active";
    if (i < currentStep.stats.activeConns + currentStep.stats.idleConns) return "idle";
    return "empty";
  });

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-elevated/80 to-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm">
            <button
              onClick={() => onPoolingModeChange("no-pooling")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors rounded-l-md",
                poolingMode === "no-pooling"
                  ? "bg-red-500/10 text-red-400"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              Without Pool
            </button>
            <button
              onClick={() => onPoolingModeChange("with-pooling")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors rounded-r-md border-l border-border/30",
                poolingMode === "with-pooling"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              With Pool
            </button>
          </div>
          <span className="text-xs text-foreground-muted">
            Step {stepIndex + 1} / {steps.length}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
              currentStep.stats.latencyMs.includes("TIMEOUT")
                ? "bg-red-500/15 text-red-400"
                : currentStep.stats.latencyMs.includes("ready") || currentStep.stats.latencyMs.includes("0ms")
                  ? "bg-zinc-800 text-foreground-subtle"
                  : parseFloat(currentStep.stats.latencyMs) <= 3
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400",
            )}
          >
            {currentStep.stats.latencyMs}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showPool && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-foreground-muted">Pool size:</span>
              <input
                type="range"
                min={2}
                max={20}
                value={poolSize}
                onChange={(e) => onPoolSizeChange(Number(e.target.value))}
                className="h-1 w-20 accent-primary"
              />
              <span className="w-5 text-center font-mono text-[10px] text-primary">
                {poolSize}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowPgBouncer(!showPgBouncer)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
              showPgBouncer
                ? "bg-violet-500/10 text-violet-400 border border-violet-500/30"
                : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
            )}
          >
            {showPgBouncer ? "Show Diagram" : "PgBouncer Modes"}
          </button>
        </div>
      </div>

      {showPgBouncer ? (
        /* ── PgBouncer modes view ─────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-xl border border-amber-500/30/50 bg-amber-950/20 p-4 text-center">
              <p className="text-sm font-semibold text-amber-300">
                PgBouncer Pooling Modes
              </p>
              <p className="mt-1 text-[11px] text-amber-400/80">
                PgBouncer sits between your app and PostgreSQL, managing a pool of
                real database connections. The mode determines WHEN a connection is
                returned to the pool.
              </p>
            </div>

            {/* Mode selector */}
            <div className="flex gap-2">
              {PGBOUNCER_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPgMode(m.id)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-left transition-all",
                    selectedPgMode === m.id
                      ? "border-violet-500/30 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                      : "border-border/30 bg-elevated/50 backdrop-blur-sm hover:border-foreground-subtle",
                  )}
                >
                  <span className="block text-xs font-bold text-foreground">
                    {m.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-foreground-subtle">
                    Reuse: {m.id === "session" ? "Low" : m.id === "transaction" ? "High" : "Maximum"}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected mode detail */}
            {(() => {
              const info = PGBOUNCER_MODES.find((m) => m.id === selectedPgMode)!;
              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
                    <p className="text-sm text-foreground-muted">{info.description}</p>
                    <div className="mt-3 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                          Connection Reuse
                        </span>
                        <p className="text-[11px] text-foreground-subtle">{info.connReuse}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                          Best For
                        </span>
                        <p className="text-[11px] text-foreground-subtle">{info.bestFor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                          Tradeoff
                        </span>
                        <p className="text-[11px] text-foreground-subtle">{info.tradeoff}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comparison table */}
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border/30 bg-black/30">
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Mode</th>
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Conn Released</th>
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Features</th>
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={cn("border-b border-border/30", selectedPgMode === "session" && "bg-violet-500/5")}>
                          <td className="px-3 py-2 font-medium text-foreground">Session</td>
                          <td className="px-3 py-2 text-foreground-subtle">On disconnect</td>
                          <td className="px-3 py-2 text-emerald-400">All</td>
                          <td className="px-3 py-2 text-red-400">Low</td>
                        </tr>
                        <tr className={cn("border-b border-border/30", selectedPgMode === "transaction" && "bg-violet-500/5")}>
                          <td className="px-3 py-2 font-medium text-foreground">Transaction</td>
                          <td className="px-3 py-2 text-foreground-subtle">After COMMIT</td>
                          <td className="px-3 py-2 text-amber-400">Most</td>
                          <td className="px-3 py-2 text-emerald-400">High</td>
                        </tr>
                        <tr className={cn(selectedPgMode === "statement" && "bg-violet-500/5")}>
                          <td className="px-3 py-2 font-medium text-foreground">Statement</td>
                          <td className="px-3 py-2 text-foreground-subtle">After each query</td>
                          <td className="px-3 py-2 text-red-400">Minimal</td>
                          <td className="px-3 py-2 text-emerald-400">Maximum</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Architecture diagram */}
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-3">
                      Architecture: App &rarr; PgBouncer &rarr; PostgreSQL
                    </span>
                    <div className="flex items-center justify-center gap-4">
                      <div className="rounded-xl border border-border/30 bg-black/30 px-4 py-3 text-center">
                        <span className="block text-[10px] font-bold text-blue-400">App Servers</span>
                        <span className="block text-[10px] text-foreground-subtle">100+ connections</span>
                      </div>
                      <span className="text-foreground-subtle">&rarr;</span>
                      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center">
                        <span className="block text-[10px] font-bold text-violet-400">PgBouncer</span>
                        <span className="block text-[10px] text-foreground-subtle">multiplexes to {poolSize}</span>
                      </div>
                      <span className="text-foreground-subtle">&rarr;</span>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm px-4 py-3 text-center">
                        <span className="block text-[10px] font-bold text-emerald-400">PostgreSQL</span>
                        <span className="block text-[10px] text-foreground-subtle">{poolSize} real connections</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* ── Connection lifecycle diagram ─────────────────────── */
        <div className="flex flex-1 flex-col">
          <div className="relative flex-1 p-4">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker id="cpArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker id="cpArrowActive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={phaseColors.stroke} />
                </marker>
                <filter id="cpGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── App Server Box ── */}
              <rect x={APP_X} y={APP_Y} width={BOX_W} height={BOX_H} rx={8} fill="#0f172a" stroke="#334155" strokeWidth={1.5} />
              <text x={APP_X + BOX_W / 2} y={APP_Y + 20} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={700}>
                Application
              </text>
              <text x={APP_X + BOX_W / 2} y={APP_Y + 38} textAnchor="middle" fill="#64748b" fontSize={9}>
                (Node.js / Go / Java)
              </text>
              {/* Request indicators */}
              {currentStep.stats.queuedRequests > 0 && (
                <>
                  <rect x={APP_X + 15} y={APP_Y + 55} width={BOX_W - 30} height={20} rx={4} fill="#450a0a" stroke="#ef4444" strokeWidth={1} />
                  <text x={APP_X + BOX_W / 2} y={APP_Y + 68} textAnchor="middle" fill="#f87171" fontSize={8} fontWeight={600}>
                    {currentStep.stats.queuedRequests} queued
                  </text>
                </>
              )}
              {currentStep.activePhase !== "idle" && currentStep.activePhase !== "exhaustion" && currentStep.stats.queuedRequests === 0 && (
                <rect x={APP_X + 15} y={APP_Y + 55} width={BOX_W - 30} height={20} rx={4} fill={phaseColors.fill} stroke={phaseColors.stroke} strokeWidth={1}>
                  <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                </rect>
              )}

              {/* ── Connection Pool Box (only with pooling) ── */}
              {showPool && (
                <>
                  <rect x={POOL_X} y={POOL_Y} width={BOX_W + 20} height={BOX_H + 40} rx={8} fill="#0f172a" stroke="#1e4038" strokeWidth={1.5} />
                  <text x={POOL_X + (BOX_W + 20) / 2} y={POOL_Y + 18} textAnchor="middle" fill="#10b981" fontSize={10} fontWeight={700}>
                    Connection Pool
                  </text>
                  <text x={POOL_X + (BOX_W + 20) / 2} y={POOL_Y + 33} textAnchor="middle" fill="#4ade80" fontSize={9}>
                    (PgBouncer / HikariCP)
                  </text>
                  {/* Pool slots visualization */}
                  {poolSlots.map((status, i) => {
                    const cols = Math.ceil(Math.sqrt(poolSize));
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    const slotW = Math.min(18, (BOX_W - 10) / cols);
                    const slotH = 14;
                    const sx = POOL_X + 15 + col * (slotW + 3);
                    const sy = POOL_Y + 48 + row * (slotH + 3);
                    return (
                      <g key={i}>
                        <rect
                          x={sx}
                          y={sy}
                          width={slotW}
                          height={slotH}
                          rx={2}
                          fill={
                            status === "active"
                              ? "#064e3b"
                              : status === "idle"
                                ? "#1e293b"
                                : "#0f172a"
                          }
                          stroke={
                            status === "active"
                              ? "#10b981"
                              : status === "idle"
                                ? "#475569"
                                : "#1e293b"
                          }
                          strokeWidth={1}
                        >
                          {status === "active" && (
                            <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
                          )}
                        </rect>
                      </g>
                    );
                  })}
                  {/* Legend */}
                  <circle cx={POOL_X + 15} cy={POOL_Y + BOX_H + 30} r={4} fill="#064e3b" stroke="#10b981" strokeWidth={1} />
                  <text x={POOL_X + 24} y={POOL_Y + BOX_H + 33} fill="#64748b" fontSize={8}>active ({currentStep.stats.activeConns})</text>
                  <circle cx={POOL_X + 95} cy={POOL_Y + BOX_H + 30} r={4} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                  <text x={POOL_X + 104} y={POOL_Y + BOX_H + 33} fill="#64748b" fontSize={8}>idle ({currentStep.stats.idleConns})</text>
                </>
              )}

              {/* ── Database Box ── */}
              <rect x={DB_X} y={DB_Y} width={BOX_W} height={BOX_H} rx={8} fill="#0f172a" stroke="#334155" strokeWidth={1.5} />
              <text x={DB_X + BOX_W / 2} y={DB_Y + 20} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={700}>
                PostgreSQL
              </text>
              <text x={DB_X + BOX_W / 2} y={DB_Y + 38} textAnchor="middle" fill="#64748b" fontSize={9}>
                max_connections: 100
              </text>
              {/* DB active indicator */}
              {(currentStep.activePhase === "query" || currentStep.activePhase === "response" || currentStep.activePhase === "auth") && (
                <rect x={DB_X + 15} y={DB_Y + 55} width={BOX_W - 30} height={20} rx={4} fill={phaseColors.fill} stroke={phaseColors.stroke} strokeWidth={1}>
                  <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                </rect>
              )}
              {currentStep.activePhase === "exhaustion" && (
                <>
                  <rect x={DB_X + 15} y={DB_Y + 55} width={BOX_W - 30} height={20} rx={4} fill="#450a0a" stroke="#ef4444" strokeWidth={1} />
                  <text x={DB_X + BOX_W / 2} y={DB_Y + 68} textAnchor="middle" fill="#f87171" fontSize={8} fontWeight={600}>
                    100/100 MAX
                  </text>
                </>
              )}

              {/* ── Arrows ── */}
              {/* Without pooling: direct App -> DB */}
              {!showPool && (
                <>
                  {/* Forward path */}
                  <line
                    x1={APP_X + BOX_W}
                    y1={APP_Y + BOX_H / 2 - 10}
                    x2={DB_X}
                    y2={DB_Y + BOX_H / 2 - 10}
                    stroke={currentStep.activeArrows.length > 0 && (currentStep.activeArrows.includes("app-db-tcp") || currentStep.activeArrows.includes("app-db-tls") || currentStep.activeArrows.includes("app-db-auth") || currentStep.activeArrows.includes("app-db-query") || currentStep.activeArrows.includes("app-db-close")) ? phaseColors.stroke : "#334155"}
                    strokeWidth={currentStep.activeArrows.length > 0 ? 2.5 : 1.5}
                    strokeDasharray={currentStep.activeArrows.length > 0 ? "8 4" : "6 4"}
                    markerEnd={currentStep.activeArrows.length > 0 ? "url(#cpArrowActive)" : "url(#cpArrow)"}
                  >
                    {currentStep.activeArrows.length > 0 && (
                      <animate attributeName="stroke-dashoffset" values="0;-24" dur="0.8s" repeatCount="indefinite" />
                    )}
                  </line>
                  {/* Return path */}
                  <line
                    x1={DB_X}
                    y1={DB_Y + BOX_H / 2 + 10}
                    x2={APP_X + BOX_W}
                    y2={APP_Y + BOX_H / 2 + 10}
                    stroke={currentStep.activeArrows.includes("db-app-response") ? phaseColors.stroke : "#334155"}
                    strokeWidth={currentStep.activeArrows.includes("db-app-response") ? 2.5 : 1.5}
                    strokeDasharray={currentStep.activeArrows.includes("db-app-response") ? "8 4" : "6 4"}
                    markerEnd={currentStep.activeArrows.includes("db-app-response") ? "url(#cpArrowActive)" : "url(#cpArrow)"}
                  >
                    {currentStep.activeArrows.includes("db-app-response") && (
                      <animate attributeName="stroke-dashoffset" values="0;24" dur="0.8s" repeatCount="indefinite" />
                    )}
                  </line>
                  {/* Phase label on arrow */}
                  {currentStep.activePhase !== "idle" && currentStep.activePhase !== "exhaustion" && (
                    <text
                      x={(APP_X + BOX_W + DB_X) / 2}
                      y={APP_Y + BOX_H / 2 - 25}
                      textAnchor="middle"
                      fill={phaseColors.text}
                      fontSize={10}
                      fontWeight={700}
                    >
                      {currentStep.activePhase === "connect" ? "TCP + TLS" : currentStep.activePhase === "auth" ? "AUTH" : currentStep.activePhase === "query" ? "QUERY" : currentStep.activePhase === "response" ? "RESPONSE" : "CLOSE"}
                    </text>
                  )}
                </>
              )}

              {/* With pooling: App -> Pool -> DB */}
              {showPool && (
                <>
                  {/* App -> Pool */}
                  <line
                    x1={APP_X + BOX_W}
                    y1={APP_Y + BOX_H / 2}
                    x2={POOL_X}
                    y2={POOL_Y + (BOX_H + 40) / 2}
                    stroke={
                      currentStep.activeArrows.includes("app-pool-request") || currentStep.activeArrows.includes("app-pool-return") || currentStep.activeArrows.includes("app-pool-queue")
                        ? phaseColors.stroke
                        : "#334155"
                    }
                    strokeWidth={currentStep.activeArrows.some((a) => a.startsWith("app-pool") || a.startsWith("pool-app")) ? 2.5 : 1.5}
                    strokeDasharray="8 4"
                    markerEnd={currentStep.activeArrows.some((a) => a.startsWith("app-pool")) ? "url(#cpArrowActive)" : "url(#cpArrow)"}
                  >
                    {currentStep.activeArrows.some((a) => a.startsWith("app-pool")) && (
                      <animate attributeName="stroke-dashoffset" values="0;-24" dur="0.8s" repeatCount="indefinite" />
                    )}
                  </line>
                  {/* Pool -> App (borrow) */}
                  {currentStep.activeArrows.includes("pool-app-conn") && (
                    <line
                      x1={POOL_X}
                      y1={POOL_Y + (BOX_H + 40) / 2 + 15}
                      x2={APP_X + BOX_W}
                      y2={APP_Y + BOX_H / 2 + 15}
                      stroke={phaseColors.stroke}
                      strokeWidth={2.5}
                      strokeDasharray="8 4"
                      markerEnd="url(#cpArrowActive)"
                    >
                      <animate attributeName="stroke-dashoffset" values="0;24" dur="0.8s" repeatCount="indefinite" />
                    </line>
                  )}
                  {/* Pool -> DB */}
                  <line
                    x1={POOL_X + BOX_W + 20}
                    y1={POOL_Y + (BOX_H + 40) / 2}
                    x2={DB_X}
                    y2={DB_Y + BOX_H / 2}
                    stroke={
                      currentStep.activeArrows.includes("pool-db-init") || currentStep.activeArrows.includes("app-db-query")
                        ? phaseColors.stroke
                        : "#334155"
                    }
                    strokeWidth={currentStep.activeArrows.includes("pool-db-init") || currentStep.activeArrows.includes("app-db-query") ? 2.5 : 1.5}
                    strokeDasharray="8 4"
                    markerEnd={currentStep.activeArrows.includes("pool-db-init") || currentStep.activeArrows.includes("app-db-query") ? "url(#cpArrowActive)" : "url(#cpArrow)"}
                  >
                    {(currentStep.activeArrows.includes("pool-db-init") || currentStep.activeArrows.includes("app-db-query")) && (
                      <animate attributeName="stroke-dashoffset" values="0;-24" dur="0.8s" repeatCount="indefinite" />
                    )}
                  </line>
                  {/* DB -> Pool return */}
                  {currentStep.activeArrows.includes("db-app-response") && (
                    <line
                      x1={DB_X}
                      y1={DB_Y + BOX_H / 2 + 15}
                      x2={POOL_X + BOX_W + 20}
                      y2={POOL_Y + (BOX_H + 40) / 2 + 15}
                      stroke={phaseColors.stroke}
                      strokeWidth={2.5}
                      strokeDasharray="8 4"
                      markerEnd="url(#cpArrowActive)"
                    >
                      <animate attributeName="stroke-dashoffset" values="0;24" dur="0.8s" repeatCount="indefinite" />
                    </line>
                  )}
                  {/* Phase label */}
                  {currentStep.activePhase !== "idle" && (
                    <text
                      x={POOL_X + (BOX_W + 20) / 2}
                      y={POOL_Y - 10}
                      textAnchor="middle"
                      fill={phaseColors.text}
                      fontSize={10}
                      fontWeight={700}
                    >
                      {currentStep.activePhase === "borrow" ? "BORROW" : currentStep.activePhase === "return" ? "RETURN" : currentStep.activePhase === "queue" ? "QUEUED" : currentStep.activePhase === "query" ? "QUERY" : currentStep.activePhase === "response" ? "RESPONSE" : "INIT"}
                    </text>
                  )}
                </>
              )}

              {/* ── Stats bar ── */}
              <rect x={80} y={400} width={SVG_W - 160} height={60} rx={8} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
              <text x={SVG_W / 2} y={418} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight={600}>
                Connection Statistics
              </text>
              {[
                { label: "Active", value: String(currentStep.stats.activeConns), color: "#10b981" },
                { label: "Idle", value: String(currentStep.stats.idleConns), color: "#475569" },
                { label: "Queued", value: String(currentStep.stats.queuedRequests), color: currentStep.stats.queuedRequests > 0 ? "#ef4444" : "#475569" },
                { label: "Latency", value: currentStep.stats.latencyMs, color: currentStep.stats.latencyMs.includes("TIMEOUT") ? "#ef4444" : "#3b82f6" },
              ].map((stat, i) => (
                <g key={stat.label}>
                  <text x={160 + i * 200} y={443} textAnchor="middle" fill="#64748b" fontSize={8}>
                    {stat.label}
                  </text>
                  <text x={160 + i * 200} y={455} textAnchor="middle" fill={stat.color} fontSize={11} fontWeight={700} fontFamily="monospace">
                    {stat.value}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Step description bar */}
          <div className="border-t border-border/30 bg-elevated/50 backdrop-blur-sm px-4 py-3">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 shrink-0 rounded-xl px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  currentStep.activePhase === "exhaustion" || currentStep.activePhase === "close"
                    ? "bg-red-500/10 text-red-400"
                    : currentStep.activePhase === "query" || currentStep.activePhase === "response"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : currentStep.activePhase === "queue"
                        ? "bg-amber-500/10 text-amber-400"
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

export default ConnectionPoolingCanvas;
