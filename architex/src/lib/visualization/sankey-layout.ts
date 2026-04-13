// ─────────────────────────────────────────────────────────────
// Architex — Sankey Layout Algorithm
// ─────────────────────────────────────────────────────────────
//
// Pure layout engine for Sankey diagrams. No DOM dependencies.
//
// Algorithm:
//   1. Topological sort to assign columns (longest-path method)
//   2. Compute node values from sum of connected links
//   3. Scale node heights proportional to value
//   4. Iterative relaxation to minimize link crossings
//   5. Generate cubic bezier paths for links
//
// Complexity: O(n * iterations) where n = nodes + links
// ─────────────────────────────────────────────────────────────

import { IBM_COLORBLIND } from './colors';
import type {
  SankeyInputNode,
  SankeyInputLink,
  SankeyNode,
  SankeyLink,
  SankeyLayout,
  SankeyOptions,
} from './sankey-types';

// ── Default Options ────────────────────────────────────────

const DEFAULT_OPTIONS: SankeyOptions = {
  width: 800,
  height: 400,
  nodePadding: 16,
  nodeWidth: 20,
  iterations: 32,
};

// ── Color Palette ──────────────────────────────────────────
// IBM colorblind-safe palette for node categories.

const CATEGORY_COLORS: string[] = [
  IBM_COLORBLIND.blue,
  IBM_COLORBLIND.purple,
  IBM_COLORBLIND.magenta,
  IBM_COLORBLIND.orange,
  IBM_COLORBLIND.yellow,
  IBM_COLORBLIND.teal,
  IBM_COLORBLIND.grey,
];

// ── Main Entry Point ───────────────────────────────────────

/**
 * Compute a full Sankey layout from input nodes and links.
 *
 * @param inputNodes - Array of raw node definitions
 * @param inputLinks - Array of raw link definitions (source/target/value)
 * @param opts       - Partial layout options (merged with defaults)
 * @returns `{ nodes, links }` with computed positions and SVG paths
 */
export function layoutSankey(
  inputNodes: SankeyInputNode[],
  inputLinks: SankeyInputLink[],
  opts?: Partial<SankeyOptions>,
): SankeyLayout {
  const options: SankeyOptions = { ...DEFAULT_OPTIONS, ...opts };

  // Build adjacency structures
  const nodeMap = new Map<string, SankeyNode>();
  const outLinks = new Map<string, SankeyInputLink[]>();
  const inLinks = new Map<string, SankeyInputLink[]>();

  for (const n of inputNodes) {
    outLinks.set(n.id, []);
    inLinks.set(n.id, []);
  }

  for (const link of inputLinks) {
    outLinks.get(link.source)?.push(link);
    inLinks.get(link.target)?.push(link);
  }

  // Step 1: Assign columns via topological ordering
  const columns = assignColumns(inputNodes, outLinks);

  // Step 2: Compute node values and create SankeyNode objects
  const categorySet = new Set<string>();
  for (const n of inputNodes) {
    if (n.category) categorySet.add(n.category);
  }
  const categories = Array.from(categorySet);

  for (const n of inputNodes) {
    const inValue = (inLinks.get(n.id) ?? []).reduce((s, l) => s + l.value, 0);
    const outValue = (outLinks.get(n.id) ?? []).reduce((s, l) => s + l.value, 0);
    const value = Math.max(inValue, outValue);

    const catIndex = n.category ? categories.indexOf(n.category) : -1;
    const colorIndex = catIndex >= 0 ? catIndex : columns.get(n.id) ?? 0;

    nodeMap.set(n.id, {
      id: n.id,
      label: n.label,
      column: columns.get(n.id) ?? 0,
      value,
      x: 0,
      y: 0,
      width: options.nodeWidth,
      height: 0,
      color: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length],
      category: n.category,
      sourceOffset: 0,
      targetOffset: 0,
    });
  }

  const nodes = Array.from(nodeMap.values());

  // Step 3: Compute horizontal positions
  const maxColumn = Math.max(...nodes.map((n) => n.column), 0);
  const horizontalSpacing =
    maxColumn > 0
      ? (options.width - options.nodeWidth) / maxColumn
      : 0;

  for (const node of nodes) {
    node.x = node.column * horizontalSpacing;
  }

  // Step 4: Compute vertical positions with scaling
  scaleNodeHeights(nodes, options);

  // Step 5: Initial vertical positioning
  positionNodesInColumns(nodes, options);

  // Step 6: Iterative relaxation
  relaxNodes(nodes, inputLinks, nodeMap, options);

  // Step 7: Generate link paths
  const links = generateLinks(inputLinks, nodeMap, options);

  return { nodes, links };
}

// ── Column Assignment (Topological) ────────────────────────

/**
 * Assign columns via longest-path from sources.
 * Nodes with no incoming links are placed in column 0.
 * Each subsequent node is placed one column after its
 * deepest predecessor.
 */
