"use client";

import React, { memo, lazy, Suspense, useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Network,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  AlertTriangle,
  Plus,
  Minus,
  Hash,
  Send,
  Skull,
  Wifi,
  WifiOff,
  Merge,
  ArrowRightLeft,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONCEPTS } from "@/lib/seo/concepts-data";
import { useProgressStore } from "@/stores/progress-store";
import { useCrossModuleStore } from "@/stores/cross-module-store";
import { markFeatureExplored, recordModuleVisit, logActivity } from "@/lib/progress/module-progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RaftCluster } from "@/lib/distributed/raft";
import { ConsistentHashRing } from "@/lib/distributed/consistent-hash";
import { VectorClockSimulation } from "@/lib/distributed/vector-clock";
import { GossipProtocol } from "@/lib/distributed/gossip";
import { CRDTSimulation } from "@/lib/distributed/crdt";
import { CAPCluster } from "@/lib/distributed/cap-theorem";
import { simulate2PC } from "@/lib/distributed/two-phase-commit";
import { simulateSagaChoreography } from "@/lib/distributed/saga";
import { simulateMapReduce } from "@/lib/distributed/map-reduce";
import { LamportSimulation } from "@/lib/distributed/lamport-timestamps";
import { simulatePaxos } from "@/lib/distributed/paxos";
import type { RaftNode, RaftMessage } from "@/lib/distributed/raft";
import type { HashNode, HashKey } from "@/lib/distributed/consistent-hash";
import type { ClockEvent } from "@/lib/distributed/vector-clock";
import type { GossipEvent, GossipNode } from "@/lib/distributed/gossip";
import type { CRDTEvent, CRDTType } from "@/lib/distributed/crdt";
import type { CAPEvent, CAPMode, CAPNode } from "@/lib/distributed/cap-theorem";
import type { TwoPCStep } from "@/lib/distributed/two-phase-commit";
import type { SagaStep } from "@/lib/distributed/saga";
import type { MRStep } from "@/lib/distributed/map-reduce";
import type { LamportEvent } from "@/lib/distributed/lamport-timestamps";
import type { PaxosStep } from "@/lib/distributed/paxos";
import { DISTRIBUTED_ROLE_COLORS, DISTRIBUTED_NODE_COLORS, DISTRIBUTED_MSG_COLORS, DISTRIBUTED_PHASE_COLORS } from '@/lib/visualization/distributed-config';
import { useReducedMotion } from "motion/react";

// ── LEARN Panel Components (lazy) ────────────────────────────
const TopologyAwareFailureModes = lazy(() => import("@/components/modules/distributed/TopologyAwareFailureModes"));
const SplitBrainVisualizer = lazy(() => import("@/components/modules/distributed/SplitBrainVisualizer"));

// ── Simulation Types ────────────────────────────────────────

type DistributedSim =
  | "raft"
  | "consistent-hashing"
  | "vector-clocks"
  | "gossip"
  | "crdts"
  | "cap-theorem"
  | "two-phase-commit"
  | "saga"
  | "map-reduce"
  | "lamport-timestamps"
  | "paxos";

interface SimDef {
  id: DistributedSim;
  name: string;
  description: string;
}

const SIMULATIONS: SimDef[] = [
  {
    id: "raft",
    name: "Raft Consensus",
    description: "Five servers must agree on operations — even when servers crash. Raft solves this with leader election and log replication. Used by Kubernetes (etcd) and CockroachDB.",
  },
  {
    id: "consistent-hashing",
    name: "Consistent Hashing",
    description: "Adding a server to a cache cluster normally remaps almost ALL keys. Consistent Hashing fixes this — only 1/N keys move. Used by Cassandra and DynamoDB.",
  },
  {
    id: "vector-clocks",
    name: "Vector Clocks",
    description: "Causality tracking in distributed systems.",
  },
  {
    id: "gossip",
    name: "Gossip Protocol",
    description: "How does a rumor spread through a school? One person tells two friends, who each tell two more. Gossip protocols use this exact principle to sync thousands of servers.",
  },
  {
    id: "crdts",
    name: "CRDTs",
    description: "Conflict-free Replicated Data Types.",
  },
  {
    id: "cap-theorem",
    name: "CAP Theorem",
    description: "Partitions WILL happen — your network WILL split. The real question: do you sacrifice consistency (show stale data) or availability (refuse to answer)?",
  },
  {
    id: "two-phase-commit",
    name: "Two-Phase Commit",
    description: "Atomic commit protocol with coordinator and participants.",
  },
  {
    id: "saga",
    name: "Saga Pattern",
    description: "Choreography-based distributed transactions with compensation.",
  },
  {
    id: "map-reduce",
    name: "MapReduce",
    description: "Parallel word-count: split, map, shuffle, reduce, output.",
  },
  {
    id: "lamport-timestamps",
    name: "Lamport Timestamps",
    description: "Scalar logical clocks for event ordering (cannot detect concurrency).",
  },
  {
    id: "paxos",
    name: "Paxos",
    description: "The foundational consensus algorithm — every other protocol is secretly Paxos in disguise. Harder than Raft but more fundamental. Used by Google Spanner and Chubby.",
  },
];

// ── Colors (imported from distributed-config.ts) ────────────

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = DISTRIBUTED_ROLE_COLORS;
const NODE_COLORS: readonly string[] = DISTRIBUTED_NODE_COLORS;
const MSG_COLORS: Record<string, string> = DISTRIBUTED_MSG_COLORS;

/** A message currently animating between two nodes. */
interface AnimatedMessage {
  id: number;
  from: string;
  to: string;
  type: string;
  /** 0 = at sender, 1 = arrived at receiver */
  progress: number;
  /** Timestamp when animation started (ms). */
  startTime: number;
}

const ANIMATION_DURATION_MS = 300;

// ── Raft Visualization ──────────────────────────────────────

