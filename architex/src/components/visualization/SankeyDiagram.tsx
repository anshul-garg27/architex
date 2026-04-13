'use client';

// ─────────────────────────────────────────────────────────────
// SankeyDiagram — Interactive Data Flow Visualization
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width × configurable height
// Rendering: SVG with motion animations
// Features:
//   - Nodes as rectangles, links as cubic bezier gradient paths
//   - Hover node: highlight all connected links, dim others
//   - Hover link: tooltip with formatted flow value
//   - Click node: details panel
//   - Animated flowing dashes along link paths
//   - Color-coded by node category
//   - Responsive sizing with viewBox
//
// Animation: motion spring for highlights, CSS keyframes for flow
// Performance: SVG fine for ~50 nodes, ~100 links
// Accessibility: aria-labels on nodes and links
// Responsive: SVG viewBox scales horizontally
// Implementation effort: XL
// ─────────────────────────────────────────────────────────────

import { memo, useState, useMemo, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { siSuffix, hexToRgba } from '@/lib/visualization/colors';
import { duration } from '@/lib/constants/motion';
import { layoutSankey } from '@/lib/visualization/sankey-layout';
import type {
  SankeyInputNode,
  SankeyInputLink,
  SankeyOptions,
  SankeyNode,
  SankeyLink,
} from '@/lib/visualization/sankey-types';

// ── Types ──────────────────────────────────────────────────

export interface SankeyDiagramProps {
  nodes: SankeyInputNode[];
  links: SankeyInputLink[];
  /** Layout options override. */
  options?: Partial<SankeyOptions>;
  /** Flow unit label (e.g. "req/s", "events/s"). */
  unit?: string;
  /** SVG width. Defaults to 800. */
  width?: number;
  /** SVG height. Defaults to 400. */
  height?: number;
  className?: string;
}

interface Tooltip {
  x: number;
  y: number;
  label: string;
}

interface NodeDetail {
  node: SankeyNode;
  inLinks: SankeyLink[];
  outLinks: SankeyLink[];
}

// ── Constants ──────────────────────────────────────────────

const DASH_ARRAY = '8 4';
const DASH_OFFSET_KEYFRAMES = { strokeDashoffset: [0, -24] };
const FLOW_TRANSITION = { duration: 1.5, repeat: Infinity, ease: 'linear' as const };

// ── Component ──────────────────────────────────────────────

export const SankeyDiagram = memo(function SankeyDiagram({
  nodes: inputNodes,
  links: inputLinks,
  options,
  unit = 'req/s',
  width = 800,
  height = 400,
  className,
}: SankeyDiagramProps) {
  const gradientIdPrefix = useId();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);

  // Compute layout
  const layout = useMemo(
    () => layoutSankey(inputNodes, inputLinks, { width, height, ...options }),
    [inputNodes, inputLinks, width, height, options],
  );

  // Build lookup maps
  const nodeMap = useMemo(() => {
    const map = new Map<string, SankeyNode>();
    for (const n of layout.nodes) map.set(n.id, n);
    return map;
  }, [layout.nodes]);

  const connectedLinks = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const n of layout.nodes) map.set(n.id, new Set());
    for (const l of layout.links) {
      const key = `${l.source}->${l.target}`;
      map.get(l.source)?.add(key);
      map.get(l.target)?.add(key);
    }
    return map;
  }, [layout.nodes, layout.links]);

  // Determine if a link is highlighted
  const isLinkHighlighted = useCallback(
    (link: SankeyLink): boolean => {
      if (!hoveredNode) return true;
      const key = `${link.source}->${link.target}`;
      return connectedLinks.get(hoveredNode)?.has(key) ?? false;
    },
    [hoveredNode, connectedLinks],
  );

  const linkKey = useCallback(
    (link: SankeyLink) => `${link.source}->${link.target}`,
    [],
  );

  // Event handlers
  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNode(nodeId);
  }, []);

  const handleLinkHover = useCallback(
    (link: SankeyLink | null, event?: React.MouseEvent) => {
      if (link && event) {
        const svgRect = (event.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
        if (svgRect) {
          setTooltip({
            x: event.clientX - svgRect.left,
            y: event.clientY - svgRect.top - 10,
            label: `${siSuffix(link.value)} ${unit}`,
          });
        }
        setHoveredLink(linkKey(link));
      } else {
        setTooltip(null);
        setHoveredLink(null);
      }
    },
    [unit, linkKey],
  );

  const handleNodeClick = useCallback(
    (node: SankeyNode) => {
      const inLinks = layout.links.filter((l) => l.target === node.id);
      const outLinks = layout.links.filter((l) => l.source === node.id);
      setSelectedNode((prev) =>
        prev?.node.id === node.id ? null : { node, inLinks, outLinks },
      );
    },
    [layout.links],
  );

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Sankey data flow diagram"
      >
        {/* Gradient definitions for links */}
        <defs>
          {layout.links.map((link) => {
            const sourceNode = nodeMap.get(link.source);
            const targetNode = nodeMap.get(link.target);
            if (!sourceNode || !targetNode) return null;
            return (
              <linearGradient
                key={`grad-${linkKey(link)}`}
                id={`${gradientIdPrefix}-grad-${link.source}-${link.target}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={sourceNode.color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={targetNode.color} stopOpacity={0.6} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Links (rendered behind nodes) */}
        <g className="sankey-links">
          {layout.links.map((link) => {
            const highlighted = isLinkHighlighted(link);
            const isHovered = hoveredLink === linkKey(link);
            const opacity = hoveredNode
              ? highlighted
                ? 0.7
                : 0.08
              : isHovered
                ? 0.85
                : 0.4;

            return (
              <g key={linkKey(link)}>
                {/* Visible link fill */}
                <motion.path
                  d={link.path}
                  fill="none"
                  stroke={`url(#${gradientIdPrefix}-grad-${link.source}-${link.target})`}
                  strokeWidth={link.width}
                  strokeLinecap="butt"
                  animate={{ opacity }}
                  transition={{ duration: duration.normal }}
                  onMouseEnter={(e: React.MouseEvent) => handleLinkHover(link, e)}
                  onMouseMove={(e: React.MouseEvent) => handleLinkHover(link, e)}
                  onMouseLeave={() => handleLinkHover(null)}
                  role="graphics-symbol"
                  aria-label={`Flow from ${link.source} to ${link.target}: ${siSuffix(link.value)} ${unit}`}
                  style={{ cursor: 'pointer' }}
                />

                {/* Animated flowing dashes */}
                {highlighted && (
                  <motion.path
                    d={link.path}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={Math.max(link.width * 0.3, 1)}
                    strokeLinecap="butt"
                    strokeDasharray={DASH_ARRAY}
                    animate={DASH_OFFSET_KEYFRAMES}
                    transition={FLOW_TRANSITION}
                    opacity={hoveredNode ? 0.9 : 0.3}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="sankey-nodes">
          {layout.nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isDimmed = hoveredNode !== null && !isHovered
              && !connectedLinks.get(hoveredNode)?.has(`${hoveredNode}->${node.id}`)
              && !connectedLinks.get(hoveredNode)?.has(`${node.id}->${hoveredNode}`);

            // Check if this node is connected to the hovered node
            const isConnected = hoveredNode !== null && !isDimmed;

            return (
              <g key={node.id}>
                {/* Node rectangle */}
                <motion.rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={2}
                  fill={node.color}
                  animate={{
                    opacity: isDimmed ? 0.2 : 1,
                    scale: isHovered ? 1.02 : 1,
                  }}
                  transition={{ duration: duration.normal }}
                  onMouseEnter={() => handleNodeHover(node.id)}
                  onMouseLeave={() => handleNodeHover(null)}
                  onClick={() => handleNodeClick(node)}
                  role="graphics-symbol"
                  aria-label={`${node.label}: ${siSuffix(node.value)} ${unit}`}
                  style={{
                    cursor: 'pointer',
                    transformOrigin: `${node.x + node.width / 2}px ${node.y + node.height / 2}px`,
                  }}
                />

                {/* Hover glow */}
                {(isHovered || isConnected) && (
                  <motion.rect
                    x={node.x - 2}
                    y={node.y - 2}
                    width={node.width + 4}
                    height={node.height + 4}
                    rx={3}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={1.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 0.8 : 0.3 }}
                    exit={{ opacity: 0 }}
                    pointerEvents="none"
                  />
                )}

                {/* Node label */}
                <motion.text
                  x={node.x + node.width + 6}
                  y={node.y + node.height / 2}
                  dy="0.35em"
                  fontSize={11}
                  fill="currentColor"
                  className="fill-neutral-300"
                  animate={{ opacity: isDimmed ? 0.2 : 1 }}
                  transition={{ duration: duration.normal }}
                  pointerEvents="none"
                >
                  {node.label}
                </motion.text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: duration.fast }}
            className="pointer-events-none absolute z-50 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-100 shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          >
            {tooltip.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: duration.normal }}
            className="absolute right-0 top-0 w-64 rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 text-sm text-neutral-100 shadow-xl backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{selectedNode.node.label}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-neutral-400 hover:text-neutral-100"
                aria-label="Close details"
              >
                &times;
              </button>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: selectedNode.node.color }}
              />
              <span className="text-neutral-400">
                {selectedNode.node.category ?? 'uncategorized'}
              </span>
            </div>

            <div className="mb-3 text-lg font-bold">
              {siSuffix(selectedNode.node.value)} {unit}
            </div>

            {selectedNode.inLinks.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 text-xs font-medium text-neutral-500">
                  Incoming ({selectedNode.inLinks.length})
                </div>
                {selectedNode.inLinks.map((l) => (
                  <div
                    key={`in-${l.source}`}
                    className="flex justify-between text-xs text-neutral-300"
                  >
                    <span>{nodeMap.get(l.source)?.label ?? l.source}</span>
                    <span className="text-neutral-500">
                      {siSuffix(l.value)} {unit}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selectedNode.outLinks.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-neutral-500">
                  Outgoing ({selectedNode.outLinks.length})
                </div>
                {selectedNode.outLinks.map((l) => (
                  <div
                    key={`out-${l.target}`}
                    className="flex justify-between text-xs text-neutral-300"
                  >
                    <span>{nodeMap.get(l.target)?.label ?? l.target}</span>
                    <span className="text-neutral-500">
                      {siSuffix(l.value)} {unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SankeyDiagram.displayName = "SankeyDiagram";
