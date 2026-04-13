"use client";

import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────

export type CachingPattern =
  | "cache-aside"
  | "write-through"
  | "write-behind";

export type InvalidationStrategy = "ttl" | "event-based" | "manual";

export interface CachingPatternsCanvasProps {
  selectedPattern: CachingPattern;
  onPatternChange: (p: CachingPattern) => void;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onStep: () => void;
  onStepBack: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

// ── Step definitions per pattern ─────────────────────────────────

interface CacheStep {
  id: number;
  label: string;
  description: string;
  /** Which component is "active" (glowing) */
  activeComponent: "app" | "cache" | "db" | "queue" | null;
  /** Which arrow is animating */
  activeArrow: "app-cache" | "cache-app" | "app-db" | "db-app" | "db-cache" | "cache-db" | "cache-queue" | "queue-db" | null;
  /** Direction hint for the arrow */
  arrowDirection: "right" | "left" | "down" | null;
  /** Cache state: hit, miss, populated, stale */
  cacheState: "empty" | "miss" | "hit" | "populated" | "updated" | "stale";
  /** DB state */
  dbState: "idle" | "reading" | "writing" | "synced" | "stale";
  /** Latency label */
  latency?: string;
}

function getCacheAsideSteps(): CacheStep[] {
  return [
    {
      id: 0,
      label: "Request arrives",
      description: "Application receives GET request for user:123.",
      activeComponent: "app",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "empty",
      dbState: "idle",
      latency: undefined,
    },
    {
      id: 1,
      label: "Check cache",
      description: "App checks Redis for key 'user:123'. Cache is empty.",
      activeComponent: "cache",
      activeArrow: "app-cache",
      arrowDirection: "right",
      cacheState: "miss",
      dbState: "idle",
      latency: "~1ms",
    },
    {
      id: 2,
      label: "Cache MISS",
      description: "Key not found in cache. Redis returns null. Must fall back to database.",
      activeComponent: "cache",
      activeArrow: "cache-app",
      arrowDirection: "left",
      cacheState: "miss",
      dbState: "idle",
      latency: "~1ms",
    },
    {
      id: 3,
      label: "Read from DB",
      description: "App queries PostgreSQL: SELECT * FROM users WHERE id = 123.",
      activeComponent: "db",
      activeArrow: "app-db",
      arrowDirection: "right",
      cacheState: "miss",
      dbState: "reading",
      latency: "~15ms",
    },
    {
      id: 4,
      label: "DB returns data",
      description: "PostgreSQL returns {id: 123, name: 'Alice', email: 'alice@...'} from disk.",
      activeComponent: "app",
      activeArrow: "db-app",
      arrowDirection: "left",
      cacheState: "miss",
      dbState: "synced",
      latency: "~15ms",
    },
    {
      id: 5,
      label: "Populate cache",
      description: "App writes result to Redis: SET user:123 '{...}' EX 300 (5 min TTL).",
      activeComponent: "cache",
      activeArrow: "app-cache",
      arrowDirection: "right",
      cacheState: "populated",
      dbState: "synced",
      latency: "~1ms",
    },
    {
      id: 6,
      label: "Return to client",
      description: "Response sent. Total latency: ~17ms (cache miss path). Next request will be faster.",
      activeComponent: "app",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "populated",
      dbState: "synced",
      latency: "~17ms total",
    },
    {
      id: 7,
      label: "Second request arrives",
      description: "Another GET for user:123. Let's check cache again.",
      activeComponent: "app",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "populated",
      dbState: "synced",
    },
    {
      id: 8,
      label: "Cache HIT!",
      description: "Redis has the data! Returns immediately. No database query needed.",
      activeComponent: "cache",
      activeArrow: "app-cache",
      arrowDirection: "right",
      cacheState: "hit",
      dbState: "idle",
      latency: "~1ms",
    },
    {
      id: 9,
      label: "Fast response",
      description: "Total latency: ~1ms (cache hit path). That's 17x faster than the first request!",
      activeComponent: "app",
      activeArrow: "cache-app",
      arrowDirection: "left",
      cacheState: "hit",
      dbState: "idle",
      latency: "~1ms total",
    },
  ];
}

function getWriteThroughSteps(): CacheStep[] {
  return [
    {
      id: 0,
      label: "Write request arrives",
      description: "Application receives PUT request to update user:123's email.",
      activeComponent: "app",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "empty",
      dbState: "idle",
    },
    {
      id: 1,
      label: "Write to cache",
      description: "App writes updated data to Redis first: SET user:123 '{...new email...}'.",
      activeComponent: "cache",
      activeArrow: "app-cache",
      arrowDirection: "right",
      cacheState: "updated",
      dbState: "idle",
      latency: "~1ms",
    },
    {
      id: 2,
      label: "Write to database",
      description: "App ALSO writes to PostgreSQL: UPDATE users SET email = '...' WHERE id = 123.",
      activeComponent: "db",
      activeArrow: "app-db",
      arrowDirection: "right",
      cacheState: "updated",
      dbState: "writing",
      latency: "~10ms",
    },
    {
      id: 3,
      label: "Both in sync",
      description: "Cache and DB now have identical data. Strong consistency guaranteed.",
      activeComponent: null,
      activeArrow: null,
      arrowDirection: null,
      cacheState: "populated",
      dbState: "synced",
      latency: "~11ms total",
    },
    {
      id: 4,
      label: "Read request",
      description: "GET user:123. Cache always has fresh data because every write goes through it.",
      activeComponent: "cache",
      activeArrow: "app-cache",
      arrowDirection: "right",
      cacheState: "hit",
      dbState: "synced",
      latency: "~1ms",
    },
    {
      id: 5,
      label: "Always consistent",
      description: "Cache hit returns the latest data. Trade-off: writes are slower (cache + DB) but reads are always consistent.",
      activeComponent: "app",
      activeArrow: "cache-app",
      arrowDirection: "left",
      cacheState: "hit",
      dbState: "synced",
      latency: "~1ms read",
    },
  ];
}

function getWriteBehindSteps(): CacheStep[] {
  return [
    {
      id: 0,
      label: "Write request arrives",
      description: "Application receives PUT request to update user:123's email.",
      activeComponent: "app",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "empty",
      dbState: "idle",
    },
    {
      id: 1,
      label: "Write to cache only",
      description: "App writes to Redis immediately. Response can be sent NOW -- ultra-fast write.",
      activeComponent: "cache",
      activeArrow: "app-cache",
      arrowDirection: "right",
      cacheState: "updated",
      dbState: "stale",
      latency: "~1ms",
    },
    {
      id: 2,
      label: "Ack to client",
      description: "Client gets 200 OK. Write appears complete. But DB hasn't been updated yet!",
      activeComponent: "app",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "updated",
      dbState: "stale",
      latency: "~1ms total",
    },
    {
      id: 3,
      label: "Enqueue async write",
      description: "Cache adds write to an async queue (e.g., Redis Streams, Kafka). DB will be updated later.",
      activeComponent: "queue",
      activeArrow: "cache-queue",
      arrowDirection: "down",
      cacheState: "updated",
      dbState: "stale",
      latency: "async",
    },
    {
      id: 4,
      label: "Async flush to DB",
      description: "Queue consumer processes the write and updates PostgreSQL in the background.",
      activeComponent: "db",
      activeArrow: "queue-db",
      arrowDirection: "right",
      cacheState: "populated",
      dbState: "writing",
      latency: "~10ms (background)",
    },
    {
      id: 5,
      label: "Eventually consistent",
      description: "DB is now updated. Trade-off: blazing fast writes, but risk of data loss if cache crashes before flush!",
      activeComponent: null,
      activeArrow: null,
      arrowDirection: null,
      cacheState: "populated",
      dbState: "synced",
      latency: "eventual",
    },
    {
      id: 6,
      label: "Crash scenario",
      description: "If Redis crashes BEFORE flushing to DB, the write is LOST. This is the risk of write-behind caching.",
      activeComponent: "cache",
      activeArrow: null,
      arrowDirection: null,
      cacheState: "miss",
      dbState: "stale",
      latency: "DATA LOSS!",
    },
  ];
}

export function getStepsForPattern(pattern: CachingPattern): CacheStep[] {
  switch (pattern) {
    case "cache-aside":
      return getCacheAsideSteps();
    case "write-through":
      return getWriteThroughSteps();
    case "write-behind":
      return getWriteBehindSteps();
  }
}

// ── Invalidation data ────────────────────────────────────────────

interface InvalidationInfo {
  id: InvalidationStrategy;
  name: string;
  icon: string;
  description: string;
  redis: string;
  pros: string[];
  cons: string[];
}

const INVALIDATION_STRATEGIES: InvalidationInfo[] = [
  {
    id: "ttl",
    name: "TTL (Time-to-Live)",
    icon: "clock",
    description: "Set an expiration time on each cache entry. After TTL expires, the key is automatically deleted.",
    redis: "SET user:123 '{...}' EX 300  -- expires in 5 min",
    pros: ["Simple to implement", "Self-cleaning cache", "Good for data that changes on a schedule"],
    cons: ["Stale data until TTL expires", "Hard to pick the right TTL value", "Cache stampede on popular key expiry"],
  },
  {
    id: "event-based",
    name: "Event-Based (On Write)",
    icon: "zap",
    description: "When data changes in the DB, an event (CDC, trigger, pub/sub) invalidates or updates the cache.",
    redis: "-- On DB write:\nDEL user:123  -- or PUBLISH invalidate user:123",
    pros: ["Near-real-time consistency", "No stale windows", "Works great with event-driven architectures"],
    cons: ["Complex infrastructure (CDC/triggers)", "Event delivery not guaranteed", "Ordering issues with concurrent writes"],
  },
  {
    id: "manual",
    name: "Manual (Explicit Clear)",
    icon: "trash",
    description: "Application code explicitly deletes or updates cache entries when it knows data has changed.",
    redis: "// In your update handler:\nawait db.update(user);\nawait redis.del(`user:${id}`);",
    pros: ["Full control", "Simple mental model", "No extra infrastructure"],
    cons: ["Easy to forget a code path", "Scattered invalidation logic", "Race conditions between delete and re-populate"],
  },
];

// ── Component boxes ─────────────────────────────────────────────

const CACHE_STATE_COLORS: Record<CacheStep["cacheState"], { bg: string; border: string; glow: string; label: string }> = {
  empty: { bg: "bg-elevated/50", border: "border-border/30", glow: "", label: "Empty" },
  miss: { bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]", label: "MISS" },
  hit: { bg: "bg-emerald-950", border: "border-emerald-500", glow: "shadow-[0_0_20px_rgba(16,185,129,0.5)]", label: "HIT" },
  populated: { bg: "bg-emerald-500/5", border: "border-emerald-500/30", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]", label: "Cached" },
  updated: { bg: "bg-blue-950", border: "border-blue-500", glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]", label: "Updated" },
  stale: { bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]", label: "Stale" },
};

const DB_STATE_COLORS: Record<CacheStep["dbState"], { bg: string; border: string; label: string }> = {
  idle: { bg: "bg-elevated/50", border: "border-border/30", label: "Idle" },
  reading: { bg: "bg-blue-950", border: "border-blue-500", label: "Reading" },
  writing: { bg: "bg-violet-950", border: "border-violet-500", label: "Writing" },
  synced: { bg: "bg-emerald-500/5", border: "border-emerald-500/30", label: "Synced" },
  stale: { bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Stale" },
};

// ── Arrow SVG helpers ────────────────────────────────────────────

interface ArrowDef {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Positions in % of the SVG viewport (we use a 1000x500 viewBox)
const COMPONENT_POS = {
  app: { cx: 150, cy: 180 },
  cache: { cx: 500, cy: 120 },
  db: { cx: 850, cy: 120 },
  queue: { cx: 500, cy: 360 },
} as const;

function getArrowCoords(arrowId: CacheStep["activeArrow"]): ArrowDef | null {
  if (!arrowId) return null;
  const [fromKey, toKey] = arrowId.split("-") as [keyof typeof COMPONENT_POS, keyof typeof COMPONENT_POS];
  const from = COMPONENT_POS[fromKey];
  const to = COMPONENT_POS[toKey];
  if (!from || !to) return null;
  return { x1: from.cx, y1: from.cy, x2: to.cx, y2: to.cy };
}

// ── Canvas ──────────────────────────────────────────────────────

const CachingPatternsCanvas = memo(function CachingPatternsCanvas({
  selectedPattern,
  onPatternChange,
  stepIndex,
  totalSteps,
  isPlaying,
  onStep,
  onStepBack,
  onPlay,
  onPause,
  onReset,
}: CachingPatternsCanvasProps) {
  const steps = getStepsForPattern(selectedPattern);
  const currentStep = steps[stepIndex] ?? steps[0];

  const [showInvalidation, setShowInvalidation] = useState(false);
  const [selectedInvalidation, setSelectedInvalidation] = useState<InvalidationStrategy>("ttl");

  const cacheColors = CACHE_STATE_COLORS[currentStep.cacheState];
  const dbColors = DB_STATE_COLORS[currentStep.dbState];

  const activeArrowCoords = getArrowCoords(currentStep.activeArrow);

  const showQueue = selectedPattern === "write-behind";

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-elevated/80 to-background">
      {/* Top bar: pattern info + invalidation toggle */}
      <div className="flex items-center justify-between border-b border-border/30 bg-elevated/30 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {selectedPattern.replace(/-/g, " ")}
          </span>
          <span className="text-xs text-foreground-muted">
            Step {stepIndex + 1} / {steps.length}
          </span>
          {currentStep.latency && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                currentStep.latency.includes("LOSS")
                  ? "bg-red-500/15 text-red-400"
                  : currentStep.latency.includes("async") || currentStep.latency.includes("eventual")
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-emerald-500/10 text-emerald-400",
              )}
            >
              {currentStep.latency}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowInvalidation(!showInvalidation)}
          className={cn(
            "rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
            showInvalidation
              ? "bg-violet-500/10 text-violet-400 border border-violet-500/30"
              : "bg-elevated/50 backdrop-blur-sm text-foreground-muted hover:text-foreground border border-border/30",
          )}
        >
          {showInvalidation ? "Show Caching Patterns" : "Show Invalidation"}
        </button>
      </div>

      {showInvalidation ? (
        /* ── Invalidation view ────────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* The joke */}
            <div className="rounded-xl border border-amber-500/30/50 bg-amber-500/10/20 p-4 text-center">
              <p className="text-sm italic text-amber-300">
                &quot;There are only two hard things in Computer Science:
                cache invalidation and naming things.&quot;
              </p>
              <p className="mt-1 text-[10px] text-amber-500">-- Phil Karlton</p>
            </div>

            {/* Strategy selector */}
            <div className="flex gap-2">
              {INVALIDATION_STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedInvalidation(s.id)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-left transition-all",
                    selectedInvalidation === s.id
                      ? "border-violet-500/30 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                      : "border-border/30 bg-elevated/50 backdrop-blur-sm hover:border-foreground-subtle",
                  )}
                >
                  <span className="block text-xs font-bold text-foreground">
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-foreground-subtle">
                    {s.id === "ttl" ? "Time-based expiry" : s.id === "event-based" ? "On data change" : "Explicit delete"}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected strategy detail */}
            {(() => {
              const info = INVALIDATION_STRATEGIES.find((s) => s.id === selectedInvalidation)!;
              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4">
                    <p className="text-sm text-foreground-muted">{info.description}</p>
                    <div className="mt-3 rounded-xl bg-black/50 p-3">
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-emerald-400">
                        {info.redis}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-3">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Pros
                      </span>
                      <ul className="space-y-1">
                        {info.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground-subtle">
                            <span className="mt-0.5 text-emerald-500">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-red-500/30/50 bg-red-500/10/10 p-3">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-red-400">
                        Cons
                      </span>
                      <ul className="space-y-1">
                        {info.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground-subtle">
                            <span className="mt-0.5 text-red-500">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Comparison table */}
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border/30 bg-black/30">
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Strategy</th>
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Consistency</th>
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Complexity</th>
                          <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Best For</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={cn("border-b border-border/30", selectedInvalidation === "ttl" && "bg-violet-500/5")}>
                          <td className="px-3 py-2 font-medium text-foreground">TTL</td>
                          <td className="px-3 py-2 text-amber-400">Eventual</td>
                          <td className="px-3 py-2 text-emerald-400">Low</td>
                          <td className="px-3 py-2 text-foreground-subtle">Config data, session data</td>
                        </tr>
                        <tr className={cn("border-b border-border/30", selectedInvalidation === "event-based" && "bg-violet-500/5")}>
                          <td className="px-3 py-2 font-medium text-foreground">Event-Based</td>
                          <td className="px-3 py-2 text-emerald-400">Near-RT</td>
                          <td className="px-3 py-2 text-red-400">High</td>
                          <td className="px-3 py-2 text-foreground-subtle">User profiles, inventory</td>
                        </tr>
                        <tr className={cn(selectedInvalidation === "manual" && "bg-violet-500/5")}>
                          <td className="px-3 py-2 font-medium text-foreground">Manual</td>
                          <td className="px-3 py-2 text-emerald-400">Immediate</td>
                          <td className="px-3 py-2 text-amber-400">Medium</td>
                          <td className="px-3 py-2 text-foreground-subtle">CRUD APIs, admin panels</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* ── Caching pattern animation view ───────────────────── */
        <div className="flex flex-1 flex-col">
          {/* Architecture diagram */}
          <div className="relative flex-1 p-4">
            <svg
              viewBox="0 0 1000 480"
              className="h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Defs for arrow markers and gradients */}
              <defs>
                <marker
                  id="arrowGreen"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker
                  id="arrowRed"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
                <marker
                  id="arrowBlue"
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
                  id="arrowAmber"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrowGray"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" />
                </marker>

                {/* Animated dash pattern */}
                <filter id="glowGreen">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowRed">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowBlue">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Static connection lines (gray, always visible) ── */}
              {/* App -> Cache */}
              <line
                x1={220}
                y1={180}
                x2={420}
                y2={130}
                stroke="#3f3f46"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                markerEnd="url(#arrowGray)"
              />
              {/* Cache -> DB */}
              <line
                x1={580}
                y1={120}
                x2={770}
                y2={120}
                stroke="#3f3f46"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                markerEnd="url(#arrowGray)"
              />
              {/* App -> DB (direct) */}
              <line
                x1={220}
                y1={200}
                x2={770}
                y2={140}
                stroke="#3f3f46"
                strokeWidth={1}
                strokeDasharray="4 6"
                opacity={0.3}
              />

              {/* Queue connections (write-behind only) */}
              {showQueue && (
                <>
                  <line
                    x1={500}
                    y1={170}
                    x2={500}
                    y2={310}
                    stroke="#3f3f46"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    markerEnd="url(#arrowGray)"
                  />
                  <line
                    x1={580}
                    y1={360}
                    x2={770}
                    y2={160}
                    stroke="#3f3f46"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    markerEnd="url(#arrowGray)"
                  />
                </>
              )}

              {/* ── Active arrow (animated, colored) ── */}
              {activeArrowCoords && (
                <line
                  x1={activeArrowCoords.x1 + (activeArrowCoords.x1 < activeArrowCoords.x2 ? 70 : -70)}
                  y1={activeArrowCoords.y1}
                  x2={activeArrowCoords.x2 + (activeArrowCoords.x2 < activeArrowCoords.x1 ? 70 : -70)}
                  y2={activeArrowCoords.y2}
                  stroke={
                    currentStep.cacheState === "miss"
                      ? "#ef4444"
                      : currentStep.cacheState === "hit"
                        ? "#10b981"
                        : currentStep.dbState === "writing"
                          ? "#8b5cf6"
                          : "#3b82f6"
                  }
                  strokeWidth={3}
                  markerEnd={
                    currentStep.cacheState === "miss"
                      ? "url(#arrowRed)"
                      : currentStep.cacheState === "hit"
                        ? "url(#arrowGreen)"
                        : "url(#arrowBlue)"
                  }
                  className="animate-pulse"
                  opacity={0.9}
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                </line>
              )}

              {/* ── App box ── */}
              <g>
                <rect
                  x={70}
                  y={130}
                  width={160}
                  height={100}
                  rx={12}
                  className={cn(
                    "transition-all duration-300",
                    currentStep.activeComponent === "app"
                      ? "fill-blue-950 stroke-blue-500"
                      : "fill-zinc-900 stroke-zinc-700",
                  )}
                  strokeWidth={currentStep.activeComponent === "app" ? 2.5 : 1.5}
                  filter={currentStep.activeComponent === "app" ? "url(#glowBlue)" : undefined}
                />
                <text x={150} y={165} textAnchor="middle" className="fill-blue-400 text-[11px] font-bold">
                  Application
                </text>
                <text x={150} y={185} textAnchor="middle" className="fill-zinc-400 text-[10px]">
                  Node.js / Python
                </text>
                <text x={150} y={205} textAnchor="middle" className="fill-zinc-500 text-[9px] font-mono">
                  GET /api/users/123
                </text>
              </g>

              {/* ── Cache (Redis) box ── */}
              <g>
                <rect
                  x={420}
                  y={70}
                  width={160}
                  height={100}
                  rx={12}
                  className="transition-all duration-300"
                  fill={
                    currentStep.cacheState === "miss"
                      ? "#1c0a0a"
                      : currentStep.cacheState === "hit"
                        ? "#022c22"
                        : currentStep.cacheState === "updated"
                          ? "#0c1a3d"
                          : currentStep.cacheState === "populated"
                            ? "#0a2818"
                            : currentStep.cacheState === "stale"
                              ? "#2d1a00"
                              : "#18181b"
                  }
                  stroke={
                    currentStep.cacheState === "miss"
                      ? "#dc2626"
                      : currentStep.cacheState === "hit"
                        ? "#10b981"
                        : currentStep.cacheState === "updated"
                          ? "#3b82f6"
                          : currentStep.cacheState === "populated"
                            ? "#047857"
                            : currentStep.cacheState === "stale"
                              ? "#d97706"
                              : "#3f3f46"
                  }
                  strokeWidth={currentStep.activeComponent === "cache" ? 2.5 : 1.5}
                  filter={
                    currentStep.activeComponent === "cache"
                      ? currentStep.cacheState === "miss"
                        ? "url(#glowRed)"
                        : "url(#glowGreen)"
                      : undefined
                  }
                />
                <text x={500} y={100} textAnchor="middle" className="fill-red-400 text-[11px] font-bold">
                  Cache (Redis)
                </text>
                <text x={500} y={120} textAnchor="middle" className="fill-zinc-400 text-[10px]">
                  In-Memory Store
                </text>
                {/* Cache state badge */}
                <rect
                  x={460}
                  y={132}
                  width={80}
                  height={22}
                  rx={6}
                  fill={
                    currentStep.cacheState === "miss"
                      ? "#7f1d1d"
                      : currentStep.cacheState === "hit"
                        ? "#064e3b"
                        : currentStep.cacheState === "updated"
                          ? "#1e3a5f"
                          : currentStep.cacheState === "populated"
                            ? "#064e3b"
                            : currentStep.cacheState === "stale"
                              ? "#78350f"
                              : "#27272a"
                  }
                  opacity={0.8}
                />
                <text
                  x={500}
                  y={147}
                  textAnchor="middle"
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    currentStep.cacheState === "miss"
                      ? "fill-red-400"
                      : currentStep.cacheState === "hit"
                        ? "fill-emerald-400"
                        : currentStep.cacheState === "updated"
                          ? "fill-blue-400"
                          : currentStep.cacheState === "populated"
                            ? "fill-emerald-500"
                            : currentStep.cacheState === "stale"
                              ? "fill-amber-400"
                              : "fill-zinc-500",
                  )}
                >
                  {cacheColors.label}
                </text>
              </g>

              {/* ── Database (PostgreSQL) box ── */}
              <g>
                <rect
                  x={770}
                  y={70}
                  width={160}
                  height={100}
                  rx={12}
                  className="transition-all duration-300"
                  fill={
                    currentStep.dbState === "reading"
                      ? "#0c1a3d"
                      : currentStep.dbState === "writing"
                        ? "#1a0a2e"
                        : currentStep.dbState === "synced"
                          ? "#0a2818"
                          : currentStep.dbState === "stale"
                            ? "#2d1a00"
                            : "#18181b"
                  }
                  stroke={
                    currentStep.dbState === "reading"
                      ? "#3b82f6"
                      : currentStep.dbState === "writing"
                        ? "#8b5cf6"
                        : currentStep.dbState === "synced"
                          ? "#047857"
                          : currentStep.dbState === "stale"
                            ? "#d97706"
                            : "#3f3f46"
                  }
                  strokeWidth={currentStep.activeComponent === "db" ? 2.5 : 1.5}
                  filter={currentStep.activeComponent === "db" ? "url(#glowBlue)" : undefined}
                />
                <text x={850} y={100} textAnchor="middle" className="fill-blue-400 text-[11px] font-bold">
                  Database (PostgreSQL)
                </text>
                <text x={850} y={120} textAnchor="middle" className="fill-zinc-400 text-[10px]">
                  Persistent Storage
                </text>
                <rect
                  x={810}
                  y={132}
                  width={80}
                  height={22}
                  rx={6}
                  fill={
                    currentStep.dbState === "reading"
                      ? "#1e3a5f"
                      : currentStep.dbState === "writing"
                        ? "#2e1065"
                        : currentStep.dbState === "synced"
                          ? "#064e3b"
                          : currentStep.dbState === "stale"
                            ? "#78350f"
                            : "#27272a"
                  }
                  opacity={0.8}
                />
                <text
                  x={850}
                  y={147}
                  textAnchor="middle"
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    currentStep.dbState === "reading"
                      ? "fill-blue-400"
                      : currentStep.dbState === "writing"
                        ? "fill-violet-400"
                        : currentStep.dbState === "synced"
                          ? "fill-emerald-400"
                          : currentStep.dbState === "stale"
                            ? "fill-amber-400"
                            : "fill-zinc-500",
                  )}
                >
                  {dbColors.label}
                </text>
              </g>

