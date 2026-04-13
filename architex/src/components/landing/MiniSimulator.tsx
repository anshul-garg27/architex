"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  AnimatePresence,
} from "motion/react";
import { duration, easing, springs } from "@/lib/constants/motion";

// ═══════════════════════════════════════════════════════════════
// MiniSimulator — Embedded interactive system design demo
// ═══════════════════════════════════════════════════════════════
// A small self-contained demo showing a 4-node system design:
//   Client -> API Gateway -> Service -> Database
//
// - Animated request flow (dots along edges)
// - Click to toggle node failure -> shows cascade effect
// - Pure SVG + motion, no external dependencies
// - Demonstrates the platform value in ~5 seconds

// ── Layout constants ─────────────────────────────────────────

const SVG_W = 520;
const SVG_H = 200;

interface NodeDef {
  id: string;
  label: string;
  x: number;
  y: number;
  icon: string;
  color: string;
  failColor: string;
}

const NODES: NodeDef[] = [
  {
    id: "client",
    label: "Client",
    x: 60,
    y: 100,
    icon: "M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z",
    color: "hsl(199, 89%, 48%)",
    failColor: "hsl(0, 72%, 51%)",
  },
  {
    id: "gateway",
    label: "API Gateway",
    x: 190,
    y: 100,
    icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
    color: "hsl(271, 81%, 56%)",
    failColor: "hsl(0, 72%, 51%)",
  },
  {
    id: "service",
    label: "Service",
    x: 330,
    y: 100,
    icon: "M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z",
    color: "hsl(217, 91%, 60%)",
    failColor: "hsl(0, 72%, 51%)",
  },
  {
    id: "database",
    label: "Database",
    x: 460,
    y: 100,
    icon: "M12 3C7 3 3 4.8 3 7v10c0 2.2 4 4 9 4s9-1.8 9-4V7c0-2.2-4-4-9-4zm0 2c4.4 0 7 1.5 7 2s-2.6 2-7 2-7-1.5-7-2 2.6-2 7-2z",
    color: "hsl(142, 71%, 45%)",
    failColor: "hsl(0, 72%, 51%)",
  },
];

interface EdgeDef {
  from: string;
  to: string;
}

const EDGES: EdgeDef[] = [
  { from: "client", to: "gateway" },
  { from: "gateway", to: "service" },
  { from: "service", to: "database" },
];

const NODE_RADIUS = 28;

// ── Helper: get node by id ──────────────────────────────────

function getNode(id: string): NodeDef {
  return NODES.find((n) => n.id === id)!;
}

// ── Helper: check if a downstream node is affected by failure ─

function isAffectedByFailure(
  nodeId: string,
  failedNodes: Set<string>
): boolean {
  // A node is affected if any node upstream of it in the chain has failed
  const nodeIndex = NODES.findIndex((n) => n.id === nodeId);
  for (let i = 0; i < nodeIndex; i++) {
    if (failedNodes.has(NODES[i].id)) return true;
  }
  return failedNodes.has(nodeId);
}

// ── Animated dot along an edge ──────────────────────────────

function FlowDot({
  fromX,
  fromY,
  toX,
  toY,
  delay,
  blocked,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  blocked: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (blocked) return null;

  if (prefersReducedMotion) {
    // Show a static dot at midpoint
    return (
      <circle
        cx={(fromX + toX) / 2}
        cy={(fromY + toY) / 2}
        r={3}
        fill="hsl(252, 87%, 67%)"
        opacity={0.7}
      />
    );
  }

  return (
    <motion.circle
      r={3}
      fill="hsl(252, 87%, 67%)"
      initial={{ cx: fromX, cy: fromY, opacity: 0 }}
      animate={{
        cx: [fromX, toX],
        cy: [fromY, toY],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.2,
        delay,
        repeat: Infinity,
        repeatDelay: 0.6,
        ease: "linear",
      }}
    />
  );
}

// ── Error ripple effect ─────────────────────────────────────

function ErrorRipple({ cx, cy }: { cx: number; cy: number }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={NODE_RADIUS + 6}
        fill="none"
        stroke="hsl(0, 72%, 51%)"
        strokeWidth={2}
        opacity={0.4}
      />
    );
  }

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={NODE_RADIUS}
      fill="none"
      stroke="hsl(0, 72%, 51%)"
      strokeWidth={2}
      initial={{ r: NODE_RADIUS, opacity: 0.6 }}
      animate={{ r: NODE_RADIUS + 20, opacity: 0 }}
      transition={{ duration: 1, repeat: Infinity, ease: easing.out }}
    />
  );
}

// ── Main component ──────────────────────────────────────────

interface MiniSimulatorProps {
  className?: string;
}

