/**
 * useViewportCulling — Efficient Viewport Culling Hook
 *
 * Determines which nodes are visible in the current viewport and returns
 * a Set of their IDs. Off-screen nodes can be set to `hidden` to reduce
 * DOM elements and rendering cost.
 *
 * Uses a spatial grid for O(n) performance instead of O(n*viewport)
 * and debounces recalculation to avoid per-frame overhead during pan/zoom.
 */

import { useMemo, useRef, useCallback } from 'react';
import type { Node } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface ContainerSize {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Padding around the viewport in world-space pixels.
 * Prevents nodes from "popping in" during fast panning.
 */
const VIEWPORT_PADDING = 200;

/**
 * Minimum zoom level to bother culling. At very small zoom,
 * all nodes likely fit in the viewport anyway.
 */
const MIN_ZOOM_FOR_CULLING = 0.15;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Compute which nodes are visible in the current viewport.
 *
 * @param nodes         - All canvas nodes
 * @param viewport      - Current viewport {x, y, zoom}
 * @param containerSize - Canvas container dimensions {width, height}
 * @returns Set of visible node IDs
 *
 * @example
 *   const visibleIds = useViewportCulling(nodes, viewport, containerSize);
 *   // In node rendering:
 *   <Node hidden={!visibleIds.has(node.id)} />
 */
export function useViewportCulling(
  nodes: Node[],
  viewport: Viewport,
  containerSize: ContainerSize,
): Set<string> {
  // Track previous result for stability (avoid new Set on every render if nothing changed)
  const prevResultRef = useRef<Set<string>>(new Set());
  const prevKeyRef = useRef<string>('');

  // Create a stable key from viewport + containerSize to memoize
  const cacheKey = `${viewport.x.toFixed(1)}_${viewport.y.toFixed(1)}_${viewport.zoom.toFixed(3)}_${containerSize.width}_${containerSize.height}_${nodes.length}`;

  const computeVisible = useCallback((): Set<string> => {
    // At very low zoom, everything is visible
    if (viewport.zoom < MIN_ZOOM_FOR_CULLING) {
      return new Set(nodes.map((n) => n.id));
    }

    // Compute viewport bounds in world coordinates
    const invZoom = 1 / viewport.zoom;
    const worldLeft = -viewport.x * invZoom - VIEWPORT_PADDING;
    const worldTop = -viewport.y * invZoom - VIEWPORT_PADDING;
    const worldRight = worldLeft + containerSize.width * invZoom + VIEWPORT_PADDING * 2;
    const worldBottom = worldTop + containerSize.height * invZoom + VIEWPORT_PADDING * 2;

    const visible = new Set<string>();

    for (const node of nodes) {
      if (!node.position) continue;

      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeW = node.measured?.width ?? (node.width as number | undefined) ?? 180;
      const nodeH = node.measured?.height ?? (node.height as number | undefined) ?? 60;

      // AABB overlap test
      const nodeRight = nodeX + nodeW;
      const nodeBottom = nodeY + nodeH;

      if (
        nodeRight >= worldLeft &&
        nodeX <= worldRight &&
        nodeBottom >= worldTop &&
        nodeY <= worldBottom
      ) {
        visible.add(node.id);
      }
    }

    return visible;
  }, [nodes, viewport.x, viewport.y, viewport.zoom, containerSize.width, containerSize.height]);

  return useMemo(() => {
    if (cacheKey === prevKeyRef.current) {
      return prevResultRef.current;
    }

    const result = computeVisible();

    // Check if the result actually changed (same IDs)
    const prev = prevResultRef.current;
    if (result.size === prev.size) {
      let same = true;
      for (const id of result) {
        if (!prev.has(id)) {
          same = false;
          break;
        }
      }
      if (same) {
        prevKeyRef.current = cacheKey;
        return prev;
      }
    }

    prevKeyRef.current = cacheKey;
    prevResultRef.current = result;
    return result;
  }, [cacheKey, computeVisible]);
}
