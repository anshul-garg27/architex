"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Network,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  PenLine,
  Shield,
  Clock,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type ResolutionStrategy = "fencing" | "quorum" | "crdt";

interface ClusterNode {
  id: string;
  label: string;
  x: number;
  y: number;
  partition: "left" | "right" | "none";
  isLeader: boolean;
  value: string;
  fencingToken: number;
}

interface WriteEvent {
  id: number;
  node: string;
  value: string;
  partition: "left" | "right";
  timestamp: number;
  fencingToken?: number;
}

interface AnimationState {
  phase: "normal" | "partitioning" | "split-brain" | "conflicting-writes" | "resolution" | "resolved";
  tick: number;
  message: string;
}

// ── Constants ──────────────────────────────────────────────────

const STRATEGY_INFO: Record<ResolutionStrategy, { name: string; description: string }> = {
  fencing: {
    name: "Fencing Tokens",
    description: "Each leader gets a monotonically increasing token. Storage rejects writes with outdated tokens, ensuring only the legitimate leader's writes succeed.",
  },
  quorum: {
    name: "Quorum-Based",
    description: "Writes require acknowledgment from a majority (W > N/2). The partition with fewer nodes cannot achieve quorum and stops accepting writes.",
  },
  crdt: {
    name: "CRDT Merge",
    description: "Both partitions accept writes freely. On reunion, CRDTs automatically merge using mathematical properties (commutativity, associativity, idempotency).",
  },
};

const NODE_POSITIONS: { x: number; y: number }[] = [
  { x: 60, y: 50 },   // top-left
  { x: 60, y: 110 },  // mid-left
  { x: 60, y: 170 },  // bottom-left
  { x: 220, y: 50 },  // top-right
  { x: 220, y: 110 }, // mid-right
];

// ── Component ──────────────────────────────────────────────────

