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
  ChevronRight,
  Circle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

type Topology = "ring" | "star" | "mesh";

interface TopoNode {
  id: string;
  label: string;
  x: number;
  y: number;
  alive: boolean;
  isLeader: boolean;
}

interface TopoEdge {
  from: string;
  to: string;
  active: boolean;
}

interface FailureMode {
  id: string;
  name: string;
  description: string;
  probability: "High" | "Medium" | "Low";
  impact: "Critical" | "High" | "Medium" | "Low";
  applicableTo: Topology[];
}

interface CascadeStep {
  tick: number;
  message: string;
  deadNodes: string[];
  deadEdges: string[];
}

// ── Failure Modes ──────────────────────────────────────────────

const FAILURE_MODES: FailureMode[] = [
  {
    id: "single-node",
    name: "Single Node Failure",
    description: "One node crashes. In ring, breaks the chain. In star, only one spoke lost. In mesh, multiple paths reroute.",
    probability: "High",
    impact: "Medium",
    applicableTo: ["ring", "star", "mesh"],
  },
  {
    id: "leader-failure",
    name: "Leader/Hub Failure",
    description: "Central coordinator crashes. Star topology is fully disconnected. Ring and mesh degrade gracefully.",
    probability: "Medium",
    impact: "Critical",
    applicableTo: ["star", "ring", "mesh"],
  },
  {
    id: "cascade",
    name: "Cascade Failure",
    description: "One node fails, overloading neighbors. Ring propagates linearly. Star overloads hub. Mesh distributes load.",
    probability: "Low",
    impact: "Critical",
    applicableTo: ["ring", "star", "mesh"],
  },
  {
    id: "partition",
    name: "Network Partition",
    description: "Network splits into two halves. Ring splits into two arcs. Star splits only if hub is on boundary. Mesh has multiple paths.",
    probability: "Medium",
    impact: "High",
    applicableTo: ["ring", "star", "mesh"],
  },
  {
    id: "byzantine",
    name: "Byzantine Fault",
    description: "A node sends conflicting messages to different peers. Mesh and ring are vulnerable. Star can validate through hub.",
    probability: "Low",
    impact: "High",
    applicableTo: ["ring", "mesh"],
  },
];

// ── Topology Generators ────────────────────────────────────────

const NODE_COUNT = 6;
const CX = 140;
const CY = 110;
const RADIUS = 80;

function generateTopology(topo: Topology): { nodes: TopoNode[]; edges: TopoEdge[] } {
  const nodes: TopoNode[] = [];
  const edges: TopoEdge[] = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (2 * Math.PI * i) / NODE_COUNT - Math.PI / 2;
    nodes.push({
      id: `n${i}`,
      label: `N${i}`,
      x: CX + RADIUS * Math.cos(angle),
      y: CY + RADIUS * Math.sin(angle),
      alive: true,
      isLeader: i === 0,
    });
  }

  if (topo === "ring") {
    for (let i = 0; i < NODE_COUNT; i++) {
      edges.push({ from: `n${i}`, to: `n${(i + 1) % NODE_COUNT}`, active: true });
    }
  } else if (topo === "star") {
    // n0 is hub in center
    nodes[0].x = CX;
    nodes[0].y = CY;
    for (let i = 1; i < NODE_COUNT; i++) {
      const angle = (2 * Math.PI * (i - 1)) / (NODE_COUNT - 1) - Math.PI / 2;
      nodes[i].x = CX + RADIUS * Math.cos(angle);
      nodes[i].y = CY + RADIUS * Math.sin(angle);
      edges.push({ from: "n0", to: `n${i}`, active: true });
    }
  } else {
    // mesh: every node connects to every other
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        edges.push({ from: `n${i}`, to: `n${j}`, active: true });
      }
    }
  }

  return { nodes, edges };
}

