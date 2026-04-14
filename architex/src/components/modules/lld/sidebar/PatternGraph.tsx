"use client";

/**
 * PatternGraph -- Interactive force-directed graph showing how all 36 design
 * patterns relate to each other.
 *
 * Node colors by category:
 *   creational=blue, structural=green, behavioral=purple,
 *   modern=orange, resilience=red, concurrency=cyan, ai-agent=pink
 *
 * Edge types:
 *   prerequisite = solid arrow, dark gray
 *   confusedWith = dashed line, red/orange
 *   relatedPatterns = thin solid line, light gray
 *
 * Pure SVG with custom force-directed layout (no D3 dependency).
 * Runs 300 simulation iterations on mount, then renders static.
 * Supports: hover highlight, click to navigate, zoom+pan, legend, tooltips.
 */

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignPattern, PatternCategory } from "@/lib/lld";
import { PATTERN_PREREQUISITES } from "@/lib/lld";

// ── Constants ──────────────────────────────────────────────

const CANVAS_W = 600;
const CANVAS_H = 400;

const CATEGORY_COLORS: Record<PatternCategory, string> = {
  creational: "#3b82f6",   // blue
  structural: "#22c55e",   // green
  behavioral: "#a855f7",   // purple
  modern: "#f97316",       // orange
  resilience: "#ef4444",   // red
  concurrency: "#06b6d4",  // cyan
  "ai-agent": "#ec4899",   // pink
};

const CATEGORY_LABELS: Record<PatternCategory, string> = {
  creational: "Creational",
  structural: "Structural",
  behavioral: "Behavioral",
  modern: "Modern",
  resilience: "Resilience",
  concurrency: "Concurrency",
  "ai-agent": "AI Agent",
};

// ── Types ──────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  category: PatternCategory;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "prerequisite" | "confused" | "related";
}

// ── Data Assembly ──────────────────────────────────────────

