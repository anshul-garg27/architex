import { create } from "zustand";
import type { DiagramTemplate } from "@/lib/templates/types";

// ─────────────────────────────────────────────────────────────
// Template Meta Store
//
// Holds the full DiagramTemplate for the design currently loaded
// onto the canvas, so learnSteps / simulation metadata / rationale
// survive template load instead of being dropped with the JSON.
// Written by the command-bus template handler; read by the
// GuidedTourOverlay, ChaosScenarioPicker, RationalePanel, and the
// post-run report cards.
// ─────────────────────────────────────────────────────────────

interface TemplateMetaState {
  /** Template behind the current canvas, null for blank/own designs. */
  activeTemplate: DiagramTemplate | null;
  /** Guided tour visibility (requested from gallery/toolbar). */
  tourOpen: boolean;

  setActiveTemplate: (template: DiagramTemplate | null) => void;
  clearActiveTemplate: () => void;
  openTour: () => void;
  closeTour: () => void;
}

export const useTemplateMetaStore = create<TemplateMetaState>()((set) => ({
  activeTemplate: null,
  tourOpen: false,

  setActiveTemplate: (template) =>
    set({ activeTemplate: template, tourOpen: false }),
  clearActiveTemplate: () => set({ activeTemplate: null, tourOpen: false }),
  openTour: () => set({ tourOpen: true }),
  closeTour: () => set({ tourOpen: false }),
}));