export default function SplitBrainVisualizer() {
  const [strategy, setStrategy] = useState<ResolutionStrategy>("fencing");
  const [isRunning, setIsRunning] = useState(false);
  const [partitionLine, setPartitionLine] = useState(140);
  const [animState, setAnimState] = useState<AnimationState>({
    phase: "normal",
    tick: 0,
    message: "Healthy 5-node cluster with elected leader N0.",
  });
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [writes, setWrites] = useState<WriteEvent[]>([]);
  const [resolvedValue, setResolvedValue] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const writeIdRef = useRef(0);

  // Initialize cluster
  const initCluster = useCallback(() => {
    return NODE_POSITIONS.map((pos, i) => ({
      id: `n${i}`,
      label: `N${i}`,
      x: pos.x,
      y: pos.y,
      partition: "none" as const,
      isLeader: i === 0,
      value: "v0",
      fencingToken: i === 0 ? 1 : 0,
    }));
  }, []);

  useEffect(() => {
    setNodes(initCluster());
  }, [initCluster]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setNodes(initCluster());
    setWrites([]);
    setResolvedValue(null);
    setAnimState({ phase: "normal", tick: 0, message: "Healthy 5-node cluster with elected leader N0." });
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [initCluster]);

  // Run animation sequence
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const phases: AnimationState[] = [
      { phase: "normal", tick: 0, message: "Cluster healthy. All nodes connected. N0 is leader." },
      { phase: "partitioning", tick: 1, message: "Network partition forming... Links between halves failing." },
      { phase: "split-brain", tick: 2, message: "Split brain! Left: {N0,N1,N2}. Right: {N3,N4}. Both sides elect leaders." },
      { phase: "conflicting-writes", tick: 3, message: "Conflicting writes! Left leader writes 'A=100'. Right leader writes 'A=200'." },
      { phase: "conflicting-writes", tick: 4, message: "More conflicts accumulating. Data diverging across partitions." },
      { phase: "resolution", tick: 5, message: `Partition heals. Applying resolution: ${STRATEGY_INFO[strategy].name}` },
      { phase: "resolved", tick: 6, message: getResolutionMessage(strategy) },
    ];

    let step = 0;
    setAnimState(phases[0]);

    intervalRef.current = setInterval(() => {
      step++;
      if (step >= phases.length) {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const phase = phases[step];
      setAnimState(phase);

      // Update node states based on phase
      if (phase.phase === "partitioning" || phase.phase === "split-brain") {
        setNodes((prev) =>
          prev.map((n) => ({
            ...n,
            partition: n.x < partitionLine ? "left" : "right",
            isLeader: phase.phase === "split-brain"
              ? (n.x < partitionLine ? n.id === "n0" : n.id === "n3")
              : n.isLeader,
          })),
        );
      }

      if (phase.phase === "conflicting-writes") {
        writeIdRef.current++;
        const wid = writeIdRef.current;
        setWrites((prev) => [
          ...prev,
          {
            id: wid,
            node: step === 3 ? "n0" : "n3",
            value: step === 3 ? "A=100" : "A=200",
            partition: step === 3 ? "left" : "right",
            timestamp: Date.now(),
            fencingToken: step === 3 ? 1 : 2,
          },
        ]);

        setNodes((prev) =>
          prev.map((n) => ({
            ...n,
            value: n.partition === "left" ? "A=100" : n.partition === "right" ? "A=200" : n.value,
          })),
        );
      }

      if (phase.phase === "resolution") {
        setNodes((prev) =>
          prev.map((n) => ({
            ...n,
            partition: "none",
          })),
        );
      }

      if (phase.phase === "resolved") {
        const resolved = strategy === "fencing" ? "A=100" : strategy === "quorum" ? "A=100" : "A={100,200}";
        setResolvedValue(resolved);
        setNodes((prev) =>
          prev.map((n) => ({
            ...n,
            partition: "none",
            isLeader: n.id === "n0",
            value: resolved,
          })),
        );
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, strategy, partitionLine]);

  function getResolutionMessage(s: ResolutionStrategy): string {
    switch (s) {
      case "fencing":
        return "Resolved: N0 had token=1 (original). N3 had token=2 (higher). Storage accepted only token=2. Final: A=200.";
      case "quorum":
        return "Resolved: Left partition had 3/5 nodes (quorum). Right had 2/5 (no quorum). Right's writes rejected. Final: A=100.";
      case "crdt":
        return "Resolved: CRDT merge combines both writes. Final: A={100,200} (set union). Application decides semantics.";
    }
  }

  const phaseColor = (phase: AnimationState["phase"]): string => {
    switch (phase) {
      case "normal": return "var(--state-success)";
      case "partitioning": return "var(--state-warning)";
      case "split-brain":
      case "conflicting-writes": return "var(--state-error)";
      case "resolution": return "var(--viz-seq-high)";
      case "resolved": return "var(--state-success)";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <GitMerge className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Split-Brain Visualizer
        </h3>
        <span
          className="ml-auto text-[10px] px-2 py-0.5 rounded font-medium capitalize"
          style={{ background: phaseColor(animState.phase), color: "#fff" }}
        >
          {animState.phase.replace("-", " ")}
        </span>
      </div>

      {/* Resolution Strategy Selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(STRATEGY_INFO) as ResolutionStrategy[]).map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setStrategy(s); handleReset(); }}
            className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
            style={{
              background: s === strategy ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: s === strategy ? "var(--primary)" : "var(--border)",
              color: s === strategy ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {STRATEGY_INFO[s].name}
          </motion.button>
        ))}
      </div>

      {/* Strategy Description */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        {STRATEGY_INFO[strategy].description}
      </p>

      {/* Cluster Visualization */}
      <div
        className="rounded-md border p-2 mb-4 flex justify-center relative"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <svg width={280} height={220} viewBox="0 0 280 220">
          {/* Partition line */}
          {animState.phase !== "normal" && animState.phase !== "resolved" && (
            <motion.line
              x1={partitionLine}
              y1={0}
              x2={partitionLine}
              y2={220}
              stroke="var(--state-error)"
              strokeWidth={2}
              strokeDasharray="6 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: animState.phase === "resolution" ? 0.3 : 0.8 }}
            />
          )}

          {/* Partition labels */}
          {(animState.phase === "split-brain" || animState.phase === "conflicting-writes") && (
            <>
              <text x={70} y={205} textAnchor="middle" fill="var(--state-warning)" fontSize={9} fontWeight={600}>
                Partition A (3 nodes)
              </text>
              <text x={210} y={205} textAnchor="middle" fill="var(--state-error)" fontSize={9} fontWeight={600}>
                Partition B (2 nodes)
              </text>
            </>
          )}

          {/* Links between nodes in same partition */}
          {nodes.map((n1, i) =>
            nodes.slice(i + 1).map((n2) => {
              const samePartition =
                animState.phase === "normal" || animState.phase === "resolved" ||
                n1.partition === n2.partition;
              if (!samePartition) return null;
              return (
                <motion.line
                  key={`${n1.id}-${n2.id}`}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke="var(--gray-7)"
                  strokeWidth={1}
                  animate={{ opacity: samePartition ? 0.4 : 0 }}
                />
              );
            }),
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={18}
                fill={
                  node.isLeader
                    ? node.partition === "right" ? "var(--state-error)" : "var(--primary)"
                    : "var(--gray-6)"
                }
                stroke={
                  node.isLeader
                    ? node.partition === "right" ? "var(--state-error)" : "var(--primary)"
                    : "var(--gray-8)"
                }
                strokeWidth={node.isLeader ? 3 : 1.5}
                animate={{ scale: node.isLeader ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: node.isLeader && isRunning ? Infinity : 0, duration: 1.5 }}
              />
              <text
                x={node.x}
                y={node.y - 2}
                textAnchor="middle"
                fill="#fff"
                fontSize={10}
                fontWeight={600}
                fontFamily="monospace"
              >
                {node.label}
              </text>
              <text
                x={node.x}
                y={node.y + 10}
                textAnchor="middle"
                fill="hsla(0,0%,100%,0.7)"
                fontSize={7}
                fontFamily="monospace"
              >
                {node.value}
              </text>
              {node.isLeader && (
                <text
                  x={node.x}
                  y={node.y - 24}
                  textAnchor="middle"
                  fill={node.partition === "right" ? "var(--state-error)" : "var(--primary)"}
                  fontSize={8}
                  fontWeight={700}
                >
                  LEADER
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Status Message */}
      <motion.div
        key={animState.tick}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-md border p-3 mb-4 text-xs"
        style={{
          background: `color-mix(in srgb, ${phaseColor(animState.phase)} 10%, transparent)`,
          borderColor: phaseColor(animState.phase),
          color: "var(--foreground)",
        }}
      >
        <span className="font-mono text-[10px] mr-2" style={{ color: phaseColor(animState.phase) }}>
          [{animState.phase.toUpperCase()}]
        </span>
        {animState.message}
      </motion.div>

      {/* Write Log */}
      {writes.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
            CONFLICTING WRITES
          </p>
          <div className="space-y-1">
            {writes.map((w) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[10px] font-mono"
              >
                <PenLine className="h-3 w-3" style={{ color: w.partition === "left" ? "var(--primary)" : "var(--state-error)" }} />
                <span style={{ color: "var(--foreground)" }}>{w.node}</span>
                <span style={{ color: "var(--foreground-muted)" }}>wrote</span>
                <span className="font-bold" style={{ color: w.partition === "left" ? "var(--primary)" : "var(--state-error)" }}>
                  {w.value}
                </span>
                {w.fencingToken !== undefined && (
                  <span style={{ color: "var(--foreground-muted)" }}>
                    (token={w.fencingToken})
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Value */}
      <AnimatePresence>
        {resolvedValue && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border p-3 mb-4 flex items-center gap-2 text-xs"
            style={{
              background: "hsla(142, 71%, 45%, 0.1)",
              borderColor: "var(--state-success)",
              color: "var(--state-success)",
            }}
          >
            <Shield className="h-4 w-4" />
            <span>
              Resolved value: <span className="font-mono font-bold">{resolvedValue}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
          {isRunning ? "Pause" : "Start Scenario"}
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