export function MiniSimulator({ className = "" }: MiniSimulatorProps) {
  const [failedNodes, setFailedNodes] = useState<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Auto-play a failure scenario after a delay when scrolled into view
  useEffect(() => {
    if (!isInView || hasAutoPlayed || prefersReducedMotion) return;

    const timer = setTimeout(() => {
      setFailedNodes(new Set(["service"]));
      setHasAutoPlayed(true);

      // Auto-recover after 3 seconds
      const recoverTimer = setTimeout(() => {
        setFailedNodes(new Set());
      }, 3000);

      return () => clearTimeout(recoverTimer);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInView, hasAutoPlayed, prefersReducedMotion]);

  const toggleNodeFailure = useCallback((nodeId: string) => {
    setFailedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: duration.moderate, ease: easing.out }
        }
        className="relative overflow-hidden rounded-xl border border-border bg-surface/80 p-4 backdrop-blur-sm"
      >
        {/* Title bar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-state-error/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-state-warning/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-state-success/60" />
            </div>
            <span className="text-xs font-medium text-foreground-muted">
              System Architecture
            </span>
          </div>
          <span className="text-[10px] text-foreground-subtle">
            Click a node to simulate failure
          </span>
        </div>

        {/* SVG Canvas */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          role="img"
          aria-label="Interactive system architecture demo showing Client, API Gateway, Service, and Database nodes with animated request flow"
        >
          {/* Edges */}
          {EDGES.map((edge) => {
            const from = getNode(edge.from);
            const to = getNode(edge.to);
            const edgeBlocked = isAffectedByFailure(edge.to, failedNodes);

            return (
              <g key={`${edge.from}-${edge.to}`}>
                {/* Edge line */}
                <line
                  x1={from.x + NODE_RADIUS + 2}
                  y1={from.y}
                  x2={to.x - NODE_RADIUS - 2}
                  y2={to.y}
                  stroke={edgeBlocked ? "hsl(0, 72%, 51%)" : "hsl(228, 15%, 22%)"}
                  strokeWidth={2}
                  strokeDasharray={edgeBlocked ? "6 4" : "none"}
                  opacity={edgeBlocked ? 0.5 : 0.6}
                />

                {/* Animated flow dots */}
                {isInView && (
                  <>
                    <FlowDot
                      fromX={from.x + NODE_RADIUS + 2}
                      fromY={from.y}
                      toX={to.x - NODE_RADIUS - 2}
                      toY={to.y}
                      delay={0}
                      blocked={edgeBlocked}
                    />
                    <FlowDot
                      fromX={from.x + NODE_RADIUS + 2}
                      fromY={from.y}
                      toX={to.x - NODE_RADIUS - 2}
                      toY={to.y}
                      delay={0.9}
                      blocked={edgeBlocked}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const isFailed = failedNodes.has(node.id);
            const isDownstream = isAffectedByFailure(node.id, failedNodes);
            const nodeColor = isFailed || isDownstream ? node.failColor : node.color;

            return (
              <g
                key={node.id}
                onClick={() => toggleNodeFailure(node.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${node.label} node${isFailed ? " (failed)" : ""}. Click to toggle failure.`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleNodeFailure(node.id);
                  }
                }}
              >
                {/* Error ripple for failed nodes */}
                <AnimatePresence>
                  {isFailed && (
                    <ErrorRipple cx={node.x} cy={node.y} />
                  )}
                </AnimatePresence>

                {/* Node circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill="hsl(228, 15%, 10%)"
                  stroke={nodeColor}
                  strokeWidth={2}
                  animate={
                    isFailed
                      ? { scale: [1, 0.95, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    isFailed && !prefersReducedMotion
                      ? { duration: duration.moderate, repeat: Infinity, repeatDelay: 1 }
                      : { duration: duration.normal }
                  }
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />

                {/* Node icon */}
                <g
                  transform={`translate(${node.x - 12}, ${node.y - 16}) scale(1)`}
                  fill={nodeColor}
                  opacity={0.9}
                >
                  <path d={node.icon} />
                </g>

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + NODE_RADIUS + 16}
                  textAnchor="middle"
                  fill="hsl(220, 10%, 50%)"
                  fontSize={11}
                  fontFamily="var(--font-geist-sans), system-ui, sans-serif"
                >
                  {node.label}
                </text>

                {/* Failure badge */}
                <AnimatePresence>
                  {isFailed && (
                    <motion.g
                      initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : springs.bouncy
                      }
                      style={{
                        transformOrigin: `${node.x + NODE_RADIUS - 4}px ${node.y - NODE_RADIUS + 4}px`,
                      }}
                    >
                      <circle
                        cx={node.x + NODE_RADIUS - 4}
                        cy={node.y - NODE_RADIUS + 4}
                        r={8}
                        fill="hsl(0, 72%, 51%)"
                      />
                      <text
                        x={node.x + NODE_RADIUS - 4}
                        y={node.y - NODE_RADIUS + 8}
                        textAnchor="middle"
                        fill="white"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        !
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* Downstream affected indicator (warning triangle) */}
                <AnimatePresence>
                  {!isFailed && isDownstream && (
                    <motion.g
                      initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : springs.bouncy
                      }
                      style={{
                        transformOrigin: `${node.x + NODE_RADIUS - 4}px ${node.y - NODE_RADIUS + 4}px`,
                      }}
                    >
                      <circle
                        cx={node.x + NODE_RADIUS - 4}
                        cy={node.y - NODE_RADIUS + 4}
                        r={8}
                        fill="hsl(38, 92%, 50%)"
                      />
                      <text
                        x={node.x + NODE_RADIUS - 4}
                        y={node.y - NODE_RADIUS + 8}
                        textAnchor="middle"
                        fill="white"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        !
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>

        {/* Status bar */}
        <div className="mt-3 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-foreground-subtle">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  failedNodes.size > 0 ? "bg-state-error" : "bg-state-success"
                }`}
              />
              {failedNodes.size > 0
                ? `${failedNodes.size} node${failedNodes.size > 1 ? "s" : ""} degraded`
                : "All systems operational"}
            </span>
          </div>
          <span className="text-foreground-subtle">
            {failedNodes.size > 0 ? "Click failed node to recover" : "Interactive demo"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