function buildCascade(topo: Topology, failureId: string): CascadeStep[] {
  const steps: CascadeStep[] = [];

  if (failureId === "single-node") {
    steps.push({ tick: 0, message: "Node N2 fails", deadNodes: ["n2"], deadEdges: [] });
    if (topo === "ring") {
      steps.push({ tick: 1, message: "Ring broken: N1-N2 and N2-N3 links down", deadNodes: ["n2"], deadEdges: ["n1-n2", "n2-n3"] });
      steps.push({ tick: 2, message: "N1 and N3 cannot communicate without rerouting", deadNodes: ["n2"], deadEdges: ["n1-n2", "n2-n3"] });
    } else if (topo === "star") {
      steps.push({ tick: 1, message: "Spoke N0-N2 lost. Other nodes unaffected.", deadNodes: ["n2"], deadEdges: ["n0-n2"] });
    } else {
      steps.push({ tick: 1, message: "Mesh reroutes. Multiple paths still available.", deadNodes: ["n2"], deadEdges: [] });
    }
  } else if (failureId === "leader-failure") {
    steps.push({ tick: 0, message: "Leader N0 (hub) crashes", deadNodes: ["n0"], deadEdges: [] });
    if (topo === "star") {
      const allEdges = Array.from({ length: NODE_COUNT - 1 }, (_, i) => `n0-n${i + 1}`);
      steps.push({ tick: 1, message: "All spokes disconnected. Total partition.", deadNodes: ["n0"], deadEdges: allEdges });
      steps.push({ tick: 2, message: "No node can communicate. System down.", deadNodes: ["n0"], deadEdges: allEdges });
    } else if (topo === "ring") {
      steps.push({ tick: 1, message: "Ring broken at N0. Two arc segments formed.", deadNodes: ["n0"], deadEdges: [`n${NODE_COUNT - 1}-n0`, "n0-n1"] });
      steps.push({ tick: 2, message: "New leader election begins among remaining nodes.", deadNodes: ["n0"], deadEdges: [`n${NODE_COUNT - 1}-n0`, "n0-n1"] });
    } else {
      steps.push({ tick: 1, message: "Mesh: all other nodes still interconnected.", deadNodes: ["n0"], deadEdges: [] });
      steps.push({ tick: 2, message: "New leader elected. Minimal disruption.", deadNodes: ["n0"], deadEdges: [] });
    }
  } else if (failureId === "cascade") {
    steps.push({ tick: 0, message: "N3 overloaded, crashes", deadNodes: ["n3"], deadEdges: [] });
    steps.push({ tick: 1, message: "N3's load shifts to neighbors", deadNodes: ["n3"], deadEdges: [] });
    if (topo === "ring") {
      steps.push({ tick: 2, message: "N2 overloaded by redirected traffic, crashes", deadNodes: ["n3", "n2"], deadEdges: [] });
      steps.push({ tick: 3, message: "Cascade continues: N1 overloaded", deadNodes: ["n3", "n2", "n1"], deadEdges: [] });
    } else if (topo === "star") {
      steps.push({ tick: 2, message: "Hub N0 receives all redirected load", deadNodes: ["n3"], deadEdges: [] });
      steps.push({ tick: 3, message: "Hub N0 overloaded, crashes. Total failure.", deadNodes: ["n3", "n0"], deadEdges: [] });
    } else {
      steps.push({ tick: 2, message: "Load distributed across mesh. No cascade.", deadNodes: ["n3"], deadEdges: [] });
    }
  } else if (failureId === "partition") {
    steps.push({ tick: 0, message: "Network split between {N0,N1,N2} and {N3,N4,N5}", deadNodes: [], deadEdges: [] });
    if (topo === "ring") {
      steps.push({ tick: 1, message: "Two arcs: [N0-N1-N2] and [N3-N4-N5]", deadNodes: [], deadEdges: ["n2-n3", `n${NODE_COUNT - 1}-n0`] });
    } else if (topo === "star") {
      steps.push({ tick: 1, message: "Hub N0 in partition A. Nodes N3-N5 fully isolated.", deadNodes: [], deadEdges: ["n0-n3", "n0-n4", "n0-n5"] });
    } else {
      steps.push({ tick: 1, message: "Cross-partition edges severed. Both sides still connected internally.", deadNodes: [], deadEdges: ["n0-n3", "n0-n4", "n0-n5", "n1-n3", "n1-n4", "n1-n5", "n2-n3", "n2-n4", "n2-n5"] });
    }
  } else {
    steps.push({ tick: 0, message: "N4 sends conflicting values to neighbors", deadNodes: [], deadEdges: [] });
    steps.push({ tick: 1, message: "Peers disagree on state. Consensus broken.", deadNodes: [], deadEdges: [] });
  }

  return steps;
}

// ── Component ──────────────────────────────────────────────────

