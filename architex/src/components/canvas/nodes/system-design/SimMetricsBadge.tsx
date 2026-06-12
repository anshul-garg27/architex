'use client';

/**
 * SimMetricsBadge — Calm Two-Tier Telemetry Badge (zero re-renders per tick)
 *
 * DEFAULT tier (always visible during sim): one thin band-colored
 * utilization bar plus a single number (rps). That is all.
 * DETAIL tier (node hovered or selected): the full formatted metric row
 * (util · rps · latency · err · queue) with noise-level values omitted
 * (sub-1 queues, sub-0.1% error rates). No raw floats anywhere.
 *
 * Architecture (unchanged from v1):
 *   1. SimBadgeDriver singleton subscribes to SimMetricsBus
 *   2. On rAF-coalesced dirty notification it writes CSS custom properties
 *      onto registered DOM elements — no React state, no re-renders
 *   3. CSS `content: var(--prop)` / `transform: scaleX(var(--util))`
 *      display the values without React
 *   4. The driver also mirrors the node's worst threshold band onto the
 *      nearest [data-sim-chrome] ancestor (BaseNode's container) as a
 *      `data-sim-band` attribute, driving ambient health chrome via CSS.
 *      The attribute is only touched when the band actually changes.
 */

import { memo, useRef, useEffect } from 'react';
import { SimMetricsBus } from '@/lib/simulation/sim-metrics-bus';
import type { NodeMetricsSnapshot } from '@/lib/simulation/sim-metrics-bus';
import {
  formatRps,
  formatLatency,
  formatQueueDepth,
  formatErrorRate,
  formatUtilization,
  classifyUtilizationBand,
  classifyNodeMetrics,
  BAND_COLOR_VAR,
} from '@/lib/simulation/format-metrics';
import type { ThresholdBand } from '@/lib/simulation/threshold-bands';

// ---------------------------------------------------------------------------
// SimBadgeDriver — singleton that drives CSS custom properties
// ---------------------------------------------------------------------------

interface RegisteredBadge {
  /** Badge container that receives the CSS custom properties. */
  el: HTMLElement;
  /** Nearest [data-sim-chrome] ancestor (BaseNode container), if any. */
  chrome: HTMLElement | null;
  /** Last band written to the chrome element (avoids attribute churn). */
  lastBand: ThresholdBand | null;
}

class SimBadgeDriver {
  private static instance: SimBadgeDriver | null = null;

  /** Map of nodeId -> registered badge entry. */
  private entries: Map<string, RegisteredBadge> = new Map();

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
    this.entries.set(nodeId, {
      el: element,
      chrome: element.closest<HTMLElement>('[data-sim-chrome]'),
      lastBand: null,
    });
  }

  /** Unregister a node and clear its ambient chrome. */
  unregister(nodeId: string): void {
    const entry = this.entries.get(nodeId);
    entry?.chrome?.removeAttribute('data-sim-band');
    this.entries.delete(nodeId);
  }

  /** Start listening to SimMetricsBus. */
  private start(): void {
    const bus = SimMetricsBus.getInstance();
    this.unsubscribe = bus.subscribe((dirtyNodeIds) => {
      for (const nodeId of dirtyNodeIds) {
        const entry = this.entries.get(nodeId);
        if (!entry) continue;

        const metrics = bus.readNode(nodeId);
        if (!metrics) continue;

        this.applyProperties(entry, metrics);
      }
    });
  }

  /** Apply CSS custom properties (and band chrome) for one node. */
  private applyProperties(entry: RegisteredBadge, metrics: NodeMetricsSnapshot): void {
    const s = entry.el.style;

    // ── Default tier: utilization bar + one number ──
    const clampedUtil = Math.min(Math.max(metrics.utilization, 0), 1);
    s.setProperty('--util', String(clampedUtil));
    s.setProperty('--band-color', BAND_COLOR_VAR[classifyUtilizationBand(metrics.utilization)]);
    s.setProperty('--rps-text', `"${formatRps(metrics.throughput)}"`);

    // ── Detail tier: full formatted row, nulls omitted via display vars ──
    s.setProperty('--util-text', `"${formatUtilization(metrics.utilization)}"`);
    s.setProperty('--lat-text', `"${formatLatency(metrics.latency)}"`);

    const err = formatErrorRate(metrics.errorRate);
    s.setProperty('--err-display', err ? 'inline-block' : 'none');
    if (err) s.setProperty('--err-text', `"err ${err}"`);

    const q = formatQueueDepth(metrics.queueDepth);
    s.setProperty('--q-display', q ? 'inline-block' : 'none');
    if (q) s.setProperty('--q-text', `"Q:${q}"`);

    // ── Ambient node chrome: write only on band transitions ──
    const band = classifyNodeMetrics({
      utilization: metrics.utilization,
      errorRate: metrics.errorRate,
    });
    if (band !== entry.lastBand) {
      entry.lastBand = band;
      entry.chrome?.setAttribute('data-sim-band', band);
    }
  }

  /** Cleanup (for hot reload or testing). */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    for (const entry of this.entries.values()) {
      entry.chrome?.removeAttribute('data-sim-band');
    }
    this.entries.clear();
    SimBadgeDriver.instance = null;
  }
}

