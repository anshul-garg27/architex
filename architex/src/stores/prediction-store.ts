import { create } from "zustand";
import {
  scorePrediction,
  type PredictionRecord,
  type RunOutcome,
  type ScoredPrediction,
} from "@/lib/simulation/prediction-scoring";

// ─────────────────────────────────────────────────────────────
// Prediction Store (Predict-Run-Compare loop)
//
// Holds the user's locked pre-run prediction, the scored result
// of the last completed run, and the visibility of the
// PredictionModal that the CanvasToolbar play-button opens
// before fresh runs on real architectures (>= 3 nodes).
//
// Written by PredictionModal (setPending) and
// PredictionResultCard (scoreAgainstRun); read by both plus the
// toolbar interception.
// ─────────────────────────────────────────────────────────────

interface PredictionState {
  /** Prediction locked before the current/next run, null if skipped. */
  pending: PredictionRecord | null;
  /** Graded result of the most recent completed run with a prediction. */
  lastScored: ScoredPrediction | null;
  /** PredictionModal visibility (opened by the toolbar play intercept). */
  modalOpen: boolean;

  setPending: (record: PredictionRecord) => void;
  /**
   * Grade the pending prediction against a derived run outcome.
   * Consumes `pending` and stores the result in `lastScored`.
   * Returns null when there is no pending prediction.
   */
  scoreAgainstRun: (
    outcome: RunOutcome,
    nodeLabels?: Record<string, string>,
  ) => ScoredPrediction | null;
  /** Drop both the pending prediction and the last scored result. */
  clear: () => void;
  /** Drop only the scored result (e.g. when a fresh run starts). */
  clearScored: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const usePredictionStore = create<PredictionState>()((set, get) => ({
  pending: null,
  lastScored: null,
  modalOpen: false,

  setPending: (record) => set({ pending: record, lastScored: null }),

  scoreAgainstRun: (outcome, nodeLabels) => {
    const { pending } = get();
    if (!pending) return null;
    const scored = scorePrediction(pending, outcome, nodeLabels);
    set({ pending: null, lastScored: scored });
    return scored;
  },

  clear: () => set({ pending: null, lastScored: null }),
  clearScored: () => set({ lastScored: null }),
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}));