              {/* ── Async Queue box (write-behind only) ── */}
              {showQueue && (
                <g>
                  <rect
                    x={420}
                    y={310}
                    width={160}
                    height={90}
                    rx={12}
                    className="transition-all duration-300"
                    fill={currentStep.activeComponent === "queue" ? "#1a0a2e" : "#18181b"}
                    stroke={currentStep.activeComponent === "queue" ? "#8b5cf6" : "#3f3f46"}
                    strokeWidth={currentStep.activeComponent === "queue" ? 2.5 : 1.5}
                  />
                  <text x={500} y={340} textAnchor="middle" className="fill-violet-400 text-[11px] font-bold">
                    Async Queue
                  </text>
                  <text x={500} y={358} textAnchor="middle" className="fill-zinc-400 text-[10px]">
                    Redis Streams / Kafka
                  </text>
                  <text x={500} y={380} textAnchor="middle" className="fill-zinc-500 text-[9px] font-mono">
                    Background worker
                  </text>
                </g>
              )}

              {/* ── Step description overlay ── */}
              <g>
                <rect
                  x={70}
                  y={showQueue ? 420 : 290}
                  width={860}
                  height={60}
                  rx={10}
                  fill="#09090b"
                  stroke="#27272a"
                  strokeWidth={1}
                  opacity={0.95}
                />
                <text
                  x={500}
                  y={showQueue ? 447 : 317}
                  textAnchor="middle"
                  className="fill-primary text-[13px] font-bold"
                >
                  {currentStep.label}
                </text>
                <text
                  x={500}
                  y={showQueue ? 466 : 336}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[11px]"
                >
                  {currentStep.description.length > 120
                    ? currentStep.description.slice(0, 117) + "..."
                    : currentStep.description}
                </text>
              </g>
            </svg>
          </div>

          {/* Step progress bar */}
          <div className="border-t border-border/30 px-4 py-2">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    i < stepIndex
                      ? "bg-primary"
                      : i === stepIndex
                        ? "bg-primary animate-pulse"
                        : "bg-zinc-800",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CachingPatternsCanvas;

export type { CachingPattern as CachingPatternType };
