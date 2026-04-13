"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  Layers,
  Play,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  unsafeIncrement,
  unsafeIncrementRandom,
  safeIncrement,
  simulateProducerConsumer,
  simulateNaive,
  simulateOrdered,
  simulateEventLoop,
  EVENT_LOOP_DEMOS,
  THREAD_STATES,
  THREAD_STATE_COLORS,
  THREAD_STATE_LABELS,
  TRANSITIONS,
  EXAMPLE_THREADS,
  maxTick,
  GOROUTINE_DEMOS,
  simulateGoroutines,
  simulateReadersWriters,
  simulateSleepingBarber,
  ASYNC_PATTERN_DEMOS,
  simulateAsyncPattern,
  simulateDeadlock,
  simulateDeadlockPrevention,
  simulateSpinLock,
  simulateMutex,
  simulateTTAS,
  computeMetrics,
} from "@/lib/concurrency";
import ThreadPoolSaturationVisualizer from "@/components/modules/concurrency/ThreadPoolSaturationVisualizer";
import type {
  RaceConditionDemo,
  BufferEvent,
  PhilosopherEvent,
  EventLoopStep,
  EventLoopDemoId,
  ThreadState,
  GoroutineDemoId,
  GoroutineStep,
  Goroutine,
  Channel,
  RWEvent,
  BarberEvent,
  AsyncStep,
  AsyncPatternId,
  DeadlockStep,
  MutexStep,
  MutexMetrics,
} from "@/lib/concurrency";

// ── Demo Definitions ────────────────────────────────────────

type ConcurrencyDemo =
  | "race-condition"
  | "producer-consumer"
  | "dining-philosophers"
  | "event-loop"
  | "thread-lifecycle"
  | "go-goroutines"
  | "readers-writers"
  | "sleeping-barber"
  | "async-patterns"
  | "deadlock-demo"
  | "lock-comparison";

interface DemoDef {
  id: ConcurrencyDemo;
  name: string;
  description: string;
}

const DEMOS: DemoDef[] = [
  {
    id: "race-condition",
    name: "Race Condition",
    description:
      "Unsafe vs safe concurrent counter increments. See lost updates.",
  },
  {
    id: "producer-consumer",
    name: "Producer-Consumer",
    description:
      "Bounded buffer with producers and consumers, wait/signal sync.",
  },
  {
    id: "dining-philosophers",
    name: "Dining Philosophers",
    description:
      "Classic deadlock scenario: naive vs resource-ordering strategy.",
  },
  {
    id: "event-loop",
    name: "Event Loop",
    description:
      "Visualize JS call stack, microtask & macrotask queues step-by-step.",
  },
  {
    id: "thread-lifecycle",
    name: "Thread Lifecycle",
    description:
      "7-state thread lifecycle with animated transitions and example timelines.",
  },
  {
    id: "go-goroutines",
    name: "Go Goroutines",
    description:
      "Goroutines, channels, select, WaitGroups, and deadlock visualization.",
  },
  {
    id: "readers-writers",
    name: "Readers-Writers",
    description:
      "Multiple readers share access; writers need exclusive lock. Shows starvation.",
  },
  {
    id: "sleeping-barber",
    name: "Sleeping Barber",
    description:
      "Barber sleeps when idle; customers wake, wait, or leave if full.",
  },
  {
    id: "async-patterns",
    name: "Async Patterns",
    description:
      "Promise.all, race, allSettled, any -- see how each combinator handles resolve/reject.",
  },
  {
    id: "deadlock-demo",
    name: "Deadlock Demo",
    description:
      "Circular wait deadlock vs. resource ordering prevention. Threads and resources visualized.",
  },
  {
    id: "lock-comparison",
    name: "Lock Comparison",
    description:
      "SpinLock vs Mutex vs TTAS: CPU usage, latency, and bus traffic trade-offs visualized.",
  },
];

const PHILOSOPHER_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"];
const PHILOSOPHER_STATES: Record<string, string> = {
  thinking: "#6b7280",
  hungry: "#f59e0b",
  eating: "#22c55e",
  waiting: "#ef4444",
};

// ── Race Condition Visualization ────────────────────────────