// ---------------------------------------------------------------------------
// SimMetricsBadge Component
// ---------------------------------------------------------------------------

interface SimMetricsBadgeProps {
  nodeId: string;
  /** Opens the detail tier (BaseNode passes its `selected` state). Hover opens it via CSS. */
  expanded?: boolean;
}

/**
 * Renders a static two-tier badge that updates via CSS custom properties.
 * After initial mount, this component never re-renders for value changes —
 * only when `expanded` (selection) flips, which is user-paced, not per-tick.
 */
export const SimMetricsBadge = memo(function SimMetricsBadge({
  nodeId,
  expanded = false,
}: SimMetricsBadgeProps) {
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
      className="sim-badge-container w-full"
      data-expanded={expanded ? '' : undefined}
      style={{
        // Initial values before the first bus flush
        ['--util' as string]: '0',
        ['--band-color' as string]: 'var(--state-idle)',
        ['--rps-text' as string]: '"—"',
        ['--util-text' as string]: '"—"',
        ['--lat-text' as string]: '"—"',
        ['--err-display' as string]: 'none',
        ['--q-display' as string]: 'none',
      }}
    >
      {/* ── DEFAULT tier: thin utilization bar + one number (rps) ── */}
      <div className="flex items-center gap-1.5">
        <span
          className="relative h-[3px] min-w-0 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--state-idle) 25%, transparent)' }}
        >
          <span
            className="absolute inset-0 origin-left rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{
              backgroundColor: 'var(--band-color)',
              transform: 'scaleX(var(--util))',
            }}
          />
        </span>
        <span className="sim-badge-rps sim-badge-rps-default font-mono text-[9px] leading-none tabular-nums text-[var(--muted-foreground)]" />
      </div>

      {/* ── DETAIL tier: full row, only on hover (CSS) or selection (data-expanded) ── */}
      <div className="sim-badge-detail items-center gap-1 pt-1 font-mono text-[9px] leading-none tabular-nums text-[var(--muted-foreground)]">
        <span className="sim-badge-util" />
        <span className="sim-badge-rps sim-badge-sep" />
        <span className="sim-badge-lat sim-badge-sep" />
        <span className="sim-badge-err sim-badge-sep" style={{ color: 'var(--state-warning)' }} />
        <span className="sim-badge-q sim-badge-sep" style={{ color: 'var(--state-warning)' }} />
      </div>

      {/* CSS-only content display using ::after pseudo-elements.
          The actual values arrive via CSS custom properties set by the driver. */}
      <style>{`
        .sim-badge-rps::after { content: var(--rps-text); }
        .sim-badge-util::after { content: var(--util-text); }
        .sim-badge-lat::after { content: var(--lat-text); }
        .sim-badge-err { display: var(--err-display, none); }
        .sim-badge-err::after { content: var(--err-text, ""); }
        .sim-badge-q { display: var(--q-display, none); }
        .sim-badge-q::after { content: var(--q-text, ""); }
        .sim-badge-sep::before { content: '·'; margin-right: 0.25rem; opacity: 0.6; }
        .sim-badge-detail { display: none; }
        .group:hover .sim-badge-detail,
        .sim-badge-container[data-expanded] .sim-badge-detail { display: flex; }
        .group:hover .sim-badge-rps-default,
        .sim-badge-container[data-expanded] .sim-badge-rps-default { display: none; }
      `}</style>
    </div>
  );
});

SimMetricsBadge.displayName = 'SimMetricsBadge';
