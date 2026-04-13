// ─────────────────────────────────────────────────────────────
// Architex — Cross-Module Bridge Store (CROSS-001)
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModuleType } from "./ui-store";
import type {
  BridgePayload,
  CrossModuleContext,
  ModuleMasteryEntry,
  ConceptProgressEntry,
} from "@/lib/cross-module/bridge-types";
import { ALL_MODULES, MODULE_LABELS } from "@/lib/cross-module/bridge-types";

// ── State shape ───────────────────────────────────────────────

interface CrossModuleState {
  /** Payload waiting to be consumed by the target module. */
  pendingBridge: BridgePayload | null;

  /** Full navigation context (source, target, breadcrumb). */
  activeContext: CrossModuleContext | null;

  /** Per-module mastery scores (persisted). */
  moduleMastery: Record<string, ModuleMasteryEntry>;

  /** Per-concept completion tracking (persisted). */
  conceptProgress: Record<string, ConceptProgressEntry>;

  // ── Actions ─────────────────────────────────────────────────

  /** Set a bridge payload and navigation context. */
  setBridge: (payload: BridgePayload, source: ModuleType, target: ModuleType) => void;

  /** Clear the pending bridge after consumption. */
  clearBridge: () => void;

  /** Update theory or practice mastery for a module. Clamps to [0, 100]. */
  updateModuleMastery: (
    module: string,
    dimension: "theory" | "practice",
    delta: number,
  ) => void;

  /** Mark a concept as completed in a specific module. */
  markConceptComplete: (conceptId: string, module: ModuleType) => void;

  /** Get all 13 modules as radar-chart-ready data. */
  getMasteryForRadar: () => { module: string; label: string; theory: number; practice: number }[];
}

// ── Default mastery entries for all 13 modules ────────────────

function createDefaultMastery(): Record<string, ModuleMasteryEntry> {
  const m: Record<string, ModuleMasteryEntry> = {};
  for (const mod of ALL_MODULES) {
    m[mod] = { theory: 0, practice: 0, lastUpdated: new Date().toISOString() };
  }
  return m;
}

// ── Store ─────────────────────────────────────────────────────

export const useCrossModuleStore = create<CrossModuleState>()(
  persist(
    (set, get) => ({
      pendingBridge: null,
      activeContext: null,
      moduleMastery: createDefaultMastery(),
      conceptProgress: {},

      setBridge: (payload, source, target) => {
        const prev = get().activeContext;
        const breadcrumb = prev?.breadcrumb ?? [];
        set({
          pendingBridge: payload,
          activeContext: {
            sourceModule: source,
            targetModule: target,
            payload,
            timestamp: new Date().toISOString(),
            breadcrumb: [
              ...breadcrumb,
              { module: source, label: MODULE_LABELS[source] },
            ],
          },
        });
      },

      clearBridge: () =>
        set({ pendingBridge: null }),

      updateModuleMastery: (module, dimension, delta) =>
        set((state) => {
          const current = state.moduleMastery[module] ?? {
            theory: 0,
            practice: 0,
            lastUpdated: new Date().toISOString(),
          };
          const newValue = Math.max(0, Math.min(100, current[dimension] + delta));
          return {
            moduleMastery: {
              ...state.moduleMastery,
              [module]: {
                ...current,
                [dimension]: newValue,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      markConceptComplete: (conceptId, module) =>
        set((state) => ({
          conceptProgress: {
            ...state.conceptProgress,
            [conceptId]: {
              completed: true,
              module,
              completedAt: new Date().toISOString(),
            },
          },
        })),

      getMasteryForRadar: () => {
        const mastery = get().moduleMastery;
        return ALL_MODULES.map((mod) => {
          const entry = mastery[mod];
          return {
            module: mod,
            label: MODULE_LABELS[mod],
            theory: entry?.theory ?? 0,
            practice: entry?.practice ?? 0,
          };
        });
      },
    }),
    {
      name: "architex-cross-module",
      partialize: (state) => ({
        moduleMastery: state.moduleMastery,
        conceptProgress: state.conceptProgress,
      }),
    },
  ),
);
