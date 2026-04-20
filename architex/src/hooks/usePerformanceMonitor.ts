/**
 * usePerformanceMonitor — Frame Time, Tick Duration, and Render Count Monitoring
 *
 * Measures and logs performance metrics for the simulation system:
 *   - Frame time (ms per animation frame)
 *   - Tick duration (ms per simulation tick)
 *   - Render count (React renders per second)
 *   - FPS (frames per second)
 *
 * Returns a snapshot of current metrics. Samples are collected via
 * requestAnimationFrame and aggregated every second.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PerformanceMetrics {
  /** Average frame time in ms (lower = better, target: <16.67ms for 60fps). */
  avgFrameTimeMs: number;
  /** Maximum frame time in ms (spikes). */
  maxFrameTimeMs: number;
  /** Current frames per second. */
  fps: number;
  /** Average simulation tick duration in ms. */
  avgTickDurationMs: number;
  /** Maximum simulation tick duration in ms. */
  maxTickDurationMs: number;
  /** Number of React renders in the last second. */
  rendersPerSecond: number;
  /** Total renders since monitoring started. */
  totalRenders: number;
  /** Whether performance is considered healthy (FPS >= 30). */
  healthy: boolean;
}

// ---------------------------------------------------------------------------
// Module-level tick tracking (written by orchestrator, read by hook)
// ---------------------------------------------------------------------------

/** Ring buffer for tick durations (last 120 ticks = ~12 seconds at 100ms/tick). */
const TICK_BUFFER_SIZE = 120;
const tickDurations = new Float64Array(TICK_BUFFER_SIZE);
let tickWriteIndex = 0;
let tickSampleCount = 0;

/**
 * Record a simulation tick duration. Call from the orchestrator.
 *
 * @param durationMs - How long the tick took in milliseconds
 */
export function recordTickDuration(durationMs: number): void {
  tickDurations[tickWriteIndex] = durationMs;
  tickWriteIndex = (tickWriteIndex + 1) % TICK_BUFFER_SIZE;
  if (tickSampleCount < TICK_BUFFER_SIZE) tickSampleCount++;
}

/**
 * Reset tick duration tracking.
 */
export function resetTickDurations(): void {
  tickDurations.fill(0);
  tickWriteIndex = 0;
  tickSampleCount = 0;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UsePerformanceMonitorOptions {
  /** Whether monitoring is active. Default: true. */
  enabled?: boolean;
  /** How often to aggregate metrics, in ms. Default: 1000. */
  sampleIntervalMs?: number;
  /** Log metrics to console. Default: false. */
  logToConsole?: boolean;
}

const INITIAL_METRICS: PerformanceMetrics = {
  avgFrameTimeMs: 0,
  maxFrameTimeMs: 0,
  fps: 60,
  avgTickDurationMs: 0,
  maxTickDurationMs: 0,
  rendersPerSecond: 0,
  totalRenders: 0,
  healthy: true,
};

/**
 * Monitor rendering and simulation performance.
 *
 * @example
 *   const { metrics, markRender } = usePerformanceMonitor({ logToConsole: true });
 *   // Call markRender() in components to count renders
 *   console.log(metrics.fps, metrics.avgFrameTimeMs);
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {},
): { metrics: PerformanceMetrics; markRender: () => void } {
  const { enabled = true, sampleIntervalMs = 1000, logToConsole = false } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>(INITIAL_METRICS);

  // Frame time tracking
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(0);
  const rafRef = useRef(0);

  // Render counting
  const renderCountRef = useRef(0);
  const totalRendersRef = useRef(0);

  const markRender = useCallback(() => {
    renderCountRef.current++;
    totalRendersRef.current++;
  }, []);

  // Frame sampling loop
  useEffect(() => {
    if (!enabled) return;

    function sampleFrame(timestamp: number) {
      if (lastFrameTimeRef.current > 0) {
        const dt = timestamp - lastFrameTimeRef.current;
        frameTimesRef.current.push(dt);
        // Keep only the last 120 samples (2 seconds at 60fps)
        if (frameTimesRef.current.length > 120) {
          frameTimesRef.current.shift();
        }
      }
      lastFrameTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(sampleFrame);
    }

    rafRef.current = requestAnimationFrame(sampleFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // Aggregation interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const frameTimes = frameTimesRef.current;

      // Compute frame time stats
      let avgFrame = 0;
      let maxFrame = 0;
      if (frameTimes.length > 0) {
        let sum = 0;
        for (let i = 0; i < frameTimes.length; i++) {
          sum += frameTimes[i];
          if (frameTimes[i] > maxFrame) maxFrame = frameTimes[i];
        }
        avgFrame = sum / frameTimes.length;
      }

      const fps = avgFrame > 0 ? Math.round(1000 / avgFrame) : 60;

      // Compute tick duration stats
      let avgTick = 0;
      let maxTick = 0;
      if (tickSampleCount > 0) {
        let sum = 0;
        const count = Math.min(tickSampleCount, TICK_BUFFER_SIZE);
        for (let i = 0; i < count; i++) {
          sum += tickDurations[i];
          if (tickDurations[i] > maxTick) maxTick = tickDurations[i];
        }
        avgTick = sum / count;
      }

      const rendersPerSecond = Math.round(
        (renderCountRef.current / sampleIntervalMs) * 1000,
      );
      renderCountRef.current = 0;

      const newMetrics: PerformanceMetrics = {
        avgFrameTimeMs: Math.round(avgFrame * 100) / 100,
        maxFrameTimeMs: Math.round(maxFrame * 100) / 100,
        fps,
        avgTickDurationMs: Math.round(avgTick * 100) / 100,
        maxTickDurationMs: Math.round(maxTick * 100) / 100,
        rendersPerSecond,
        totalRenders: totalRendersRef.current,
        healthy: fps >= 30,
      };

      setMetrics(newMetrics);

      if (logToConsole) {
         
        console.log(
          `[Perf] FPS: ${fps} | Frame: ${newMetrics.avgFrameTimeMs}ms (max: ${newMetrics.maxFrameTimeMs}ms) | Tick: ${newMetrics.avgTickDurationMs}ms | Renders/s: ${rendersPerSecond}`,
        );
      }
    }, sampleIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, sampleIntervalMs, logToConsole]);

  return { metrics, markRender };
}
