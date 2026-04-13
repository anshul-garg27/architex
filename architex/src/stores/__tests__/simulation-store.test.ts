import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSimulationStore } from '../simulation-store';

// Mock the simulation-orchestrator module so play/pause/stop don't hit real
// canvas state or timers.
vi.mock('@/lib/simulation/simulation-orchestrator', () => ({
  createOrchestrator: () => ({
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    step: vi.fn(),
    setSpeed: vi.fn(),
  }),
  SimulationOrchestrator: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('simulation-store', () => {
  beforeEach(() => {
    // Reset to initial state via the reset action
    useSimulationStore.getState().reset();
  });

  // ── Initial state ──────────────────────────────────────────────────────

  it('initial status is idle', () => {
    expect(useSimulationStore.getState().status).toBe('idle');
  });

  it('initial currentTick is 0', () => {
    expect(useSimulationStore.getState().currentTick).toBe(0);
  });

  it('initial playbackSpeed is 1', () => {
    expect(useSimulationStore.getState().playbackSpeed).toBe(1);
  });

  it('initial metrics are all zeroed', () => {
    const { metrics } = useSimulationStore.getState();
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.avgLatencyMs).toBe(0);
    expect(metrics.errorRate).toBe(0);
  });

  // ── setStatus ──────────────────────────────────────────────────────────

  it('setStatus transitions to provided status', () => {
    useSimulationStore.getState().setStatus('running');
    expect(useSimulationStore.getState().status).toBe('running');

    useSimulationStore.getState().setStatus('error');
    expect(useSimulationStore.getState().status).toBe('error');
  });

  // ── pause (without orchestrator) ───────────────────────────────────────

  it('pause() sets status to paused when no orchestrator exists', () => {
    useSimulationStore.getState().pause();
    expect(useSimulationStore.getState().status).toBe('paused');
  });

  // ── stop ───────────────────────────────────────────────────────────────

  it('stop() resets currentTick to 0 and clears orchestratorRef', () => {
    useSimulationStore.getState().setTick(42);
    useSimulationStore.getState().stop();

    const s = useSimulationStore.getState();
    expect(s.currentTick).toBe(0);
    expect(s.orchestratorRef).toBeNull();
  });

  // ── Playback speed ─────────────────────────────────────────────────────

  it('setPlaybackSpeed updates the speed multiplier', () => {
    useSimulationStore.getState().setPlaybackSpeed(2);
    expect(useSimulationStore.getState().playbackSpeed).toBe(2);
  });

  it('setPlaybackSpeed works with fractional values', () => {
    useSimulationStore.getState().setPlaybackSpeed(0.5);
    expect(useSimulationStore.getState().playbackSpeed).toBe(0.5);
  });

  // ── Tick manipulation ──────────────────────────────────────────────────

  it('setTick updates the current tick', () => {
    useSimulationStore.getState().setTick(50);
    expect(useSimulationStore.getState().currentTick).toBe(50);
  });

  it('stepBackward decrements tick but never below 0', () => {
    useSimulationStore.getState().setTick(2);
    useSimulationStore.getState().stepBackward();
    expect(useSimulationStore.getState().currentTick).toBe(1);

    useSimulationStore.getState().stepBackward();
    useSimulationStore.getState().stepBackward();
    expect(useSimulationStore.getState().currentTick).toBe(0);
  });

  it('stepForward without orchestrator clamps to totalTicks', () => {
    useSimulationStore.getState().setTotalTicks(5);
    useSimulationStore.getState().setTick(4);
    useSimulationStore.getState().stepForward();
    expect(useSimulationStore.getState().currentTick).toBe(5);

    // Should not exceed totalTicks
    useSimulationStore.getState().stepForward();
    expect(useSimulationStore.getState().currentTick).toBe(5);
  });

  // ── Metrics accumulation ───────────────────────────────────────────────

  it('updateMetrics merges partial metrics', () => {
    useSimulationStore
      .getState()
      .updateMetrics({ totalRequests: 100, successfulRequests: 95 });

    const { metrics } = useSimulationStore.getState();
    expect(metrics.totalRequests).toBe(100);
    expect(metrics.successfulRequests).toBe(95);
    // Other fields remain at defaults
    expect(metrics.avgLatencyMs).toBe(0);
  });

  it('recordMetricsSnapshot pushes current metrics into history', () => {
    useSimulationStore
      .getState()
      .updateMetrics({ totalRequests: 10, avgLatencyMs: 42 });
    useSimulationStore.getState().recordMetricsSnapshot();

    const history = useSimulationStore.getState().metricsHistory;
    expect(history).toHaveLength(1);
    expect(history[0].totalRequests).toBe(10);
    expect(history[0].avgLatencyMs).toBe(42);
  });

  // ── Traffic config ─────────────────────────────────────────────────────

  it('setTrafficConfig merges partial config', () => {
    useSimulationStore
      .getState()
      .setTrafficConfig({ requestsPerSecond: 500, pattern: 'ramp' });

    const tc = useSimulationStore.getState().trafficConfig;
    expect(tc.requestsPerSecond).toBe(500);
    expect(tc.pattern).toBe('ramp');
    // Untouched fields remain at defaults
    expect(tc.spikeMultiplier).toBe(10);
  });

  // ── Chaos events ───────────────────────────────────────────────────────

  it('addChaosEvent/removeChaosEvent manages the active list', () => {
    useSimulationStore.getState().addChaosEvent('ev-1');
    useSimulationStore.getState().addChaosEvent('ev-2');
    expect(useSimulationStore.getState().activeChaosEvents).toEqual([
      'ev-1',
      'ev-2',
    ]);

    useSimulationStore.getState().removeChaosEvent('ev-1');
    expect(useSimulationStore.getState().activeChaosEvents).toEqual(['ev-2']);
  });

  it('clearChaosEvents empties the list', () => {
    useSimulationStore.getState().addChaosEvent('ev-1');
    useSimulationStore.getState().clearChaosEvents();
    expect(useSimulationStore.getState().activeChaosEvents).toHaveLength(0);
  });

  // ── Console messages ───────────────────────────────────────────────────

  it('addConsoleMessage appends a timestamped entry', () => {
    useSimulationStore.getState().addConsoleMessage('info', 'hello');

    const msgs = useSimulationStore.getState().consoleMessages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].level).toBe('info');
    expect(msgs[0].message).toBe('hello');
    expect(typeof msgs[0].timestamp).toBe('number');
  });

  it('clearConsoleMessages empties the list', () => {
    useSimulationStore.getState().addConsoleMessage('warn', 'oops');
    useSimulationStore.getState().clearConsoleMessages();
    expect(useSimulationStore.getState().consoleMessages).toHaveLength(0);
  });

  // ── Overlay state ──────────────────────────────────────────────────────

  it('toggleHeatmap flips heatmapEnabled', () => {
    expect(useSimulationStore.getState().heatmapEnabled).toBe(false);
    useSimulationStore.getState().toggleHeatmap();
    expect(useSimulationStore.getState().heatmapEnabled).toBe(true);
    useSimulationStore.getState().toggleHeatmap();
    expect(useSimulationStore.getState().heatmapEnabled).toBe(false);
  });

  it('setHeatmapMetric updates the metric type', () => {
    useSimulationStore.getState().setHeatmapMetric('latency');
    expect(useSimulationStore.getState().heatmapMetric).toBe('latency');
  });

  it('startTrace / stopTrace manages tracing state', () => {
    useSimulationStore.getState().startTrace('error');
    expect(useSimulationStore.getState().traceActive).toBe(true);
    expect(useSimulationStore.getState().traceType).toBe('error');

    useSimulationStore.getState().stopTrace();
    expect(useSimulationStore.getState().traceActive).toBe(false);
  });

  // ── reset ──────────────────────────────────────────────────────────────

  it('reset() returns all state to initial values', () => {
    // Dirty the state
    useSimulationStore.getState().setStatus('running');
    useSimulationStore.getState().setTick(100);
    useSimulationStore.getState().updateMetrics({ totalRequests: 999 });
    useSimulationStore.getState().addChaosEvent('x');
    useSimulationStore.getState().addConsoleMessage('error', 'bad');

    useSimulationStore.getState().reset();

    const s = useSimulationStore.getState();
    expect(s.status).toBe('idle');
    expect(s.currentTick).toBe(0);
    expect(s.metrics.totalRequests).toBe(0);
    expect(s.activeChaosEvents).toHaveLength(0);
    expect(s.consoleMessages).toHaveLength(0);
    expect(s.orchestratorRef).toBeNull();
  });
});