export default function TopologyAwareFailureModes() {
  const [topology, setTopology] = useState<Topology>("ring");
  const [selectedFailure, setSelectedFailure] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [nodesState, setNodesState] = useState<TopoNode[]>([]);
  const [edgesState, setEdgesState] = useState<TopoEdge[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => generateTopology(topology), [topology]);

  const applicableFailures = useMemo(
    () => FAILURE_MODES.filter((f) => f.applicableTo.includes(topology)),
    [topology],
  );

  const cascadeSteps = useMemo(
    () => (selectedFailure ? buildCascade(topology, selectedFailure) : []),
    [topology, selectedFailure],
  );

  // Reset on topology change
  useEffect(() => {
    setNodesState(baseNodes);
    setEdgesState(baseEdges);
    setSelectedFailure(null);
    setCurrentStep(-1);
    setIsAnimating(false);
  }, [baseNodes, baseEdges]);

  const edgeKey = useCallback((from: string, to: string) => {
    return [from, to].sort().join("-");
  }, []);

  // Animation logic
  useEffect(() => {
    if (!isAnimating || cascadeSteps.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let step = 0;
    setCurrentStep(0);

    // Apply first step immediately
    const applyStep = (s: CascadeStep) => {
      setNodesState(
        baseNodes.map((n) => ({
          ...n,
          alive: !s.deadNodes.includes(n.id),
        })),
      );
      setEdgesState(
        baseEdges.map((e) => ({
          ...e,
          active: !s.deadEdges.includes(edgeKey(e.from, e.to)),
        })),
      );
    };

    applyStep(cascadeSteps[0]);

    intervalRef.current = setInterval(() => {
      step++;
      if (step >= cascadeSteps.length) {
        setIsAnimating(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setCurrentStep(step);
      applyStep(cascadeSteps[step]);
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAnimating, cascadeSteps, baseNodes, baseEdges, edgeKey]);

  const handleSimulate = useCallback((failureId: string) => {
    setSelectedFailure(failureId);
    setIsAnimating(true);
    setCurrentStep(-1);
  }, []);

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    setCurrentStep(-1);
    setNodesState(baseNodes);
    setEdgesState(baseEdges);
    setSelectedFailure(null);
  }, [baseNodes, baseEdges]);

  const impactColor = (impact: string) => {
    switch (impact) {
      case "Critical": return "var(--state-error)";
      case "High": return "var(--viz-seq-high)";
      case "Medium": return "var(--state-warning)";
      default: return "var(--state-success)";
    }
  };

  const probColor = (prob: string) => {
    switch (prob) {
      case "High": return "var(--state-error)";
      case "Medium": return "var(--state-warning)";
      default: return "var(--state-success)";
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
        <Network className="h-5 w-5" style={{ color: "var(--primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Topology-Aware Failure Modes
        </h3>
      </div>

      {/* Topology Selector */}
      <div className="flex gap-2 mb-4">
        {(["ring", "star", "mesh"] as Topology[]).map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.97 }}
            onClick={() => setTopology(t)}
            className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-colors"
            style={{
              background: t === topology ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: t === topology ? "var(--primary)" : "var(--border)",
              color: t === topology ? "var(--primary)" : "var(--foreground-muted)",
            }}
          >
            {t}
          </motion.button>
        ))}
      </div>

      {/* Topology Visualization */}
      <div
        className="rounded-md border p-2 mb-4 flex justify-center"
        style={{ background: "var(--gray-2)", borderColor: "var(--border)" }}
      >
        <svg width={280} height={220} viewBox="0 0 280 220">
          {/* Edges */}
          {edgesState.map((e) => {
            const from = nodesState.find((n) => n.id === e.from);
            const to = nodesState.find((n) => n.id === e.to);
            if (!from || !to) return null;
            return (
              <motion.line
                key={`${e.from}-${e.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={e.active ? "var(--gray-7)" : "var(--state-error)"}
                strokeWidth={e.active ? 1.5 : 1}
                strokeDasharray={e.active ? "none" : "4 4"}
                animate={{ opacity: e.active ? 0.6 : 0.3 }}
              />
            );
          })}

          {/* Nodes */}
          {nodesState.map((node) => (
            <g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={16}
                fill={
                  !node.alive
                    ? "var(--state-error)"
                    : node.isLeader
                      ? "var(--primary)"
                      : "var(--gray-6)"
                }
                stroke={
                  !node.alive
                    ? "var(--state-error)"
                    : node.isLeader
                      ? "var(--primary)"
                      : "var(--gray-8)"
                }
                strokeWidth={2}
                animate={{
                  opacity: node.alive ? 1 : 0.4,
                  scale: node.alive ? 1 : 0.8,
                }}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill="#fff"
                fontSize={10}
                fontWeight={600}
                fontFamily="monospace"
              >
                {node.label}
              </text>
              {!node.alive && (
                <motion.text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={16}
                  fontWeight={700}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  X
                </motion.text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Animation Log */}
      <AnimatePresence>
        {currentStep >= 0 && cascadeSteps[currentStep] && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-md border p-3 mb-4 text-xs"
            style={{ background: "var(--gray-3)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <span className="font-mono text-[10px] mr-2" style={{ color: "var(--primary)" }}>
              T{cascadeSteps[currentStep].tick}
            </span>
            {cascadeSteps[currentStep].message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failure Modes List */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
          Possible Failure Modes
        </p>
        {applicableFailures.map((f) => (
          <motion.div
            key={f.id}
            layout
            className="rounded-md border p-3 cursor-pointer"
            style={{
              background: selectedFailure === f.id ? "var(--violet-3)" : "var(--gray-3)",
              borderColor: selectedFailure === f.id ? "var(--primary)" : "var(--border)",
            }}
            onClick={() => handleSimulate(f.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: impactColor(f.impact) }} />
              <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                {f.name}
              </span>
              <div className="ml-auto flex gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: probColor(f.probability), background: "var(--gray-5)" }}>
                  P: {f.probability}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: impactColor(f.impact), background: "var(--gray-5)" }}>
                  I: {f.impact}
                </span>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2 text-sm font-medium border",
          )}
          style={{ background: "var(--gray-3)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "rounded-md px-4 py-2.5 text-sm font-medium",
            "bg-[var(--primary)] text-[var(--primary-foreground)]",
            "hover:bg-[var(--primary-hover)] transition-colors",
          )}
          onClick={() => {
            if (selectedFailure) {
              handleSimulate(selectedFailure);
            }
          }}
        >
          <Zap className="h-4 w-4" />
          Simulate This
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