const RaceConditionViz = memo(function RaceConditionViz({
  unsafeDemo,
  safeDemo,
  stepIndex,
}: {
  unsafeDemo: RaceConditionDemo;
  safeDemo: RaceConditionDemo;
  stepIndex: number;
}) {
  const visibleUnsafe = unsafeDemo.events.slice(0, stepIndex + 1);
  const visibleSafe = safeDemo.events.slice(0, stepIndex + 1);

  return (
    <div className="flex w-full gap-6 bg-background p-6">
      {/* Unsafe side */}
      <div className="flex-1 rounded-lg border border-red-800/50 bg-red-950/10 p-4">
        <h3 className="mb-1 text-sm font-semibold text-red-400">
          Unsafe (No Lock)
        </h3>
        <p className="mb-3 text-[11px] text-foreground-subtle">
          {unsafeDemo.explanation}
        </p>
        <div className="mb-3 text-center">
          <span className="text-xs text-foreground-subtle">Counter Value</span>
          <div className="font-mono text-3xl font-bold text-red-400">
            {visibleUnsafe.length > 0
              ? visibleUnsafe[visibleUnsafe.length - 1].value
              : 0}
          </div>
          <span className="text-[10px] text-foreground-subtle">
            Expected: {unsafeDemo.expectedValue} | Actual:{" "}
            {unsafeDemo.finalValue}
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto font-mono text-[10px]">
          {visibleUnsafe.map((e, i) => (
            <div
              key={`cc-${i}`}
              className={cn(
                "flex gap-1 border-b border-border/20 py-0.5",
                e.action === "write"
                  ? "text-red-300"
                  : e.action === "read"
                    ? "text-blue-300"
                    : "text-foreground-muted",
              )}
            >
              <span className="w-6 text-foreground-subtle">{e.tick}</span>
              <span className="w-14">{e.threadId}</span>
              <span className="w-10">{e.action}</span>
              <span>{e.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safe side */}
      <div className="flex-1 rounded-lg border border-green-800/50 bg-green-950/10 p-4">
        <h3 className="mb-1 text-sm font-semibold text-green-400">
          Safe (With Mutex)
        </h3>
        <p className="mb-3 text-[11px] text-foreground-subtle">
          {safeDemo.explanation}
        </p>
        <div className="mb-3 text-center">
          <span className="text-xs text-foreground-subtle">Counter Value</span>
          <div className="font-mono text-3xl font-bold text-green-400">
            {visibleSafe.length > 0
              ? visibleSafe[visibleSafe.length - 1].value
              : 0}
          </div>
          <span className="text-[10px] text-foreground-subtle">
            Expected: {safeDemo.expectedValue} | Actual: {safeDemo.finalValue}
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto font-mono text-[10px]">
          {visibleSafe.map((e, i) => (
            <div
              key={`cc-${i}`}
              className={cn(
                "flex gap-1 border-b border-border/20 py-0.5",
                e.action === "lock"
                  ? "text-amber-300"
                  : e.action === "unlock"
                    ? "text-amber-200"
                    : e.action === "write"
                      ? "text-green-300"
                      : e.action === "read"
                        ? "text-blue-300"
                        : "text-foreground-muted",
              )}
            >
              <span className="w-6 text-foreground-subtle">{e.tick}</span>
              <span className="w-14">{e.threadId}</span>
              <span className="w-10">{e.action}</span>
              <span>{e.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Producer-Consumer Visualization ─────────────────────────

const ProducerConsumerViz = memo(function ProducerConsumerViz({
  events,
  stepIndex,
}: {
  events: BufferEvent[];
  stepIndex: number;
}) {
  const currentEvent = events[stepIndex];
  const visibleEvents = events.slice(0, stepIndex + 1);

  return (
    <div className="flex h-full w-full flex-col bg-background p-6">
      {/* Buffer visualization */}
      <div className="mb-4 text-center">
        <h3 className="mb-2 text-sm font-medium text-foreground-muted">
          Bounded Buffer
        </h3>
        {currentEvent && (
          <div className="mx-auto flex items-center justify-center gap-1">
            {Array.from({ length: currentEvent.bufferSize }, (_, i) => {
              const item = currentEvent.bufferState[i];
              return (
                <div
                  key={`cc-${i}`}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-md border-2 font-mono text-sm font-medium transition-colors",
                    item !== undefined
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-elevated text-foreground-subtle",
                  )}
                >
                  {item !== undefined ? item : "-"}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event log */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {visibleEvents.map((e, i) => (
          <div
            key={`cc-${i}`}
            className={cn(
              "flex gap-2 border-b border-border/30 py-1",
              i === stepIndex ? "bg-primary/5" : "",
              e.action === "produce"
                ? "text-green-400"
                : e.action === "consume"
                  ? "text-blue-400"
                  : e.action.includes("wait")
                    ? "text-red-400"
                    : "text-foreground-muted",
            )}
          >
            <span className="w-6 text-foreground-subtle">{e.tick}</span>
            <span className="w-20">{e.actor}</span>
            <span className="w-16">{e.action}</span>
            <span>{e.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Dining Philosophers Visualization ───────────────────────

const DiningPhilosophersViz = memo(function DiningPhilosophersViz({
  naiveEvents,
  orderedEvents,
  stepIndex,
}: {
  naiveEvents: PhilosopherEvent[];
  orderedEvents: PhilosopherEvent[];
  stepIndex: number;
}) {
  const naiveEvent = naiveEvents[Math.min(stepIndex, naiveEvents.length - 1)];
  const orderedEvent = orderedEvents[Math.min(stepIndex, orderedEvents.length - 1)];

  function renderTable(
    event: PhilosopherEvent | undefined,
    label: string,
    borderColor: string,
  ) {
    if (!event) return null;

    const cx = 120;
    const cy = 120;
    const radius = 70;

    return (
      <div className={cn("flex-1 rounded-lg border p-4", borderColor)}>
        <h3 className="mb-2 text-center text-sm font-semibold text-foreground">
          {label}
        </h3>
        {event.deadlock && (
          <div className="mb-2 rounded bg-red-950/50 px-2 py-1 text-center text-xs font-medium text-red-400">
            DEADLOCK DETECTED
          </div>
        )}
        <svg viewBox="0 0 240 240" className="mx-auto h-48 w-48">
          {/* Table circle */}
          <circle
            cx={cx}
            cy={cy}
            r={40}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="2"
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
          >
            Table
          </text>
          {/* Philosophers */}
          {[0, 1, 2, 3, 4].map((id) => {
            const angle = (2 * Math.PI * id) / 5 - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            const state =
              event.philosopherId === id ? event.state : "thinking";
            const color = PHILOSOPHER_STATES[state] ?? "#6b7280";

            // Forks between philosophers
            const forkAngle = (2 * Math.PI * (id + 0.5)) / 5 - Math.PI / 2;
            const fx = cx + 52 * Math.cos(forkAngle);
            const fy = cy + 52 * Math.sin(forkAngle);
            const forkLabel = event.allForkStates[id] ?? "free";
            const forkColor = forkLabel === "free" ? "#4b5563" : "#f59e0b";

            return (
              <g key={id}>
                {/* Fork */}
                <rect
                  x={fx - 4}
                  y={fy - 8}
                  width={8}
                  height={16}
                  rx={2}
                  fill={forkColor}
                  opacity={0.8}
                />
                <text
                  x={fx}
                  y={fy + 16}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="7"
                >
                  {forkLabel}
                </text>
                {/* Philosopher */}
                <circle
                  cx={x}
                  cy={y}
                  r={18}
                  fill={color}
                  opacity={0.8}
                  stroke={id === event.philosopherId ? "#fff" : "none"}
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={y - 3}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="600"
                >
                  P{id}
                </text>
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="7"
                >
                  {id === event.philosopherId
                    ? event.state.slice(0, 5)
                    : "think"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full gap-4 bg-background p-6">
      {renderTable(naiveEvent, "Naive (can deadlock)", "border-red-800/50")}
      {renderTable(orderedEvent, "Ordered (deadlock-free)", "border-green-800/50")}
    </div>
  );
});

// ── Event Loop Visualization ───────────────────────────────

const HIGHLIGHT_COLORS: Record<string, string> = {
  callstack: "ring-blue-500",
  webapi: "ring-yellow-500",
  microtask: "ring-green-500",
  macrotask: "ring-orange-500",
  output: "ring-purple-500",
};

const EventLoopViz = memo(function EventLoopViz({
  steps,
  stepIndex,
  demoId,
  onDemoChange,
}: {
  steps: EventLoopStep[];
  stepIndex: number;
  demoId: EventLoopDemoId;
  onDemoChange: (id: EventLoopDemoId) => void;
}) {
  const step = steps[stepIndex];
  if (!step) return null;

  const demoDef = EVENT_LOOP_DEMOS.find((d) => d.id === demoId);

  return (
    <div className="flex h-full w-full flex-col bg-background p-4 overflow-auto">
      {/* Demo selector + code snippet */}
      <div className="mb-4 flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="mb-2 flex items-center gap-2">
            {EVENT_LOOP_DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => onDemoChange(d.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  demoId === d.id
                    ? "bg-primary/15 text-primary"
                    : "text-foreground-muted hover:bg-elevated hover:text-foreground",
                )}
              >
                {d.title}
              </button>
            ))}
          </div>
          <pre className="rounded-md border border-border bg-elevated px-3 py-2 font-mono text-[11px] text-foreground-muted leading-relaxed whitespace-pre-wrap">
            {demoDef?.code}
          </pre>
          {demoDef && (
            <p className="mt-1 text-[10px] text-foreground-subtle">
              Expected output: <strong className="text-foreground">{demoDef.expectedOutput}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Step description */}
      <div
        className={cn(
          "mb-4 rounded-md border px-3 py-2 text-xs font-medium ring-2 transition-all",
          HIGHLIGHT_COLORS[step.highlight] ?? "ring-transparent",
          "border-border bg-elevated/50",
        )}
      >
        <span className="text-foreground-subtle">Step {step.tick + 1}:</span>{" "}
        <span className="text-foreground">{step.description}</span>
      </div>

      {/* 4 columns + output */}
      <div className="grid flex-1 grid-cols-4 gap-3 min-h-0">
        {/* Call Stack */}
        <div
          className={cn(
            "flex flex-col rounded-lg border p-3 transition-all",
            step.highlight === "callstack"
              ? "border-blue-500/60 bg-blue-950/15 ring-1 ring-blue-500/30"
              : "border-border bg-elevated/30",
          )}
        >
          <h4 className="mb-2 text-center text-[11px] font-semibold text-blue-400">
            Call Stack
          </h4>
          <div className="flex flex-1 flex-col-reverse justify-start gap-1 overflow-auto">
            {step.state.callStack.map((frame, i) => (
              <div
                key={`cc-${i}`}
                className="rounded border border-blue-700/40 bg-blue-900/30 px-2 py-1 text-center font-mono text-[10px] text-blue-300"
              >
                {frame}
              </div>
            ))}
          </div>
        </div>

        {/* Web APIs */}
        <div
          className={cn(
            "flex flex-col rounded-lg border p-3 transition-all",
            step.highlight === "webapi"
              ? "border-yellow-500/60 bg-yellow-950/15 ring-1 ring-yellow-500/30"
              : "border-border bg-elevated/30",
          )}
        >
          <h4 className="mb-2 text-center text-[11px] font-semibold text-yellow-400">
            Web APIs
          </h4>
          <div className="flex flex-1 flex-col gap-1 overflow-auto">
            {step.state.webAPIs.map((api, i) => (
              <div
                key={`cc-${i}`}
                className="rounded border border-yellow-700/40 bg-yellow-900/30 px-2 py-1 text-center font-mono text-[10px] text-yellow-300"
              >
                {api.name}
                {api.timer !== undefined && (
                  <span className="ml-1 text-yellow-500">({api.timer}ms)</span>
                )}
              </div>
            ))}
            {step.state.webAPIs.length === 0 && (
              <span className="text-center text-[10px] text-foreground-subtle italic">
                empty
              </span>
            )}
          </div>
        </div>

        {/* Microtask Queue */}
        <div
          className={cn(
            "flex flex-col rounded-lg border p-3 transition-all",
            step.highlight === "microtask"
              ? "border-green-500/60 bg-green-950/15 ring-1 ring-green-500/30"
              : "border-border bg-elevated/30",
          )}
        >
          <h4 className="mb-2 text-center text-[11px] font-semibold text-green-400">
            Microtask Queue
          </h4>
          <div className="flex flex-1 flex-col-reverse justify-start gap-1 overflow-auto">
            {step.state.microtaskQueue.map((task, i) => (
              <div
                key={`cc-${i}`}
                className="rounded border border-green-700/40 bg-green-900/30 px-2 py-1 text-center font-mono text-[10px] text-green-300"
              >
                {task}
              </div>
            ))}
            {step.state.microtaskQueue.length === 0 && (
              <span className="text-center text-[10px] text-foreground-subtle italic">
                empty
              </span>
            )}
          </div>
        </div>

        {/* Macrotask Queue */}
        <div
          className={cn(
            "flex flex-col rounded-lg border p-3 transition-all",
            step.highlight === "macrotask"
              ? "border-orange-500/60 bg-orange-950/15 ring-1 ring-orange-500/30"
              : "border-border bg-elevated/30",
          )}
        >
          <h4 className="mb-2 text-center text-[11px] font-semibold text-orange-400">
            Macrotask Queue
          </h4>
          <div className="flex flex-1 flex-col-reverse justify-start gap-1 overflow-auto">
            {step.state.macrotaskQueue.map((task, i) => (
              <div
                key={`cc-${i}`}
                className="rounded border border-orange-700/40 bg-orange-900/30 px-2 py-1 text-center font-mono text-[10px] text-orange-300"
              >
                {task}
              </div>
            ))}
            {step.state.macrotaskQueue.length === 0 && (
              <span className="text-center text-[10px] text-foreground-subtle italic">
                empty
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Output */}
      <div
        className={cn(
          "mt-3 rounded-lg border p-3 transition-all",
          step.highlight === "output"
            ? "border-purple-500/60 bg-purple-950/15 ring-1 ring-purple-500/30"
            : "border-border bg-elevated/30",
        )}
      >
        <h4 className="mb-1 text-[11px] font-semibold text-purple-400">
          Console Output
        </h4>
        <div className="flex items-center gap-2 font-mono text-sm">
          {step.state.output.map((val, i) => (
            <React.Fragment key={`cc-${i}`}>
              {i > 0 && <span className="text-foreground-subtle">,</span>}
              <span
                className={cn(
                  "rounded bg-purple-900/30 px-2 py-0.5 text-purple-300",
                  i === step.state.output.length - 1 && step.highlight === "output"
                    ? "ring-1 ring-purple-400"
                    : "",
                )}
              >
                {val}
              </span>
            </React.Fragment>
          ))}
          {step.state.output.length === 0 && (
            <span className="text-[11px] text-foreground-subtle italic">
              (no output yet)
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Thread Lifecycle Visualization ─────────────────────────

/** Position of each state circle in the SVG. */
const STATE_POSITIONS: Record<ThreadState, { x: number; y: number }> = {
  new: { x: 80, y: 200 },
  runnable: { x: 240, y: 100 },
  running: { x: 440, y: 100 },
  blocked: { x: 600, y: 200 },
  waiting: { x: 600, y: 320 },
  "timed-waiting": { x: 440, y: 350 },
  terminated: { x: 240, y: 350 },
};

const ThreadLifecycleViz = memo(function ThreadLifecycleViz({
  stepIndex,
  selectedTransition,
  onTransitionClick,
}: {
  stepIndex: number;
  selectedTransition: number | null;
  onTransitionClick: (idx: number) => void;
}) {
  // Current state for each thread at this tick
  const threadStates = EXAMPLE_THREADS.map((t) => {
    let current: ThreadState = "new";
    for (const entry of t.timeline) {
      if (entry.tick <= stepIndex) current = entry.state;
      else break;
    }
    return { thread: t, state: current };
  });

  // Build the active transition for animation highlight
  const activeTransition = selectedTransition !== null ? TRANSITIONS[selectedTransition] : null;

  return (
    <div className="flex h-full w-full flex-col bg-background p-4 overflow-auto">
      {/* State machine diagram */}
      <div className="flex-1 min-h-[320px]">
        <svg viewBox="0 0 700 420" className="h-full w-full">
          {/* Draw transition arrows */}
          {TRANSITIONS.map((tr, idx) => {
            const fromPos = STATE_POSITIONS[tr.from];
            const toPos = STATE_POSITIONS[tr.to];
            const isActive = activeTransition?.from === tr.from && activeTransition?.to === tr.to;

            // Offset for bidirectional arrows
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;
            const off = 8;

            const x1 = fromPos.x + nx * off;
            const y1 = fromPos.y + ny * off;
            const x2 = toPos.x + nx * off;
            const y2 = toPos.y + ny * off;

            // Shorten by radius of circle (32) from each end
            const r = 32;
            const adx = x2 - x1;
            const ady = y2 - y1;
            const alen = Math.sqrt(adx * adx + ady * ady);
            const ux = adx / alen;
            const uy = ady / alen;
            const sx = x1 + ux * r;
            const sy = y1 + uy * r;
            const ex = x2 - ux * r;
            const ey = y2 - uy * r;

            const midX = (sx + ex) / 2 + nx * 10;
            const midY = (sy + ey) / 2 + ny * 10;

            return (
              <g
                key={`cc-t-${idx}`}
                onClick={() => onTransitionClick(idx)}
                style={{ cursor: "pointer" }}
              >
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke={isActive ? "#f59e0b" : "#475569"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  markerEnd="url(#arrowhead)"
                />
                {/* Wider invisible hit area */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke="transparent"
                  strokeWidth={12}
                />
                <text
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fill={isActive ? "#fbbf24" : "#94a3b8"}
                  fontSize="8"
                  fontWeight={isActive ? "bold" : "normal"}
                >
                  {tr.label}
                </text>
              </g>
            );
          })}

          {/* Arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Draw state circles */}
          {THREAD_STATES.map((state) => {
            const pos = STATE_POSITIONS[state];
            const color = THREAD_STATE_COLORS[state];
            // Check if any thread is currently in this state
            const threadsHere = threadStates.filter((ts) => ts.state === state);
            const isHighlighted = threadsHere.length > 0;

            return (
              <g key={state}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={30}
                  fill={color}
                  opacity={isHighlighted ? 0.9 : 0.35}
                  stroke={isHighlighted ? "#fff" : color}
                  strokeWidth={isHighlighted ? 2 : 1}
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="600"
                >
                  {THREAD_STATE_LABELS[state]}
                </text>
                {/* Show thread indicators */}
                {threadsHere.map((ts, i) => (
                  <circle
                    key={ts.thread.id}
                    cx={pos.x - 12 + i * 12}
                    cy={pos.y + 22}
                    r={4}
                    fill={ts.thread.color}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Thread timelines */}
      <div className="mt-3 space-y-2">
        {EXAMPLE_THREADS.map((t) => {
          const currentEntry = t.timeline.filter((e) => e.tick <= stepIndex).pop();
          return (
            <div key={t.id} className="rounded-md border border-border bg-elevated/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-xs font-medium text-foreground">
                  {t.name}
                </span>
                {currentEntry && (
                  <>
                    <span
                      className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: THREAD_STATE_COLORS[currentEntry.state] }}
                    >
                      {THREAD_STATE_LABELS[currentEntry.state]}
                    </span>
                    <span className="text-[10px] text-foreground-subtle ml-2">
                      {currentEntry.description}
                    </span>
                  </>
                )}
              </div>
              {/* Mini timeline bar */}
              <div className="mt-1 flex gap-0.5">
                {t.timeline.map((entry, i) => (
                  <div
                    key={`cc-${i}`}
                    className={cn(
                      "h-2 flex-1 rounded-sm transition-opacity",
                      entry.tick <= stepIndex ? "opacity-100" : "opacity-20",
                    )}
                    style={{ backgroundColor: THREAD_STATE_COLORS[entry.state] }}
                    title={`Tick ${entry.tick}: ${THREAD_STATE_LABELS[entry.state]}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Goroutine Visualization ──────────────────────────────────

const GOROUTINE_STATE_COLORS: Record<Goroutine['state'], string> = {
  running: '#22c55e',
  waiting: '#3b82f6',
  blocked: '#ef4444',
  done: '#6b7280',
};

const GOROUTINE_STATE_LABELS: Record<Goroutine['state'], string> = {
  running: 'Running',
  waiting: 'Waiting',
  blocked: 'Blocked',
  done: 'Done',
};

const GoroutineViz = memo(function GoroutineViz({
  steps,
  stepIndex,
  demoId,
  onDemoChange,
}: {
  steps: GoroutineStep[];
  stepIndex: number;
  demoId: GoroutineDemoId;
  onDemoChange: (id: GoroutineDemoId) => void;
}) {
  const step = steps[stepIndex];
  if (!step) return null;

  const demoDef = GOROUTINE_DEMOS.find((d) => d.id === demoId);

  // Layout constants for SVG
  const svgW = 800;
  const svgH = 400;
  const goroutineW = 100;
  const goroutineH = 50;
  const channelW = 120;
  const channelH = 40;

  // Position goroutines in a row at top
  const goroutines = step.goroutines;
  const channels = step.channels;
  const gSpacing = Math.min(160, (svgW - 40) / Math.max(goroutines.length, 1));
  const gStartX = (svgW - gSpacing * (goroutines.length - 1)) / 2;
  const gY = 60;

  // Position channels in a row below goroutines
  const chSpacing = channels.length > 0 ? Math.min(180, (svgW - 40) / Math.max(channels.length, 1)) : 0;
  const chStartX = channels.length > 0 ? (svgW - chSpacing * (channels.length - 1)) / 2 : 0;
  const chY = 220;

  return (
    <div className="flex h-full w-full flex-col bg-background p-4 overflow-auto">
      {/* Demo selector tabs */}
      <div className="mb-3 flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="mb-2 flex items-center gap-2">
            {GOROUTINE_DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => onDemoChange(d.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  demoId === d.id
                    ? "bg-primary/15 text-primary"
                    : "text-foreground-muted hover:bg-elevated hover:text-foreground",
                )}
              >
                {d.title}
              </button>
            ))}
          </div>
          <pre className="rounded-md border border-border bg-elevated px-3 py-2 font-mono text-[11px] text-foreground-muted leading-relaxed whitespace-pre-wrap">
            {demoDef?.code}
          </pre>
        </div>
      </div>

      {/* Step description */}
      <div className="mb-3 rounded-md border border-border bg-elevated/50 px-3 py-2 text-xs font-medium">
        <span className="text-foreground-subtle">Step {step.tick + 1}:</span>{" "}
        <span className="text-foreground">{step.description}</span>
        {step.description.includes('DEADLOCK') && (
          <span className="ml-2 rounded bg-red-950/50 px-2 py-0.5 text-[10px] font-bold text-red-400">
            DEADLOCK
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 min-h-[320px]">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="h-full w-full">
          <defs>
            <marker
              id="goroutine-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            {/* Animated dot for message passing */}
            <circle id="msg-dot" r="5" fill="#fbbf24" />
          </defs>

          {/* Draw connections from goroutines to channels */}
          {channels.map((channel, ci) => {
            const cx = chStartX + ci * chSpacing;
            const cy = chY;

            // Draw lines from senders to channel
            return (
              <g key={`conn-${channel.id}`}>
                {channel.senders.map((sid) => {
                  const gi = goroutines.findIndex((gr) => gr.id === sid);
                  if (gi === -1) return null;
                  const gx = gStartX + gi * gSpacing;
                  return (
                    <g key={`send-${sid}-${channel.id}`}>
                      <line
                        x1={gx}
                        y1={gY + goroutineH / 2 + 4}
                        x2={cx}
                        y2={cy - channelH / 2 - 4}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        markerEnd="url(#goroutine-arrow)"
                        opacity={0.7}
                      />
                      {/* Animated message dot */}
                      <circle r="4" fill="#fbbf24" opacity={0.9}>
                        <animateMotion
                          dur="1s"
                          repeatCount="indefinite"
                          path={`M${gx},${gY + goroutineH / 2 + 4} L${cx},${cy - channelH / 2 - 4}`}
                        />
                      </circle>
                    </g>
                  );
                })}
                {channel.receivers.map((rid) => {
                  const gi = goroutines.findIndex((gr) => gr.id === rid);
                  if (gi === -1) return null;
                  const gx = gStartX + gi * gSpacing;
                  return (
                    <g key={`recv-${rid}-${channel.id}`}>
                      <line
                        x1={cx}
                        y1={cy + channelH / 2 + 4}
                        x2={gx}
                        y2={gY + goroutineH / 2 + 4}
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        markerEnd="url(#goroutine-arrow)"
                        opacity={0.7}
                      />
                      {/* Animated receive dot */}
                      <circle r="4" fill="#60a5fa" opacity={0.9}>
                        <animateMotion
                          dur="1s"
                          repeatCount="indefinite"
                          path={`M${cx},${cy + channelH / 2 + 4} L${gx},${gY + goroutineH / 2 + 4}`}
                        />
                      </circle>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Goroutine boxes */}
          {goroutines.map((gr, i) => {
            const x = gStartX + i * gSpacing;
            const y = gY;
            const color = GOROUTINE_STATE_COLORS[gr.state];

            return (
              <g key={gr.id}>
                <rect
                  x={x - goroutineW / 2}
                  y={y - goroutineH / 2}
                  width={goroutineW}
                  height={goroutineH}
                  rx={8}
                  fill={color}
                  opacity={gr.state === 'done' ? 0.35 : 0.85}
                  stroke={gr.state === 'blocked' ? '#fca5a5' : color}
                  strokeWidth={gr.state === 'blocked' ? 2.5 : 1.5}
                />
                {gr.state === 'blocked' && (
                  <rect
                    x={x - goroutineW / 2}
                    y={y - goroutineH / 2}
                    width={goroutineW}
                    height={goroutineH}
                    rx={8}
                    fill="none"
                    stroke="#fca5a5"
                    strokeWidth={2}
                    opacity={0.6}
                  >
                    <animate
                      attributeName="opacity"
                      values="0.6;0.1;0.6"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}
                <text
                  x={x}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="600"
                >
                  {gr.name}
                </text>
                <text
                  x={x}
                  y={y + 10}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="9"
                  opacity={0.8}
                >
                  {GOROUTINE_STATE_LABELS[gr.state]}
                </text>
                {gr.channel && (
                  <text
                    x={x}
                    y={y + goroutineH / 2 + 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8"
                  >
                    on {gr.channel}
                  </text>
                )}
              </g>
            );
          })}

          {/* Channel pipes */}
          {channels.map((channel, i) => {
            const x = chStartX + i * chSpacing;
            const y = chY;
            const isFull = channel.buffer.length >= channel.capacity && channel.capacity > 0;

            return (
              <g key={channel.id}>
                {/* Pipe body */}
                <rect
                  x={x - channelW / 2}
                  y={y - channelH / 2}
                  width={channelW}
                  height={channelH}
                  rx={channelH / 2}
                  fill="#1e293b"
                  stroke={isFull ? '#f59e0b' : '#475569'}
                  strokeWidth={isFull ? 2 : 1.5}
                />
                {/* Channel name */}
                <text
                  x={x}
                  y={y - channelH / 2 - 6}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                >
                  {channel.name}
                  {channel.capacity > 0 && (
                    <tspan fill="#64748b" fontSize="8">
                      {` (cap:${channel.capacity})`}
                    </tspan>
                  )}
                </text>
                {/* Buffer slots */}
                {channel.capacity > 0 ? (
                  // Buffered channel: show capacity slots with filled circles
                  Array.from({ length: channel.capacity }, (_, si) => {
                    const slotX = x - ((channel.capacity - 1) * 16) / 2 + si * 16;
                    const filled = si < channel.buffer.length;
                    return (
                      <g key={si}>
                        <circle
                          cx={slotX}
                          cy={y}
                          r={6}
                          fill={filled ? '#22c55e' : '#334155'}
                          stroke={filled ? '#4ade80' : '#475569'}
                          strokeWidth={1}
                        />
                        {filled && channel.buffer[si] !== undefined && (
                          <text
                            x={slotX}
                            y={y + 3}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="7"
                            fontWeight="bold"
                          >
                            {channel.buffer[si]}
                          </text>
                        )}
                      </g>
                    );
                  })
                ) : (
                  // Unbuffered channel: show a rendezvous icon
                  <>
                    {channel.buffer.length > 0 ? (
                      // Value passing through
                      <g>
                        <circle cx={x} cy={y} r={8} fill="#fbbf24" opacity={0.9}>
                          <animate
                            attributeName="r"
                            values="6;10;6"
                            dur="0.8s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <text
                          x={x}
                          y={y + 3}
                          textAnchor="middle"
                          fill="#000"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {channel.buffer[0]}
                        </text>
                      </g>
                    ) : (
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="9"
                      >
                        {channel.senders.length > 0 || channel.receivers.length > 0
                          ? 'waiting'
                          : 'idle'}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* No channels label for WaitGroup demo */}
          {channels.length === 0 && (
            <text
              x={svgW / 2}
              y={chY}
              textAnchor="middle"
              fill="#475569"
              fontSize="11"
            >
              (no channels -- WaitGroup synchronization)
            </text>
          )}

          {/* Legend */}
          {(['running', 'waiting', 'blocked', 'done'] as const).map((state, i) => (
            <g key={state}>
              <rect
                x={20 + i * 120}
                y={svgH - 30}
                width={12}
                height={12}
                rx={3}
                fill={GOROUTINE_STATE_COLORS[state]}
                opacity={state === 'done' ? 0.35 : 0.85}
              />
              <text
                x={36 + i * 120}
                y={svgH - 20}
                fill="#94a3b8"
                fontSize="10"
              >
                {GOROUTINE_STATE_LABELS[state]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
});

// ── Readers-Writers Visualization ──────────────────────────

const RW_ACTION_COLORS: Record<string, string> = {
  'read-start': '#3b82f6',
  'read-end': '#60a5fa',
  'write-start': '#ef4444',
  'write-end': '#f87171',
  wait: '#f59e0b',
};

const ReadersWritersViz = memo(function ReadersWritersViz({
  events,
  stepIndex,
}: {
  events: RWEvent[];
  stepIndex: number;
}) {
  const currentEvent = events[stepIndex];
  const visibleEvents = events.slice(0, stepIndex + 1);

  if (!currentEvent) return null;

  const readerCount = currentEvent.readerCount;
  const writerActive = currentEvent.writerActive;

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
      {/* Shared resource box */}
      <div className="mb-6 flex items-center justify-center gap-8">
        {/* Resource */}
        <div
          className={cn(
            "flex h-28 w-48 flex-col items-center justify-center rounded-xl border-2 transition-colors",
            writerActive
              ? "border-red-500 bg-red-950/20"
              : readerCount > 0
                ? "border-blue-500 bg-blue-950/20"
                : "border-border bg-elevated/30",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Shared Resource
          </span>
          <div className="mt-1 text-2xl font-bold">
            {writerActive ? (
              <span className="text-red-400">WRITING</span>
            ) : readerCount > 0 ? (
              <span className="text-blue-400">READING</span>
            ) : (
              <span className="text-foreground-subtle">IDLE</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
            <span>
              Readers:{" "}
              <strong className="text-blue-400">{readerCount}</strong>
            </span>
            <span>
              Writer:{" "}
              <strong className={writerActive ? "text-red-400" : "text-foreground-subtle"}>
                {writerActive ? "Active" : "None"}
              </strong>
            </span>
          </div>
        </div>

        {/* Concurrent reader indicators */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Active Readers
          </span>
          <div className="flex gap-1.5">
            {readerCount > 0 ? (
              Array.from({ length: readerCount }, (_, i) => (
                <div
                  key={`cc-${i}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/80 text-xs font-semibold text-white"
                >
                  R{i + 1}
                </div>
              ))
            ) : (
              <span className="text-xs text-foreground-subtle italic">none</span>
            )}
          </div>
        </div>
      </div>

      {/* Queue indicators */}
      <div className="mb-4 flex gap-4">
        {/* Reader queue */}
        <div className="flex-1 rounded-lg border border-blue-800/40 bg-blue-950/10 p-3">
          <h4 className="mb-1 text-[11px] font-semibold text-blue-400">
            Reader Queue
          </h4>
          <div className="flex flex-wrap gap-1">
            {visibleEvents
              .filter((e) => e.action === "wait" && e.actor.startsWith("reader"))
              .slice(-5)
              .map((e, i) => (
                <span
                  key={`cc-${i}`}
                  className="rounded bg-blue-900/40 px-2 py-0.5 text-[10px] font-mono text-blue-300"
                >
                  {e.actor}
                </span>
              ))}
            {visibleEvents.filter(
              (e) => e.action === "wait" && e.actor.startsWith("reader"),
            ).length === 0 && (
              <span className="text-[10px] text-foreground-subtle italic">
                empty
              </span>
            )}
          </div>
        </div>

        {/* Writer queue */}
        <div className="flex-1 rounded-lg border border-red-800/40 bg-red-950/10 p-3">
          <h4 className="mb-1 text-[11px] font-semibold text-red-400">
            Writer Queue
          </h4>
          <div className="flex flex-wrap gap-1">
            {visibleEvents
              .filter((e) => e.action === "wait" && e.actor.startsWith("writer"))
              .slice(-5)
              .map((e, i) => (
                <span
                  key={`cc-${i}`}
                  className="rounded bg-red-900/40 px-2 py-0.5 text-[10px] font-mono text-red-300"
                >
                  {e.actor}
                </span>
              ))}
            {visibleEvents.filter(
              (e) => e.action === "wait" && e.actor.startsWith("writer"),
            ).length === 0 && (
              <span className="text-[10px] text-foreground-subtle italic">
                empty
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Event log */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {visibleEvents.map((e, i) => (
          <div
            key={`cc-${i}`}
            className={cn(
              "flex gap-2 border-b border-border/30 py-1",
              i === stepIndex ? "bg-primary/5" : "",
            )}
            style={{ color: RW_ACTION_COLORS[e.action] ?? '#9ca3af' }}
          >
            <span className="w-6 text-foreground-subtle">{e.tick}</span>
            <span className="w-20">{e.actor}</span>
            <span className="w-20">{e.action}</span>
            <span>{e.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Sleeping Barber Visualization ─────────────────────────

const BARBER_ACTION_COLORS: Record<string, string> = {
  enter: '#6b7280',
  'wake-barber': '#22c55e',
  'sit-wait': '#3b82f6',
  'get-haircut': '#a855f7',
  done: '#22c55e',
  'leave-full': '#ef4444',
};

const SleepingBarberViz = memo(function SleepingBarberViz({
  events,
  stepIndex,
}: {
  events: BarberEvent[];
  stepIndex: number;
}) {
  const currentEvent = events[stepIndex];
  const visibleEvents = events.slice(0, stepIndex + 1);

  if (!currentEvent) return null;

  const { barber, waitingRoom, capacity } = currentEvent;

  return (
    <div className="flex h-full w-full flex-col bg-background p-6 overflow-auto">
      {/* Barber shop visual */}
      <div className="mb-6 flex items-start justify-center gap-8">
        {/* Barber chair */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Barber Chair
          </span>
          <div
            className={cn(
              "flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 transition-colors",
              barber === "cutting"
                ? "border-purple-500 bg-purple-950/20"
                : "border-border bg-elevated/30",
            )}
          >
            {barber === "cutting" ? (
              <>
                <span className="text-2xl">&#9986;</span>
                <span className="mt-1 text-[10px] font-semibold text-purple-400">
                  Cutting
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl">&#128164;</span>
                <span className="mt-1 text-[10px] font-semibold text-foreground-subtle">
                  Sleeping
                </span>
              </>
            )}
          </div>
        </div>

        {/* Waiting room */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Waiting Room ({waitingRoom}/{capacity})
          </span>
          <div className="flex gap-2">
            {Array.from({ length: capacity }, (_, i) => {
              const occupied = i < waitingRoom;
              return (
                <div
                  key={`cc-${i}`}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-lg border-2 transition-colors",
                    occupied
                      ? "border-blue-500 bg-blue-950/20"
                      : "border-border bg-elevated/20",
                  )}
                >
                  {occupied ? (
                    <span className="text-lg">&#128100;</span>
                  ) : (
                    <span className="text-xs text-foreground-subtle">empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Door / exit */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Door
          </span>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-border bg-elevated/20">
            <span className="text-lg">&#128682;</span>
          </div>
          <div className="text-center text-[10px] text-foreground-subtle">
            Turned away:{" "}
            <strong className="text-red-400">
              {visibleEvents.filter((e) => e.customerAction === "leave-full").length}
            </strong>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 rounded-lg border border-green-800/40 bg-green-950/10 p-2 text-center">
          <span className="text-[10px] text-foreground-subtle">Served</span>
          <div className="text-lg font-bold text-green-400">
            {visibleEvents.filter((e) => e.customerAction === "done").length}
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-blue-800/40 bg-blue-950/10 p-2 text-center">
          <span className="text-[10px] text-foreground-subtle">Waiting</span>
          <div className="text-lg font-bold text-blue-400">{waitingRoom}</div>
        </div>
        <div className="flex-1 rounded-lg border border-red-800/40 bg-red-950/10 p-2 text-center">
          <span className="text-[10px] text-foreground-subtle">Left</span>
          <div className="text-lg font-bold text-red-400">
            {visibleEvents.filter((e) => e.customerAction === "leave-full").length}
          </div>
        </div>
      </div>

      {/* Event log */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {visibleEvents.map((e, i) => (
          <div
            key={`cc-${i}`}
            className={cn(
              "flex gap-2 border-b border-border/30 py-1",
              i === stepIndex ? "bg-primary/5" : "",
            )}
            style={{
              color: BARBER_ACTION_COLORS[e.customerAction] ?? '#9ca3af',
            }}
          >
            <span className="w-6 text-foreground-subtle">{e.tick}</span>
            <span className="w-20">{e.customerAction}</span>
            <span>{e.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Async Patterns Visualization ────────────────────────────

const PROMISE_STATE_COLORS: Record<string, string> = {
  pending: '#3b82f6',
  resolved: '#22c55e',
  rejected: '#ef4444',
};

const PROMISE_STATE_BG: Record<string, string> = {
  pending: 'border-blue-500/60 bg-blue-950/20',
  resolved: 'border-green-500/60 bg-green-950/20',
  rejected: 'border-red-500/60 bg-red-950/20',
};

const PROMISE_STATE_TEXT: Record<string, string> = {
  pending: 'text-blue-400',
  resolved: 'text-green-400',
  rejected: 'text-red-400',
};

const AsyncPatternsViz = memo(function AsyncPatternsViz({
  steps,
  stepIndex,
  demoId,
  onDemoChange,
}: {
  steps: AsyncStep[];
  stepIndex: number;
  demoId: AsyncPatternId;
  onDemoChange: (id: AsyncPatternId) => void;
}) {
  const step = steps[stepIndex];
  if (!step) return null;

  const demoDef = ASYNC_PATTERN_DEMOS.find((d) => d.id === demoId);

  return (
    <div className="flex h-full w-full flex-col bg-background p-4 overflow-auto">
      {/* Demo selector + code snippet */}
      <div className="mb-4 flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {ASYNC_PATTERN_DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => onDemoChange(d.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  demoId === d.id
                    ? "bg-primary/15 text-primary"
                    : "text-foreground-muted hover:bg-elevated hover:text-foreground",
                )}
              >
                {d.title}
              </button>
            ))}
          </div>
          <pre className="rounded-md border border-border bg-elevated px-3 py-2 font-mono text-[11px] text-foreground-muted leading-relaxed whitespace-pre-wrap">
            {demoDef?.code}
          </pre>
        </div>
      </div>

      {/* Step description */}
      <div className="mb-4 rounded-md border border-border bg-elevated/50 px-3 py-2 text-xs font-medium">
        <span className="text-foreground-subtle">Step {step.tick + 1}:</span>{" "}
        <span className="text-foreground">{step.description}</span>
      </div>

      {/* Timeline visualization */}
      <div className="mb-4 flex-1 min-h-[200px]">
        <div className="flex h-full items-start justify-center gap-6 pt-4">
          {step.promises.map((p) => {
            const color = PROMISE_STATE_COLORS[p.state];
            return (
              <div key={p.id} className="flex flex-col items-center gap-3">
                {/* Promise box */}
                <div
                  className={cn(
                    "flex h-24 w-32 flex-col items-center justify-center rounded-xl border-2 transition-all",
                    PROMISE_STATE_BG[p.state],
                  )}
                >
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {p.id}
                  </span>
                  <span
                    className={cn(
                      "mt-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                      PROMISE_STATE_TEXT[p.state],
                    )}
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {p.state}
                  </span>
                </div>
                {/* Value display */}
                {p.value && (
                  <div
                    className={cn(
                      "max-w-[140px] rounded-md border px-2 py-1 text-center font-mono text-[10px] break-all",
                      p.state === 'resolved'
                        ? "border-green-700/40 bg-green-900/20 text-green-300"
                        : "border-red-700/40 bg-red-900/20 text-red-300",
                    )}
                  >
                    {p.value}
                  </div>
                )}
                {/* Pending pulse indicator */}
                {p.state === 'pending' && (
                  <div className="flex items-center gap-1">
                    <div
                      className="h-2 w-2 rounded-full bg-blue-500"
                      style={{ animation: 'pulse 1.5s infinite' }}
                    />
                    <span className="text-[10px] text-blue-400">waiting...</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result output area */}
      <div
        className={cn(
          "rounded-lg border p-3 transition-all",
          step.output
            ? "border-purple-500/60 bg-purple-950/15 ring-1 ring-purple-500/30"
            : "border-border bg-elevated/30",
        )}
      >
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-semibold text-purple-400">
            {step.pattern} Result
          </h4>
          {step.output && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                step.output.startsWith('Error') || step.output.startsWith('Aggregate')
                  ? "bg-red-900/30 text-red-400"
                  : "bg-green-900/30 text-green-400",
              )}
            >
              {step.output.startsWith('Error') || step.output.startsWith('Aggregate')
                ? 'rejected'
                : 'fulfilled'}
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-sm">
          {step.output ? (
            <span
              className={cn(
                "rounded px-2 py-0.5",
                step.output.startsWith('Error') || step.output.startsWith('Aggregate')
                  ? "bg-red-900/30 text-red-300"
                  : "bg-green-900/30 text-green-300",
              )}
            >
              {step.output}
            </span>
          ) : (
            <span className="text-[11px] text-foreground-subtle italic">
              (pending -- waiting for promises to settle)
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Deadlock Demo Visualization ─────────────────────────────

const DEADLOCK_THREAD_STATE_COLORS: Record<string, string> = {
  running: '#22c55e',
  blocked: '#f59e0b',
  deadlocked: '#ef4444',
};

const DeadlockDemoViz = memo(function DeadlockDemoViz({
  deadlockSteps,
  preventionSteps,
  stepIndex,
}: {
  deadlockSteps: DeadlockStep[];
  preventionSteps: DeadlockStep[];
  stepIndex: number;
}) {
  const dlStep = deadlockSteps[Math.min(stepIndex, deadlockSteps.length - 1)];
  const pvStep = preventionSteps[Math.min(stepIndex, preventionSteps.length - 1)];

  function renderScene(step: DeadlockStep, label: string, borderColor: string) {
    if (!step) return null;

    const svgW = 340;
    const svgH = 260;

    // Thread positions (circles)
    const t0x = 90, t0y = 70;
    const t1x = 250, t1y = 70;
    // Resource positions (squares)
    const r0x = 90, r0y = 190;
    const r1x = 250, r1y = 190;

    const threadPositions: Record<string, { x: number; y: number }> = {
      [step.threads[0]?.id]: { x: t0x, y: t0y },
      [step.threads[1]?.id]: { x: t1x, y: t1y },
    };
    const resourcePositions: Record<string, { x: number; y: number }> = {
      [step.resources[0]?.id]: { x: r0x, y: r0y },
      [step.resources[1]?.id]: { x: r1x, y: r1y },
    };

    return (
      <div className={cn('flex-1 rounded-lg border p-4', borderColor)}>
        <h3 className="mb-1 text-center text-sm font-semibold text-foreground">
          {label}
        </h3>
        {step.isDeadlocked && (
          <div className="mb-2 rounded bg-red-950/50 px-2 py-1 text-center text-xs font-medium text-red-400">
            DEADLOCK DETECTED
          </div>
        )}
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="mx-auto h-48 w-full">
          <defs>
            <marker id="hold-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
            </marker>
            <marker id="wait-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>

          {/* Holding arrows (green solid) — resource → thread (thread holds resource) */}
          {step.threads.map((thread) =>
            thread.holding.map((resId) => {
              const tp = threadPositions[thread.id];
              const rp = resourcePositions[resId];
              if (!tp || !rp) return null;
              return (
                <line
                  key={`hold-${thread.id}-${resId}`}
                  x1={rp.x}
                  y1={rp.y - 22}
                  x2={tp.x}
                  y2={tp.y + 26}
                  stroke="#22c55e"
                  strokeWidth={2}
                  markerEnd="url(#hold-arrow)"
                />
              );
            }),
          )}

          {/* Waiting arrows (red dashed) — thread → resource */}
          {step.threads.map((thread) => {
            if (!thread.waiting) return null;
            const tp = threadPositions[thread.id];
            const rp = resourcePositions[thread.waiting];
            if (!tp || !rp) return null;
            // Offset slightly so it doesn't overlap holding arrows
            const offsetX = tp.x < rp.x ? 6 : -6;
            return (
              <line
                key={`wait-${thread.id}-${thread.waiting}`}
                x1={tp.x + offsetX}
                y1={tp.y + 26}
                x2={rp.x + offsetX}
                y2={rp.y - 22}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6 3"
                markerEnd="url(#wait-arrow)"
              />
            );
          })}

          {/* Deadlock cycle highlight */}
          {step.isDeadlocked && (
            <rect
              x={40}
              y={30}
              width={260}
              height={200}
              rx={16}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              opacity={0.5}
            >
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.2s" repeatCount="indefinite" />
            </rect>
          )}

          {/* Thread circles */}
          {step.threads.map((thread) => {
            const pos = threadPositions[thread.id];
            if (!pos) return null;
            const color = DEADLOCK_THREAD_STATE_COLORS[thread.state] ?? '#6b7280';
            return (
              <g key={thread.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={24}
                  fill={color}
                  opacity={0.85}
                  stroke={thread.state === 'deadlocked' ? '#fca5a5' : color}
                  strokeWidth={thread.state === 'deadlocked' ? 2.5 : 1.5}
                />
                {thread.state === 'deadlocked' && (
                  <circle cx={pos.x} cy={pos.y} r={24} fill="none" stroke="#fca5a5" strokeWidth={2} opacity={0.6}>
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
                  {thread.id}
                </text>
                <text x={pos.x} y={pos.y + 9} textAnchor="middle" fill="#fff" fontSize="8" opacity={0.8}>
                  {thread.state}
                </text>
              </g>
            );
          })}

          {/* Resource squares */}
          {step.resources.map((res) => {
            const pos = resourcePositions[res.id];
            if (!pos) return null;
            const owned = res.owner !== null;
            return (
              <g key={res.id}>
                <rect
                  x={pos.x - 20}
                  y={pos.y - 20}
                  width={40}
                  height={40}
                  rx={6}
                  fill={owned ? '#334155' : '#1e293b'}
                  stroke={owned ? '#f59e0b' : '#475569'}
                  strokeWidth={owned ? 2 : 1.5}
                />
                <text x={pos.x} y={pos.y - 3} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                  {res.id}
                </text>
                <text x={pos.x} y={pos.y + 10} textAnchor="middle" fill="#94a3b8" fontSize="7">
                  {res.owner ?? 'free'}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g>
            <line x1={20} y1={svgH - 10} x2={40} y2={svgH - 10} stroke="#22c55e" strokeWidth={2} />
            <text x={44} y={svgH - 6} fill="#94a3b8" fontSize="8">holding</text>
            <line x1={110} y1={svgH - 10} x2={130} y2={svgH - 10} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
            <text x={134} y={svgH - 6} fill="#94a3b8" fontSize="8">waiting</text>
          </g>
        </svg>
        <p className="mt-1 text-center text-[10px] text-foreground-muted">
          {step.description}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full gap-4 bg-background p-6">
      {renderScene(dlStep, 'Deadlock (circular wait)', 'border-red-800/50')}
      {renderScene(pvStep, 'Prevention (resource ordering)', 'border-green-800/50')}
    </div>
  );
});

// ── Race Condition Histogram ────────────────────────────────

const RaceConditionHistogram = memo(function RaceConditionHistogram({
  onRun,
  results,
  running,
  expectedValue,
}: {
  onRun: () => void;
  results: number[];
  running: boolean;
  expectedValue: number;
}) {
  // Build histogram buckets
  const histogram = useMemo(() => {
    if (results.length === 0) return [];
    const counts = new Map<number, number>();
    for (const v of results) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const entries = Array.from(counts.entries()).sort((a, b) => a[0] - b[0]);
    const maxCount = Math.max(...entries.map((e) => e[1]));
    return entries.map(([value, count]) => ({ value, count, pct: count / maxCount }));
  }, [results]);

  return (
    <div className="mt-4 rounded-lg border border-border bg-elevated/30 p-4">
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={onRun}
          disabled={running}
          className="flex h-7 items-center gap-1.5 rounded-md bg-amber-600 px-3 text-xs font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-40"
        >
          {running ? 'Running...' : 'Run 100 Times'}
        </button>
        <span className="text-[11px] text-foreground-subtle">
          Run the unsafe 3-thread x 3-increment race 100 times and observe the distribution of final values.
        </span>
      </div>

      {results.length > 0 && (
        <>
          <div className="mb-2 text-xs text-foreground-muted">
            Expected value: <strong className="text-green-400">{expectedValue}</strong> | Trials: <strong className="text-foreground">{results.length}</strong> |{' '}
            Reached expected:{' '}
            <strong className={results.filter((r) => r === expectedValue).length > 0 ? 'text-green-400' : 'text-red-400'}>
              {results.filter((r) => r === expectedValue).length} times
            </strong>
          </div>
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {histogram.map((bucket) => (
              <div
                key={bucket.value}
                className="flex flex-col items-center"
                style={{ flex: '1 1 0' }}
              >
                <span className="mb-0.5 text-[9px] font-mono text-foreground-subtle">
                  {bucket.count}
                </span>
                <div
                  className={cn(
                    'w-full min-w-[12px] rounded-t transition-all',
                    bucket.value === expectedValue
                      ? 'bg-green-500'
                      : 'bg-red-400/70',
                  )}
                  style={{ height: `${Math.max(bucket.pct * 90, 4)}px` }}
                />
                <span className={cn(
                  'mt-1 text-[9px] font-mono',
                  bucket.value === expectedValue ? 'text-green-400 font-bold' : 'text-foreground-subtle',
                )}>
                  {bucket.value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-foreground-subtle italic">
            Without synchronization, the counter rarely reaches {expectedValue}. Values cluster around lower numbers due to lost updates.
          </p>
        </>
      )}
    </div>
  );
});

// ── Lock Comparison Visualization ──────────────────────────

const MUTEX_STATE_COLORS: Record<string, string> = {
  running: '#6b7280',
  spinning: '#ef4444',
  sleeping: '#3b82f6',
  acquired: '#22c55e',
  released: '#8b5cf6',
};

const MUTEX_STATE_LABELS: Record<string, string> = {
  running: 'Ready',
  spinning: 'Spinning (CPU)',
  sleeping: 'Sleeping (0 CPU)',
  acquired: 'Holding Lock',
  released: 'Done',
};

const LockComparisonViz = memo(function LockComparisonViz({
  spinSteps,
  mutexSteps,
  ttasSteps,
  spinMetrics,
  mutexMetrics,
  ttasMetrics,
  stepIndex,
}: {
  spinSteps: MutexStep[];
  mutexSteps: MutexStep[];
  ttasSteps: MutexStep[];
  spinMetrics: MutexMetrics;
  mutexMetrics: MutexMetrics;
  ttasMetrics: MutexMetrics;
  stepIndex: number;
}) {
  const spinStep = spinSteps[Math.min(stepIndex, spinSteps.length - 1)];
  const mutexStep = mutexSteps[Math.min(stepIndex, mutexSteps.length - 1)];
  const ttasStep = ttasSteps[Math.min(stepIndex, ttasSteps.length - 1)];

  function renderTimeline(
    steps: MutexStep[],
    currentStep: MutexStep | undefined,
    label: string,
    borderColor: string,
    accentColor: string,
    idx: number,
  ) {
    if (!currentStep) return null;
    const si = Math.min(stepIndex, steps.length - 1);

    return (
      <div className={cn('flex-1 rounded-lg border p-3', borderColor)}>
        <h3 className={cn('mb-2 text-center text-sm font-semibold', accentColor)}>
          {label}
        </h3>
        <div className="mb-1 flex items-center justify-between text-[10px] text-foreground-subtle">
          <span>Lock: <strong className={currentStep.lockState === 'held' ? 'text-amber-400' : 'text-green-400'}>{currentStep.lockState}</strong></span>
          <span>CPU: <strong className="text-foreground">{currentStep.cpuCycles}</strong> cycles</span>
        </div>

        {/* Thread timeline bars */}
        <div className="mb-3 space-y-1.5">
          {currentStep.threads.map((thread) => {
            const stateColor = MUTEX_STATE_COLORS[thread.state] ?? '#6b7280';
            const cpuPct = steps.length > 1
              ? Math.min(100, Math.round((thread.cpuCycles / Math.max(1, currentStep.cpuCycles)) * 100))
              : 0;

            return (
              <div key={thread.id}>
                <div className="flex items-center gap-2">
                  <span className="w-6 font-mono text-[10px] text-foreground-subtle">{thread.id}</span>
                  <div className="flex-1">
                    {/* State indicator */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-5 rounded"
                        style={{
                          backgroundColor: stateColor,
                          width: `${Math.max(20, cpuPct)}%`,
                          opacity: 0.8,
                          transition: 'width 0.2s, background-color 0.2s',
                        }}
                      />
                      <span className="whitespace-nowrap text-[9px] text-foreground-muted">
                        {MUTEX_STATE_LABELS[thread.state] ?? thread.state}
                      </span>
                    </div>
                    {/* CPU usage bar */}
                    <div className="mt-0.5 h-1.5 w-full rounded-full bg-elevated">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${cpuPct}%`,
                          backgroundColor: thread.state === 'spinning' ? '#ef4444' : thread.state === 'sleeping' ? '#3b82f6' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right font-mono text-[9px] text-foreground-subtle">
                    {thread.cpuCycles}c
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step description */}
        <p className="text-[10px] text-foreground-muted leading-snug">
          {currentStep.description}
        </p>
      </div>
    );
  }

  const allMetrics = [spinMetrics, mutexMetrics, ttasMetrics];

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-background p-4">
      {/* Three lock visualizations side by side */}
      <div className="mb-4 flex gap-3">
        {renderTimeline(spinSteps, spinStep, 'SpinLock', 'border-red-800/50', 'text-red-400', 0)}
        {renderTimeline(mutexSteps, mutexStep, 'Mutex (Blocking)', 'border-blue-800/50', 'text-blue-400', 1)}
        {renderTimeline(ttasSteps, ttasStep, 'TTAS', 'border-purple-800/50', 'text-purple-400', 2)}
      </div>

      {/* Comparison metrics table */}
      <div className="rounded-lg border border-border bg-elevated/30 p-3">
        <h4 className="mb-2 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Comparison Metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border text-foreground-subtle">
                <th className="py-1.5 pr-3 text-left font-medium">Metric</th>
                {allMetrics.map((m) => (
                  <th key={m.lockType} className="px-3 py-1.5 text-right font-medium">
                    {m.lockType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-3 text-foreground-muted">Total CPU Cycles</td>
                {allMetrics.map((m) => {
                  const isLowest = m.totalCpuCycles === Math.min(...allMetrics.map((x) => x.totalCpuCycles));
                  return (
                    <td key={m.lockType} className={cn('px-3 py-1.5 text-right font-mono', isLowest ? 'text-green-400 font-semibold' : 'text-foreground')}>
                      {m.totalCpuCycles}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-3 text-foreground-muted">Total Ticks</td>
                {allMetrics.map((m) => {
                  const isLowest = m.totalTicks === Math.min(...allMetrics.map((x) => x.totalTicks));
                  return (
                    <td key={m.lockType} className={cn('px-3 py-1.5 text-right font-mono', isLowest ? 'text-green-400 font-semibold' : 'text-foreground')}>
                      {m.totalTicks}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-3 text-foreground-muted">Avg Wait (ticks/thread)</td>
                {allMetrics.map((m) => {
                  const isLowest = m.avgWaitTicks === Math.min(...allMetrics.map((x) => x.avgWaitTicks));
                  return (
                    <td key={m.lockType} className={cn('px-3 py-1.5 text-right font-mono', isLowest ? 'text-green-400 font-semibold' : 'text-foreground')}>
                      {m.avgWaitTicks}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-1.5 pr-3 text-foreground-muted">Throughput (threads/tick)</td>
                {allMetrics.map((m) => {
                  const isHighest = m.throughput === Math.max(...allMetrics.map((x) => x.throughput));
                  return (
                    <td key={m.lockType} className={cn('px-3 py-1.5 text-right font-mono', isHighest ? 'text-green-400 font-semibold' : 'text-foreground')}>
                      {m.throughput}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recommendation row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {allMetrics.map((m) => (
            <div key={m.lockType} className="rounded border border-border/50 bg-background px-2 py-1.5">
              <span className="block text-[10px] font-semibold text-foreground-muted">{m.lockType}</span>
              <span className="block text-[10px] text-foreground-subtle leading-snug">{m.recommendation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Sidebar ─────────────────────────────────────────────────

const ConcurrencySidebar = memo(function ConcurrencySidebar({
  active,
  onSelect,
}: {
  active: ConcurrencyDemo;
  onSelect: (d: ConcurrencyDemo) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Concurrency
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {DEMOS.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors",
              active === d.id
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            <span className="block text-sm font-medium">{d.name}</span>
            <span className="block text-[11px] text-foreground-subtle">
              {d.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Module Hook ─────────────────────────────────────────────

export function useConcurrencyModule() {
  const [active, setActive] = useState<ConcurrencyDemo>("race-condition");
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Event-loop sub-state
  const [eventLoopDemoId, setEventLoopDemoId] = useState<EventLoopDemoId>("setTimeout-vs-promise");
  const [selectedTransition, setSelectedTransition] = useState<number | null>(null);

  // Goroutine sub-state
  const [goroutineDemoId, setGoroutineDemoId] = useState<GoroutineDemoId>("basic-channel");

  // Async patterns sub-state
  const [asyncPatternDemoId, setAsyncPatternDemoId] = useState<AsyncPatternId>("promise-all");

  // Race condition histogram state (CON-010)
  const [histogramResults, setHistogramResults] = useState<number[]>([]);
  const [histogramRunning, setHistogramRunning] = useState(false);

  // Pre-compute demos
  const unsafeDemo = useMemo(() => unsafeIncrement(3, 3), []);
  const safeDemo = useMemo(() => safeIncrement(3, 3), []);
  const pcEvents = useMemo(
    () => simulateProducerConsumer(2, 2, 4, 8),
    [],
  );
  const naiveEvents = useMemo(() => simulateNaive(5, 10), []);
  const orderedEvents = useMemo(() => simulateOrdered(5, 10), []);

  // Event loop steps (recomputed when demo changes)
  const eventLoopSteps = useMemo(
    () => simulateEventLoop(eventLoopDemoId),
    [eventLoopDemoId],
  );

  // Goroutine steps (recomputed when demo changes)
  const goroutineSteps = useMemo(
    () => simulateGoroutines(goroutineDemoId),
    [goroutineDemoId],
  );

  // Readers-Writers events
  const rwEvents = useMemo(
    () => simulateReadersWriters(3, 2, 4),
    [],
  );

  // Async pattern steps (recomputed when demo changes)
  const asyncPatternSteps = useMemo(
    () => simulateAsyncPattern(asyncPatternDemoId),
    [asyncPatternDemoId],
  );

  // Sleeping Barber events
  const barberEvents = useMemo(
    () => simulateSleepingBarber(3, 10),
    [],
  );

  // Deadlock demo steps
  const deadlockSteps = useMemo(() => simulateDeadlock(), []);
  const deadlockPreventionSteps = useMemo(() => simulateDeadlockPrevention(), []);

  // Lock comparison steps (4 threads, 3-tick critical section)
  const lockThreadCount = 4;
  const lockCsTime = 3;
  const spinLockSteps = useMemo(() => simulateSpinLock(lockThreadCount, lockCsTime), []);
  const blockingMutexSteps = useMemo(() => simulateMutex(lockThreadCount, lockCsTime), []);
  const ttasLockSteps = useMemo(() => simulateTTAS(lockThreadCount, lockCsTime), []);
  const spinMetrics = useMemo(() => computeMetrics(spinLockSteps, 'SpinLock', lockThreadCount, lockCsTime), [spinLockSteps]);
  const mutexMetrics = useMemo(() => computeMetrics(blockingMutexSteps, 'Mutex', lockThreadCount, lockCsTime), [blockingMutexSteps]);
  const ttasMetrics = useMemo(() => computeMetrics(ttasLockSteps, 'TTAS', lockThreadCount, lockCsTime), [ttasLockSteps]);

  // Thread lifecycle max tick
  const threadMaxTick = useMemo(() => maxTick(), []);

  // Race condition histogram handler (CON-010)
  const handleRunHistogram = useCallback(() => {
    setHistogramRunning(true);
    const results: number[] = [];
    for (let i = 0; i < 100; i++) {
      results.push(unsafeIncrementRandom(3, 3));
    }
    setHistogramResults(results);
    setHistogramRunning(false);
  }, []);

  const maxSteps = useMemo(() => {
    switch (active) {
      case "race-condition":
        return Math.max(unsafeDemo.events.length, safeDemo.events.length) - 1;
      case "producer-consumer":
        return pcEvents.length - 1;
      case "dining-philosophers":
        return Math.max(naiveEvents.length, orderedEvents.length) - 1;
      case "event-loop":
        return eventLoopSteps.length - 1;
      case "thread-lifecycle":
        return threadMaxTick;
      case "go-goroutines":
        return goroutineSteps.length - 1;
      case "readers-writers":
        return rwEvents.length - 1;
      case "sleeping-barber":
        return barberEvents.length - 1;
      case "async-patterns":
        return asyncPatternSteps.length - 1;
      case "deadlock-demo":
        return Math.max(deadlockSteps.length, deadlockPreventionSteps.length) - 1;
      case "lock-comparison":
        return Math.max(spinLockSteps.length, blockingMutexSteps.length, ttasLockSteps.length) - 1;
    }
  }, [active, unsafeDemo, safeDemo, pcEvents, naiveEvents, orderedEvents, eventLoopSteps, threadMaxTick, goroutineSteps, rwEvents, barberEvents, asyncPatternSteps, deadlockSteps, deadlockPreventionSteps, spinLockSteps, blockingMutexSteps, ttasLockSteps]);

  const handleStep = useCallback(() => {
    setStepIndex((s) => Math.min(s + 1, maxSteps));
  }, [maxSteps]);

  const handlePlayPause = useCallback(() => {
    if (playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setPlaying(false);
    } else {
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setStepIndex((s) => {
          if (s >= maxSteps) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 400);
    }
  }, [playing, maxSteps]);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setStepIndex(0);
    setSelectedTransition(null);
  }, []);

  const handleSelect = useCallback((d: ConcurrencyDemo) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setActive(d);
    setStepIndex(0);
    setSelectedTransition(null);
  }, []);

  const handleEventLoopDemoChange = useCallback((id: EventLoopDemoId) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setEventLoopDemoId(id);
    setStepIndex(0);
  }, []);

  const handleGoroutineDemoChange = useCallback((id: GoroutineDemoId) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setGoroutineDemoId(id);
    setStepIndex(0);
  }, []);

  const handleAsyncPatternDemoChange = useCallback((id: AsyncPatternId) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setAsyncPatternDemoId(id);
    setStepIndex(0);
  }, []);

  const handleTransitionClick = useCallback((idx: number) => {
    setSelectedTransition((prev) => (prev === idx ? null : idx));
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  let canvas: React.ReactNode;
  switch (active) {
    case "race-condition":
      canvas = (
        <div className="flex h-full w-full flex-col overflow-auto">
          <RaceConditionViz
            unsafeDemo={unsafeDemo}
            safeDemo={safeDemo}
            stepIndex={stepIndex}
          />
          <div className="px-6 pb-4">
            <RaceConditionHistogram
              onRun={handleRunHistogram}
              results={histogramResults}
              running={histogramRunning}
              expectedValue={unsafeDemo.expectedValue}
            />
          </div>
        </div>
      );
      break;
    case "producer-consumer":
      canvas = (
        <ProducerConsumerViz events={pcEvents} stepIndex={stepIndex} />
      );
      break;
    case "dining-philosophers":
      canvas = (
        <DiningPhilosophersViz
          naiveEvents={naiveEvents}
          orderedEvents={orderedEvents}
          stepIndex={stepIndex}
        />
      );
      break;
    case "event-loop":
      canvas = (
        <EventLoopViz
          steps={eventLoopSteps}
          stepIndex={stepIndex}
          demoId={eventLoopDemoId}
          onDemoChange={handleEventLoopDemoChange}
        />
      );
      break;
    case "thread-lifecycle":
      canvas = (
        <ThreadLifecycleViz
          stepIndex={stepIndex}
          selectedTransition={selectedTransition}
          onTransitionClick={handleTransitionClick}
        />
      );
      break;
    case "go-goroutines":
      canvas = (
        <GoroutineViz
          steps={goroutineSteps}
          stepIndex={stepIndex}
          demoId={goroutineDemoId}
          onDemoChange={handleGoroutineDemoChange}
        />
      );
      break;
    case "readers-writers":
      canvas = (
        <ReadersWritersViz events={rwEvents} stepIndex={stepIndex} />
      );
      break;
    case "sleeping-barber":
      canvas = (
        <SleepingBarberViz events={barberEvents} stepIndex={stepIndex} />
      );
      break;
    case "async-patterns":
      canvas = (
        <AsyncPatternsViz
          steps={asyncPatternSteps}
          stepIndex={stepIndex}
          demoId={asyncPatternDemoId}
          onDemoChange={handleAsyncPatternDemoChange}
        />
      );
      break;
    case "deadlock-demo":
      canvas = (
        <DeadlockDemoViz
          deadlockSteps={deadlockSteps}
          preventionSteps={deadlockPreventionSteps}
          stepIndex={stepIndex}
        />
      );
      break;
    case "lock-comparison":
      canvas = (
        <LockComparisonViz
          spinSteps={spinLockSteps}
          mutexSteps={blockingMutexSteps}
          ttasSteps={ttasLockSteps}
          spinMetrics={spinMetrics}
          mutexMetrics={mutexMetrics}
          ttasMetrics={ttasMetrics}
          stepIndex={stepIndex}
        />
      );
      break;
  }

  return {
    sidebar: (
      <div className="flex h-full flex-col">
        <ConcurrencySidebar active={active} onSelect={handleSelect} />
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={handleStep}
            disabled={stepIndex >= maxSteps}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={handlePlayPause}
            disabled={stepIndex >= maxSteps && !playing}
            className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {playing ? (
              <><Layers className="h-3 w-3" /> Pause</>
            ) : (
              <><Play className="h-3 w-3" /> Play</>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {stepIndex + 1}/{maxSteps + 1}
          </span>
        </div>
      </div>
    ),
    canvas,
    properties: (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Concepts
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <h3 className="mb-1 text-sm font-medium text-foreground">
            {DEMOS.find((d) => d.id === active)?.name}
          </h3>
          <p className="mb-3 text-xs text-foreground-muted">
            {DEMOS.find((d) => d.id === active)?.description}
          </p>

          {active === "race-condition" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                A <strong className="text-foreground">race condition</strong>{" "}
                occurs when multiple threads access shared data without
                synchronization.
              </p>
              <p>
                The <strong className="text-red-400">unsafe</strong> version
                shows lost updates where threads overwrite each other's work.
              </p>
              <p>
                The <strong className="text-green-400">safe</strong> version
                uses a mutex to ensure only one thread modifies the counter at a
                time.
              </p>
            </div>
          )}

          {active === "producer-consumer" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                The <strong className="text-foreground">bounded buffer</strong>{" "}
                problem coordinates producers and consumers sharing a
                fixed-size queue.
              </p>
              <p>
                Producers wait when the buffer is full. Consumers wait when
                empty. Signal/notify wakes blocked threads.
              </p>
            </div>
          )}

          {active === "dining-philosophers" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                Five philosophers sit around a table with a fork between each
                pair. Each needs two forks to eat.
              </p>
              <p>
                <strong className="text-red-400">Naive:</strong> Each
                philosopher picks up their left fork first, leading to
                circular wait (deadlock).
              </p>
              <p>
                <strong className="text-green-400">Ordered:</strong> Always
                pick up the lower-numbered fork first. This breaks circular
                wait.
              </p>
            </div>
          )}

          {active === "event-loop" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                JavaScript uses a{" "}
                <strong className="text-foreground">single-threaded event loop</strong>{" "}
                with distinct task queues.
              </p>
              <p>
                <strong className="text-green-400">Microtasks</strong> (Promises)
                are drained completely after each macrotask, before the next
                macrotask runs.
              </p>
              <p>
                <strong className="text-orange-400">Macrotasks</strong>{" "}
                (setTimeout, setInterval) execute one per loop iteration, after
                all microtasks are processed.
              </p>
              <p>
                This means <code className="text-foreground">Promise.then()</code>{" "}
                always fires before a <code className="text-foreground">setTimeout(0)</code>{" "}
                callback.
              </p>
            </div>
          )}

          {active === "thread-lifecycle" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                A thread passes through{" "}
                <strong className="text-foreground">7 states</strong> during its
                lifetime.
              </p>
              <p>
                <strong className="text-blue-400">New → Runnable:</strong>{" "}
                <code className="text-foreground">start()</code> places the thread
                in the ready queue.
              </p>
              <p>
                <strong className="text-green-400">Running:</strong> The OS
                scheduler dispatches the thread to a CPU core.
              </p>
              <p>
                <strong className="text-red-400">Blocked:</strong> Contended lock
                acquisition suspends the thread until the lock is released.
              </p>
              <p>
                <strong className="text-yellow-400">Waiting / Timed-Waiting:</strong>{" "}
                <code className="text-foreground">wait()</code>,{" "}
                <code className="text-foreground">sleep()</code>, or{" "}
                <code className="text-foreground">join()</code> suspend execution.
              </p>
              <p>
                Click transitions in the diagram to highlight them.
              </p>
            </div>
          )}

          {active === "go-goroutines" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                Go&apos;s concurrency model uses{" "}
                <strong className="text-foreground">goroutines</strong> (lightweight
                green threads) and{" "}
                <strong className="text-foreground">channels</strong> for
                communication.
              </p>
              <p>
                <strong className="text-green-400">Unbuffered channels</strong>{" "}
                require both sender and receiver to be ready (rendezvous).
              </p>
              <p>
                <strong className="text-blue-400">Buffered channels</strong>{" "}
                allow sends up to the capacity before blocking.
              </p>
              <p>
                <strong className="text-yellow-400">select</strong> waits on
                multiple channels simultaneously, picking whichever is ready first.
              </p>
              <p>
                <strong className="text-purple-400">WaitGroup</strong> blocks until
                a counter decremented by Done() reaches zero.
              </p>

              {/* Live goroutine states */}
              {goroutineSteps[stepIndex] && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-2">
                  <h4 className="text-[11px] font-semibold text-foreground">
                    Goroutine States
                  </h4>
                  {goroutineSteps[stepIndex].goroutines.map((gr) => (
                    <div
                      key={gr.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-[11px]"
                      style={{ backgroundColor: `${GOROUTINE_STATE_COLORS[gr.state]}15` }}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: GOROUTINE_STATE_COLORS[gr.state] }}
                      />
                      <span className="font-medium text-foreground">{gr.name}</span>
                      <span
                        className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: GOROUTINE_STATE_COLORS[gr.state] }}
                      >
                        {GOROUTINE_STATE_LABELS[gr.state]}
                      </span>
                    </div>
                  ))}

                  {/* Channel contents */}
                  {goroutineSteps[stepIndex].channels.length > 0 && (
                    <>
                      <h4 className="mt-2 text-[11px] font-semibold text-foreground">
                        Channel Contents
                      </h4>
                      {goroutineSteps[stepIndex].channels.map((channel) => (
                        <div
                          key={channel.id}
                          className="rounded border border-border bg-elevated/30 px-2 py-1 text-[11px]"
                        >
                          <span className="font-medium text-foreground">
                            {channel.name}
                          </span>
                          <span className="ml-1 text-foreground-subtle">
                            ({channel.capacity === 0 ? 'unbuffered' : `cap:${channel.capacity}`})
                          </span>
                          <div className="mt-0.5 font-mono text-[10px] text-foreground-muted">
                            buffer: [{channel.buffer.join(', ')}]
                            {channel.senders.length > 0 && (
                              <span className="ml-2 text-amber-400">
                                senders: {channel.senders.join(', ')}
                              </span>
                            )}
                            {channel.receivers.length > 0 && (
                              <span className="ml-2 text-blue-400">
                                receivers: {channel.receivers.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {active === "readers-writers" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                The <strong className="text-foreground">readers-writers problem</strong>{" "}
                controls access to a shared resource where reads are concurrent
                but writes are exclusive.
              </p>
              <p>
                <strong className="text-blue-400">Readers</strong> can access
                the resource simultaneously -- no data corruption because they
                only observe.
              </p>
              <p>
                <strong className="text-red-400">Writers</strong> need exclusive
                access. They must wait until all readers finish and no other
                writer is active.
              </p>
              <p>
                <strong className="text-amber-400">Starvation:</strong> With
                readers-preference, a steady stream of readers can starve
                writers indefinitely. Writers-preference or fair queuing
                policies address this.
              </p>
              <p>
                Real-world usage: <code className="text-foreground">ReadWriteLock</code>{" "}
                in Java, <code className="text-foreground">sync.RWMutex</code> in Go,{" "}
                <code className="text-foreground">shared_mutex</code> in C++.
              </p>
            </div>
          )}

          {active === "sleeping-barber" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                The <strong className="text-foreground">sleeping barber problem</strong>{" "}
                models a service with limited waiting capacity.
              </p>
              <p>
                <strong className="text-purple-400">Barber</strong> sleeps when
                no customers are present, and is woken by the next arrival.
              </p>
              <p>
                <strong className="text-blue-400">Waiting room</strong> has a
                fixed number of chairs. Customers sit if a chair is available.
              </p>
              <p>
                <strong className="text-red-400">Full shop:</strong> When all
                chairs are occupied, arriving customers leave (lost demand).
              </p>
              <p>
                The key synchronisation challenge is avoiding race conditions
                between the barber checking for customers and customers checking
                the barber&apos;s state. Solved with{" "}
                <code className="text-foreground">mutex + semaphore</code>.
              </p>
              <p>
                Analogies: connection pools, thread pools, bounded task queues.
              </p>
            </div>
          )}

          {active === "async-patterns" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                JavaScript&apos;s <strong className="text-foreground">Promise combinators</strong>{" "}
                compose multiple async operations with different settlement strategies.
              </p>
              <p>
                <strong className="text-green-400">Promise.all</strong>: Resolves
                when ALL promises fulfill. Short-circuits on first rejection.
              </p>
              <p>
                <strong className="text-blue-400">Promise.race</strong>: Settles
                with the first promise to resolve <em>or</em> reject. Fastest wins.
              </p>
              <p>
                <strong className="text-purple-400">Promise.allSettled</strong>: Always
                waits for every promise. Returns an array of{" "}
                <code className="text-foreground">{"{status, value/reason}"}</code>{" "}
                objects. Never rejects.
              </p>
              <p>
                <strong className="text-amber-400">Promise.any</strong>: Resolves
                with the first fulfilled promise. Only rejects if ALL promises
                reject, throwing an{" "}
                <code className="text-foreground">AggregateError</code>.
              </p>
              <p>
                Use the tabs above to compare success and failure scenarios for
                each combinator.
              </p>

              {/* Live promise states */}
              {asyncPatternSteps[stepIndex] && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-2">
                  <h4 className="text-[11px] font-semibold text-foreground">
                    Promise States
                  </h4>
                  {asyncPatternSteps[stepIndex].promises.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-[11px]"
                      style={{ backgroundColor: `${PROMISE_STATE_COLORS[p.state]}15` }}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PROMISE_STATE_COLORS[p.state] }}
                      />
                      <span className="font-medium text-foreground">{p.id}</span>
                      <span
                        className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: PROMISE_STATE_COLORS[p.state] }}
                      >
                        {p.state}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "deadlock-demo" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                A <strong className="text-foreground">deadlock</strong> occurs
                when two or more threads are each waiting for a resource held by
                the other, creating a circular dependency.
              </p>
              <p>
                <strong className="text-red-400">Four conditions</strong> must
                all hold for deadlock: mutual exclusion, hold and wait, no
                preemption, and circular wait.
              </p>
              <p>
                <strong className="text-green-400">Resource ordering</strong>{" "}
                breaks circular wait by requiring all threads to acquire
                resources in a fixed global order.
              </p>
              <p>
                Other prevention strategies include lock timeouts, deadlock
                detection with rollback, and the banker&apos;s algorithm.
              </p>
            </div>
          )}

          {active === "lock-comparison" && (
            <div className="space-y-2 text-xs text-foreground-muted">
              <p>
                <strong className="text-red-400">SpinLock</strong>{" "}
                uses a busy-wait loop (test-and-set). The thread continuously
                polls the lock, burning CPU cycles. Best for{" "}
                <strong className="text-foreground">very short critical sections</strong>{" "}
                (a few microseconds) where context-switch overhead would dominate.
              </p>
              <p>
                <strong className="text-blue-400">Mutex (Blocking)</strong>{" "}
                puts waiting threads to sleep and wakes them on release. Sleeping
                threads use{" "}
                <strong className="text-foreground">zero CPU</strong>, but
                wake-up incurs context-switch latency. Ideal for{" "}
                <strong className="text-foreground">longer critical sections</strong>.
              </p>
              <p>
                <strong className="text-purple-400">TTAS</strong>{" "}
                (Test-and-Test-and-Set) first reads the lock with a regular
                (cached) load. Only if the lock appears free does it attempt an
                expensive atomic TAS. This{" "}
                <strong className="text-foreground">reduces bus/cache traffic</strong>{" "}
                dramatically under contention.
              </p>
              <p className="rounded border border-border/50 bg-elevated/50 px-2 py-1.5">
                <strong className="text-foreground">Rule of thumb:</strong>{" "}
                Short CS (a few instructions) → SpinLock or TTAS.{" "}
                Long CS (I/O, computation) → Blocking Mutex.{" "}
                High contention → TTAS over SpinLock.
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">State Legend</p>
                {Object.entries(MUTEX_STATE_COLORS).map(([state, color]) => (
                  <div key={state} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-[10px]">{MUTEX_STATE_LABELS[state] ?? state}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LEARN: Thread Pool Saturation Visualizer */}
        <div className="border-t border-sidebar-border">
          <ThreadPoolSaturationVisualizer />
        </div>
      </div>
    ),
    bottomPanel: (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Step Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-1 text-xs text-foreground-muted">
          {active === "race-condition" && unsafeDemo.events[stepIndex] && (
            <p>
              Tick {unsafeDemo.events[stepIndex].tick}:{" "}
              {unsafeDemo.events[stepIndex].description}
            </p>
          )}
          {active === "producer-consumer" && pcEvents[stepIndex] && (
            <p>
              Tick {pcEvents[stepIndex].tick}: {pcEvents[stepIndex].description}
            </p>
          )}
          {active === "dining-philosophers" &&
            naiveEvents[Math.min(stepIndex, naiveEvents.length - 1)] && (
              <p>
                {
                  naiveEvents[Math.min(stepIndex, naiveEvents.length - 1)]
                    .description
                }
              </p>
            )}
          {active === "event-loop" && eventLoopSteps[stepIndex] && (
            <p>
              Step {eventLoopSteps[stepIndex].tick + 1}:{" "}
              {eventLoopSteps[stepIndex].description}
            </p>
          )}
          {active === "thread-lifecycle" && (
            <p>
              Tick {stepIndex}:{" "}
              {EXAMPLE_THREADS.map((t) => {
                const entry = t.timeline.find((e) => e.tick === stepIndex);
                return entry ? `${t.name}: ${entry.description}` : null;
              })
                .filter(Boolean)
                .join(" | ") || "No state changes at this tick"}
            </p>
          )}
          {active === "go-goroutines" && goroutineSteps[stepIndex] && (
            <p>
              Step {goroutineSteps[stepIndex].tick + 1} [{goroutineSteps[stepIndex].action}]:{" "}
              {goroutineSteps[stepIndex].description}
            </p>
          )}
          {active === "readers-writers" && rwEvents[stepIndex] && (
            <p>
              Tick {rwEvents[stepIndex].tick} [{rwEvents[stepIndex].action}]:{" "}
              {rwEvents[stepIndex].description}
            </p>
          )}
          {active === "sleeping-barber" && barberEvents[stepIndex] && (
            <p>
              Tick {barberEvents[stepIndex].tick} [{barberEvents[stepIndex].customerAction}]:{" "}
              {barberEvents[stepIndex].description}
            </p>
          )}
          {active === "async-patterns" && asyncPatternSteps[stepIndex] && (
            <p>
              Step {asyncPatternSteps[stepIndex].tick + 1} [{asyncPatternSteps[stepIndex].pattern}]:{" "}
              {asyncPatternSteps[stepIndex].description}
            </p>
          )}
          {active === "deadlock-demo" && (() => {
            const dlStep = deadlockSteps[Math.min(stepIndex, deadlockSteps.length - 1)];
            return dlStep ? (
              <p>
                Tick {dlStep.tick}: {dlStep.description}
              </p>
            ) : null;
          })()}
          {active === "lock-comparison" && (() => {
            const s = spinLockSteps[Math.min(stepIndex, spinLockSteps.length - 1)];
            return s ? (
              <p>
                Tick {s.tick} | SpinLock: {s.description} | CPU: {s.cpuCycles} cycles
              </p>
            ) : null;
          })()}
        </div>
      </div>
    ),
  };
}

export const ConcurrencyModule = memo(function ConcurrencyModule() {
  return null;
});
