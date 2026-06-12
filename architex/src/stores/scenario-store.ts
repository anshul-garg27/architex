import { create } from "zustand";
import type { ChaosScenario } from "@/lib/templates/types";
import type {
  PlannedInjection,
  SlaVerdict,
} from "@/lib/simulation/scenario-runner";

// ─────────────────────────────────────────────────────────────
// Scenario Store (Survive This Incident)
//
// Holds the chaos scenario armed from the ChaosScenarioPicker,
// the injection log written while the scenario-runner drives the
// run, and the post-run SLA verdict. Read by the running banner
// and the ScenarioVerdictCard in the post-simulation report.
// ─────────────────────────────────────────────────────────────

/** A planned injection that actually fired, with its sim-time. */
export interface ScenarioInjectionRecord extends PlannedInjection {
  /** Sim-time (ms from run start) at which the injection landed. */
  firedAtSimMs: number;
}

interface ScenarioState {
  /** Scenario selected pre-run; stays armed through the run + report. */
  armedScenario: ChaosScenario | null;
  /** Chaos injections fired during the current/last run. */
  injections: ScenarioInjectionRecord[];
  /** SLA verdict evaluated when the run completes; null until then. */
  verdict: SlaVerdict | null;

  arm: (scenario: ChaosScenario) => void;
  clear: () => void;
  recordInjection: (record: ScenarioInjectionRecord) => void;
  clearInjections: () => void;
  setVerdict: (verdict: SlaVerdict | null) => void;
}

export const useScenarioStore = create<ScenarioState>()((set) => ({
  armedScenario: null,
  injections: [],
  verdict: null,

  arm: (scenario) =>
    set({ armedScenario: scenario, injections: [], verdict: null }),

  clear: () => set({ armedScenario: null, injections: [], verdict: null }),

  recordInjection: (record) =>
    set((s) => ({ injections: [...s.injections, record] })),

  clearInjections: () => set({ injections: [] }),

  setVerdict: (verdict) => set({ verdict }),
}));
