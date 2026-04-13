'use client';

/**
 * NodeMetricsOverlay (UI-002)
 *
 * Per-node metric badges showing CPU utilization (conic-gradient ring),
 * micro-badges for RPS, queue depth, and a state dot. Reads directly
 * from SimMetricsBus via requestAnimationFrame -- NOT from Zustand.
 *
 * Badges are hidden at zoom < 0.5. A shake animation plays when a
 * chaos event is applied to a node.
 */

import { memo, useEffect, useRef, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useViewportStore } from '@/stores/viewport-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { SimMetricsBus } from '@/lib/simulation/sim-metrics-bus';

// ---------------------------------------------------------------------------
// State color mapping
// ---------------------------------------------------------------------------

function getStateColor(utilization: number): string {
  if (utilization >= 0.9) return 'var(--severity-critical)';
  if (utilization >= 0.7) return 'var(--severity-high)';
  if (utilization >= 0.5) return 'var(--severity-medium)';
  return 'var(--state-success)';
}

function getStateDotClass(utilization: number): string {
  if (utilization >= 0.9) return 'bg-severity-critical';
  if (utilization >= 0.7) return 'bg-severity-high';
  if (utilization >= 0.5) return 'bg-severity-medium';
  return 'bg-state-success';
}

// ---------------------------------------------------------------------------
// NodeMetricsOverlay
// ---------------------------------------------------------------------------

export const NodeMetricsOverlay = memo(function NodeMetricsOverlay() {
  const status = useSimulationStore((s) => s.status);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const nodes = useCanvasStore((s) => s.nodes);
  const zoom = useViewportStore((s) => s.zoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const reactFlowInstance = useReactFlow();

  const isActive = status === 'running' || status === 'paused';

  // Subscribe to SimMetricsBus and update DOM directly (no React re-renders)
  useEffect(() => {
    if (!isActive || !orchestratorRef) return;

    const bus = SimMetricsBus.getInstance();

    const unsub = bus.subscribe((dirtyNodeIds: ReadonlySet<string>) => {
      for (const nodeId of dirtyNodeIds) {
        const badge = badgeRefs.current.get(nodeId);
        if (!badge) continue;

        const metrics = bus.readNode(nodeId);
        if (!metrics) continue;

        // Update utilization gauge (conic-gradient ring)
        const gauge = badge.querySelector<HTMLDivElement>('[data-gauge]');
        if (gauge) {
          const pct = Math.round(metrics.utilization * 100);
          const color = getStateColor(metrics.utilization);
          gauge.style.background = `conic-gradient(${color} ${pct}%, transparent ${pct}%)`;
          const label = gauge.querySelector<HTMLSpanElement>('[data-gauge-label]');
          if (label) label.textContent = `${pct}%`;
        }

        // Update RPS badge
        const rps = badge.querySelector<HTMLSpanElement>('[data-rps]');
        if (rps) rps.textContent = `${Math.round(metrics.throughput)} rps`;

        // Update queue depth
        const queue = badge.querySelector<HTMLSpanElement>('[data-queue]');
        if (queue) queue.textContent = `Q: ${metrics.queueDepth}`;

        // Update state dot
        const dot = badge.querySelector<HTMLDivElement>('[data-state-dot]');
        if (dot) {
          dot.className = `h-2 w-2 rounded-full ${getStateDotClass(metrics.utilization)}`;
        }

        // Chaos shake: check if node has active chaos
        const chaosEngine = orchestratorRef.getChaosEngine();
        const hasChaos = chaosEngine.isNodeAffected(nodeId);
        if (hasChaos) {
          badge.classList.add('animate-shake');
        } else {
          badge.classList.remove('animate-shake');
        }
      }
    });

    return unsub;
  }, [isActive, orchestratorRef]);

  if (!isActive || zoom < 0.5) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-10"
    >
      {nodes.map((node) => {
        // Convert flow position to screen position
        const screenPos = reactFlowInstance.flowToScreenPosition({
          x: node.position.x,
          y: node.position.y,
        });

        const nodeWidth = (node.measured?.width ?? (node.width as number | undefined) ?? 180) * zoom;
        const nodeHeight = (node.measured?.height ?? (node.height as number | undefined) ?? 60) * zoom;

        return (
          <div
            key={node.id}
            ref={(el) => {
              if (el) badgeRefs.current.set(node.id, el);
              else badgeRefs.current.delete(node.id);
            }}
            className="absolute transition-transform duration-75"
            style={{
              left: screenPos.x + nodeWidth / 2,
              top: screenPos.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/90 px-2 py-1 text-[10px] shadow-md backdrop-blur-sm">
              {/* Utilization gauge ring */}
              <div
                data-gauge
                className="relative flex h-6 w-6 items-center justify-center rounded-full"
                style={{
                  background: 'conic-gradient(var(--state-success) 0%, transparent 0%)',
                }}
              >
                <div className="absolute inset-[3px] rounded-full bg-background" />
                <span
                  data-gauge-label
                  className="relative z-10 text-[8px] font-bold tabular-nums text-foreground"
                >
                  0%
                </span>
              </div>

              {/* State dot */}
              <div data-state-dot className="h-2 w-2 rounded-full bg-state-success" />

              {/* RPS */}
              <span
                data-rps
                className="font-mono tabular-nums text-foreground-muted"
              >
                0 rps
              </span>

              {/* Queue depth */}
              <span
                data-queue
                className="font-mono tabular-nums text-foreground-muted"
              >
                Q: 0
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
