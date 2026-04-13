import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the simulation-orchestrator module before importing the store so the
// real orchestrator (which may rely on browser APIs / workers) is never loaded.
vi.mock('@/lib/simulation/simulation-orchestrator', () => ({
  createOrchestrator: () => ({
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    step: vi.fn(),
    setSpeed: vi.fn(),
  }),
}));

import { useSimulationStore } from '@/stores/simulation-store';

function resetStore() {
  useSimulationStore.getState().reset();
}

describe('simulation-store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Status transitions ───────────────────────────────────

  it('starts in idle status', () => {
    expect(useSimulationStore.getState().status).toBe('idle');
  });

  it('setStatus transitions to the given status', () => {
    useSimulationStore.getState().setStatus('running');
    expect(useSimulationStore.getState().status).toBe('running');
  });

  it('pause sets status to paused when no orchestrator is present', () => {
    useSimulationStore.getState().setStatus('running');
    useSimulationStore.getState().pause();
    expect(useSimulationStore.getState().status).toBe('paused');
  });

  it('stop clears orchestratorRef and resets currentTick', () => {
    const store = useSimulationStore.getState();
    store.setStatus('running');
    store.setTick(42);

    useSimulationStore.getState().stop();

    const state = useSimulationStore.getState();
    expect(state.orchestratorRef).toBeNull();
    expect(state.currentTick).toBe(0);
  });

  it('reset restores the store to its initial state', () => {
    const store = useSimulationStore.getState();
    store.setStatus('running');
    store.setTick(100);
    store.updateMetrics({ totalRequests: 500, errorRate: 0.05 });
    store.addChaosEvent('node-kill');
    store.addConsoleMessage('error', 'boom');

    useSimulationStore.getState().reset();

    const state = useSimulationStore.getState();
    expect(state.status).toBe('idle');
    expect(state.currentTick).toBe(0);
    expect(state.metrics.totalRequests).toBe(0);
    expect(state.activeChaosEvents).toEqual([]);
    expect(state.consoleMessages).toEqual([]);
  });

  // ── Metrics update ───────────────────────────────────────

  it('updateMetrics merges partial metrics', () => {
    useSimulationStore.getState().updateMetrics({
      totalRequests: 1000,
      avgLatencyMs: 42,
    });

    const { metrics } = useSimulationStore.getState();
    expect(metrics.totalRequests).toBe(1000);
    expect(metrics.avgLatencyMs).toBe(42);
    // Other fields should remain at default (0)
    expect(metrics.successfulRequests).toBe(0);
  });

  it('recordMetricsSnapshot appends to metricsHistory', () => {
    const store = useSimulationStore.getState();
    store.updateMetrics({ totalRequests: 10 });
    store.recordMetricsSnapshot();
    store.updateMetrics({ totalRequests: 20 });
    store.recordMetricsSnapshot();

    const { metricsHistory } = useSimulationStore.getState();
    expect(metricsHistory).toHaveLength(2);
    expect(metricsHistory[0].totalRequests).toBe(10);
    expect(metricsHistory[1].totalRequests).toBe(20);
  });

  // ── Step controls ────────────────────────────────────────

  it('stepForward increments currentTick when no orchestrator', () => {
    const store = useSimulationStore.getState();
    store.setTotalTicks(10);
    store.stepForward();
    expect(useSimulationStore.getState().currentTick).toBe(1);
  });

  it('stepBackward decrements currentTick (floor at 0)', () => {
    const store = useSimulationStore.getState();
    store.setTick(3);
    store.stepBackward();
    expect(useSimulationStore.getState().currentTick).toBe(2);

    // Ensure it doesn't go below 0
    useSimulationStore.getState().setTick(0);
    useSimulationStore.getState().stepBackward();
    expect(useSimulationStore.getState().currentTick).toBe(0);
  });
});
