"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Timer, ArrowRight, GitCompare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceParticipant, LatencyMessage } from "@/lib/lld/types";

// ── Types ──────────────────────────────────────────────────────

interface SequenceScenario {
  id: string;
  name: string;
  participants: SequenceParticipant[];
  messages: LatencyMessage[];
}

// ── Sample Data ────────────────────────────────────────────────

const SCENARIOS: SequenceScenario[] = [
  {
    id: "api-gateway",
    name: "API Gateway Flow",
    participants: [
      { id: "client", name: "Client" },
      { id: "gateway", name: "API Gateway" },
      { id: "auth", name: "Auth Service" },
      { id: "service", name: "Backend" },
      { id: "db", name: "Database" },
    ],
    messages: [
      { id: "m1", from: "client", to: "gateway", label: "POST /api/order", latencyMs: 5 },
      { id: "m2", from: "gateway", to: "auth", label: "Validate JWT", latencyMs: 12 },
      { id: "m3", from: "auth", to: "gateway", label: "200 OK", latencyMs: 8, isReturn: true },
      { id: "m4", from: "gateway", to: "service", label: "Forward request", latencyMs: 3 },
      { id: "m5", from: "service", to: "db", label: "INSERT order", latencyMs: 25 },
      { id: "m6", from: "db", to: "service", label: "ACK", latencyMs: 2, isReturn: true },
      { id: "m7", from: "service", to: "gateway", label: "201 Created", latencyMs: 4, isReturn: true },
      { id: "m8", from: "gateway", to: "client", label: "Response", latencyMs: 5, isReturn: true },
    ],
  },
  {
    id: "payment-flow",
    name: "Payment Processing",
    participants: [
      { id: "user", name: "User" },
      { id: "api", name: "API Server" },
      { id: "payment", name: "Payment Svc" },
      { id: "stripe", name: "Stripe API" },
      { id: "ledger", name: "Ledger DB" },
    ],
    messages: [
      { id: "p1", from: "user", to: "api", label: "Submit payment", latencyMs: 10 },
      { id: "p2", from: "api", to: "payment", label: "Process charge", latencyMs: 5 },
      { id: "p3", from: "payment", to: "stripe", label: "Charge card", latencyMs: 350 },
      { id: "p4", from: "stripe", to: "payment", label: "charge_id", latencyMs: 50, isReturn: true },
      { id: "p5", from: "payment", to: "ledger", label: "Record txn", latencyMs: 15 },
      { id: "p6", from: "ledger", to: "payment", label: "ACK", latencyMs: 3, isReturn: true },
      { id: "p7", from: "payment", to: "api", label: "Success", latencyMs: 4, isReturn: true },
      { id: "p8", from: "api", to: "user", label: "Confirmation", latencyMs: 8, isReturn: true },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────

function findCriticalPath(messages: LatencyMessage[]): Set<string> {
  // Simple: the message with the highest latency on each forward path segment
  const sorted = [...messages].sort((a, b) => b.latencyMs - a.latencyMs);
  const criticalIds = new Set<string>();
  // Mark top 3 latency messages as critical
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    criticalIds.add(sorted[i].id);
  }
  return criticalIds;
}

// ── Component ──────────────────────────────────────────────────

export default function SequenceDiagramLatencyOverlay() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [latencyOverrides, setLatencyOverrides] = useState<Record<string, number>>({});
  const [compareMode, setCompareMode] = useState(false);
  const [compareOverrides, setCompareOverrides] = useState<Record<string, number>>({});

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );

  // Merge overrides with base latencies
  const messages = useMemo(() => {
    return scenario.messages.map((m) => ({
      ...m,
      latencyMs: latencyOverrides[m.id] ?? m.latencyMs,
    }));
  }, [scenario, latencyOverrides]);

  const compareMessages = useMemo(() => {
    if (!compareMode) return null;
    return scenario.messages.map((m) => ({
      ...m,
      latencyMs: compareOverrides[m.id] ?? m.latencyMs,
    }));
  }, [scenario, compareOverrides, compareMode]);

  // Cumulative latencies
  const cumulativeLatencies = useMemo(() => {
    let total = 0;
    return messages.map((m) => {
      total += m.latencyMs;
      return total;
    });
  }, [messages]);

  const totalLatency = cumulativeLatencies[cumulativeLatencies.length - 1] ?? 0;
  const p99Total = Math.round(totalLatency * 1.8); // rough P99 estimate

  const criticalPath = useMemo(() => findCriticalPath(messages), [messages]);

  // Compare totals
  const compareTotalLatency = useMemo(() => {
    if (!compareMessages) return 0;
    return compareMessages.reduce((sum, m) => sum + m.latencyMs, 0);
  }, [compareMessages]);

  const handleLatencyChange = useCallback(
    (msgId: string, value: number, isCompare: boolean) => {
      if (isCompare) {
        setCompareOverrides((prev) => ({ ...prev, [msgId]: value }));
      } else {
        setLatencyOverrides((prev) => ({ ...prev, [msgId]: value }));
      }
    },
    [],
  );

  const handleScenarioChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setScenarioId(e.target.value);
      setLatencyOverrides({});
      setCompareOverrides({});
    },
    [],
  );

  // SVG layout constants
  const participantSpacing = 120;
  const rowHeight = 48;
  const topMargin = 50;
  const svgWidth = scenario.participants.length * participantSpacing + 40;
  const svgHeight = topMargin + messages.length * rowHeight + 40;

  const pIdx = useMemo(() => {
    const m = new Map<string, number>();
    scenario.participants.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [scenario.participants]);

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Sequence Diagram Latency Overlay
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCompareMode((c) => !c)}
          className={cn(
            "ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] border",
          )}
          style={{
            background: compareMode ? "var(--violet-3)" : "var(--gray-3)",
            borderColor: compareMode ? "var(--primary)" : "var(--border)",
            color: compareMode ? "var(--primary)" : "var(--foreground-muted)",
          }}
        >
          <GitCompare className="h-3 w-3" />
          What-If
        </motion.button>
      </div>

      {/* Scenario selector */}
      <div className="mb-4">
        <select
          value={scenarioId}
          onChange={handleScenarioChange}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm",
            "bg-[var(--surface-elevated)] border-[var(--border)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
          )}
          style={{ color: "var(--foreground)" }}
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* SVG Sequence Diagram */}
      <div
        className="rounded-md border mb-4 overflow-x-auto"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ minWidth: 500, maxHeight: 500 }}
        >
          {/* Participant headers */}
          {scenario.participants.map((p, i) => {
            const x = 40 + i * participantSpacing;
            return (
              <g key={p.id}>
                <rect
                  x={x - 40}
                  y={8}
                  width={80}
                  height={28}
                  rx={4}
                  fill="var(--gray-4)"
                  stroke="var(--gray-6)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={27}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--foreground)"
                  fontFamily="inherit"
                >
                  {p.name}
                </text>
                {/* Lifeline */}
                <line
                  x1={x}
                  y1={36}
                  x2={x}
                  y2={svgHeight - 10}
                  stroke="var(--gray-6)"
                  strokeWidth={1}
                  strokeDasharray="4,3"
                />
              </g>
            );
          })}

          {/* Messages */}
          {messages.map((msg, mIdx) => {
            const fromIdx = pIdx.get(msg.from) ?? 0;
            const toIdx = pIdx.get(msg.to) ?? 0;
            const fromX = 40 + fromIdx * participantSpacing;
            const toX = 40 + toIdx * participantSpacing;
            const y = topMargin + mIdx * rowHeight + 20;
            const isCritical = criticalPath.has(msg.id);
            const strokeColor = isCritical
              ? "var(--state-error)"
              : msg.isReturn
                ? "var(--gray-8)"
                : "var(--state-active)";

            return (
              <g key={msg.id}>
                {/* Arrow line */}
                <line
                  x1={fromX}
                  y1={y}
                  x2={toX}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={isCritical ? 2 : 1.5}
                  strokeDasharray={msg.isReturn ? "4,3" : undefined}
                  markerEnd="url(#seq-arrow)"
                />
                {/* Label */}
                <text
                  x={(fromX + toX) / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--foreground-muted)"
                >
                  {msg.label}
                </text>
                {/* Latency badge */}
                <rect
                  x={(fromX + toX) / 2 + 30}
                  y={y - 7}
                  width={40}
                  height={14}
                  rx={3}
                  fill={isCritical ? "var(--state-error)" : "var(--gray-5)"}
                  opacity={0.9}
                />
                <text
                  x={(fromX + toX) / 2 + 50}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="monospace"
                  fill={isCritical ? "var(--primary-foreground)" : "var(--foreground)"}
                >
                  {msg.latencyMs}ms
                </text>
                {/* Cumulative */}
                <text
                  x={svgWidth - 20}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={8}
                  fontFamily="monospace"
                  fill="var(--foreground-muted)"
                >
                  +{cumulativeLatencies[mIdx]}ms
                </text>
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="seq-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--state-active)" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Latency adjusters */}
      <div className="mb-4">
        <p className="text-xs font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Adjust Step Latencies
        </p>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-center gap-2 rounded-md px-2 py-1"
              style={{ background: "var(--gray-3)" }}
            >
              <span className="text-[10px] flex-1 truncate" style={{ color: "var(--foreground-muted)" }}>
                {msg.label}
              </span>
              <input
                type="number"
                min={0}
                max={5000}
                value={msg.latencyMs}
                onChange={(e) =>
                  handleLatencyChange(msg.id, Math.max(0, Number(e.target.value)), false)
                }
                className="w-16 rounded border px-1.5 py-0.5 text-[10px] font-mono text-right"
                style={{
                  background: "var(--surface-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
              <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Total Latency</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--foreground)" }}>{totalLatency}ms</p>
        </div>
        <div className="rounded-md border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>P99 Estimate</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--viz-p99)" }}>{p99Total}ms</p>
        </div>
        <div className="rounded-md border p-3 text-center" style={{ background: "var(--gray-3)", borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Critical Steps</p>
          <p className="text-sm font-bold font-mono" style={{ color: "var(--state-error)" }}>{criticalPath.size}</p>
        </div>
      </div>

      {/* Compare mode summary */}
      {compareMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 rounded-md border p-3 flex items-center justify-between"
          style={{ background: "var(--violet-2)", borderColor: "var(--primary)" }}
        >
          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            What-If Total:
          </span>
          <span className="text-sm font-bold font-mono" style={{ color: "var(--primary)" }}>
            {compareTotalLatency}ms
          </span>
          <span className="text-xs" style={{ color: compareTotalLatency < totalLatency ? "var(--state-success)" : "var(--state-error)" }}>
            {compareTotalLatency < totalLatency
              ? `${totalLatency - compareTotalLatency}ms faster`
              : `${compareTotalLatency - totalLatency}ms slower`}
          </span>
        </motion.div>
      )}
    </div>
  );
}
