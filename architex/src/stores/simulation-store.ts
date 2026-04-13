import { create } from "zustand";
import {
  SimulationOrchestrator,
  createOrchestrator,
} from "@/lib/simulation/simulation-orchestrator";

export type SimulationStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "error";

export type HeatmapMetric = "utilization" | "latency" | "errorRate";
export type TraceType = "happy" | "cache-miss" | "error";

export interface TrafficConfig {
  requestsPerSecond: number;
  pattern: "constant" | "sine-wave" | "spike" | "ramp" | "random";
  spikeMultiplier: number;
  distribution: "uniform" | "poisson" | "normal";
}

export interface SimulationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  errorRate: number;
  elapsedMs: number;
}

export interface ConsoleMessage {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface SimulationState {
  // Status
  status: SimulationStatus;

  // Timeline
  currentTick: number;
  totalTicks: number;
  playbackSpeed: number;

  // Traffic config
  trafficConfig: TrafficConfig;

  // Metrics
  metrics: SimulationMetrics;
  metricsHistory: SimulationMetrics[];

  // Active chaos events
  activeChaosEvents: string[];

  // Console messages
  consoleMessages: ConsoleMessage[];

  // Orchestrator reference (lives outside React)
  orchestratorRef: SimulationOrchestrator | null;

  // Overlay state
  heatmapEnabled: boolean;
  heatmapMetric: HeatmapMetric;
  traceActive: boolean;
  traceType: TraceType;

  // Actions
  setStatus: (status: SimulationStatus) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  setTick: (tick: number) => void;
  setTotalTicks: (ticks: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setTrafficConfig: (config: Partial<TrafficConfig>) => void;
  updateMetrics: (metrics: Partial<SimulationMetrics>) => void;
  recordMetricsSnapshot: () => void;
  addChaosEvent: (event: string) => void;
  removeChaosEvent: (event: string) => void;
  clearChaosEvents: () => void;
  addConsoleMessage: (level: 'info' | 'warn' | 'error', message: string) => void;
  clearConsoleMessages: () => void;

  // Overlay actions
  toggleHeatmap: () => void;
  setHeatmapMetric: (metric: HeatmapMetric) => void;
  startTrace: (type: TraceType) => void;
  stopTrace: () => void;
}

const initialMetrics: SimulationMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgLatencyMs: 0,
  p50LatencyMs: 0,
  p90LatencyMs: 0,
  p95LatencyMs: 0,
  p99LatencyMs: 0,
  throughputRps: 0,
  errorRate: 0,
  elapsedMs: 0,
};

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  status: "idle",
  currentTick: 0,
  totalTicks: 0,
  playbackSpeed: 1,

  trafficConfig: {
    requestsPerSecond: 100,
    pattern: "constant",
    spikeMultiplier: 10,
    distribution: "poisson",
  },

  metrics: { ...initialMetrics },
  metricsHistory: [],
  activeChaosEvents: [],
  consoleMessages: [],
  orchestratorRef: null,

  heatmapEnabled: false,
  heatmapMetric: "utilization",
  traceActive: false,
  traceType: "happy",

  setStatus: (status) => set({ status }),

  play: () => {
    const state = get();
    if (state.status === "paused" && state.orchestratorRef) {
      // Resume from paused state
      state.orchestratorRef.resume(state.playbackSpeed);
      // Status is set by orchestrator.resume()
    } else {
      // Fresh start — create a new orchestrator and kick off the run
      const orchestrator = createOrchestrator();
      set({ orchestratorRef: orchestrator });
      orchestrator.start(state.trafficConfig, state.playbackSpeed);
      // Status is set by orchestrator.start()
    }
  },

  pause: () => {
    const { orchestratorRef } = get();
    if (orchestratorRef) {
      orchestratorRef.pause();
      // Status is set by orchestrator.pause()
    } else {
      set({ status: "paused" });
    }
  },

  stop: () => {
    const { orchestratorRef } = get();
    if (orchestratorRef) {
      orchestratorRef.stop();
      // Status is set by orchestrator.stop()
    }
    set({ orchestratorRef: null, currentTick: 0 });
  },

  reset: () => {
    const { orchestratorRef } = get();
    if (orchestratorRef) {
      orchestratorRef.stop();
    }
    set({
      status: "idle",
      currentTick: 0,
      totalTicks: 0,
      metrics: { ...initialMetrics },
      metricsHistory: [],
      activeChaosEvents: [],
      consoleMessages: [],
      orchestratorRef: null,
    });
  },

  setTick: (tick) => set({ currentTick: tick }),
  setTotalTicks: (ticks) => set({ totalTicks: ticks }),

  stepForward: () => {
    const { orchestratorRef } = get();
    if (orchestratorRef) {
      orchestratorRef.step();
      // Tick + status are set by orchestrator.step()
    } else {
      set((s) => ({
        currentTick: Math.min(s.currentTick + 1, s.totalTicks),
      }));
    }
  },

  stepBackward: () =>
    set((s) => ({ currentTick: Math.max(s.currentTick - 1, 0) })),

  setPlaybackSpeed: (speed) => {
    const { orchestratorRef, status } = get(); // read FIRST
    set({ playbackSpeed: speed }); // write AFTER
    if (status === "running" && orchestratorRef) {
      orchestratorRef.setSpeed(speed);
    }
  },

  setTrafficConfig: (config) =>
    set((s) => ({ trafficConfig: { ...s.trafficConfig, ...config } })),

  updateMetrics: (metrics) =>
    set((s) => ({ metrics: { ...s.metrics, ...metrics } })),

  recordMetricsSnapshot: () =>
    set((s) => ({
      metricsHistory: [...s.metricsHistory.slice(-999), { ...s.metrics }],
    })),

  addChaosEvent: (event) =>
    set((s) => ({
      activeChaosEvents: [...s.activeChaosEvents, event],
    })),
  removeChaosEvent: (event) =>
    set((s) => ({
      activeChaosEvents: s.activeChaosEvents.filter((e) => e !== event),
    })),
  clearChaosEvents: () => set({ activeChaosEvents: [] }),
  addConsoleMessage: (level, message) =>
    set((s) => ({
      consoleMessages: [
        ...s.consoleMessages,
        { timestamp: Date.now(), level, message },
      ],
    })),
  clearConsoleMessages: () => set({ consoleMessages: [] }),

  // Overlay actions
  toggleHeatmap: () => set((s) => ({ heatmapEnabled: !s.heatmapEnabled })),
  setHeatmapMetric: (metric) => set({ heatmapMetric: metric }),
  startTrace: (type) => set({ traceActive: true, traceType: type }),
  stopTrace: () => set({ traceActive: false }),
}));