function assignColumns(
  inputNodes: SankeyInputNode[],
  outLinks: Map<string, SankeyInputLink[]>,
): Map<string, number> {
  const columns = new Map<string, number>();

  // Respect any fixed column assignments
  for (const n of inputNodes) {
    if (n.column !== undefined) {
      columns.set(n.id, n.column);
    }
  }

  // Build in-degree map for nodes without fixed columns
  const inDegree = new Map<string, number>();
  const incomingFrom = new Map<string, Set<string>>();

  for (const n of inputNodes) {
    inDegree.set(n.id, 0);
    incomingFrom.set(n.id, new Set());
  }

  for (const n of inputNodes) {
    for (const link of outLinks.get(n.id) ?? []) {
      inDegree.set(link.target, (inDegree.get(link.target) ?? 0) + 1);
      incomingFrom.get(link.target)?.add(link.source);
    }
  }

  // BFS from sources (in-degree 0)
  const queue: string[] = [];
  for (const n of inputNodes) {
    if ((inDegree.get(n.id) ?? 0) === 0 && !columns.has(n.id)) {
      columns.set(n.id, 0);
      queue.push(n.id);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const col = columns.get(nodeId) ?? 0;

    for (const link of outLinks.get(nodeId) ?? []) {
      if (columns.has(link.target)) {
        // Already assigned (fixed or earlier BFS), skip
        continue;
      }

      const incoming = incomingFrom.get(link.target) ?? new Set();
      // Check if all predecessors have been assigned
      let allAssigned = true;
      let maxPredCol = 0;
      for (const pred of incoming) {
        if (!columns.has(pred)) {
          allAssigned = false;
          break;
        }
        maxPredCol = Math.max(maxPredCol, columns.get(pred) ?? 0);
      }

      if (allAssigned) {
        columns.set(link.target, maxPredCol + 1);
        queue.push(link.target);
      }
    }
  }

  // Handle any remaining unassigned nodes (cycles or disconnected)
  for (const n of inputNodes) {
    if (!columns.has(n.id)) {
      columns.set(n.id, 0);
    }
  }

  return columns;
}

// ── Node Height Scaling ────────────────────────────────────

/**
 * Scale node heights proportional to their value.
 * The tallest column determines the scale factor.
 */
function scaleNodeHeights(nodes: SankeyNode[], options: SankeyOptions): void {
  // Group by column
  const columnNodes = groupByColumn(nodes);

  // Find the column with the largest total value
  let maxColumnValue = 0;
  let maxColumnCount = 0;

  for (const group of columnNodes.values()) {
    const totalValue = group.reduce((s, n) => s + n.value, 0);
    if (totalValue > maxColumnValue) {
      maxColumnValue = totalValue;
      maxColumnCount = group.length;
    }
  }

  if (maxColumnValue === 0) return;

  // Available height minus padding
  const availableHeight =
    options.height - Math.max(maxColumnCount - 1, 0) * options.nodePadding;
  const scale = availableHeight / maxColumnValue;

  for (const node of nodes) {
    node.height = Math.max(node.value * scale, 2); // minimum 2px
  }
}

// ── Initial Vertical Positioning ───────────────────────────

/**
 * Stack nodes within each column with padding between them.
 * Centers each column vertically.
 */
function positionNodesInColumns(
  nodes: SankeyNode[],
  options: SankeyOptions,
): void {
  const columnNodes = groupByColumn(nodes);

  for (const group of columnNodes.values()) {
    const totalHeight =
      group.reduce((s, n) => s + n.height, 0) +
      (group.length - 1) * options.nodePadding;

    let y = (options.height - totalHeight) / 2;

    for (const node of group) {
      node.y = y;
      y += node.height + options.nodePadding;
    }
  }
}

// ── Iterative Relaxation ───────────────────────────────────

/**
 * Iteratively adjust node positions to minimize link crossings.
 * Uses weighted average of connected node centers as target position.
 */
function relaxNodes(
  nodes: SankeyNode[],
  links: SankeyInputLink[],
  nodeMap: Map<string, SankeyNode>,
  options: SankeyOptions,
): void {
  const columnNodes = groupByColumn(nodes);
  const alpha = 0.5; // relaxation factor (damping)

  for (let iter = 0; iter < options.iterations; iter++) {
    // Forward pass: adjust based on source positions
    const sortedColumns = Array.from(columnNodes.keys()).sort((a, b) => a - b);

    for (const col of sortedColumns) {
      const group = columnNodes.get(col)!;
      for (const node of group) {
        const sourceLinks = links.filter((l) => l.target === node.id);
        if (sourceLinks.length === 0) continue;

        let weightedSum = 0;
        let totalWeight = 0;
        for (const link of sourceLinks) {
          const source = nodeMap.get(link.source);
          if (source) {
            weightedSum += (source.y + source.height / 2) * link.value;
            totalWeight += link.value;
          }
        }

        if (totalWeight > 0) {
          const targetCenter = weightedSum / totalWeight;
          node.y += (targetCenter - node.y - node.height / 2) * alpha;
        }
      }

      resolveOverlaps(group, options);
    }

    // Backward pass: adjust based on target positions
    for (let i = sortedColumns.length - 1; i >= 0; i--) {
      const col = sortedColumns[i];
      const group = columnNodes.get(col)!;
      for (const node of group) {
        const targetLinks = links.filter((l) => l.source === node.id);
        if (targetLinks.length === 0) continue;

        let weightedSum = 0;
        let totalWeight = 0;
        for (const link of targetLinks) {
          const target = nodeMap.get(link.target);
          if (target) {
            weightedSum += (target.y + target.height / 2) * link.value;
            totalWeight += link.value;
          }
        }

        if (totalWeight > 0) {
          const targetCenter = weightedSum / totalWeight;
          node.y += (targetCenter - node.y - node.height / 2) * alpha;
        }
      }

      resolveOverlaps(group, options);
    }
  }
}

/**
 * Resolve vertical overlaps within a column by pushing nodes apart.
 * Clamps nodes to stay within the diagram height.
 */
function resolveOverlaps(group: SankeyNode[], options: SankeyOptions): void {
  // Sort by current y
  group.sort((a, b) => a.y - b.y);

  // Push down overlapping nodes
  for (let i = 1; i < group.length; i++) {
    const prev = group[i - 1];
    const minY = prev.y + prev.height + options.nodePadding;
    if (group[i].y < minY) {
      group[i].y = minY;
    }
  }

  // Clamp to bottom edge and push up if needed
  const last = group[group.length - 1];
  if (last) {
    const overflow = last.y + last.height - options.height;
    if (overflow > 0) {
      last.y -= overflow;
      for (let i = group.length - 2; i >= 0; i--) {
        const maxY = group[i + 1].y - group[i].height - options.nodePadding;
        if (group[i].y > maxY) {
          group[i].y = maxY;
        }
      }
    }
  }

  // Clamp to top edge
  if (group[0] && group[0].y < 0) {
    group[0].y = 0;
    for (let i = 1; i < group.length; i++) {
      const minY = group[i - 1].y + group[i - 1].height + options.nodePadding;
      if (group[i].y < minY) {
        group[i].y = minY;
      }
    }
  }
}

// ── Link Path Generation ───────────────────────────────────

/**
 * Generate cubic bezier SVG paths for each link.
 * Width proportional to flow value. Paths connect the right
 * edge of the source node to the left edge of the target node.
 */
function generateLinks(
  inputLinks: SankeyInputLink[],
  nodeMap: Map<string, SankeyNode>,
  _options: SankeyOptions,
): SankeyLink[] {
  // Reset source/target offsets
  for (const node of nodeMap.values()) {
    node.sourceOffset = 0;
    node.targetOffset = 0;
  }

  // Sort links to minimize crossings: by source y, then target y
  const sortedLinks = [...inputLinks].sort((a, b) => {
    const sa = nodeMap.get(a.source);
    const sb = nodeMap.get(b.source);
    const ta = nodeMap.get(a.target);
    const tb = nodeMap.get(b.target);
    if (!sa || !sb || !ta || !tb) return 0;
    if (sa.y !== sb.y) return sa.y - sb.y;
    return ta.y - tb.y;
  });

  const result: SankeyLink[] = [];

  for (const link of sortedLinks) {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    if (!source || !target) continue;

    // Calculate link width proportional to value relative to node
    const linkWidth = source.height > 0
      ? (link.value / source.value) * source.height
      : 2;

    // Source: right edge of node, offset down
    const x0 = source.x + source.width;
    const y0 = source.y + source.sourceOffset + linkWidth / 2;
    source.sourceOffset += linkWidth;

    // Target: left edge of node, offset down
    const x1 = target.x;
    const targetLinkWidth = target.height > 0
      ? (link.value / target.value) * target.height
      : 2;
    const y1 = target.y + target.targetOffset + targetLinkWidth / 2;
    target.targetOffset += targetLinkWidth;

    // Cubic bezier control points (horizontal tangent)
    const midX = (x0 + x1) / 2;
    const path = `M ${x0},${y0} C ${midX},${y0} ${midX},${y1} ${x1},${y1}`;

    result.push({
      source: link.source,
      target: link.target,
      value: link.value,
      path,
      width: Math.max(linkWidth, 1),
      color: source.color,
      sy: y0,
      ty: y1,
    });
  }

  return result;
}

// ── Utility ────────────────────────────────────────────────

/** Group nodes by their column index. */
function groupByColumn(nodes: SankeyNode[]): Map<number, SankeyNode[]> {
  const map = new Map<number, SankeyNode[]>();
  for (const node of nodes) {
    const group = map.get(node.column);
    if (group) {
      group.push(node);
    } else {
      map.set(node.column, [node]);
    }
  }
  return map;
}
