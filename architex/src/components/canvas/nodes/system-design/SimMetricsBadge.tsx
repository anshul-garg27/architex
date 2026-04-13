'use client';

/**
 * SimMetricsBadge — Zero Re-Render Metric Badge
 *
 * Displays simulation metrics (CPU, RPS, latency, error rate) on canvas nodes
 * using CSS custom properties instead of React state. After initial mount,
 * this component NEVER re-renders for value updates.
 *
 * Architecture:
 *   1. SimBadgeDriver singleton subscribes to SimMetricsBus
 *   2. On dirty notification, it sets CSS custom properties on registered DOM elements
 *   3. SimMetricsBadge renders once (static HTML structure) and registers its ref
 *   4. CSS `content: var(--prop)` displays the values without React
 */

import { memo, useRef, useEffect } from 'react';
import { SimMetricsBus } from '@/lib/simulation/sim-metrics-bus';
import type { NodeMetricsSnapshot } from '@/lib/simulation/sim-metrics-bus';

// ---------------------------------------------------------------------------
// SimBadgeDriver — singleton that drives CSS custom properties
// ---------------------------------------------------------------------------

class SimBadgeDriver {
  private static instance: SimBadgeDriver | null = null;

  /** Map of nodeId -> registered DOM element. */
  private elements: Map<string, HTMLElement> = new Map();

  /** Unsubscribe handle from the metrics bus. */
  private unsubscribe: (() => void) | null = null;

  private constructor() {
    this.start();
  }

  static getInstance(): SimBadgeDriver {
    if (!SimBadgeDriver.instance) {
      SimBadgeDriver.instance = new SimBadgeDriver();
    }
    return SimBadgeDriver.instance;
  }

  /** Register a DOM element for a node. */
  register(nodeId: string, element: HTMLElement): void {
    this.elements.set(nodeId, element);
  }

  /** Unregister a DOM element for a node. */
  unregister(nodeId: string): void {
    this.elements.delete(nodeId);
  }

  /** Start listening to SimMetricsBus. */
  private start(): void {
    const bus = SimMetricsBus.getInstance();
    this.unsubscribe = bus.subscribe((dirtyNodeIds) => {
      for (const nodeId of dirtyNodeIds) {
        const el = this.elements.get(nodeId);
        if (!el) continue;

        const metrics = bus.readNode(nodeId);
        if (!metrics) continue;

        this.applyProperties(el, metrics);
      }
    });
  }

  /** Apply CSS custom properties to a DOM element. */
  private applyProperties(el: HTMLElement, metrics: NodeMetricsSnapshot): void {
    const s = el.style;
    s.setProperty('--cpu-text', `"${Math.round(metrics.utilization * 100)}%"`);
    s.setProperty('--rps-text', `"${Math.round(metrics.throughput)} rps"`);
    s.setProperty('--lat-text', `"${Math.round(metrics.latency)}ms"`);
    s.setProperty('--err-text', `"${(metrics.errorRate * 100).toFixed(1)}%"`);
    s.setProperty('--util', String(metrics.utilization));

    // Set color based on utilization
    if (metrics.utilization >= 0.85) {
      s.setProperty('--badge-color', 'var(--state-error, #EF4444)');
    } else if (metrics.utilization >= 0.6) {
      s.setProperty('--badge-color', 'var(--state-warning, #F59E0B)');
    } else {
      s.setProperty('--badge-color', 'var(--state-active, #3B82F6)');
    }
  }

  /** Cleanup (for hot reload or testing). */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.elements.clear();
    SimBadgeDriver.instance = null;
  }
}

// ---------------------------------------------------------------------------
// SimMetricsBadge Component
// ---------------------------------------------------------------------------

interface SimMetricsBadgeProps {
  nodeId: string;
}

/**
 * Renders a static metric badge that updates via CSS custom properties.
 * After initial mount, this component never re-renders for value changes.
 */
export const SimMetricsBadge = memo(function SimMetricsBadge({ nodeId }: SimMetricsBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const driver = SimBadgeDriver.getInstance();
    driver.register(nodeId, el);

    return () => {
      driver.unregister(nodeId);
    };
  }, [nodeId]);

  return (
    <div
      ref={containerRef}
      className="sim-badge-container"
      style={{
        // Initial values before first update
        ['--cpu-text' as string]: '"—"',
        ['--rps-text' as string]: '"—"',
        ['--lat-text' as string]: '"—"',
        ['--err-text' as string]: '"—"',
        ['--badge-color' as string]: 'var(--state-idle, #6B7280)',
        ['--util' as string]: '0',
      }}
    >
      <div className="flex items-center gap-1 text-[9px] font-mono leading-none opacity-80">
        <span
          className="sim-badge-cpu inline-block rounded px-1 py-0.5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--badge-color) 15%, transparent)' }}
        />
        <span
          className="sim-badge-rps inline-block rounded px-1 py-0.5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--badge-color) 10%, transparent)' }}
        />
        <span
          className="sim-badge-lat inline-block rounded px-1 py-0.5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--badge-color) 10%, transparent)' }}
        />
        <span
          className="sim-badge-err inline-block rounded px-1 py-0.5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--badge-color) 10%, transparent)' }}
        />
      </div>

      {/* CSS-only content display using ::after pseudo-elements.
          The actual content is set via CSS custom properties. */}
      <style>{`
        .sim-badge-cpu::after { content: var(--cpu-text); }
        .sim-badge-rps::after { content: var(--rps-text); }
        .sim-badge-lat::after { content: var(--lat-text); }
        .sim-badge-err::after { content: var(--err-text); }
      `}</style>
    </div>
  );
});

SimMetricsBadge.displayName = 'SimMetricsBadge';
