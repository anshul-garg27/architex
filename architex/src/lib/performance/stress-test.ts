// ─────────────────────────────────────────────────────────────
// Architex — React Flow Stress Test Utility
// ─────────────────────────────────────────────────────────────
//
// Development-only utilities for generating large diagrams and
// measuring render performance. NOT for production use.
//
// `generateStressTestNodes` creates a grid of nodes with random
// edges for testing canvas performance at scale.
//
// `measureRenderPerformance` uses requestAnimationFrame timing
// to estimate average FPS over a short sample window.
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from '@xyflow/react';

// ── Types ──────────────────────────────────────────────────

export type StressTestSize = 50 | 100 | 200 | 500;

export interface StressTestResult {
  nodes: Node[];
  edges: Edge[];
  nodeCount: number;
  edgeCount: number;
}

export interface PerformanceResult {
  /** Average FPS over the measurement window. */
  averageFPS: number;
  /** Minimum FPS observed during the window. */
  minFPS: number;
  /** Maximum FPS observed during the window. */
  maxFPS: number;
  /** Total frames sampled. */
  frameCount: number;
  /** Duration of the measurement in milliseconds. */
  durationMs: number;
}

// ── Node / Edge Generation ─────────────────────────────────

/**
 * Generates a grid of React Flow nodes with random inter-node
 * edges. Useful for stress-testing canvas rendering at scale.
 *
 * Layout: nodes are arranged in a square-ish grid with 200px
 * spacing. Edges are added randomly with a ~20% connection
 * probability between adjacent grid cells.
 *
 * @param count Number of nodes to generate (50, 100, 200, or 500)
 */
export function generateStressTestNodes(count: StressTestSize): StressTestResult {
  const cols = Math.ceil(Math.sqrt(count));
  const spacingX = 200;
  const spacingY = 120;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── Create grid of nodes ──
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    nodes.push({
      id: `stress-${i}`,
      position: { x: col * spacingX, y: row * spacingY },
      data: {
        label: `Node ${i}`,
      },
      type: 'default',
    });
  }

  // ── Create edges between adjacent nodes ──
  // Use a seeded-style approach (deterministic based on index)
  // to keep results reproducible.
  let edgeId = 0;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Connect to right neighbor
    if (col < cols - 1 && i + 1 < count) {
      // ~60% chance of horizontal edge
      if (seededRandom(i, 0) > 0.4) {
        edges.push({
          id: `stress-edge-${edgeId++}`,
          source: `stress-${i}`,
          target: `stress-${i + 1}`,
        });
      }
    }

    // Connect to bottom neighbor
    const belowIndex = i + cols;
    if (row < Math.ceil(count / cols) - 1 && belowIndex < count) {
      // ~40% chance of vertical edge
      if (seededRandom(i, 1) > 0.6) {
        edges.push({
          id: `stress-edge-${edgeId++}`,
          source: `stress-${i}`,
          target: `stress-${belowIndex}`,
        });
      }
    }
  }

  return {
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

// ── Seeded Random ──────────────────────────────────────────

/**
 * Simple deterministic pseudo-random based on index + salt.
 * Returns a value in [0, 1).
 */
function seededRandom(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ── FPS Measurement ────────────────────────────────────────

/**
 * Measures render performance by counting requestAnimationFrame
 * callbacks over a fixed window (default 2 seconds).
 *
 * Returns a promise that resolves with FPS statistics.
 *
 * @param durationMs Measurement window in milliseconds (default 2000)
 */
export function measureRenderPerformance(
  durationMs: number = 2000,
): Promise<PerformanceResult> {
  return new Promise((resolve) => {
    const frameTimes: number[] = [];
    let lastTime = performance.now();
    let rafId: number;
    const startTime = lastTime;

    function frame() {
      const now = performance.now();
      frameTimes.push(now - lastTime);
      lastTime = now;

      if (now - startTime < durationMs) {
        rafId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(rafId);

        // Compute stats
        const frameCount = frameTimes.length;
        const elapsed = now - startTime;
        const averageFPS = frameCount > 0 ? (frameCount / elapsed) * 1000 : 0;

        const fpsSamples = frameTimes.map((dt) => (dt > 0 ? 1000 / dt : 0));
        const minFPS = fpsSamples.length > 0 ? Math.min(...fpsSamples) : 0;
        const maxFPS = fpsSamples.length > 0 ? Math.max(...fpsSamples) : 0;

        resolve({
          averageFPS: Math.round(averageFPS * 10) / 10,
          minFPS: Math.round(minFPS * 10) / 10,
          maxFPS: Math.round(maxFPS * 10) / 10,
          frameCount,
          durationMs: Math.round(elapsed),
        });
      }
    }

    rafId = requestAnimationFrame(frame);
  });
}