const RaftCanvas = memo(function RaftCanvas({
  nodes,
  leader,
  crashedNodes,
  pendingMessages,
  prefersReducedMotion,
}: {
  nodes: RaftNode[];
  leader: string | null;
  crashedNodes: Set<string>;
  pendingMessages: RaftMessage[];
  prefersReducedMotion?: boolean;
}) {
  const cx = 300;
  const cy = 220;
  const radius = 150;
  const nodeCount = nodes.length;

  const positions = useMemo(() => {
    return nodes.map((_, i) => {
      const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [nodeCount, cx, cy, radius]);

  // Map node id -> position for quick lookup
  const posMap = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      m[n.id] = positions[i];
    });
    return m;
  }, [nodes, positions]);

  // ── Animated messages state ─────────────────────────────────
  const [activeMessages, setActiveMessages] = useState<AnimatedMessage[]>([]);
  const nextIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const prevMessagesRef = useRef<RaftMessage[]>([]);

  // When pendingMessages change, queue new animated messages
  useEffect(() => {
    const prev = prevMessagesRef.current;
    // Only add truly new messages (compare by serialised identity)
    const prevKeys = new Set(prev.map((m) => `${m.type}:${m.from}:${m.to}:${m.term}`));
    const newMsgs = pendingMessages.filter(
      (m) => !prevKeys.has(`${m.type}:${m.from}:${m.to}:${m.term}`),
    );
    prevMessagesRef.current = pendingMessages;

    if (newMsgs.length === 0) return;

    const now = performance.now();
    const animated: AnimatedMessage[] = newMsgs.map((m) => ({
      id: nextIdRef.current++,
      from: m.from,
      to: m.to,
      type: m.type,
      progress: 0,
      startTime: now,
    }));

    setActiveMessages((prev) => [...prev, ...animated]);
  }, [pendingMessages]);

  // Animation loop — skip when reduced motion is preferred
  useEffect(() => {
    if (prefersReducedMotion) {
      // Clear animated messages immediately — they'll be rendered as static arrows
      if (activeMessages.length > 0) {
        const timer = setTimeout(() => setActiveMessages([]), 50);
        return () => clearTimeout(timer);
      }
      return;
    }

    function tick() {
      const now = performance.now();
      setActiveMessages((msgs) => {
        const updated = msgs
          .map((m) => ({
            ...m,
            progress: Math.min(1, (now - m.startTime) / ANIMATION_DURATION_MS),
          }))
          .filter((m) => m.progress < 1);
        return updated;
      });
      rafRef.current = requestAnimationFrame(tick);
    }

    // Only start the loop if there are messages to animate
    if (activeMessages.length > 0 && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }

    // If no messages, cancel the loop
    if (activeMessages.length === 0 && rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [activeMessages.length, prefersReducedMotion]);  

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox="0 0 600 440"
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Connection lines */}
        {nodes.map((node, i) =>
          nodes.map((otherNode, j) => {
            if (j <= i) return null;
            return (
              <line
                key={`${node.id}-${otherNode.id}`}
                x1={positions[i].x}
                y1={positions[i].y}
                x2={positions[j].x}
                y2={positions[j].y}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray={
                  crashedNodes.has(node.id) || crashedNodes.has(otherNode.id)
                    ? "4 4"
                    : undefined
                }
                opacity={
                  crashedNodes.has(node.id) || crashedNodes.has(otherNode.id)
                    ? 0.3
                    : 0.5
                }
              />
            );
          }),
        )}

        {/* Animated message dots (or static arrows when reduced motion) */}
        {prefersReducedMotion
          ? /* Static arrows for reduced motion */
            pendingMessages.map((msg, idx) => {
              const fromPos = posMap[msg.from];
              const toPos = posMap[msg.to];
              if (!fromPos || !toPos) return null;
              const color = MSG_COLORS[msg.type] ?? MSG_COLORS.default ?? "#9ca3af";
              return (
                <line
                  key={`static-${idx}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={color}
                  strokeWidth="2"
                  opacity={0.6}
                >
                  <title>
                    {msg.type}: {msg.from} → {msg.to}
                  </title>
                </line>
              );
            })
          : /* Animated flying dots */
            activeMessages.map((msg) => {
              const fromPos = posMap[msg.from];
              const toPos = posMap[msg.to];
              if (!fromPos || !toPos) return null;
              const x = fromPos.x + (toPos.x - fromPos.x) * msg.progress;
              const y = fromPos.y + (toPos.y - fromPos.y) * msg.progress;
              const color = MSG_COLORS[msg.type] ?? MSG_COLORS.default ?? "#9ca3af";
              return (
                <circle
                  key={msg.id}
                  cx={x}
                  cy={y}
                  r={5}
                  fill={color}
                  opacity={1 - msg.progress * 0.3}
                >
                  <title>
                    {msg.type}: {msg.from} → {msg.to}
                  </title>
                </circle>
              );
            })
        }

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[i];
          const colors = ROLE_COLORS[node.role] ?? ROLE_COLORS.follower;
          const isCrashed = crashedNodes.has(node.id);
          const nodeRadius = 32;

          return (
            <g key={node.id} opacity={isCrashed ? 0.3 : 1}>
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="2"
              />
              {/* Node ID */}
              <text
                x={pos.x}
                y={pos.y - 8}
                textAnchor="middle"
                fill={colors.text}
                fontSize="11"
                fontWeight="600"
              >
                {node.id.replace("node-", "N")}
              </text>
              {/* Role label */}
              <text
                x={pos.x}
                y={pos.y + 6}
                textAnchor="middle"
                fill={colors.text}
                fontSize="9"
                style={{ textTransform: "uppercase" }}
              >
                {isCrashed ? "CRASHED" : node.role.toUpperCase()}
              </text>
              {/* Term */}
              <text
                x={pos.x}
                y={pos.y + 18}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="8"
              >
                term {node.term}
              </text>
              {/* Log entries */}
              {node.log.slice(-3).map((entry, eIdx) => (
                <rect
                  key={eIdx}
                  x={pos.x - 15 + eIdx * 12}
                  y={pos.y + nodeRadius + 6}
                  width="10"
                  height="8"
                  rx="1"
                  fill={
                    entry.index <= node.commitIndex ? "#22c55e" : "#6b7280"
                  }
                  opacity={0.7}
                />
              ))}
              {node.log.length > 3 && (
                <text
                  x={pos.x}
                  y={pos.y + nodeRadius + 22}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="7"
                >
                  +{node.log.length - 3} more
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ── Consistent Hashing Visualization ────────────────────────

const ConsistentHashCanvas = memo(function ConsistentHashCanvas({
  ring,
  nodeCounter,
  showVnodes,
}: {
  ring: ConsistentHashRing;
  nodeCounter: number;
  showVnodes: boolean;
}) {
  const allNodes = ring.getAllNodes();
  const allKeys = ring.getAllKeys();
  const loadDist = ring.getLoadDistribution();
  const maxLoad = Math.max(...Array.from(loadDist.values()), 1);

  const cx = 250;
  const cy = 220;
  const ringRadius = 160;
  const MAX_HASH = 0xffffffff;

  function hashToAngle(hash: number): number {
    return (hash / MAX_HASH) * 2 * Math.PI - Math.PI / 2;
  }

  return (
    <div className="flex h-full w-full flex-col items-center bg-background p-4">
      <div className="flex w-full max-w-4xl flex-1 items-start gap-4">
        {/* Ring SVG */}
        <svg viewBox="0 0 500 440" className="h-full max-h-[440px] flex-1">
          {/* The ring */}
          <circle
            cx={cx}
            cy={cy}
            r={ringRadius}
            fill="none"
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Virtual nodes (when toggled on) */}
          {showVnodes &&
            allNodes.map((node, i) => {
              const color = NODE_COLORS[i % NODE_COLORS.length];
              return node.virtualNodes.map((vhash, vi) => {
                const angle = hashToAngle(vhash);
                const x = cx + ringRadius * Math.cos(angle);
                const y = cy + ringRadius * Math.sin(angle);
                return (
                  <circle
                    key={`vn-${node.id}-${vi}`}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={color}
                    opacity={0.3}
                    stroke={color}
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                );
              });
            })}

          {/* Keys */}
          {allKeys.slice(0, 200).map((key, i) => {
            const angle = hashToAngle(key.hash);
            const x = cx + (ringRadius - 4) * Math.cos(angle);
            const y = cy + (ringRadius - 4) * Math.sin(angle);
            const nodeIdx = allNodes.findIndex(
              (n) => n.id === key.assignedNode,
            );
            const color = NODE_COLORS[nodeIdx % NODE_COLORS.length] ?? "#6b7280";
            return (
              <circle key={i} cx={x} cy={y} r="2" fill={color} opacity={0.6} />
            );
          })}

          {/* Nodes on the ring */}
          {allNodes.map((node, i) => {
            const angle = hashToAngle(node.position);
            const x = cx + ringRadius * Math.cos(angle);
            const y = cy + ringRadius * Math.sin(angle);
            const color = NODE_COLORS[i % NODE_COLORS.length];
            return (
              <g key={node.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={color}
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={y + (y < cy ? -14 : 18)}
                  textAnchor="middle"
                  fill={color}
                  fontSize="10"
                  fontWeight="600"
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Center stats */}
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill="#d1d5db"
            fontSize="14"
            fontWeight="600"
          >
            {allNodes.length} nodes
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="12"
          >
            {allKeys.length} keys
          </text>
        </svg>

        {/* Load distribution */}
        <div className="w-48 shrink-0">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Load Distribution
          </h4>
          {allNodes.map((node, i) => {
            const load = loadDist.get(node.id) ?? 0;
            const pct = maxLoad > 0 ? (load / maxLoad) * 100 : 0;
            const color = NODE_COLORS[i % NODE_COLORS.length];
            return (
              <div key={node.id} className="mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color }}>{node.label}</span>
                  <span className="font-mono text-foreground-muted">
                    {load}
                  </span>
                </div>
                <div className="mt-0.5 h-2 rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
          {allNodes.length === 0 && (
            <p className="text-xs text-foreground-subtle">
              Add nodes to see distribution.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Shared Event Log type ──────────────────────────────────

interface GenericEvent {
  tick: number;
  type: string;
  description: string;
}

// ── Vector Clocks Visualization ────────────────────────────

const PROCESS_IDS = ["P0", "P1", "P2"];
const PROCESS_COLORS = [DISTRIBUTED_NODE_COLORS[0], DISTRIBUTED_NODE_COLORS[2], DISTRIBUTED_NODE_COLORS[3]];
const CONCURRENT_COLOR = "#ef4444";
const CAUSAL_COLOR = "#8b5cf6";

const VectorClockCanvas = memo(function VectorClockCanvas({
  events,
  selectedProcess,
  sim,
}: {
  events: ClockEvent[];
  selectedProcess: string;
  sim: VectorClockSimulation;
}) {
  const svgWidth = 600;
  const svgHeight = 440;
  const marginLeft = 80;
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = 40;
  const laneWidth = (svgWidth - marginLeft - marginRight) / PROCESS_IDS.length;
  const maxTick = Math.max(events.length, 6);
  const rowHeight = Math.min(
    (svgHeight - marginTop - marginBottom) / (maxTick + 1),
    50,
  );

  // Build event positions: each event gets a row based on its order
  const eventPositions = useMemo(() => {
    // Track per-process event index for y positioning
    const positions: { x: number; y: number; event: ClockEvent }[] = [];
    // We lay events out in global order, each taking a row
    events.forEach((evt, i) => {
      const procIdx = PROCESS_IDS.indexOf(evt.processId);
      const x = marginLeft + procIdx * laneWidth + laneWidth / 2;
      const y = marginTop + (i + 1) * rowHeight;
      positions.push({ x, y, event: evt });
    });
    return positions;
  }, [events, laneWidth, rowHeight]);

  // Find send/receive pairs
  const arrows = useMemo(() => {
    const result: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      sendEvent: ClockEvent;
      recvEvent: ClockEvent;
    }[] = [];
    const unmatched: {
      sendIdx: number;
      sendEvent: ClockEvent;
    }[] = [];

    eventPositions.forEach((pos, i) => {
      if (pos.event.type === "send") {
        unmatched.push({ sendIdx: i, sendEvent: pos.event });
      } else if (pos.event.type === "receive") {
        // Find the matching send: same pair of processes, most recent unmatched
        const matchIdx = unmatched.findIndex(
          (u) =>
            u.sendEvent.processId === pos.event.targetProcessId &&
            u.sendEvent.targetProcessId === pos.event.processId,
        );
        if (matchIdx >= 0) {
          const match = unmatched[matchIdx];
          const fromPos = eventPositions[match.sendIdx];
          result.push({
            fromX: fromPos.x,
            fromY: fromPos.y,
            toX: pos.x,
            toY: pos.y,
            sendEvent: match.sendEvent,
            recvEvent: pos.event,
          });
          unmatched.splice(matchIdx, 1);
        }
      }
    });
    return result;
  }, [eventPositions]);

  // Determine concurrent pairs for coloring
  const concurrentSet = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (sim.areConcurrent(events[i], events[j])) {
          set.add(i);
          set.add(j);
        }
      }
    }
    return set;
  }, [events, sim]);

  function formatVC(clock: Record<string, number>): string {
    return `[${PROCESS_IDS.map((p) => clock[p] ?? 0).join(",")}]`;
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Process timelines */}
        {PROCESS_IDS.map((pid, i) => {
          const x = marginLeft + i * laneWidth + laneWidth / 2;
          return (
            <g key={pid}>
              {/* Label */}
              <text
                x={x}
                y={marginTop - 12}
                textAnchor="middle"
                fill={PROCESS_COLORS[i]}
                fontSize="13"
                fontWeight="600"
              >
                {pid}
              </text>
              {/* Vertical timeline */}
              <line
                x1={x}
                y1={marginTop}
                x2={x}
                y2={svgHeight - marginBottom}
                stroke={PROCESS_COLORS[i]}
                strokeWidth="2"
                opacity={0.3}
              />
              {/* Selection indicator */}
              {pid === selectedProcess && (
                <rect
                  x={x - laneWidth / 2 + 4}
                  y={marginTop - 4}
                  width={laneWidth - 8}
                  height={svgHeight - marginTop - marginBottom + 8}
                  rx="4"
                  fill={PROCESS_COLORS[i]}
                  opacity={0.06}
                />
              )}
            </g>
          );
        })}

        {/* Message arrows */}
        {arrows.map((arrow, i) => (
          <g key={`arrow-${i}`}>
            <defs>
              <marker
                id={`arrowhead-${i}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
              </marker>
            </defs>
            <line
              x1={arrow.fromX}
              y1={arrow.fromY}
              x2={arrow.toX}
              y2={arrow.toY}
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              markerEnd={`url(#arrowhead-${i})`}
            />
          </g>
        ))}

        {/* Events */}
        {eventPositions.map((pos, i) => {
          const isConcurrent = concurrentSet.has(i);
          const procIdx = PROCESS_IDS.indexOf(pos.event.processId);
          const color = isConcurrent
            ? CONCURRENT_COLOR
            : PROCESS_COLORS[procIdx];
          const radius = pos.event.type === "local" ? 6 : 8;

          return (
            <g key={`event-${i}`}>
              {/* Event dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={color}
                stroke={isConcurrent ? CONCURRENT_COLOR : "#000"}
                strokeWidth="1.5"
                opacity={0.9}
              />
              {/* Event type indicator */}
              {pos.event.type === "send" && (
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="8"
                  fontWeight="bold"
                >
                  S
                </text>
              )}
              {pos.event.type === "receive" && (
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="8"
                  fontWeight="bold"
                >
                  R
                </text>
              )}
              {/* Vector clock label */}
              <text
                x={pos.x + (procIdx === 2 ? -14 : 14)}
                y={pos.y + 4}
                textAnchor={procIdx === 2 ? "end" : "start"}
                fill="#d1d5db"
                fontSize="9"
                fontFamily="monospace"
              >
                {formatVC(pos.event.clock)}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${marginLeft}, ${svgHeight - 16})`}>
          <circle cx={0} cy={0} r={4} fill={PROCESS_COLORS[0]} />
          <text x={8} y={4} fill="#9ca3af" fontSize="9">
            Causal
          </text>
          <circle cx={60} cy={0} r={4} fill={CONCURRENT_COLOR} />
          <text x={68} y={4} fill="#9ca3af" fontSize="9">
            Concurrent
          </text>
          <text x={140} y={4} fill="#6b7280" fontSize="9">
            S=Send R=Receive
          </text>
        </g>
      </svg>
    </div>
  );
});

// ── Gossip Protocol Visualization ──────────────────────────

const GossipCanvas = memo(function GossipCanvas({
  nodes,
  lastEvents,
  convergence,
}: {
  nodes: GossipNode[];
  lastEvents: GossipEvent[];
  convergence: { converged: boolean; percentSynced: number };
}) {
  const svgWidth = 600;
  const svgHeight = 440;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2 - 20;
  const ringRadius = 150;

  // Calculate node positions in a circle
  const nodePositions = useMemo(() => {
    return nodes.map((node) => ({
      node,
      x: node.x * (svgWidth / 500),
      y: node.y * (svgHeight / 500),
    }));
  }, [nodes, svgWidth, svgHeight]);

  function getNodeColor(node: GossipNode): string {
    if (!node.alive) return "#4b5563"; // dead = dark gray
    if (node.data.size === 0) return "#6b7280"; // no data = gray
    // Check if node has all known data at latest versions
    // Simple heuristic: if converged, it's green; otherwise blue
    if (convergence.converged && node.data.size > 0) return "#22c55e";
    if (node.data.size > 0) return "#3b82f6";
    return "#6b7280";
  }

  // Build a set of recent exchange arrows from last step
  const recentArrows = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    nodePositions.forEach((np) => posMap.set(np.node.id, { x: np.x, y: np.y }));
    return lastEvents
      .map((evt) => {
        const from = posMap.get(evt.from);
        const to = posMap.get(evt.to);
        if (!from || !to) return null;
        return { from, to, keys: evt.keysExchanged };
      })
      .filter(Boolean) as {
      from: { x: number; y: number };
      to: { x: number; y: number };
      keys: string[];
    }[];
  }, [lastEvents, nodePositions]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Gossip exchange arrows */}
        {recentArrows.map((arrow, i) => (
          <g key={`gossip-arrow-${i}`}>
            <defs>
              <marker
                id={`gossip-ah-${i}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>
            <line
              x1={arrow.from.x}
              y1={arrow.from.y}
              x2={arrow.to.x}
              y2={arrow.to.y}
              stroke="#f59e0b"
              strokeWidth="2"
              opacity={0.6}
              markerEnd={`url(#gossip-ah-${i})`}
            />
          </g>
        ))}

        {/* Nodes */}
        {nodePositions.map((np) => {
          const color = getNodeColor(np.node);
          const isAlive = np.node.alive;
          return (
            <g key={np.node.id} opacity={isAlive ? 1 : 0.4}>
              <circle
                cx={np.x}
                cy={np.y}
                r={24}
                fill={color}
                stroke={isAlive ? "#fff" : "#4b5563"}
                strokeWidth="2"
                opacity={0.85}
              />
              <text
                x={np.x}
                y={np.y - 4}
                textAnchor="middle"
                fill="#fff"
                fontSize="10"
                fontWeight="600"
              >
                {np.node.id.replace("node-", "N")}
              </text>
              <text
                x={np.x}
                y={np.y + 8}
                textAnchor="middle"
                fill="#e5e7eb"
                fontSize="8"
              >
                {isAlive ? `${np.node.data.size} keys` : "DEAD"}
              </text>
              {!isAlive && (
                <line
                  x1={np.x - 12}
                  y1={np.y - 12}
                  x2={np.x + 12}
                  y2={np.y + 12}
                  stroke="#ef4444"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}

        {/* Convergence bar */}
        <g transform={`translate(${svgWidth / 2 - 120}, ${svgHeight - 50})`}>
          <text x={0} y={-6} fill="#9ca3af" fontSize="11" fontWeight="500">
            Convergence: {convergence.percentSynced.toFixed(1)}%
          </text>
          <rect
            x={0}
            y={0}
            width={240}
            height={12}
            rx={6}
            fill="#1f2937"
            stroke="#374151"
            strokeWidth="1"
          />
          <rect
            x={0}
            y={0}
            width={Math.max(0, (convergence.percentSynced / 100) * 240)}
            height={12}
            rx={6}
            fill={convergence.converged ? "#22c55e" : "#3b82f6"}
          />
          {convergence.converged && (
            <text x={248} y={10} fill="#22c55e" fontSize="10" fontWeight="600">
              Synced
            </text>
          )}
        </g>

        {/* Legend */}
        <g transform={`translate(${svgWidth / 2 - 120}, ${svgHeight - 22})`}>
          <circle cx={0} cy={0} r={4} fill="#6b7280" />
          <text x={8} y={4} fill="#6b7280" fontSize="9">
            No data
          </text>
          <circle cx={60} cy={0} r={4} fill="#3b82f6" />
          <text x={68} y={4} fill="#6b7280" fontSize="9">
            Has data
          </text>
          <circle cx={130} cy={0} r={4} fill="#22c55e" />
          <text x={138} y={4} fill="#6b7280" fontSize="9">
            Synced
          </text>
          <circle cx={190} cy={0} r={4} fill="#4b5563" />
          <text x={198} y={4} fill="#6b7280" fontSize="9">
            Dead
          </text>
        </g>
      </svg>
    </div>
  );
});

// ── CRDT Visualization ─────────────────────────────────────

const REPLICA_IDS = ["A", "B", "C"];
const REPLICA_COLORS = [DISTRIBUTED_NODE_COLORS[0], DISTRIBUTED_NODE_COLORS[2], DISTRIBUTED_NODE_COLORS[3]];

/** Info about a conflict that was resolved during merge. */
interface CRDTConflictInfo {
  /** Which CRDT type had the conflict. */
  crdtType: "lww-register" | "or-set";
  /** Values each replica had before merging. */
  premergeValues: Record<string, unknown>;
  /** The winning value after merge. */
  winnerValue: unknown;
  /** Which replica's value "won" (for LWW). */
  winnerReplica?: string;
  /** Timestamp for display. */
  timestamp: number;
}

const CRDTCanvas = memo(function CRDTCanvas({
  crdtType,
  sim,
  version,
  merging,
  conflictInfo,
  crdtEvents,
  prefersReducedMotion,
}: {
  crdtType: CRDTType;
  sim: CRDTSimulation;
  version: number;
  merging: boolean;
  conflictInfo: CRDTConflictInfo | null;
  crdtEvents: CRDTEvent[];
  prefersReducedMotion?: boolean;
}) {
  // Track previous values to detect value changes on merge
  const prevValuesRef = useRef<Record<string, string>>({});
  const [flashReplicas, setFlashReplicas] = useState<Set<string>>(new Set());
  const [allValues, setAllValues] = useState<Record<string, unknown>>(() => sim.getAllValues());
  const [converged, setConverged] = useState(() => sim.isConverged());

  // Recompute values inside useEffect to avoid calling sim methods during render
  useEffect(() => {
    const vals = sim.getAllValues();
    setAllValues(vals);
    setConverged(sim.isConverged());

    const currentSerialized: Record<string, string> = {};
    for (const rid of REPLICA_IDS) {
      currentSerialized[rid] = JSON.stringify(vals[rid]);
    }
    const changed = new Set<string>();
    for (const rid of REPLICA_IDS) {
      if (
        prevValuesRef.current[rid] !== undefined &&
        prevValuesRef.current[rid] !== currentSerialized[rid]
      ) {
        changed.add(rid);
      }
    }
    prevValuesRef.current = currentSerialized;
    if (changed.size > 0) {
      setFlashReplicas(changed);
      const t = setTimeout(() => setFlashReplicas(new Set()), 600);
      return () => clearTimeout(t);
    }
  }, [version, sim]);

  function formatValue(val: unknown): string {
    if (val === null || val === undefined) return "(empty)";
    if (Array.isArray(val)) {
      if (val.length === 0) return "{ }";
      return `{ ${val.join(", ")} }`;
    }
    return String(val);
  }

  // Positions for merge arrows (relative to the replica panels container)
  // The 3 panels are laid out flex with equal width. We approximate centers.
  const replicaCenters = REPLICA_IDS.map((_, i) => ({
    xPct: (100 / 6) + (i * 100 / 3), // center of each 1/3 panel
    y: 24,
  }));

  return (
    <div className="flex h-full w-full flex-col bg-background p-4">
      {/* Convergence indicator badge */}
      <div className="mb-3 flex items-center justify-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300",
            converged
              ? "bg-green-900/50 text-green-300 ring-1 ring-green-500/40"
              : "bg-red-900/50 text-red-300 ring-1 ring-red-500/40",
          )}
        >
          {converged ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              Converged
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
              Diverged
            </>
          )}
        </span>
        <span className="text-xs text-foreground-subtle">
          Type: {crdtType.toUpperCase()}
        </span>
      </div>

      {/* 3 replica panels */}
      <div className="relative flex flex-1 gap-3">
        {/* Merge animation overlay (skipped when reduced motion is preferred) */}
        {merging && !prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-0 z-10">
            <svg className="h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <marker id="crdt-arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                  <path d="M0,0 L6,2 L0,4" fill="#a78bfa" />
                </marker>
              </defs>
              {/* Animated arrows: A->B, B->C, A->C, B->A, C->B, C->A */}
              {[
                { from: 0, to: 1 },
                { from: 1, to: 2 },
                { from: 0, to: 2 },
              ].map(({ from, to }, idx) => {
                const x1 = replicaCenters[from].xPct;
                const x2 = replicaCenters[to].xPct;
                const yBase = 25;
                const yOffset = idx * 4 + 6;
                return (
                  <g key={`arrow-${from}-${to}`}>
                    {/* Forward arrow */}
                    <line
                      x1={x1} y1={yBase - yOffset}
                      x2={x2} y2={yBase - yOffset}
                      stroke="#a78bfa"
                      strokeWidth="0.4"
                      markerEnd="url(#crdt-arrow)"
                      opacity="0"
                    >
                      <animate attributeName="opacity" values="0;0.8;0.8;0" dur="1.2s" begin={`${idx * 0.15}s`} fill="freeze" />
                      <animate attributeName="x2" from={x1} to={x2} dur="0.6s" begin={`${idx * 0.15}s`} fill="freeze" />
                    </line>
                    {/* Reverse arrow */}
                    <line
                      x1={x2} y1={yBase + yOffset}
                      x2={x1} y2={yBase + yOffset}
                      stroke="#a78bfa"
                      strokeWidth="0.4"
                      markerEnd="url(#crdt-arrow)"
                      opacity="0"
                    >
                      <animate attributeName="opacity" values="0;0.8;0.8;0" dur="1.2s" begin={`${idx * 0.15 + 0.3}s`} fill="freeze" />
                      <animate attributeName="x2" from={x2} to={x1} dur="0.6s" begin={`${idx * 0.15 + 0.3}s`} fill="freeze" />
                    </line>
                  </g>
                );
              })}
              {/* Convergence pulse at the end */}
              {replicaCenters.map((c, i) => (
                <circle
                  key={`pulse-${i}`}
                  cx={c.xPct}
                  cy={25}
                  r="0"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.3"
                  opacity="0"
                >
                  <animate attributeName="r" from="0" to="8" dur="0.5s" begin="0.9s" fill="freeze" />
                  <animate attributeName="opacity" values="0;0.6;0" dur="0.5s" begin="0.9s" fill="freeze" />
                </circle>
              ))}
            </svg>
          </div>
        )}

        {REPLICA_IDS.map((rid, i) => {
          const val = allValues[rid];
          const isFlashing = flashReplicas.has(rid);
          const isConflictWinner =
            conflictInfo != null && conflictInfo.winnerReplica === rid;
          const isConflictLoser =
            conflictInfo != null &&
            conflictInfo.winnerReplica !== undefined &&
            conflictInfo.winnerReplica !== rid &&
            conflictInfo.premergeValues[rid] !== undefined &&
            JSON.stringify(conflictInfo.premergeValues[rid]) !==
              JSON.stringify(conflictInfo.premergeValues[conflictInfo.winnerReplica]);

          return (
            <div
              key={rid}
              className={cn(
                "flex flex-1 flex-col rounded-lg border bg-elevated p-3 transition-all",
                prefersReducedMotion ? "duration-0" : "duration-300",
                isFlashing && "ring-2 ring-purple-400/60",
                isConflictWinner && "ring-2 ring-green-400/60",
                isConflictLoser && "ring-2 ring-red-400/40",
                !isFlashing && !isConflictWinner && !isConflictLoser && "border-border",
              )}
              style={{ borderTopColor: REPLICA_COLORS[i], borderTopWidth: 3 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: REPLICA_COLORS[i] }}
                />
                <span className="text-sm font-semibold text-foreground">
                  Replica {rid}
                </span>
                {isConflictWinner && (
                  <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-300">
                    Winner
                  </span>
                )}
                {isConflictLoser && (
                  <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-300">
                    Overwritten
                  </span>
                )}
              </div>

              {/* Value display */}
              <div
                className={cn(
                  "mb-3 rounded-md bg-background p-2 transition-colors duration-300",
                  isFlashing && "bg-purple-950/30",
                )}
              >
                <div className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                  Value
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-foreground">
                  {formatValue(val)}
                </div>
                {/* Show pre-merge value during conflict */}
                {conflictInfo != null &&
                  conflictInfo.premergeValues[rid] !== undefined && (
                    <div className="mt-1 text-[10px] text-foreground-subtle">
                      was: {formatValue(conflictInfo.premergeValues[rid])}
                    </div>
                  )}
              </div>

              {/* Internal state representation */}
              <div className="flex-1 rounded-md bg-background p-2">
                <div className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                  Internal State
                </div>
                <div className="mt-1 space-y-0.5 font-mono text-[11px] text-foreground-muted">
                  {crdtType === "g-counter" && (
                    <>
                      {REPLICA_IDS.map((r) => (
                        <div key={r}>
                          {r}:{" "}
                          {(() => {
                            const v = allValues[rid];
                            return r === rid
                              ? typeof v === "number"
                                ? v
                                : 0
                              : 0;
                          })()}
                        </div>
                      ))}
                      <div className="mt-1 border-t border-border pt-1 text-foreground">
                        sum = {typeof val === "number" ? val : 0}
                      </div>
                    </>
                  )}
                  {crdtType === "pn-counter" && (
                    <div>
                      <div>P - N = {typeof val === "number" ? val : 0}</div>
                    </div>
                  )}
                  {crdtType === "lww-register" && (
                    <div>
                      <div>val: {val === null ? "(null)" : String(val)}</div>
                    </div>
                  )}
                  {crdtType === "or-set" && (
                    <div>
                      <div>
                        elements: {formatValue(val)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operation history timeline */}
      {crdtEvents.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-elevated p-2">
          <div className="mb-1.5 text-[10px] uppercase tracking-wider text-foreground-subtle">
            Operation History
          </div>
          <div className="flex items-end gap-0.5 overflow-x-auto pb-1">
            {crdtEvents.map((evt, idx) => {
              const replicaIdx = REPLICA_IDS.indexOf(evt.replicaId);
              const color =
                replicaIdx >= 0 ? REPLICA_COLORS[replicaIdx] : "#6b7280";
              const isMerge = evt.type === "merge";
              return (
                <div
                  key={idx}
                  className="group relative flex shrink-0 flex-col items-center"
                  style={{ minWidth: 28 }}
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-14 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-gray-200 shadow-lg group-hover:block">
                    <div className="font-semibold">{evt.description}</div>
                    <div className="text-gray-400">t={evt.tick}</div>
                  </div>
                  {/* Timeline bar */}
                  <div
                    className={cn(
                      "w-5 rounded-t-sm transition-all",
                      isMerge ? "opacity-70" : "opacity-100",
                    )}
                    style={{
                      height: isMerge ? 16 : 24,
                      backgroundColor: color,
                      backgroundImage: isMerge
                        ? "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)"
                        : undefined,
                    }}
                  />
                  {/* Label */}
                  <div
                    className="mt-0.5 text-[8px] font-medium"
                    style={{ color }}
                  >
                    {isMerge ? "M" : evt.type.charAt(0).toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Timeline legend */}
          <div className="mt-1 flex items-center gap-3 border-t border-border/30 pt-1">
            {REPLICA_IDS.map((rid, i) => (
              <div key={rid} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: REPLICA_COLORS[i] }}
                />
                <span className="text-[9px] text-foreground-subtle">
                  Replica {rid}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-gray-500 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.2) 1px, rgba(255,255,255,0.2) 2px)" }} />
              <span className="text-[9px] text-foreground-subtle">
                Merge
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Conflict resolution detail (shown after merge with conflicts) */}
      {conflictInfo != null && (
        <div className="mt-2 rounded-lg border border-amber-800/50 bg-amber-950/20 p-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Conflict Resolution
          </div>
          {conflictInfo.crdtType === "lww-register" && (
            <div className="text-xs text-foreground-muted">
              <span className="text-foreground">LWW-Register</span>: Replicas had different values{" "}
              ({Object.entries(conflictInfo.premergeValues).map(([r, v], idx) => (
                <span key={r}>
                  {idx > 0 && ", "}
                  <span style={{ color: REPLICA_COLORS[REPLICA_IDS.indexOf(r)] }}>
                    {r}={formatValue(v)}
                  </span>
                </span>
              ))}).
              Winner:{" "}
              <span className="font-semibold text-green-400">
                {conflictInfo.winnerReplica && (
                  <>Replica {conflictInfo.winnerReplica} </>
                )}
                ({formatValue(conflictInfo.winnerValue)})
              </span>{" "}
              -- highest timestamp wins, ties broken by replica ID.
            </div>
          )}
          {conflictInfo.crdtType === "or-set" && (
            <div className="text-xs text-foreground-muted">
              <span className="text-foreground">OR-Set</span>: Elements were added/removed concurrently.
              After merge, the union of all tagged elements is taken.
              Result:{" "}
              <span className="font-semibold text-green-400">
                {formatValue(conflictInfo.winnerValue)}
              </span>{" "}
              -- add wins over concurrent remove (unique tags).
            </div>
          )}
        </div>
      )}

      {/* Merge visualization footer */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          {REPLICA_IDS.map((rid, i) => (
            <React.Fragment key={rid}>
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: REPLICA_COLORS[i] }}
              />
              {i < REPLICA_IDS.length - 1 && (
                <ArrowRightLeft className="h-3 w-3 text-foreground-subtle" />
              )}
            </React.Fragment>
          ))}
        </div>
        <span className="text-xs text-foreground-subtle">
          Each replica maintains independent state. Merge to converge.
        </span>
      </div>
    </div>
  );
});

// ── CAP Theorem Visualization ──────────────────────────────

const CAP_NODE_POSITIONS = [
  { x: 300, y: 100 }, // node-0 (top)
  { x: 160, y: 320 }, // node-1 (bottom-left)
  { x: 440, y: 320 }, // node-2 (bottom-right)
];

const CAPCanvas = memo(function CAPCanvas({
  cluster,
  version,
}: {
  cluster: CAPCluster;
  version: number;
}) {
  const state = cluster.getState();
  const { nodes, mode, partitioned } = state;
  const svgWidth = 600;
  const svgHeight = 440;

  // Determine partition line
  const partitionLine = useMemo(() => {
    if (!partitioned || mode === "CA") return null;
    // Find which nodes are in which group
    const g1 = nodes.filter((n) => n.partitionGroup === 1);
    const g2 = nodes.filter((n) => n.partitionGroup === 2);
    if (g1.length === 0 || g2.length === 0) return null;
    // Draw a vertical line separating the groups
    return { x: svgWidth / 2, y1: 40, y2: svgHeight - 40 };
  }, [partitioned, mode, nodes, svgWidth, svgHeight]);

  function getNodeFill(node: CAPNode): string {
    if (!node.alive) return "#4b5563";
    if (partitioned && mode === "CP" && !node.hasMajority) return "#78350f";
    if (partitioned && mode === "AP") return "#1e3a5f";
    return "#14532d";
  }

  function getNodeStroke(node: CAPNode): string {
    if (!node.alive) return "#6b7280";
    if (partitioned && mode === "CP" && !node.hasMajority) return "#f59e0b";
    if (partitioned && mode === "AP") return "#3b82f6";
    return "#22c55e";
  }

  function getNodeData(node: CAPNode): string {
    const entries: string[] = [];
    for (const [key, val] of Array.from(node.data.entries())) {
      entries.push(`${key}=${val.value}`);
    }
    return entries.length > 0 ? entries.join(", ") : "(empty)";
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Mode badge */}
        <g transform={`translate(${svgWidth / 2}, 30)`}>
          <rect
            x={-30}
            y={-14}
            width={60}
            height={28}
            rx={6}
            fill={
              mode === "CP"
                ? "#14532d"
                : mode === "AP"
                  ? "#1e3a5f"
                  : "#78350f"
            }
            stroke={
              mode === "CP"
                ? "#22c55e"
                : mode === "AP"
                  ? "#3b82f6"
                  : "#f59e0b"
            }
            strokeWidth="1.5"
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fill="#fff"
            fontSize="14"
            fontWeight="700"
          >
            {mode}
          </text>
        </g>

        {/* Connection lines between nodes */}
        {nodes.length >= 2 &&
          nodes.map((n, i) =>
            nodes.map((m, j) => {
              if (j <= i) return null;
              const pos1 =
                CAP_NODE_POSITIONS[i] ?? CAP_NODE_POSITIONS[0];
              const pos2 =
                CAP_NODE_POSITIONS[j] ?? CAP_NODE_POSITIONS[0];
              const canComm =
                !partitioned ||
                n.partitionGroup === 0 ||
                m.partitionGroup === 0 ||
                n.partitionGroup === m.partitionGroup;
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={canComm ? "#374151" : "#ef4444"}
                  strokeWidth={canComm ? 1 : 2}
                  strokeDasharray={canComm ? undefined : "6 4"}
                  opacity={canComm ? 0.4 : 0.7}
                />
              );
            }),
          )}

        {/* Partition line */}
        {partitionLine && (
          <g>
            <line
              x1={partitionLine.x}
              y1={partitionLine.y1}
              x2={partitionLine.x}
              y2={partitionLine.y2}
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="8 4"
              opacity={0.6}
            />
            <text
              x={partitionLine.x}
              y={partitionLine.y1 + 16}
              textAnchor="middle"
              fill="#ef4444"
              fontSize="10"
              fontWeight="600"
            >
              PARTITION
            </text>
          </g>
        )}

        {/* CA mode: single node overlay */}
        {mode === "CA" && partitioned && (
          <text
            x={svgWidth / 2}
            y={svgHeight / 2 + 60}
            textAnchor="middle"
            fill="#ef4444"
            fontSize="13"
            fontWeight="600"
          >
            UNAVAILABLE -- partition = total outage in CA mode
          </text>
        )}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = CAP_NODE_POSITIONS[i] ?? CAP_NODE_POSITIONS[0];
          const fill = getNodeFill(node);
          const stroke = getNodeStroke(node);
          const data = getNodeData(node);

          return (
            <g key={node.id} opacity={node.alive ? 1 : 0.35}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={36}
                fill={fill}
                stroke={stroke}
                strokeWidth="2.5"
              />
              <text
                x={pos.x}
                y={pos.y - 10}
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                fontWeight="700"
              >
                {node.id.replace("node-", "Node ")}
              </text>
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill="#d1d5db"
                fontSize="9"
              >
                {node.alive ? "ALIVE" : "DOWN"}
              </text>
              {partitioned && mode === "CP" && (
                <text
                  x={pos.x}
                  y={pos.y + 17}
                  textAnchor="middle"
                  fill={node.hasMajority ? "#22c55e" : "#f59e0b"}
                  fontSize="8"
                >
                  {node.hasMajority ? "MAJORITY" : "MINORITY"}
                </text>
              )}
              {/* Data below node */}
              <text
                x={pos.x}
                y={pos.y + 50}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="9"
                fontFamily="monospace"
              >
                {data.length > 30 ? data.slice(0, 30) + "..." : data}
              </text>
            </g>
          );
        })}

        {/* Divergence indicator */}
        {cluster.hasDivergence() && (
          <g transform={`translate(${svgWidth / 2}, ${svgHeight - 30})`}>
            <rect
              x={-70}
              y={-10}
              width={140}
              height={20}
              rx={4}
              fill="#7f1d1d"
              stroke="#ef4444"
              strokeWidth="1"
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="#fca5a5"
              fontSize="10"
              fontWeight="600"
            >
              DATA DIVERGENCE
            </text>
          </g>
        )}
      </svg>
    </div>
  );
});

// ── Two-Phase Commit Visualization ─────────────────────────

const PHASE_COLORS: Record<string, string> = {
  prepare: DISTRIBUTED_PHASE_COLORS.prepare,
  vote: DISTRIBUTED_PHASE_COLORS.vote,
  commit: DISTRIBUTED_PHASE_COLORS.commit,
  abort: DISTRIBUTED_PHASE_COLORS.abort,
};

const TwoPCCanvas = memo(function TwoPCCanvas({
  steps,
  currentStep,
}: {
  steps: TwoPCStep[];
  currentStep: number;
}) {
  const svgWidth = 600;
  const svgHeight = 440;

  const step = steps[Math.min(currentStep, steps.length - 1)] ?? null;
  if (!step) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Run the simulation to see 2PC protocol.
        </p>
      </div>
    );
  }

  const coordX = svgWidth / 2;
  const coordY = 70;
  const pCount = step.participants.length;
  const participantY = 300;
  const spacing = Math.min(120, (svgWidth - 80) / Math.max(pCount, 1));
  const startX = (svgWidth - (pCount - 1) * spacing) / 2;

  const phaseColor = PHASE_COLORS[step.phase] ?? "#6b7280";

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Phase badge */}
        <g transform={`translate(${svgWidth / 2}, 24)`}>
          <rect
            x={-50}
            y={-12}
            width={100}
            height={24}
            rx={6}
            fill={phaseColor}
            opacity={0.25}
            stroke={phaseColor}
            strokeWidth="1.5"
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fill={phaseColor}
            fontSize="12"
            fontWeight="700"
          >
            {step.phase.toUpperCase()}
          </text>
        </g>

        {/* Coordinator */}
        <rect
          x={coordX - 50}
          y={coordY - 20}
          width={100}
          height={40}
          rx={8}
          fill="#1e3a5f"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <text
          x={coordX}
          y={coordY + 5}
          textAnchor="middle"
          fill="#93c5fd"
          fontSize="12"
          fontWeight="600"
        >
          Coordinator
        </text>

        {/* Participants */}
        {step.participants.map((p, i) => {
          const px = startX + i * spacing;
          const voteColor =
            p.vote === "yes"
              ? "#22c55e"
              : p.vote === "no"
                ? "#ef4444"
                : "#6b7280";
          const commitFill = p.committed ? "#14532d" : "#1f2937";
          const commitStroke = p.committed ? "#22c55e" : "#374151";

          return (
            <g key={p.id}>
              {/* Connection line from coordinator */}
              <line
                x1={coordX}
                y1={coordY + 20}
                x2={px}
                y2={participantY - 28}
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeDasharray={step.phase === "prepare" ? "6 3" : undefined}
                opacity={0.5}
              />
              {/* Arrow indicator */}
              {(step.phase === "prepare" || step.phase === "commit" || step.phase === "abort") && (
                <polygon
                  points={`${px - 5},${participantY - 32} ${px + 5},${participantY - 32} ${px},${participantY - 24}`}
                  fill={phaseColor}
                  opacity={0.7}
                />
              )}
              {step.phase === "vote" && (
                <polygon
                  points={`${coordX - 3 + i * 6},${coordY + 24} ${coordX + 3 + i * 6},${coordY + 24} ${coordX + i * 6},${coordY + 32}`}
                  fill={voteColor}
                  opacity={0.7}
                  transform={`rotate(180, ${coordX + i * 6}, ${coordY + 28})`}
                />
              )}
              {/* Participant box */}
              <rect
                x={px - 40}
                y={participantY - 24}
                width={80}
                height={60}
                rx={8}
                fill={commitFill}
                stroke={commitStroke}
                strokeWidth="2"
              />
              {/* ID */}
              <text
                x={px}
                y={participantY - 5}
                textAnchor="middle"
                fill="#d1d5db"
                fontSize="12"
                fontWeight="600"
              >
                {p.id}
              </text>
              {/* Vote */}
              <text
                x={px}
                y={participantY + 12}
                textAnchor="middle"
                fill={voteColor}
                fontSize="10"
                fontWeight="500"
              >
                vote: {p.vote.toUpperCase()}
              </text>
              {/* Committed indicator */}
              {p.committed && (
                <text
                  x={px}
                  y={participantY + 26}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize="9"
                  fontWeight="600"
                >
                  COMMITTED
                </text>
              )}
            </g>
          );
        })}

        {/* Description */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 40}
          textAnchor="middle"
          fill="#d1d5db"
          fontSize="11"
        >
          {step.description}
        </text>

        {/* Tick info */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 18}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="10"
        >
          Step {currentStep + 1} / {steps.length}
        </text>
      </svg>
    </div>
  );
});

// ── Saga Pattern Visualization ────────────────────────────

const SAGA_COLORS: Record<string, string> = {
  execute: DISTRIBUTED_PHASE_COLORS.execute,
  compensate: DISTRIBUTED_PHASE_COLORS.compensate,
  complete: DISTRIBUTED_PHASE_COLORS.complete,
  fail: DISTRIBUTED_PHASE_COLORS.fail,
};

const SagaCanvas = memo(function SagaCanvas({
  steps,
  currentStep,
}: {
  steps: SagaStep[];
  currentStep: number;
}) {
  const svgWidth = 600;
  const svgHeight = 440;

  if (steps.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Run the simulation to see Saga choreography.
        </p>
      </div>
    );
  }

  // Derive unique services from steps
  const serviceOrder: string[] = [];
  for (const s of steps) {
    if (!serviceOrder.includes(s.service)) {
      serviceOrder.push(s.service);
    }
  }
  const svcCount = serviceOrder.length;

  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 60;
  const marginBottom = 60;
  const boxWidth = Math.min(110, (svgWidth - marginLeft - marginRight - (svcCount - 1) * 10) / svcCount);
  const totalWidth = svcCount * boxWidth + (svcCount - 1) * 10;
  const offsetX = (svgWidth - totalWidth) / 2;
  const boxHeight = 50;
  const serviceY = marginTop;

  // Timeline: show steps executed up to currentStep
  const visibleSteps = steps.slice(0, currentStep + 1);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Title */}
        <text
          x={svgWidth / 2}
          y={28}
          textAnchor="middle"
          fill="#d1d5db"
          fontSize="14"
          fontWeight="600"
        >
          Saga Choreography
        </text>

        {/* Service boxes */}
        {serviceOrder.map((svc, i) => {
          const bx = offsetX + i * (boxWidth + 10);
          const by = serviceY;

          // Determine state of this service
          const svcSteps = visibleSteps.filter((s) => s.service === svc);
          const lastAction = svcSteps.length > 0 ? svcSteps[svcSteps.length - 1].action : null;

          let fill = "#1f2937";
          let stroke = "#374151";
          if (lastAction === "execute") {
            fill = "#1e3a5f";
            stroke = "#3b82f6";
          } else if (lastAction === "compensate") {
            fill = "#78350f";
            stroke = "#f59e0b";
          } else if (lastAction === "complete") {
            fill = "#14532d";
            stroke = "#22c55e";
          } else if (lastAction === "fail") {
            fill = "#7f1d1d";
            stroke = "#ef4444";
          }

          return (
            <g key={svc}>
              {/* Arrow between services */}
              {i < svcCount - 1 && (
                <line
                  x1={bx + boxWidth}
                  y1={by + boxHeight / 2}
                  x2={bx + boxWidth + 10}
                  y2={by + boxHeight / 2}
                  stroke="#4b5563"
                  strokeWidth="1.5"
                  markerEnd="url(#saga-arrow)"
                />
              )}
              <rect
                x={bx}
                y={by}
                width={boxWidth}
                height={boxHeight}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth="2"
              />
              <text
                x={bx + boxWidth / 2}
                y={by + boxHeight / 2 - 4}
                textAnchor="middle"
                fill="#e5e7eb"
                fontSize="11"
                fontWeight="600"
              >
                {svc}
              </text>
              {lastAction && (
                <text
                  x={bx + boxWidth / 2}
                  y={by + boxHeight / 2 + 12}
                  textAnchor="middle"
                  fill={SAGA_COLORS[lastAction] ?? "#6b7280"}
                  fontSize="9"
                  fontWeight="500"
                >
                  {lastAction.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker
            id="saga-arrow"
            markerWidth="6"
            markerHeight="4"
            refX="6"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill="#4b5563" />
          </marker>
        </defs>

        {/* Event timeline */}
        {visibleSteps.map((s, i) => {
          const yPos = serviceY + boxHeight + 30 + i * 28;
          const color = SAGA_COLORS[s.action] ?? "#6b7280";
          if (yPos > svgHeight - marginBottom - 20) return null;
          return (
            <g key={`step-${i}`}>
              <circle cx={marginLeft + 20} cy={yPos} r={5} fill={color} />
              <text
                x={marginLeft + 32}
                y={yPos + 4}
                fill="#d1d5db"
                fontSize="10"
              >
                <tspan fontWeight="600" fill={color}>
                  {s.service}
                </tspan>
                {" -- "}
                {s.action.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Current step description */}
        {visibleSteps.length > 0 && (
          <text
            x={svgWidth / 2}
            y={svgHeight - 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="10"
          >
            {visibleSteps[visibleSteps.length - 1].description}
          </text>
        )}
      </svg>
    </div>
  );
});

// ── MapReduce Visualization ───────────────────────────────

const MR_PHASE_COLORS: Record<string, string> = {
  split: DISTRIBUTED_PHASE_COLORS.split,
  map: DISTRIBUTED_PHASE_COLORS.map,
  shuffle: DISTRIBUTED_PHASE_COLORS.shuffle,
  reduce: DISTRIBUTED_PHASE_COLORS.reduce,
  output: DISTRIBUTED_PHASE_COLORS.output,
};

const MapReduceCanvas = memo(function MapReduceCanvas({
  steps,
  currentStep,
}: {
  steps: MRStep[];
  currentStep: number;
}) {
  const svgWidth = 600;
  const svgHeight = 440;

  if (steps.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Run the simulation to see MapReduce pipeline.
        </p>
      </div>
    );
  }

  const visibleSteps = steps.slice(0, currentStep + 1);
  const currentPhaseStep = visibleSteps[visibleSteps.length - 1];
  const phaseColor = MR_PHASE_COLORS[currentPhaseStep?.phase] ?? "#6b7280";

  // Phase pipeline at top
  const phases: Array<{ key: string; label: string }> = [
    { key: "split", label: "Split" },
    { key: "map", label: "Map" },
    { key: "shuffle", label: "Shuffle" },
    { key: "reduce", label: "Reduce" },
    { key: "output", label: "Output" },
  ];

  const pipelineY = 40;
  const phaseBoxW = 80;
  const phaseGap = 16;
  const totalPipeW = phases.length * phaseBoxW + (phases.length - 1) * phaseGap;
  const pipeStartX = (svgWidth - totalPipeW) / 2;

  // Determine which phases are "done"
  const completedPhases = new Set<string>();
  for (const s of visibleSteps) {
    completedPhases.add(s.phase);
  }

  // Build data display area
  const dataY = 100;
  const dataAreaH = svgHeight - dataY - 60;

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Pipeline stages */}
        {phases.map((p, i) => {
          const bx = pipeStartX + i * (phaseBoxW + phaseGap);
          const active = currentPhaseStep?.phase === p.key;
          const done = completedPhases.has(p.key) && !active;
          const col = MR_PHASE_COLORS[p.key] ?? "#6b7280";

          return (
            <g key={p.key}>
              {i < phases.length - 1 && (
                <line
                  x1={bx + phaseBoxW}
                  y1={pipelineY + 14}
                  x2={bx + phaseBoxW + phaseGap}
                  y2={pipelineY + 14}
                  stroke={done || active ? col : "#374151"}
                  strokeWidth="2"
                />
              )}
              <rect
                x={bx}
                y={pipelineY}
                width={phaseBoxW}
                height={28}
                rx={6}
                fill={active ? col : done ? col : "#1f2937"}
                opacity={active ? 0.3 : done ? 0.15 : 1}
                stroke={active || done ? col : "#374151"}
                strokeWidth={active ? 2 : 1}
              />
              <text
                x={bx + phaseBoxW / 2}
                y={pipelineY + 18}
                textAnchor="middle"
                fill={active || done ? col : "#6b7280"}
                fontSize="11"
                fontWeight={active ? "700" : "500"}
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Data visualization area */}
        {currentPhaseStep && currentPhaseStep.phase === "split" && (
          <g>
            <text x={30} y={dataY + 20} fill="#d1d5db" fontSize="11" fontWeight="600">
              Chunks:
            </text>
            {currentPhaseStep.chunks.map((chunk: string, i: number) => (
              <g key={i}>
                <rect
                  x={30}
                  y={dataY + 30 + i * 36}
                  width={svgWidth - 60}
                  height={28}
                  rx={4}
                  fill="#1e3a5f"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity={0.6}
                />
                <text
                  x={40}
                  y={dataY + 49 + i * 36}
                  fill="#93c5fd"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  Chunk {i}: &quot;{chunk.length > 60 ? chunk.slice(0, 60) + "..." : chunk}&quot;
                </text>
              </g>
            ))}
          </g>
        )}

        {currentPhaseStep && currentPhaseStep.phase === "map" && (
          <g>
            <text x={30} y={dataY + 20} fill="#d1d5db" fontSize="11" fontWeight="600">
              Mapper {currentPhaseStep.chunkIndex}:
            </text>
            {currentPhaseStep.pairs.slice(0, 8).map((pair: string, i: number) => (
              <g key={i}>
                <rect
                  x={30 + (i % 4) * 138}
                  y={dataY + 30 + Math.floor(i / 4) * 30}
                  width={130}
                  height={22}
                  rx={4}
                  fill="#2e1065"
                  stroke="#a855f7"
                  strokeWidth="1"
                  opacity={0.5}
                />
                <text
                  x={40 + (i % 4) * 138}
                  y={dataY + 45 + Math.floor(i / 4) * 30}
                  fill="#c4b5fd"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {pair}
                </text>
              </g>
            ))}
            {currentPhaseStep.pairs.length > 8 && (
              <text
                x={30}
                y={dataY + 100}
                fill="#6b7280"
                fontSize="10"
              >
                ...and {currentPhaseStep.pairs.length - 8} more pairs
              </text>
            )}
          </g>
        )}

        {currentPhaseStep && currentPhaseStep.phase === "shuffle" && (
          <g>
            <text x={30} y={dataY + 20} fill="#d1d5db" fontSize="11" fontWeight="600">
              Grouped Keys ({currentPhaseStep.uniqueKeys}):
            </text>
            {Object.entries(currentPhaseStep.groups)
              .slice(0, 10)
              .map(([key, vals], i) => (
                <g key={key}>
                  <text
                    x={30}
                    y={dataY + 44 + i * 22}
                    fill="#fbbf24"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {key}:
                  </text>
                  <text
                    x={110}
                    y={dataY + 44 + i * 22}
                    fill="#d1d5db"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    [{vals.join(", ")}]
                  </text>
                </g>
              ))}
          </g>
        )}

        {currentPhaseStep && currentPhaseStep.phase === "reduce" && (
          <g>
            <text x={30} y={dataY + 20} fill="#d1d5db" fontSize="11" fontWeight="600">
              Reduced Counts:
            </text>
            {Object.entries(currentPhaseStep.reduced)
              .slice(0, 12)
              .map(([word, count], i) => {
                const barW = Math.min(count * 40, svgWidth - 180);
                return (
                  <g key={word}>
                    <text
                      x={30}
                      y={dataY + 44 + i * 22}
                      fill="#d1d5db"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {word}
                    </text>
                    <rect
                      x={110}
                      y={dataY + 33 + i * 22}
                      width={barW}
                      height={14}
                      rx={3}
                      fill="#22c55e"
                      opacity={0.5}
                    />
                    <text
                      x={116 + barW}
                      y={dataY + 44 + i * 22}
                      fill="#22c55e"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
          </g>
        )}

        {currentPhaseStep && currentPhaseStep.phase === "output" && (
          <g>
            <text x={30} y={dataY + 20} fill="#d1d5db" fontSize="11" fontWeight="600">
              Final Output:
            </text>
            {currentPhaseStep.topWords.map(
              (line: string, i: number) => (
                <text
                  key={i}
                  x={40}
                  y={dataY + 44 + i * 22}
                  fill="#06b6d4"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {line}
                </text>
              ),
            )}
          </g>
        )}

        {/* Description */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 24}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="10"
        >
          {currentPhaseStep?.description ?? ""}
        </text>
        <text
          x={svgWidth / 2}
          y={svgHeight - 8}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="9"
        >
          Step {currentStep + 1} / {steps.length}
        </text>
      </svg>
    </div>
  );
});

// ── Lamport Timestamps Visualization ─────────────────────────

const LAMPORT_COLORS = [DISTRIBUTED_NODE_COLORS[0], DISTRIBUTED_NODE_COLORS[2], DISTRIBUTED_NODE_COLORS[3]];

const LamportCanvas = memo(function LamportCanvas({
  events,
  selectedProcess,
  showComparison,
  sim,
}: {
  events: LamportEvent[];
  selectedProcess: string;
  showComparison: boolean;
  sim: LamportSimulation;
}) {
  const svgWidth = 600;
  const svgHeight = 440;
  const marginLeft = 80;
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = showComparison ? 80 : 40;
  const processIds = sim.getProcessIds();
  const laneWidth = (svgWidth - marginLeft - marginRight) / processIds.length;
  const maxTick = Math.max(events.length, 6);
  const rowHeight = Math.min(
    (svgHeight - marginTop - marginBottom) / (maxTick + 1),
    50,
  );

  // Build event positions
  const eventPositions = useMemo(() => {
    const positions: { x: number; y: number; event: LamportEvent }[] = [];
    events.forEach((evt, i) => {
      const procIdx = processIds.indexOf(evt.processId);
      const x = marginLeft + procIdx * laneWidth + laneWidth / 2;
      const y = marginTop + (i + 1) * rowHeight;
      positions.push({ x, y, event: evt });
    });
    return positions;
  }, [events, laneWidth, rowHeight, processIds, marginTop, marginBottom]);

  // Find send/receive pairs for arrows
  const arrows = useMemo(() => {
    const result: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }[] = [];
    const unmatched: { sendIdx: number; event: LamportEvent }[] = [];

    eventPositions.forEach((pos, i) => {
      if (pos.event.type === "send") {
        unmatched.push({ sendIdx: i, event: pos.event });
      } else if (pos.event.type === "receive") {
        // Find most recent unmatched send targeting this process
        const matchIdx = unmatched.findIndex(
          (u) => u.event.targetProcessId === pos.event.processId,
        );
        if (matchIdx >= 0) {
          const match = unmatched[matchIdx];
          const fromPos = eventPositions[match.sendIdx];
          result.push({
            fromX: fromPos.x,
            fromY: fromPos.y,
            toX: pos.x,
            toY: pos.y,
          });
          unmatched.splice(matchIdx, 1);
        }
      }
    });
    return result;
  }, [eventPositions]);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Process timelines */}
        {processIds.map((pid, i) => {
          const x = marginLeft + i * laneWidth + laneWidth / 2;
          return (
            <g key={pid}>
              <text
                x={x}
                y={marginTop - 12}
                textAnchor="middle"
                fill={LAMPORT_COLORS[i % LAMPORT_COLORS.length]}
                fontSize="13"
                fontWeight="600"
              >
                {pid}
              </text>
              <line
                x1={x}
                y1={marginTop}
                x2={x}
                y2={svgHeight - marginBottom}
                stroke={LAMPORT_COLORS[i % LAMPORT_COLORS.length]}
                strokeWidth="2"
                opacity={0.3}
              />
              {pid === selectedProcess && (
                <rect
                  x={x - laneWidth / 2 + 4}
                  y={marginTop - 4}
                  width={laneWidth - 8}
                  height={svgHeight - marginTop - marginBottom + 8}
                  rx="4"
                  fill={LAMPORT_COLORS[i % LAMPORT_COLORS.length]}
                  opacity={0.06}
                />
              )}
            </g>
          );
        })}

        {/* Message arrows */}
        {arrows.map((arrow, i) => (
          <g key={`arrow-${i}`}>
            <defs>
              <marker
                id={`lamport-arrowhead-${i}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
              </marker>
            </defs>
            <line
              x1={arrow.fromX}
              y1={arrow.fromY}
              x2={arrow.toX}
              y2={arrow.toY}
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              markerEnd={`url(#lamport-arrowhead-${i})`}
            />
          </g>
        ))}

        {/* Events */}
        {eventPositions.map((pos, i) => {
          const procIdx = processIds.indexOf(pos.event.processId);
          const color = LAMPORT_COLORS[procIdx % LAMPORT_COLORS.length];
          const radius = pos.event.type === "local" ? 6 : 8;

          return (
            <g key={`event-${i}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={color}
                stroke="#000"
                strokeWidth="1.5"
                opacity={0.9}
              />
              {pos.event.type === "send" && (
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="8"
                  fontWeight="bold"
                >
                  S
                </text>
              )}
              {pos.event.type === "receive" && (
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="8"
                  fontWeight="bold"
                >
                  R
                </text>
              )}
              {/* Scalar timestamp label */}
              <text
                x={pos.x + (procIdx === processIds.length - 1 ? -14 : 14)}
                y={pos.y + 4}
                textAnchor={procIdx === processIds.length - 1 ? "end" : "start"}
                fill="#d1d5db"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="600"
              >
                L={pos.event.timestamp}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${marginLeft}, ${svgHeight - marginBottom + 20})`}>
          <circle cx={0} cy={0} r={4} fill={LAMPORT_COLORS[0]} />
          <text x={8} y={4} fill="#9ca3af" fontSize="9">
            Causal order
          </text>
          <text x={90} y={4} fill="#6b7280" fontSize="9">
            S=Send R=Receive L=Lamport
          </text>
        </g>

        {/* Comparison banner */}
        {showComparison && (
          <g transform={`translate(${marginLeft}, ${svgHeight - 20})`}>
            <rect
              x={-4}
              y={-12}
              width={svgWidth - marginLeft - marginRight + 8}
              height={20}
              rx={4}
              fill="#451a03"
              stroke="#f59e0b"
              strokeWidth="0.5"
              opacity={0.8}
            />
            <text x={4} y={2} fill="#fbbf24" fontSize="9" fontWeight="500">
              Limitation: L(a)&lt;L(b) does NOT imply a-&gt;b. Vector Clocks can detect concurrency, Lamport cannot.
            </text>
          </g>
        )}
      </svg>
    </div>
  );
});

// ── Paxos Protocol Visualization ─────────────────────────────

const PAXOS_PHASE_COLORS: Record<string, string> = {
  prepare: DISTRIBUTED_PHASE_COLORS.prepare,
  promise: DISTRIBUTED_PHASE_COLORS.promise,
  accept: DISTRIBUTED_PHASE_COLORS.accept,
  accepted: DISTRIBUTED_PHASE_COLORS.accepted,
  learn: DISTRIBUTED_PHASE_COLORS.learn,
};

const PaxosCanvas = memo(function PaxosCanvas({
  steps,
  currentStep,
}: {
  steps: PaxosStep[];
  currentStep: number;
}) {
  const svgWidth = 600;
  const svgHeight = 440;

  const step = steps[Math.min(currentStep, steps.length - 1)] ?? null;
  if (!step) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-foreground-subtle">
          Run the simulation to see Paxos protocol.
        </p>
      </div>
    );
  }

  // Derive unique proposers and acceptors from all steps
  const allProposers = [...new Set(steps.map((s) => s.proposer))];
  const allAcceptors = steps[0]?.acceptors ?? [];

  const proposerY = 80;
  const acceptorY = 290;
  const acceptorSpacing = Math.min(100, (svgWidth - 80) / Math.max(allAcceptors.length, 1));
  const acceptorStartX = (svgWidth - (allAcceptors.length - 1) * acceptorSpacing) / 2;

  const proposerSpacing = Math.min(160, (svgWidth - 120) / Math.max(allProposers.length, 1));
  const proposerStartX = (svgWidth - (allProposers.length - 1) * proposerSpacing) / 2;

  const phaseColor = PAXOS_PHASE_COLORS[step.phase] ?? "#6b7280";
  const isActiveProposer = (pid: string) => pid === step.proposer;

  // Determine which acceptors are "active" in the current step
  const activeAcceptorSet = new Set(step.acceptors);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto h-full max-h-[440px] w-full max-w-[600px]"
      >
        {/* Phase badge */}
        <g transform={`translate(${svgWidth / 2}, 24)`}>
          <rect
            x={-55}
            y={-12}
            width={110}
            height={24}
            rx={6}
            fill={phaseColor}
            opacity={0.25}
            stroke={phaseColor}
            strokeWidth="1.5"
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fill={phaseColor}
            fontSize="12"
            fontWeight="700"
          >
            {step.phase.toUpperCase()}
          </text>
        </g>

        {/* Proposers */}
        {allProposers.map((pid, i) => {
          const px = proposerStartX + i * proposerSpacing;
          const active = isActiveProposer(pid);
          const fill = active ? "#1e3a5f" : "#1f2937";
          const stroke = active ? phaseColor : "#374151";

          return (
            <g key={pid}>
              <rect
                x={px - 55}
                y={proposerY - 20}
                width={110}
                height={40}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={active ? 2 : 1.5}
              />
              <text
                x={px}
                y={proposerY}
                textAnchor="middle"
                fill={active ? "#93c5fd" : "#6b7280"}
                fontSize="11"
                fontWeight="600"
              >
                {pid}
              </text>
              <text
                x={px}
                y={proposerY + 14}
                textAnchor="middle"
                fill={active ? phaseColor : "#4b5563"}
                fontSize="9"
              >
                n={active ? step.proposalNumber : ""}
              </text>
            </g>
          );
        })}

        {/* Message arrows from active proposer to acceptors */}
        {allProposers.map((pid, pi) => {
          if (!isActiveProposer(pid)) return null;
          const px = proposerStartX + pi * proposerSpacing;
          const isDownward = step.phase === "prepare" || step.phase === "accept";
          const isUpward = step.phase === "promise" || step.phase === "accepted";

          return (
            <g key={`arrows-${pid}`}>
              {allAcceptors.map((aid, ai) => {
                const ax = acceptorStartX + ai * acceptorSpacing;
                const isActive = activeAcceptorSet.has(aid);
                if (!isActive) return null;

                const fromX = isDownward ? px : ax;
                const fromY = isDownward ? proposerY + 20 : acceptorY - 24;
                const toX = isDownward ? ax : px;
                const toY = isDownward ? acceptorY - 24 : proposerY + 20;

                return (
                  <g key={`arrow-${pid}-${aid}`}>
                    <defs>
                      <marker
                        id={`paxos-arrow-${pi}-${ai}`}
                        markerWidth="8"
                        markerHeight="6"
                        refX="8"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 8 3, 0 6" fill={phaseColor} />
                      </marker>
                    </defs>
                    <line
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke={phaseColor}
                      strokeWidth="1.5"
                      strokeDasharray={isUpward ? "4 2" : undefined}
                      markerEnd={`url(#paxos-arrow-${pi}-${ai})`}
                      opacity={0.6}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Learn glow on all acceptors */}
        {step.phase === "learn" &&
          allAcceptors.map((aid, ai) => {
            const ax = acceptorStartX + ai * acceptorSpacing;
            return (
              <circle
                key={`glow-${aid}`}
                cx={ax}
                cy={acceptorY}
                r={36}
                fill="#06b6d4"
                opacity={0.1}
              />
            );
          })}

        {/* Acceptors */}
        {allAcceptors.map((aid, i) => {
          const ax = acceptorStartX + i * acceptorSpacing;
          const isActive = activeAcceptorSet.has(aid);
          const fill = isActive
            ? step.phase === "accepted" || step.phase === "learn"
              ? "#14532d"
              : "#1e293b"
            : "#1f2937";
          const stroke = isActive ? phaseColor : "#374151";

          return (
            <g key={aid}>
              <rect
                x={ax - 40}
                y={acceptorY - 24}
                width={80}
                height={52}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <text
                x={ax}
                y={acceptorY - 4}
                textAnchor="middle"
                fill={isActive ? "#d1d5db" : "#6b7280"}
                fontSize="11"
                fontWeight="600"
              >
                {aid}
              </text>
              {step.value && (step.phase === "accepted" || step.phase === "learn") && isActive && (
                <text
                  x={ax}
                  y={acceptorY + 14}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize="9"
                  fontWeight="500"
                >
                  v=&quot;{step.value}&quot;
                </text>
              )}
            </g>
          );
        })}

        {/* Value label */}
        {step.value && (
          <text
            x={svgWidth / 2}
            y={acceptorY + 56}
            textAnchor="middle"
            fill={phaseColor}
            fontSize="11"
            fontWeight="600"
          >
            Proposal: n={step.proposalNumber}, v=&quot;{step.value}&quot;
          </text>
        )}

        {/* Description */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 40}
          textAnchor="middle"
          fill="#d1d5db"
          fontSize="11"
        >
          {step.description}
        </text>

        {/* Tick info */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 18}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="10"
        >
          Step {currentStep + 1} / {steps.length}
        </text>
      </svg>
    </div>
  );
});

// ── Sidebar ─────────────────────────────────────────────────

const DistributedSidebar = memo(function DistributedSidebar({
  activeSim,
  onSelect,
}: {
  activeSim: DistributedSim;
  onSelect: (sim: DistributedSim) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Distributed Systems
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {SIMULATIONS.map((sim) => (
          <button
            key={sim.id}
            onClick={() => onSelect(sim.id)}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors",
              activeSim === sim.id
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            <span className="block text-sm font-medium">{sim.name}</span>
            <span className="block text-[11px] text-foreground-subtle">
              {sim.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Properties Panel ────────────────────────────────────────

const SIM_TO_CONCEPT_SLUG: Partial<Record<DistributedSim, string>> = {
  raft: "raft-consensus",
  "consistent-hashing": "consistent-hashing",
  gossip: "gossip-protocol",
  "cap-theorem": "cap-theorem",
  "two-phase-commit": "two-phase-commit",
  saga: "saga-pattern",
};

const DistributedProperties = memo(function DistributedProperties({
  activeSim,
}: {
  activeSim: DistributedSim;
}) {
  const simDef = SIMULATIONS.find((s) => s.id === activeSim);
  const [interviewExpanded, setInterviewExpanded] = useState(false);
  const conceptSlug = SIM_TO_CONCEPT_SLUG[activeSim];
  const concept = conceptSlug
    ? CONCEPTS.find((c) => c.slug === conceptSlug)
    : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Details
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <h3 className="mb-1 text-sm font-medium text-foreground">
          {simDef?.name}
        </h3>
        <p className="mb-3 text-xs text-foreground-muted">
          {simDef?.description}
        </p>

        {(() => {
          let simContent: React.ReactNode;
          switch (activeSim) {
          case "raft":
            simContent = (
          <div>
            <p className="mb-3 text-xs text-foreground-muted italic">
              Think of Raft like a classroom: the teacher (leader) tells everyone what to write down. If the teacher is absent, students vote on a substitute — but only if the majority agrees.
            </p>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Key Concepts
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ROLE_COLORS.leader.border }}
                />
                Leader -- handles client requests, replicates logs
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ROLE_COLORS.candidate.border }}
                />
                Candidate -- running for election
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ROLE_COLORS.follower.border }}
                />
                Follower -- passive, responds to RPCs
              </li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Guarantees
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- At most one leader per term</li>
              <li>-- Majority required for election/commit</li>
              <li>-- Log entries committed if on majority</li>
              <li>-- Safety under crash and partition</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              etcd (consensus layer for Kubernetes), CockroachDB (distributed SQL), TiKV (distributed KV store), Consul (service mesh coordination).
            </p>
          </div>
            );
            break;
          case "consistent-hashing":
            simContent = (
          <div>
            <p className="mb-3 text-xs text-foreground-muted italic">
              Imagine servers sitting at positions around a clock. Each piece of data walks clockwise until it finds a server — that's its home. Add a new server, and only nearby data moves.
            </p>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Key Concepts
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Keys and nodes mapped to a ring (0 to 2^32)</li>
              <li>-- Key assigned to nearest clockwise node</li>
              <li>-- Virtual nodes improve balance</li>
              <li>-- Adding/removing a node moves ~K/N keys</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Cassandra (data partitioning with vnodes), DynamoDB (partition routing), Memcached (client-side key routing), Akamai CDN (request distribution).
            </p>
          </div>
            );
            break;
          case "vector-clocks":
            simContent = (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Key Concepts
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li>-- Each process maintains a vector of N logical clocks</li>
              <li>-- Local event: increment own component</li>
              <li>-- Send: increment own, attach clock to message</li>
              <li>-- Receive: merge (element-wise max), then increment own</li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Causality
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CAUSAL_COLOR }}
                />
                e1 -&gt; e2 iff e1.VC &le; e2.VC component-wise
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CONCURRENT_COLOR }}
                />
                Concurrent if neither happens-before the other
              </li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Amazon Dynamo (conflict detection for concurrent writes), Riak (causal context for replicated objects).
            </p>
          </div>
            );
            break;
          case "gossip":
            simContent = (
          <div>
            <p className="mb-3 text-xs text-foreground-muted italic">
              Each server picks a random friend and shares what it knows. Within O(log N) rounds, everyone is in sync — just like how rumors spread exponentially through a network.
            </p>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Key Concepts
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li>-- Epidemic / anti-entropy protocol</li>
              <li>-- Each round, nodes push data to random peers</li>
              <li>-- Version numbers resolve conflicts</li>
              <li>-- Converges in O(log N) rounds typically</li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Properties
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Scalable: per-node cost is O(fanout)</li>
              <li>-- Resilient: tolerates node failures</li>
              <li>-- Eventually consistent</li>
              <li>-- Used in Cassandra, DynamoDB, Consul</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Cassandra (membership and failure detection via gossip), Consul (SWIM protocol for cluster membership), HashiCorp Serf (decentralized cluster management).
            </p>
          </div>
            );
            break;
          case "crdts":
            simContent = (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              CRDT Types
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li>-- G-Counter: grow-only, merge = element-wise max</li>
              <li>-- PN-Counter: two G-Counters (P - N)</li>
              <li>-- LWW-Register: last-writer-wins by timestamp</li>
              <li>-- OR-Set: add/remove with unique tags</li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Guarantees
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Merge is commutative, associative, idempotent</li>
              <li>-- Strong Eventual Consistency (SEC)</li>
              <li>-- No coordination needed for writes</li>
              <li>-- All replicas converge after merge</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Figma (multiplayer cursors and selection via CRDTs), Automerge (JSON CRDT library), Yjs (real-time collaborative editing), Redis (CRDTs module for geo-replicated counters and sets).
            </p>
          </div>
            );
            break;
          case "cap-theorem":
            simContent = (
          <div>
            <div className="mb-3 rounded-md border border-amber-800/40 bg-amber-950/20 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-amber-400 mb-1">Common Misconception</p>
              <p className="text-xs text-foreground-muted">
                CAP is NOT "pick 2 of 3." Partition tolerance is mandatory — networks always fail eventually. Your real choice is between Consistency and Availability <span className="italic">during a partition</span>.
              </p>
            </div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              The CAP Theorem
            </h4>
            <p className="mb-2 text-xs text-foreground-muted">
              A distributed system can provide at most 2 of 3 guarantees
              simultaneously:
            </p>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" />
                Consistency -- all nodes see the same data
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                Availability -- every request gets a response
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                Partition tolerance -- survives network splits
              </li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Modes
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- CP: minority rejects writes during partition</li>
              <li>-- AP: all accept writes, may diverge</li>
              <li>-- CA: no partition tolerance (single node)</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              CP systems: HBase (strong consistency reads), MongoDB (strict read concern), ZooKeeper (linearizable coordination). AP systems: Cassandra (tunable consistency), DynamoDB (always-writable), CouchDB (eventual consistency with conflicts).
            </p>
          </div>
            );
            break;
          case "two-phase-commit":
            simContent = (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Protocol Phases
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                Prepare -- coordinator asks all participants
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                Vote -- participants respond YES or NO
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                />
                Commit -- all voted YES, apply changes
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#ef4444" }}
                />
                Abort -- any NO vote, rollback everything
              </li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Properties
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Atomic: all-or-nothing guarantee</li>
              <li>-- Blocking: coordinator failure blocks all</li>
              <li>-- Used in XA transactions, databases</li>
              <li>-- Not partition-tolerant</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              MySQL (XA distributed transactions), PostgreSQL (prepared transactions for cross-database atomicity), Oracle (distributed transaction coordinator).
            </p>
          </div>
            );
            break;
          case "saga":
            simContent = (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              How It Works
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li>-- Each service executes a local transaction</li>
              <li>-- Success publishes an event for the next step</li>
              <li>-- Failure triggers compensating transactions</li>
              <li>-- Compensation runs in reverse order</li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Actions
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                Execute -- forward transaction
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                Compensate -- rollback transaction
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                />
                Complete -- saga succeeded
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#ef4444" }}
                />
                Fail -- step failed, begin compensation
              </li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Properties
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Eventually consistent</li>
              <li>-- No distributed locks</li>
              <li>-- Used in microservices (Order, Payment, etc.)</li>
              <li>-- Choreography vs Orchestration variants</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Temporal (durable workflow orchestration with compensation), AWS Step Functions (managed saga orchestration), Axon Framework (event-driven saga support for Java/Kotlin).
            </p>
          </div>
            );
            break;
          case "map-reduce":
            simContent = (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Pipeline Phases
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                Split -- divide input into chunks
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#a855f7" }}
                />
                Map -- emit (key, value) pairs per chunk
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                Shuffle -- group pairs by key
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                />
                Reduce -- aggregate values per key
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#06b6d4" }}
                />
                Output -- final results
              </li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Properties
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Embarrassingly parallel</li>
              <li>-- Fault-tolerant via re-execution</li>
              <li>-- Used in Hadoop, Spark, BigQuery</li>
              <li>-- Scales linearly with data size</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Hadoop (batch processing of large datasets), early Google infrastructure (original MapReduce paper), Apache Spark (evolved from MapReduce with in-memory processing).
            </p>
          </div>
            );
            break;
          case "lamport-timestamps":
            simContent = (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Key Concepts
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li>-- Each process maintains a single scalar clock</li>
              <li>-- Local event: increment own clock</li>
              <li>-- Send: increment own, attach timestamp</li>
              <li>-- Receive: max(local, received) + 1</li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Ordering
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li>-- a -&gt; b implies L(a) &lt; L(b)</li>
              <li>-- L(a) &lt; L(b) does NOT imply a -&gt; b</li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Limitation
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li className="text-amber-400">-- Cannot detect concurrent events</li>
              <li>-- Vector Clocks solve this by using N-dimensional vectors</li>
              <li>-- Use toggle below to compare</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Foundational concept (Lamport, 1978). Google Spanner uses TrueTime (GPS + atomic clocks) instead for global ordering. Most modern systems prefer vector clocks or hybrid logical clocks.
            </p>
          </div>
            );
            break;
          case "paxos":
            simContent = (
          <div>
            <p className="mb-3 text-xs text-foreground-muted italic">
              Phase 1 (Prepare): "I want to propose — has anyone else already proposed?" Like raising your hand before speaking.
              Phase 2 (Accept): "Here's my proposal." Everyone who promised to listen must accept — unless someone with higher priority interrupted.
            </p>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Protocol Phases
            </h4>
            <ul className="mb-3 space-y-1 text-xs text-foreground-muted">
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                />
                Prepare -- proposer picks n, sends to acceptors
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#a855f7" }}
                />
                Promise -- acceptors promise not to accept n&apos; &lt; n
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                Accept -- proposer sends value with n
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#22c55e" }}
                />
                Accepted -- acceptors accept (n, v)
              </li>
              <li className="flex items-start gap-1.5">
                <span
                  className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "#06b6d4" }}
                />
                Learn -- majority accepted, value is decided
              </li>
            </ul>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Properties
            </h4>
            <ul className="space-y-1 text-xs text-foreground-muted">
              <li>-- Safety: only a single value can be chosen</li>
              <li>-- Liveness: progress if majority is alive</li>
              <li>-- Higher proposal number pre-empts lower</li>
              <li>-- Used in Chubby, Spanner, Megastore</li>
            </ul>
            <h4 className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Used By
            </h4>
            <p className="text-xs text-foreground-muted">
              Google Chubby (distributed lock service), Google Spanner (global database consensus), Google Megastore (scalable storage with Paxos replication).
            </p>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
              Why Two Phases?
            </h4>
            <p className="mb-3 text-xs text-foreground-muted">
              Without Phase 1, two proposers could propose simultaneously and get conflicting acceptances. Phase 1 establishes priority so only one value wins. This is the core insight of Paxos.
            </p>
          </div>
            );
            break;
          default: {
            const _exhaustive: never = activeSim;
            simContent = null;
          }
          }
          return simContent;
        })()}

        {/* Interview Questions (from SEO concepts data) */}
        {concept && concept.interviewQuestions.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <button
              onClick={() => setInterviewExpanded((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <h4 className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Interview Questions
              </h4>
              <span className="text-[10px] text-foreground-subtle">
                {interviewExpanded ? "Hide" : `Show (${concept.interviewQuestions.length})`}
              </span>
            </button>
            {interviewExpanded && (
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-foreground-muted">
                {concept.interviewQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Bottom Panel ────────────────────────────────────────────

const DistributedBottomPanel = memo(function DistributedBottomPanel({
  events,
}: {
  events: GenericEvent[];
}) {
  const [bottomTab, setBottomTab] = useState<"log" | "learn">("log");

  const tabBtnClass = (active: boolean) =>
    cn(
      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
      active
        ? "bg-primary/15 text-primary"
        : "text-foreground-muted hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <button onClick={() => setBottomTab("log")} className={tabBtnClass(bottomTab === "log")}>
          Event Log
        </button>
        {bottomTab === "log" && (
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-foreground-muted">
            {events.length} events
          </span>
        )}
        <button onClick={() => setBottomTab("learn")} className={tabBtnClass(bottomTab === "learn")}>
          <BookOpen className="h-3 w-3" />
          Learn
        </button>
      </div>

      {bottomTab === "learn" ? (
        <div className="flex-1 overflow-auto px-4 py-3">
          <Suspense fallback={<div className="py-4 text-center text-xs text-foreground-subtle">Loading...</div>}>
            <div className="flex flex-col gap-6">
              <TopologyAwareFailureModes />
              <SplitBrainVisualizer />
            </div>
          </Suspense>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 py-1 font-mono text-xs">
          {events.length === 0 ? (
            <p className="py-2 text-foreground-subtle">
              Step the simulation to see events here.
            </p>
          ) : (
            [...events]
              .reverse()
              .slice(0, 100)
              .map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 border-b border-border/30 py-1"
                >
                  <span className="w-10 shrink-0 text-foreground-subtle">
                    t={event.tick}
                  </span>
                  <span
                    className={cn(
                      "w-20 shrink-0 font-medium",
                      event.type === "become-leader" || event.type === "write-success"
                        ? "text-green-400"
                        : event.type === "election-timeout" || event.type === "data-diverged"
                          ? "text-amber-400"
                          : event.type === "node-crash" || event.type === "write-rejected" || event.type === "partition-created"
                            ? "text-red-400"
                            : event.type === "log-committed" || event.type === "merge" || event.type === "partition-healed" || event.type === "data-reconciled"
                              ? "text-blue-400"
                              : event.type === "send" || event.type === "receive"
                                ? "text-cyan-400"
                                : "text-foreground-muted",
                    )}
                  >
                    {event.type
                      .replace(/-/g, " ")
                      .slice(0, 14)}
                  </span>
                  <span className="text-foreground">{event.description}</span>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
});

// ── Module Hook ─────────────────────────────────────────────

export function useDistributedModule() {
  const prefersReducedMotion = useReducedMotion();
  const [activeSim, setActiveSim] = useState<DistributedSim>("raft");
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<GenericEvent[]>([]);
  const [playing, setPlaying] = useState(false);
  const [crashedNodes, setCrashedNodes] = useState<Set<string>>(new Set());
  const crashedNodesRef = useRef(crashedNodes);
  crashedNodesRef.current = crashedNodes;
  const [nodeCounter, setNodeCounter] = useState(3);
  const [hashVersion, setHashVersion] = useState(0);
  const [showVnodes, setShowVnodes] = useState(false);

  // ── Raft state ──────────────────────────────────────────────
  const clusterRef = useRef<RaftCluster>(new RaftCluster(5));
  const ringRef = useRef<ConsistentHashRing>(new ConsistentHashRing(50));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const [clusterState, setClusterState] = useState(() =>
    clusterRef.current.getState(),
  );

  // ── Auto-demo on first visit (DIS-148) ─────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('architex_distributed_demo_seen')) return;
    // Mark as seen immediately to avoid repeat
    localStorage.setItem('architex_distributed_demo_seen', 'true');

    let tickCount = 0;
    const demoTimer = setInterval(() => {
      clusterRef.current.step();
      setClusterState(clusterRef.current.getState());
      setTick(t => t + 1);
      tickCount++;
    }, 100);

    const stopTimer = setTimeout(() => {
      clearInterval(demoTimer);
      // Append a demo-complete message to the event log
      setEvents(prev => [...prev, {
        tick: tickCount,
        type: 'demo-complete',
        description: 'Demo complete! Try clicking "Crash Node" to see how Raft recovers from failures.',
      }].slice(-500));
    }, 5000);

    return () => {
      clearInterval(demoTimer);
      clearTimeout(stopTimer);
    };
  }, []);  

  // ── Vector clock state ──────────────────────────────────────
  const vcSimRef = useRef<VectorClockSimulation>(
    new VectorClockSimulation(PROCESS_IDS),
  );
  const [vcEvents, setVcEvents] = useState<ClockEvent[]>([]);
  const [vcSelectedProcess, setVcSelectedProcess] = useState<string>("P0");
  const [vcTargetProcess, setVcTargetProcess] = useState<string>("P1");
  const [vcVersion, setVcVersion] = useState(0);

  // ── Gossip state ────────────────────────────────────────────
  const gossipRef = useRef<GossipProtocol>(new GossipProtocol(8, 2, 1));
  const [gossipNodes, setGossipNodes] = useState<GossipNode[]>(() =>
    gossipRef.current.getNodes(),
  );
  const [gossipLastEvents, setGossipLastEvents] = useState<GossipEvent[]>([]);
  const [gossipConvergence, setGossipConvergence] = useState(() =>
    gossipRef.current.getConvergenceStatus(),
  );
  const [gossipVersion, setGossipVersion] = useState(0);
  const gossipDataCounter = useRef(0);

  // ── CRDT state ──────────────────────────────────────────────
  const [crdtType, setCrdtType] = useState<CRDTType>("g-counter");
  const crdtSimRef = useRef<CRDTSimulation>(
    new CRDTSimulation("g-counter", REPLICA_IDS),
  );
  const [crdtVersion, setCrdtVersion] = useState(0);
  const crdtInputRef = useRef<string>("hello");
  const [crdtInputValue, setCrdtInputValue] = useState("hello");
  const [crdtMerging, setCrdtMerging] = useState(false);
  const crdtMergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [crdtConflictInfo, setCrdtConflictInfo] = useState<CRDTConflictInfo | null>(null);
  const [crdtEventLog, setCrdtEventLog] = useState<CRDTEvent[]>([]);

  // ── CAP state ───────────────────────────────────────────────
  const [capMode, setCapMode] = useState<CAPMode>("CP");
  const capClusterRef = useRef<CAPCluster>(new CAPCluster("CP"));
  const [capVersion, setCapVersion] = useState(0);
  const capWriteCounter = useRef(0);

  // ── Two-Phase Commit state ─────────────────────────────────
  const [twoPCSteps, setTwoPCSteps] = useState<TwoPCStep[]>([]);
  const [twoPCCurrentStep, setTwoPCCurrentStep] = useState(-1);
  const [twoPCParticipants, setTwoPCParticipants] = useState(3);
  const [twoPCFailAt, setTwoPCFailAt] = useState<number | undefined>(undefined);
  const twoPCStepsRef = useRef(twoPCSteps);
  twoPCStepsRef.current = twoPCSteps;

  // ── Saga state ─────────────────────────────────────────────
  const [sagaSteps, setSagaSteps] = useState<SagaStep[]>([]);
  const [sagaCurrentStep, setSagaCurrentStep] = useState(-1);
  const [sagaStepCount, setSagaStepCount] = useState(4);
  const [sagaFailAt, setSagaFailAt] = useState<number | undefined>(undefined);
  const sagaStepsRef = useRef(sagaSteps);
  sagaStepsRef.current = sagaSteps;

  // ── MapReduce state ────────────────────────────────────────
  const [mrSteps, setMrSteps] = useState<MRStep[]>([]);
  const [mrCurrentStep, setMrCurrentStep] = useState(-1);
  const [mrInput, setMrInput] = useState("hello world hello distributed systems hello world");
  const mrStepsRef = useRef(mrSteps);
  mrStepsRef.current = mrSteps;

  // ── Lamport Timestamps state ──────────────────────────────
  const lamportSimRef = useRef<LamportSimulation>(
    new LamportSimulation(PROCESS_IDS),
  );
  const [lamportEvents, setLamportEvents] = useState<LamportEvent[]>([]);
  const [lamportSelectedProcess, setLamportSelectedProcess] = useState<string>("P0");
  const [lamportTargetProcess, setLamportTargetProcess] = useState<string>("P1");
  const [lamportShowComparison, setLamportShowComparison] = useState(false);
  const [lamportVersion, setLamportVersion] = useState(0);

  // ── Paxos state ────────────────────────────────────────────
  const [paxosSteps, setPaxosSteps] = useState<PaxosStep[]>([]);
  const [paxosCurrentStep, setPaxosCurrentStep] = useState(-1);
  const [paxosProposerCount, setPaxosProposerCount] = useState(1);
  const [paxosAcceptorCount, setPaxosAcceptorCount] = useState(3);
  const paxosStepsRef = useRef(paxosSteps);
  paxosStepsRef.current = paxosSteps;

  // ── Shared-store integration tracking ─────────────────────
  // Map sim IDs to module-progress feature IDs
  const SIM_TO_FEATURE: Record<DistributedSim, string> = useMemo(() => ({
    raft: "raft-consensus",
    "consistent-hashing": "consistent-hashing",
    "vector-clocks": "vector-clocks",
    gossip: "gossip-protocol",
    crdts: "crdt",
    "cap-theorem": "cap-theorem",
    "two-phase-commit": "two-phase-commit",
    saga: "saga-pattern",
    "map-reduce": "map-reduce",
    "lamport-timestamps": "lamport-timestamps",
    paxos: "paxos",
  }), []);

  // Track which XP milestones have been awarded to avoid duplicates
  const raftLeaderAwarded = useRef(false);
  const gossipConvergedAwarded = useRef(false);
  const crdtMergeAwarded = useRef(false);
  // Track which sims have already updated mastery this session
  const masteryUpdatedSims = useRef<Set<string>>(new Set());

  // ── Stop auto-play when switching sims ──────────────────────
  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
  }, []);

  const handleSelectSim = useCallback(
    (sim: DistributedSim) => {
      stopAutoPlay();
      setActiveSim(sim);
    },
    [stopAutoPlay],
  );

  // ── Raft handlers ───────────────────────────────────────────
  const doRaftStep = useCallback(() => {
    const prevLeader = clusterRef.current.getState().leader;
    const newEvents = clusterRef.current.step();
    const mapped: GenericEvent[] = newEvents.map((e) => ({
      tick: e.tick,
      type: e.type,
      description: e.description,
    }));
    setEvents((prev) => [...prev, ...mapped].slice(-500));
    const newState = clusterRef.current.getState();
    setClusterState(newState);
    setTick((t) => t + 1);

    // Integration 2a: Award XP when a leader is elected
    if (!prevLeader && newState.leader && !raftLeaderAwarded.current) {
      raftLeaderAwarded.current = true;
      useProgressStore.getState().addXP(10);
    }
  }, []);

  const handleRaftPlayPause = useCallback(() => {
    if (playing) {
      stopAutoPlay();
    } else {
      setPlaying(true);
      timerRef.current = setInterval(doRaftStep, 100);
    }
  }, [playing, doRaftStep, stopAutoPlay]);

  const handleRaftReset = useCallback(() => {
    stopAutoPlay();
    clusterRef.current.reset();
    setClusterState(clusterRef.current.getState());
    setEvents([]);
    setTick(0);
    setCrashedNodes(new Set());
  }, [stopAutoPlay]);

  const handleRaftCrashNode = useCallback(() => {
    const state = clusterRef.current.getState();
    const currentCrashed = crashedNodesRef.current;
    const alive = state.nodes.filter((n) => !currentCrashed.has(n.id));
    if (alive.length <= 1) return;
    const target = alive.find((n) => n.id !== state.leader) ?? alive[0];
    clusterRef.current.crashNode(target.id);
    setCrashedNodes((prev) => new Set([...prev, target.id]));
    setClusterState(clusterRef.current.getState());
    setEvents((prev) => [
      ...prev,
      ...clusterRef.current.eventLog.slice(-1).map((e) => ({
        tick: e.tick,
        type: e.type,
        description: e.description,
      })),
    ].slice(-500));
  }, []);

  const handleRaftSubmitCommand = useCallback(() => {
    const accepted = clusterRef.current.submitCommand(`SET key${tick} value${tick}`);
    if (!accepted) {
      setEvents((prev) => [
        ...prev,
        {
          tick,
          type: "command-dropped",
          description: "Command dropped: no leader exists. Elect a leader first.",
        },
      ].slice(-500));
    }
  }, [tick]);

  // ── Consistent hashing handlers ─────────────────────────────
  const handleAddNode = useCallback(() => {
    const id = `n${nodeCounter}`;
    const label = `Node ${nodeCounter}`;
    try {
      ringRef.current.addNode(id, label);
      setNodeCounter((c) => c + 1);
      setHashVersion((v) => v + 1);
    } catch {
      // node already exists
    }
  }, [nodeCounter]);

  const handleRemoveNode = useCallback(() => {
    const nodes = ringRef.current.getAllNodes();
    if (nodes.length === 0) return;
    const last = nodes[nodes.length - 1];
    ringRef.current.removeNode(last.id);
    setHashVersion((v) => v + 1);
  }, []);

  const handleAddKeys = useCallback(() => {
    for (let i = 0; i < 100; i++) {
      const key = `key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      try {
        ringRef.current.addKey(key);
      } catch {
        break;
      }
    }
    setHashVersion((v) => v + 1);
  }, []);

  // ── Vector clock handlers ───────────────────────────────────
  const handleVcLocalEvent = useCallback(() => {
    const evt = vcSimRef.current.localEvent(vcSelectedProcess);
    setVcEvents(vcSimRef.current.getEvents());
    setEvents((prev) => [
      ...prev,
      { tick: evt.tick, type: evt.type, description: evt.description },
    ].slice(-500));
    setVcVersion((v) => v + 1);
  }, [vcSelectedProcess]);

  const handleVcSend = useCallback(() => {
    if (vcSelectedProcess === vcTargetProcess) return;
    const sendEvt = vcSimRef.current.sendEvent(
      vcSelectedProcess,
      vcTargetProcess,
    );
    const recvEvt = vcSimRef.current.receiveEvent(
      vcTargetProcess,
      vcSelectedProcess,
      sendEvt.clock,
    );
    setVcEvents(vcSimRef.current.getEvents());
    setEvents((prev) => [
      ...prev,
      { tick: sendEvt.tick, type: sendEvt.type, description: sendEvt.description },
      { tick: recvEvt.tick, type: recvEvt.type, description: recvEvt.description },
    ].slice(-500));
    setVcVersion((v) => v + 1);
  }, [vcSelectedProcess, vcTargetProcess]);

  const handleVcReset = useCallback(() => {
    stopAutoPlay();
    vcSimRef.current.reset();
    setVcEvents([]);
    setEvents([]);
    setVcVersion((v) => v + 1);
  }, [stopAutoPlay]);

  // ── Gossip handlers ─────────────────────────────────────────
  const handleGossipIntroduce = useCallback(() => {
    const nodes = gossipRef.current.getNodes();
    const aliveNodes = nodes.filter((n) => n.alive);
    if (aliveNodes.length === 0) return;
    const target = aliveNodes[Math.floor(Math.random() * aliveNodes.length)];
    gossipDataCounter.current++;
    const key = `data-${gossipDataCounter.current}`;
    gossipRef.current.introduceData(target.id, key, `v${gossipDataCounter.current}`);
    setGossipNodes(gossipRef.current.getNodes());
    setGossipConvergence(gossipRef.current.getConvergenceStatus());
    setGossipVersion((v) => v + 1);
    setEvents((prev) => [
      ...prev,
      {
        tick: 0,
        type: "introduce",
        description: `Introduced ${key} on ${target.id}`,
      },
    ].slice(-500));
  }, []);

  const doGossipStep = useCallback(() => {
    const stepEvents = gossipRef.current.step();
    setGossipNodes(gossipRef.current.getNodes());
    setGossipLastEvents(stepEvents);
    const convergenceStatus = gossipRef.current.getConvergenceStatus();
    setGossipConvergence(convergenceStatus);
    setGossipVersion((v) => v + 1);
    const mapped: GenericEvent[] = stepEvents.map((e) => ({
      tick: e.tick,
      type: "gossip",
      description: e.description,
    }));
    setEvents((prev) => [...prev, ...mapped].slice(-500));

    // Integration 2b: Award XP when gossip reaches full convergence
    if (convergenceStatus.converged && !gossipConvergedAwarded.current) {
      gossipConvergedAwarded.current = true;
      useProgressStore.getState().addXP(10);
    }
  }, []);

  const handleGossipPlayPause = useCallback(() => {
    if (playing) {
      stopAutoPlay();
    } else {
      setPlaying(true);
      timerRef.current = setInterval(doGossipStep, 500);
    }
  }, [playing, doGossipStep, stopAutoPlay]);

  const handleGossipKillNode = useCallback(() => {
    const aliveNodes = gossipRef.current.getNodes().filter((n) => n.alive);
    if (aliveNodes.length <= 2) return;
    const target = aliveNodes[Math.floor(Math.random() * aliveNodes.length)];
    gossipRef.current.killNode(target.id);
    setGossipNodes(gossipRef.current.getNodes());
    setGossipConvergence(gossipRef.current.getConvergenceStatus());
    setGossipVersion((v) => v + 1);
    setEvents((prev) => [
      ...prev,
      { tick: 0, type: "node-crash", description: `Killed ${target.id}` },
    ].slice(-500));
  }, []);

  const handleGossipReset = useCallback(() => {
    stopAutoPlay();
    gossipRef.current.reset();
    gossipDataCounter.current = 0;
    setGossipNodes(gossipRef.current.getNodes());
    setGossipLastEvents([]);
    setGossipConvergence(gossipRef.current.getConvergenceStatus());
    setGossipVersion((v) => v + 1);
    setEvents([]);
  }, [stopAutoPlay]);

  // ── CRDT handlers ───────────────────────────────────────────
  const handleCrdtTypeChange = useCallback(
    (newType: CRDTType) => {
      stopAutoPlay();
      setCrdtType(newType);
      crdtSimRef.current = new CRDTSimulation(newType, REPLICA_IDS);
      setCrdtVersion((v) => v + 1);
      setCrdtConflictInfo(null);
      setCrdtEventLog([]);
      setEvents([]);
    },
    [stopAutoPlay],
  );

  const handleCrdtOp = useCallback(
    (replicaId: string, op: "increment" | "decrement" | "set" | "add" | "remove") => {
      try {
        const payload =
          op === "set" || op === "add" || op === "remove"
            ? crdtInputRef.current
            : undefined;
        const evt = crdtSimRef.current.operation(replicaId, op, payload);
        setCrdtVersion((v) => v + 1);
        setCrdtConflictInfo(null); // clear previous conflict on new op
        setCrdtEventLog((prev) => [...prev, evt]);
        setEvents((prev) => [
          ...prev,
          { tick: evt.tick, type: evt.type, description: evt.description },
        ].slice(-500));
      } catch {
        // invalid operation for this CRDT type
      }
    },
    [],
  );

  const handleCrdtMergeAll = useCallback(() => {
    // Capture pre-merge values for conflict visualization
    const premergeValues = crdtSimRef.current.getAllValues();
    const wasConverged = crdtSimRef.current.isConverged();

    // Trigger merge animation
    setCrdtMerging(true);

    // Merge all pairs to ensure convergence
    const ids = REPLICA_IDS;
    const mergeEvts: CRDTEvent[] = [];
    const mergeGenericEvents: GenericEvent[] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i !== j) {
          const evt = crdtSimRef.current.mergeReplicas(ids[i], ids[j]);
          mergeEvts.push(evt);
          mergeGenericEvents.push({
            tick: evt.tick,
            type: evt.type,
            description: evt.description,
          });
        }
      }
    }

    // Detect conflicts for LWW-Register and OR-Set
    const currentType = crdtSimRef.current.crdtType;
    if (!wasConverged && (currentType === "lww-register" || currentType === "or-set")) {
      const postmergeValues = crdtSimRef.current.getAllValues();
      // Check if replicas had different values before merge
      const uniquePreValues = new Set(
        Object.values(premergeValues).map((v) => JSON.stringify(v)),
      );
      if (uniquePreValues.size > 1) {
        let winnerReplica: string | undefined;
        if (currentType === "lww-register") {
          // Find which pre-merge value matches the post-merge value
          const winnerVal = JSON.stringify(postmergeValues[ids[0]]);
          for (const rid of ids) {
            if (JSON.stringify(premergeValues[rid]) === winnerVal) {
              winnerReplica = rid;
              break;
            }
          }
        }
        setCrdtConflictInfo({
          crdtType: currentType,
          premergeValues: { ...premergeValues },
          winnerValue: postmergeValues[ids[0]],
          winnerReplica,
          timestamp: Date.now(),
        });
      }
    } else {
      setCrdtConflictInfo(null);
    }

    setCrdtEventLog((prev) => [...prev, ...mergeEvts]);
    setCrdtVersion((v) => v + 1);
    setEvents((prev) => [...prev, ...mergeGenericEvents].slice(-500));

    // Integration 2c: Award XP when CRDTs are merged and converge
    if (crdtSimRef.current.isConverged() && !crdtMergeAwarded.current) {
      crdtMergeAwarded.current = true;
      useProgressStore.getState().addXP(10);
    }

    // Clear merge animation after duration
    crdtMergeTimerRef.current = setTimeout(() => setCrdtMerging(false), 1400);
  }, []);

  const handleCrdtReset = useCallback(() => {
    stopAutoPlay();
    crdtSimRef.current = new CRDTSimulation(crdtType, REPLICA_IDS);
    setCrdtVersion((v) => v + 1);
    setCrdtConflictInfo(null);
    setCrdtMerging(false);
    setCrdtEventLog([]);
    setEvents([]);
  }, [stopAutoPlay, crdtType]);

  // ── CAP handlers ────────────────────────────────────────────
  const handleCapModeChange = useCallback(
    (mode: CAPMode) => {
      stopAutoPlay();
      setCapMode(mode);
      capClusterRef.current.setMode(mode);
      setCapVersion((v) => v + 1);
      // Map CAP events to generic events
      const capEvts = capClusterRef.current.getEvents();
      setEvents(
        capEvts.map((e) => ({
          tick: e.tick,
          type: e.type,
          description: e.description,
        })),
      );
    },
    [stopAutoPlay],
  );

  const handleCapWrite = useCallback(() => {
    capWriteCounter.current++;
    const result = capClusterRef.current.write(
      "node-0",
      "x",
      `val-${capWriteCounter.current}`,
    );
    setCapVersion((v) => v + 1);
    const capEvts = capClusterRef.current.getEvents();
    setEvents(
      capEvts.map((e) => ({
        tick: e.tick,
        type: e.type,
        description: e.description,
      })),
    );
  }, []);

  const handleCapRead = useCallback(() => {
    // Read from node-2 (or node-0 in CA mode)
    const nodeId = capClusterRef.current.mode === "CA" ? "node-0" : "node-2";
    const result = capClusterRef.current.read(nodeId, "x");
    setCapVersion((v) => v + 1);
    const capEvts = capClusterRef.current.getEvents();
    setEvents(
      capEvts.map((e) => ({
        tick: e.tick,
        type: e.type,
        description: e.description,
      })),
    );
  }, []);

  const handleCapPartition = useCallback(() => {
    capClusterRef.current.createPartition(["node-0"], ["node-1", "node-2"]);
    setCapVersion((v) => v + 1);
    const capEvts = capClusterRef.current.getEvents();
    setEvents(
      capEvts.map((e) => ({
        tick: e.tick,
        type: e.type,
        description: e.description,
      })),
    );
  }, []);

  const handleCapHeal = useCallback(() => {
    capClusterRef.current.healPartition();
    setCapVersion((v) => v + 1);
    const capEvts = capClusterRef.current.getEvents();
    setEvents(
      capEvts.map((e) => ({
        tick: e.tick,
        type: e.type,
        description: e.description,
      })),
    );
  }, []);

  const handleCapReset = useCallback(() => {
    stopAutoPlay();
    capClusterRef.current = new CAPCluster(capMode);
    capWriteCounter.current = 0;
    setCapVersion((v) => v + 1);
    setEvents([]);
  }, [stopAutoPlay, capMode]);

  // ── Two-Phase Commit handlers ──────────────────────────────
  const handleTwoPCRun = useCallback(() => {
    const steps = simulate2PC(twoPCParticipants, twoPCFailAt);
    setTwoPCSteps(steps);
    setTwoPCCurrentStep(0);
    setEvents(
      steps.map((s) => ({
        tick: s.tick,
        type: s.phase,
        description: s.description,
      })),
    );
  }, [twoPCParticipants, twoPCFailAt]);

  const handleTwoPCStep = useCallback(() => {
    if (twoPCSteps.length === 0) {
      handleTwoPCRun();
      return;
    }
    setTwoPCCurrentStep((prev) => Math.min(prev + 1, twoPCSteps.length - 1));
  }, [twoPCSteps, handleTwoPCRun]);

  const handleTwoPCPlayPause = useCallback(() => {
    if (playing) {
      stopAutoPlay();
    } else {
      if (twoPCSteps.length === 0) {
        handleTwoPCRun();
      }
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setTwoPCCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= twoPCStepsRef.current.length) {
            stopAutoPlay();
            return prev;
          }
          return next;
        });
      }, 1000);
    }
  }, [playing, twoPCSteps, handleTwoPCRun, stopAutoPlay]);

  const handleTwoPCReset = useCallback(() => {
    stopAutoPlay();
    setTwoPCSteps([]);
    setTwoPCCurrentStep(-1);
    setEvents([]);
  }, [stopAutoPlay]);

  // ── Saga handlers ──────────────────────────────────────────
  const handleSagaRun = useCallback(() => {
    const steps = simulateSagaChoreography(sagaStepCount, sagaFailAt);
    setSagaSteps(steps);
    setSagaCurrentStep(0);
    setEvents(
      steps.map((s) => ({
        tick: s.tick,
        type: s.action,
        description: s.description,
      })),
    );
  }, [sagaStepCount, sagaFailAt]);

  const handleSagaStep = useCallback(() => {
    if (sagaSteps.length === 0) {
      handleSagaRun();
      return;
    }
    setSagaCurrentStep((prev) => Math.min(prev + 1, sagaSteps.length - 1));
  }, [sagaSteps, handleSagaRun]);

  const handleSagaPlayPause = useCallback(() => {
    if (playing) {
      stopAutoPlay();
    } else {
      if (sagaSteps.length === 0) {
        handleSagaRun();
      }
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setSagaCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= sagaStepsRef.current.length) {
            stopAutoPlay();
            return prev;
          }
          return next;
        });
      }, 800);
    }
  }, [playing, sagaSteps, handleSagaRun, stopAutoPlay]);

  const handleSagaReset = useCallback(() => {
    stopAutoPlay();
    setSagaSteps([]);
    setSagaCurrentStep(-1);
    setEvents([]);
  }, [stopAutoPlay]);

  // ── MapReduce handlers ─────────────────────────────────────
  const handleMRRun = useCallback(() => {
    const steps = simulateMapReduce(mrInput);
    setMrSteps(steps);
    setMrCurrentStep(0);
    setEvents(
      steps.map((s) => ({
        tick: s.tick,
        type: s.phase,
        description: s.description,
      })),
    );
  }, [mrInput]);

  const handleMRStep = useCallback(() => {
    if (mrSteps.length === 0) {
      handleMRRun();
      return;
    }
    setMrCurrentStep((prev) => Math.min(prev + 1, mrSteps.length - 1));
  }, [mrSteps, handleMRRun]);

  const handleMRPlayPause = useCallback(() => {
    if (playing) {
      stopAutoPlay();
    } else {
      if (mrSteps.length === 0) {
        handleMRRun();
      }
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setMrCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= mrStepsRef.current.length) {
            stopAutoPlay();
            return prev;
          }
          return next;
        });
      }, 1200);
    }
  }, [playing, mrSteps, handleMRRun, stopAutoPlay]);

  const handleMRReset = useCallback(() => {
    stopAutoPlay();
    setMrSteps([]);
    setMrCurrentStep(-1);
    setEvents([]);
  }, [stopAutoPlay]);

  // ── Lamport Timestamps handlers ────────────────────────────
  const handleLamportLocalEvent = useCallback(() => {
    const evt = lamportSimRef.current.localEvent(lamportSelectedProcess);
    setLamportEvents(lamportSimRef.current.getEvents());
    setEvents((prev) => [
      ...prev,
      { tick: evt.tick, type: evt.type, description: evt.description },
    ].slice(-500));
    setLamportVersion((v) => v + 1);
  }, [lamportSelectedProcess]);

  const handleLamportSend = useCallback(() => {
    if (lamportSelectedProcess === lamportTargetProcess) return;
    const sendEvt = lamportSimRef.current.sendEvent(
      lamportSelectedProcess,
      lamportTargetProcess,
    );
    const recvEvt = lamportSimRef.current.receiveEvent(
      lamportTargetProcess,
      sendEvt.timestamp,
    );
    setLamportEvents(lamportSimRef.current.getEvents());
    setEvents((prev) => [
      ...prev,
      { tick: sendEvt.tick, type: sendEvt.type, description: sendEvt.description },
      { tick: recvEvt.tick, type: recvEvt.type, description: recvEvt.description },
    ].slice(-500));
    setLamportVersion((v) => v + 1);
  }, [lamportSelectedProcess, lamportTargetProcess]);

  const handleLamportReset = useCallback(() => {
    stopAutoPlay();
    lamportSimRef.current.reset();
    setLamportEvents([]);
    setEvents([]);
    setLamportVersion((v) => v + 1);
  }, [stopAutoPlay]);

  // ── Paxos handlers ─────────────────────────────────────────
  const handlePaxosRun = useCallback(() => {
    const steps = simulatePaxos(paxosProposerCount, paxosAcceptorCount);
    setPaxosSteps(steps);
    setPaxosCurrentStep(0);
    setEvents(
      steps.map((s) => ({
        tick: s.tick,
        type: s.phase,
        description: s.description,
      })),
    );
  }, [paxosProposerCount, paxosAcceptorCount]);

  const handlePaxosStep = useCallback(() => {
    if (paxosSteps.length === 0) {
      handlePaxosRun();
      return;
    }
    setPaxosCurrentStep((prev) => Math.min(prev + 1, paxosSteps.length - 1));
  }, [paxosSteps, handlePaxosRun]);

  const handlePaxosPlayPause = useCallback(() => {
    if (playing) {
      stopAutoPlay();
    } else {
      if (paxosSteps.length === 0) {
        handlePaxosRun();
      }
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setPaxosCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= paxosStepsRef.current.length) {
            stopAutoPlay();
            return prev;
          }
          return next;
        });
      }, 1000);
    }
  }, [playing, paxosSteps, handlePaxosRun, stopAutoPlay]);

  const handlePaxosReset = useCallback(() => {
    stopAutoPlay();
    setPaxosSteps([]);
    setPaxosCurrentStep(-1);
    setEvents([]);
  }, [stopAutoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (crdtMergeTimerRef.current) clearTimeout(crdtMergeTimerRef.current);
    };
  }, []);

  // Clear events when switching simulations + track visits in shared stores
  useEffect(() => {
    setEvents([]);
    stopAutoPlay();

    // Reset per-sim XP flags when switching sims
    raftLeaderAwarded.current = false;
    gossipConvergedAwarded.current = false;
    crdtMergeAwarded.current = false;

    // Integration 1: Track simulation visit in module-progress
    const featureId = SIM_TO_FEATURE[activeSim];
    markFeatureExplored("distributed", featureId);
    recordModuleVisit("distributed");
    logActivity("Explored simulation", "distributed", featureId);

    // Integration 3: Update cross-module mastery (once per sim per session)
    if (!masteryUpdatedSims.current.has(activeSim)) {
      masteryUpdatedSims.current.add(activeSim);
      useCrossModuleStore.getState().updateModuleMastery("distributed", "theory", 2);
    }
  }, [activeSim, stopAutoPlay, SIM_TO_FEATURE]);

  // ── Build controls per simulation ───────────────────────────
  const btnBase =
    "flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated";
  const btnPrimary =
    "flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-primary/90";
  const btnDanger =
    "flex h-7 items-center gap-1.5 rounded-md border border-red-800 bg-red-950/50 px-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50";

  let controls: React.ReactNode = null;

  switch (activeSim) {
  case "raft":
    controls = (
      <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={doRaftStep} className={btnBase}>
              <SkipForward className="h-3 w-3" /> Step
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Advance simulation by one tick (~10ms)</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleRaftPlayPause} className={btnPrimary}>
              {playing ? (
                <>
                  <Pause className="h-3 w-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" /> Auto-play
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>{playing ? "Pause simulation" : "Run continuously"}</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleRaftReset} className={btnBase}>
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Reset to initial state</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleRaftCrashNode} className={btnDanger}>
              <AlertTriangle className="h-3 w-3" /> Crash Node
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Simulate a random node crashing</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleRaftSubmitCommand} className={btnBase}>
              <Zap className="h-3 w-3" /> Submit CMD
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Submit a command to the leader for replication</p></TooltipContent>
        </Tooltip>
        <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
          tick {tick}
        </span>
      </div>
    );
    break;
  case "consistent-hashing":
    controls = (
      <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleAddNode} className={btnPrimary}>
              <Plus className="h-3 w-3" /> Add Node
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Add a new server to the hash ring</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleRemoveNode} className={btnBase}>
              <Minus className="h-3 w-3" /> Remove Node
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Remove the last server from the ring</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleAddKeys} className={btnBase}>
              <Hash className="h-3 w-3" /> Add 100 Keys
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Place 100 random keys on the ring</p></TooltipContent>
        </Tooltip>
        <div className="ml-auto flex items-center gap-1.5">
          <label className="text-[10px] text-foreground-subtle">Vnodes:</label>
          <button
            onClick={() => setShowVnodes((v) => !v)}
            className={cn(
              "h-5 w-9 rounded-full transition-colors",
              showVnodes ? "bg-primary" : "bg-zinc-700",
            )}
          >
            <div
              className={cn(
                "h-3.5 w-3.5 rounded-full bg-white transition-transform",
                showVnodes ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>
    );
    break;
  case "vector-clocks":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Process:</label>
          <select
            value={vcSelectedProcess}
            onChange={(e) => setVcSelectedProcess(e.target.value)}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {PROCESS_IDS.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
          <label className="text-[10px] text-foreground-subtle">Target:</label>
          <select
            value={vcTargetProcess}
            onChange={(e) => setVcTargetProcess(e.target.value)}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {PROCESS_IDS.filter((p) => p !== vcSelectedProcess).map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleVcLocalEvent} className={btnBase}>
                <Zap className="h-3 w-3" /> Local Event
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Trigger a local event on the selected process</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleVcSend} className={btnPrimary}>
                <Send className="h-3 w-3" /> Send
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Send a message from selected process to target</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleVcReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset all vector clocks to zero</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  case "gossip":
    controls = (
      <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleGossipIntroduce} className={btnPrimary}>
              <Plus className="h-3 w-3" /> Introduce Data
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Inject a new key-value pair into a random node</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={doGossipStep} className={btnBase}>
              <SkipForward className="h-3 w-3" /> Step
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Run one gossip exchange round</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleGossipPlayPause} className={btnPrimary}>
              {playing ? (
                <>
                  <Pause className="h-3 w-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" /> Auto-play
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>{playing ? "Pause gossip rounds" : "Run gossip rounds continuously"}</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleGossipKillNode} className={btnDanger}>
              <Skull className="h-3 w-3" /> Kill Node
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Kill a random alive node</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleGossipReset} className={btnBase}>
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Reset all nodes and clear data</p></TooltipContent>
        </Tooltip>
      </div>
    );
    break;
  case "crdts":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Type:</label>
          <select
            value={crdtType}
            onChange={(e) => handleCrdtTypeChange(e.target.value as CRDTType)}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            <option value="g-counter">G-Counter</option>
            <option value="pn-counter">PN-Counter</option>
            <option value="lww-register">LWW-Register</option>
            <option value="or-set">OR-Set</option>
          </select>
          {(crdtType === "lww-register" || crdtType === "or-set") && (
            <input
              type="text"
              value={crdtInputValue}
              onChange={(e) => {
                setCrdtInputValue(e.target.value);
                crdtInputRef.current = e.target.value;
              }}
              placeholder="value..."
              className="h-6 w-20 rounded border border-border bg-background px-1.5 text-xs text-foreground"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {REPLICA_IDS.map((rid) => (
            <React.Fragment key={rid}>
              {crdtType === "g-counter" && (
                <button
                  onClick={() => handleCrdtOp(rid, "increment")}
                  className={btnBase}
                >
                  {rid}:Inc
                </button>
              )}
              {crdtType === "pn-counter" && (
                <>
                  <button
                    onClick={() => handleCrdtOp(rid, "increment")}
                    className={btnBase}
                  >
                    {rid}:Inc
                  </button>
                  <button
                    onClick={() => handleCrdtOp(rid, "decrement")}
                    className={btnBase}
                  >
                    {rid}:Dec
                  </button>
                </>
              )}
              {crdtType === "lww-register" && (
                <button
                  onClick={() => handleCrdtOp(rid, "set")}
                  className={btnBase}
                >
                  {rid}:Set
                </button>
              )}
              {crdtType === "or-set" && (
                <>
                  <button
                    onClick={() => handleCrdtOp(rid, "add")}
                    className={btnBase}
                  >
                    {rid}:Add
                  </button>
                  <button
                    onClick={() => handleCrdtOp(rid, "remove")}
                    className={btnBase}
                  >
                    {rid}:Rm
                  </button>
                </>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCrdtMergeAll} className={btnPrimary}>
                <Merge className="h-3 w-3" /> Merge All
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Merge all replicas to converge state</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCrdtReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset all replicas to initial state</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  case "cap-theorem":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Mode:</label>
          {(["CP", "AP", "CA"] as CAPMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleCapModeChange(m)}
              className={cn(
                "h-6 rounded px-2 text-xs font-medium transition-colors",
                capMode === m
                  ? "bg-primary text-white"
                  : "border border-border bg-background text-foreground hover:bg-elevated",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCapWrite} className={btnPrimary}>
                <Zap className="h-3 w-3" /> Write (N0)
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Write a value to Node 0</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCapRead} className={btnBase}>
                <Hash className="h-3 w-3" /> Read ({capMode === "CA" ? "N0" : "N2"})
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Read the current value from a remote node</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCapPartition} className={btnDanger}>
                <WifiOff className="h-3 w-3" /> Inject Partition
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Create a network partition between nodes</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCapHeal} className={btnBase}>
                <Wifi className="h-3 w-3" /> Heal Partition
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Restore network connectivity between all nodes</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCapReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset cluster to initial state</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  case "two-phase-commit":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Participants:</label>
          <select
            value={twoPCParticipants}
            onChange={(e) => setTwoPCParticipants(Number(e.target.value))}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className="text-[10px] text-foreground-subtle">Fail:</label>
          <select
            value={twoPCFailAt ?? "none"}
            onChange={(e) =>
              setTwoPCFailAt(
                e.target.value === "none" ? undefined : Number(e.target.value),
              )
            }
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            <option value="none">None</option>
            {Array.from({ length: twoPCParticipants }, (_, i) => (
              <option key={i} value={i}>
                P{i}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleTwoPCRun} className={btnPrimary}>
                <Play className="h-3 w-3" /> Run
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Run the 2PC protocol from the start</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleTwoPCStep} className={btnBase}>
                <SkipForward className="h-3 w-3" /> Step
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Advance to the next protocol phase</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleTwoPCPlayPause} className={btnBase}>
                {playing ? (
                  <>
                    <Pause className="h-3 w-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Auto-play
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>{playing ? "Pause protocol replay" : "Auto-advance through all phases"}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleTwoPCReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset the protocol simulation</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  case "saga":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Steps:</label>
          <select
            value={sagaStepCount}
            onChange={(e) => setSagaStepCount(Number(e.target.value))}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label className="text-[10px] text-foreground-subtle">Fail at:</label>
          <select
            value={sagaFailAt ?? "none"}
            onChange={(e) =>
              setSagaFailAt(
                e.target.value === "none" ? undefined : Number(e.target.value),
              )
            }
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            <option value="none">None</option>
            {Array.from({ length: sagaStepCount }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Step {i + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSagaRun} className={btnPrimary}>
                <Play className="h-3 w-3" /> Run
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Run the saga choreography from the start</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSagaStep} className={btnBase}>
                <SkipForward className="h-3 w-3" /> Step
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Advance to the next saga step</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSagaPlayPause} className={btnBase}>
                {playing ? (
                  <>
                    <Pause className="h-3 w-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Auto-play
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>{playing ? "Pause saga replay" : "Auto-advance through all steps"}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleSagaReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset the saga simulation</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  case "map-reduce":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Input:</label>
          <input
            type="text"
            value={mrInput}
            onChange={(e) => setMrInput(e.target.value)}
            placeholder="Enter text..."
            className="h-6 flex-1 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleMRRun} className={btnPrimary}>
                <Play className="h-3 w-3" /> Run
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Run the MapReduce pipeline on the input text</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleMRStep} className={btnBase}>
                <SkipForward className="h-3 w-3" /> Step
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Advance to the next pipeline phase</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleMRPlayPause} className={btnBase}>
                {playing ? (
                  <>
                    <Pause className="h-3 w-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Auto-play
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>{playing ? "Pause pipeline replay" : "Auto-advance through all phases"}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleMRReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset the MapReduce pipeline</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  case "lamport-timestamps":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Process:</label>
          <select
            value={lamportSelectedProcess}
            onChange={(e) => setLamportSelectedProcess(e.target.value)}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {PROCESS_IDS.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
          <label className="text-[10px] text-foreground-subtle">Target:</label>
          <select
            value={lamportTargetProcess}
            onChange={(e) => setLamportTargetProcess(e.target.value)}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {PROCESS_IDS.filter((p) => p !== lamportSelectedProcess).map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleLamportLocalEvent} className={btnBase}>
                <Zap className="h-3 w-3" /> Local Event
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Trigger a local event and increment the clock</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleLamportSend} className={btnPrimary}>
                <Send className="h-3 w-3" /> Send
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Send a timestamped message to the target process</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleLamportReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset all Lamport clocks to zero</p></TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">
            Compare with Vector Clocks:
          </label>
          <button
            onClick={() => setLamportShowComparison((v) => !v)}
            className={cn(
              "h-5 w-9 rounded-full transition-colors",
              lamportShowComparison ? "bg-primary" : "bg-zinc-700",
            )}
          >
            <div
              className={cn(
                "h-3.5 w-3.5 rounded-full bg-white transition-transform",
                lamportShowComparison ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>
    );
    break;
  case "paxos":
    controls = (
      <div className="flex flex-col gap-2 border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-foreground-subtle">Proposers:</label>
          <select
            value={paxosProposerCount}
            onChange={(e) => setPaxosProposerCount(Number(e.target.value))}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {[1, 2].map((n) => (
              <option key={n} value={n}>
                {n}{n === 2 ? " (competing)" : ""}
              </option>
            ))}
          </select>
          <label className="text-[10px] text-foreground-subtle">Acceptors:</label>
          <select
            value={paxosAcceptorCount}
            onChange={(e) => setPaxosAcceptorCount(Number(e.target.value))}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground"
          >
            {[3, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handlePaxosRun} className={btnPrimary}>
                <Play className="h-3 w-3" /> Run
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Run the Paxos consensus protocol</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handlePaxosStep} className={btnBase}>
                <SkipForward className="h-3 w-3" /> Step
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Advance to the next protocol phase</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handlePaxosPlayPause} className={btnBase}>
                {playing ? (
                  <>
                    <Pause className="h-3 w-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Auto-play
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>{playing ? "Pause protocol replay" : "Auto-advance through all phases"}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handlePaxosReset} className={btnBase}>
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Reset the Paxos simulation</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
    break;
  default: {
    const _exhaustive: never = activeSim;
    controls = null;
  }
  }

  const sidebar = (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <DistributedSidebar activeSim={activeSim} onSelect={handleSelectSim} />
        {controls}
      </div>
    </TooltipProvider>
  );

  // ── Build canvas per simulation ─────────────────────────────
  let canvas: React.ReactNode;
  switch (activeSim) {
  case "raft":
    canvas = (
      <RaftCanvas
        nodes={clusterState.nodes}
        leader={clusterState.leader}
        crashedNodes={crashedNodes}
        pendingMessages={clusterState.messages}
        prefersReducedMotion={prefersReducedMotion ?? false}
      />
    );
    break;
  case "consistent-hashing":
    canvas = (
      <ConsistentHashCanvas ring={ringRef.current} nodeCounter={nodeCounter} showVnodes={showVnodes} />
    );
    break;
  case "vector-clocks":
    canvas = (
      <VectorClockCanvas
        events={vcEvents}
        selectedProcess={vcSelectedProcess}
        sim={vcSimRef.current}
      />
    );
    break;
  case "gossip":
    canvas = (
      <GossipCanvas
        nodes={gossipNodes}
        lastEvents={gossipLastEvents}
        convergence={gossipConvergence}
      />
    );
    break;
  case "crdts":
    canvas = (
      <CRDTCanvas
        crdtType={crdtType}
        sim={crdtSimRef.current}
        version={crdtVersion}
        merging={crdtMerging}
        conflictInfo={crdtConflictInfo}
        crdtEvents={crdtEventLog}
        prefersReducedMotion={prefersReducedMotion ?? false}
      />
    );
    break;
  case "cap-theorem":
    canvas = (
      <CAPCanvas
        cluster={capClusterRef.current}
        version={capVersion}
      />
    );
    break;
  case "two-phase-commit":
    canvas = (
      <TwoPCCanvas
        steps={twoPCSteps}
        currentStep={twoPCCurrentStep}
      />
    );
    break;
  case "saga":
    canvas = (
      <SagaCanvas
        steps={sagaSteps}
        currentStep={sagaCurrentStep}
      />
    );
    break;
  case "map-reduce":
    canvas = (
      <MapReduceCanvas
        steps={mrSteps}
        currentStep={mrCurrentStep}
      />
    );
    break;
  case "lamport-timestamps":
    canvas = (
      <LamportCanvas
        events={lamportEvents}
        selectedProcess={lamportSelectedProcess}
        showComparison={lamportShowComparison}
        sim={lamportSimRef.current}
      />
    );
    break;
  case "paxos":
    canvas = (
      <PaxosCanvas
        steps={paxosSteps}
        currentStep={paxosCurrentStep}
      />
    );
    break;
  default: {
    const _exhaustive: never = activeSim;
    canvas = null;
  }
  }

  return {
    sidebar,
    canvas,
    properties: <DistributedProperties activeSim={activeSim} />,
    bottomPanel: <DistributedBottomPanel events={events} />,
  };
}

export const DistributedModule = memo(function DistributedModule() {
  return null;
});