function buildGraphData(patterns: DesignPattern[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const patternIds = new Set(patterns.map((p) => p.id));

  const nodes: GraphNode[] = patterns.map((p, i) => {
    // Seed positions in a circle for better initial layout
    const angle = (2 * Math.PI * i) / patterns.length;
    const r = Math.min(CANVAS_W, CANVAS_H) * 0.35;
    return {
      id: p.id,
      label: p.name,
      category: p.category,
      x: CANVAS_W / 2 + r * Math.cos(angle),
      y: CANVAS_H / 2 + r * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  function addEdge(source: string, target: string, type: GraphEdge["type"]) {
    if (!patternIds.has(source) || !patternIds.has(target)) return;
    if (source === target) return;
    // For undirected types, deduplicate
    const key = type === "prerequisite"
      ? `${source}->${target}:${type}`
      : `${[source, target].sort().join("<->")}: ${type}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ source, target, type });
  }

  // Prerequisite edges
  for (const [patternId, prereqs] of Object.entries(PATTERN_PREREQUISITES)) {
    for (const prereq of prereqs) {
      addEdge(prereq, patternId, "prerequisite");
    }
  }

  // confusedWith edges
  for (const p of patterns) {
    if (p.confusedWith) {
      for (const c of p.confusedWith) {
        addEdge(p.id, c.patternId, "confused");
      }
    }
  }

  // relatedPatterns edges
  for (const p of patterns) {
    if (p.relatedPatterns) {
      for (const r of p.relatedPatterns) {
        addEdge(p.id, r.patternId, "related");
      }
    }
  }

  return { nodes, edges };
}

// ── Force Simulation ───────────────────────────────────────

function runForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 300,
): GraphNode[] {
  const result = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(result.map((n) => [n.id, n]));

  const REPULSION = 8000;
  const ATTRACTION = 0.005;
  const CENTER_GRAVITY = 0.01;
  const DAMPING = 0.92;
  const MAX_VELOCITY = 8;
  const PADDING = 30;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all node pairs (Coulomb's law)
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 1;
        const force = REPULSION / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // Attraction along edges (Hooke's law)
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Stronger attraction for prerequisite edges (closer grouping)
      const strength = edge.type === "prerequisite" ? ATTRACTION * 2 : ATTRACTION;
      const fx = dx * strength;
      const fy = dy * strength;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    for (const node of result) {
      node.vx += (CANVAS_W / 2 - node.x) * CENTER_GRAVITY;
      node.vy += (CANVAS_H / 2 - node.y) * CENTER_GRAVITY;
    }

    // Apply velocity with damping, clamp, and bound to canvas
    for (const node of result) {
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      // Clamp velocity
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > MAX_VELOCITY) {
        node.vx = (node.vx / speed) * MAX_VELOCITY;
        node.vy = (node.vy / speed) * MAX_VELOCITY;
      }
      node.x += node.vx;
      node.y += node.vy;
      // Bounds
      node.x = Math.max(PADDING, Math.min(CANVAS_W - PADDING, node.x));
      node.y = Math.max(PADDING, Math.min(CANVAS_H - PADDING, node.y));
    }
  }

  return result;
}

// ── Arrow marker ID helper ─────────────────────────────────

function arrowMarkerId(dim: boolean) {
  return dim ? "arrowhead-dim" : "arrowhead";
}

// ── Component ──────────────────────────────────────────────

interface PatternGraphProps {
  patterns: DesignPattern[];
  onSelectPattern: (slug: string) => void;
  onClose?: () => void;
}

export const PatternGraph = memo(function PatternGraph({
  patterns,
  onSelectPattern,
  onClose,
}: PatternGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; category: PatternCategory } | null>(null);

  // Zoom/pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  // Build and simulate graph once
  const { nodes, edges } = useMemo(() => {
    const data = buildGraphData(patterns);
    const simulatedNodes = runForceSimulation(data.nodes, data.edges);
    return { nodes: simulatedNodes, edges: data.edges };
  }, [patterns]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Connected nodes for hover highlighting
  const connectedTo = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const n of nodes) {
      map.set(n.id, new Set());
    }
    for (const e of edges) {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    }
    return map;
  }, [nodes, edges]);

  const isHighlighted = useCallback(
    (nodeId: string) => {
      if (!hoveredNode) return true;
      if (nodeId === hoveredNode) return true;
      return connectedTo.get(hoveredNode)?.has(nodeId) ?? false;
    },
    [hoveredNode, connectedTo],
  );

  const isEdgeHighlighted = useCallback(
    (edge: GraphEdge) => {
      if (!hoveredNode) return true;
      return edge.source === hoveredNode || edge.target === hoveredNode;
    },
    [hoveredNode],
  );

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 1.15 : 0.87;
    setViewBox((prev) => {
      const newW = Math.max(100, Math.min(CANVAS_W * 3, prev.w * scaleFactor));
      const newH = Math.max(67, Math.min(CANVAS_H * 3, prev.h * scaleFactor));
      // Zoom toward center of current view
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      return {
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only pan if clicking on background
    if ((e.target as Element).tagName === "svg" || (e.target as Element).tagName === "rect") {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
    }
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !panStart.current || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.w / svgRect.width;
    const scaleY = viewBox.h / svgRect.height;
    const dx = (e.clientX - panStart.current.x) * scaleX;
    const dy = (e.clientY - panStart.current.y) * scaleY;
    setViewBox((prev) => ({
      ...prev,
      x: panStart.current!.vx - dx,
      y: panStart.current!.vy - dy,
    }));
  }, [isPanning, viewBox.w, viewBox.h]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  // Handle mouse leave to cleanup
  useEffect(() => {
    const handleUp = () => {
      setIsPanning(false);
      panStart.current = null;
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  const handleNodeClick = useCallback(
    (id: string) => {
      onSelectPattern(id);
    },
    [onSelectPattern],
  );

  const handleNodeHover = useCallback((id: string, node: GraphNode, e: React.MouseEvent) => {
    setHoveredNode(id);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      setTooltip({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top - 30,
        label: node.label,
        category: node.category,
      });
    }
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltip(null);
  }, []);

  const NODE_RADIUS = 6;

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Pattern Relationship Graph
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1 text-foreground-subtle hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close graph"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          width="100%"
          height={CANVAS_H}
          className={cn("select-none", isPanning ? "cursor-grabbing" : "cursor-grab")}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            {/* Arrow markers */}
            <marker
              id="arrowhead"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
            <marker
              id="arrowhead-dim"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b728033" />
            </marker>
          </defs>

          {/* Background rect for pan detection */}
          <rect
            x={viewBox.x}
            y={viewBox.y}
            width={viewBox.w}
            height={viewBox.h}
            fill="transparent"
          />

          {/* Edges */}
          {edges.map((edge, idx) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            const highlighted = isEdgeHighlighted(edge);
            const opacity = highlighted ? 0.8 : 0.1;

            // Offset the line ends so they don't overlap with node circles
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const offsetX = (dx / dist) * NODE_RADIUS;
            const offsetY = (dy / dist) * NODE_RADIUS;

            const x1 = sourceNode.x + offsetX;
            const y1 = sourceNode.y + offsetY;
            const x2 = targetNode.x - offsetX;
            const y2 = targetNode.y - offsetY;

            if (edge.type === "prerequisite") {
              return (
                <line
                  key={`e-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#6b7280"
                  strokeWidth={highlighted ? 1.5 : 1}
                  strokeOpacity={opacity}
                  markerEnd={`url(#${arrowMarkerId(!highlighted)})`}
                />
              );
            }

            if (edge.type === "confused") {
              return (
                <line
                  key={`e-${idx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#f97316"
                  strokeWidth={highlighted ? 1.5 : 1}
                  strokeOpacity={opacity}
                  strokeDasharray="4 3"
                />
              );
            }

            // related
            return (
              <line
                key={`e-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#9ca3af"
                strokeWidth={0.7}
                strokeOpacity={opacity * 0.6}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const highlighted = isHighlighted(node.id);
            const color = CATEGORY_COLORS[node.category];

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={(e) => handleNodeHover(node.id, node, e)}
                onMouseLeave={handleNodeLeave}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${node.label} (${CATEGORY_LABELS[node.category]})`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNodeClick(node.id);
                  }
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={hoveredNode === node.id ? NODE_RADIUS + 2 : NODE_RADIUS}
                  fill={color}
                  fillOpacity={highlighted ? 0.9 : 0.15}
                  stroke={color}
                  strokeWidth={hoveredNode === node.id ? 2 : 1}
                  strokeOpacity={highlighted ? 1 : 0.2}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + NODE_RADIUS + 10}
                  textAnchor="middle"
                  fontSize={hoveredNode === node.id ? 8 : 6.5}
                  fontWeight={hoveredNode === node.id ? 600 : 400}
                  fill={highlighted ? "currentColor" : "currentColor"}
                  fillOpacity={highlighted ? 0.9 : 0.2}
                  className="pointer-events-none"
                >
                  {node.label.length > 14 ? node.label.slice(0, 12) + ".." : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 rounded-lg border border-border/30 bg-background/90 backdrop-blur-xl px-2 py-1 shadow-lg"
            style={{
              left: Math.min(tooltip.x, CANVAS_W - 120),
              top: Math.max(0, tooltip.y),
            }}
          >
            <div className="text-[10px] font-semibold text-foreground">{tooltip.label}</div>
            <div className="text-[9px] text-foreground-subtle capitalize">{CATEGORY_LABELS[tooltip.category]}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
        {/* Category colors */}
        {(Object.entries(CATEGORY_COLORS) as [PatternCategory, string][]).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[8px] text-foreground-subtle capitalize">{CATEGORY_LABELS[cat]}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 pb-1">
        {/* Edge types */}
        <div className="flex items-center gap-1">
          <svg width="20" height="8" className="shrink-0">
            <line x1="0" y1="4" x2="16" y2="4" stroke="#6b7280" strokeWidth="1.5" />
            <polygon points="14,1 20,4 14,7" fill="#6b7280" />
          </svg>
          <span className="text-[8px] text-foreground-subtle">Prerequisite</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="20" height="8" className="shrink-0">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
          <span className="text-[8px] text-foreground-subtle">Confused With</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="20" height="8" className="shrink-0">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#9ca3af" strokeWidth="0.8" />
          </svg>
          <span className="text-[8px] text-foreground-subtle">Related</span>
        </div>
      </div>
    </div>
  );
});

export default PatternGraph;
