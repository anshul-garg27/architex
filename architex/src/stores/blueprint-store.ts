import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BlueprintSurface = "journey" | "toolkit" | "progress";
export type BlueprintToolkitTool = "patterns" | "problems" | "review";
export type BlueprintPreferredLang = "ts" | "py" | "java";

export type BlueprintUnitState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered";

export interface SectionCompletion {
  completed: boolean;
  attempts: number;
  score?: number;
}

export interface UnitProgressCache {
  unitSlug: string;
  state: BlueprintUnitState;
  sectionStates: Record<string, SectionCompletion>;
  lastSeenAt: number;
}

export interface BlueprintStoreState {
  // ── Surface (URL-derived; store is a cache) ────────────
  currentSurface: BlueprintSurface;

  // ── Journey ────────────────────────────────────────────
  currentUnitSlug: string | null;
  currentSectionId: string | null;
  unitProgress: Record<string, UnitProgressCache>;
  welcomeDismissed: boolean;

  // ── Toolkit ────────────────────────────────────────────
  activeTool: BlueprintToolkitTool | null;
  activeEntityId: string | null;
  toolkitSubMode: string | null;
  pinnedTool: BlueprintToolkitTool | null;

  // ── Preferences ────────────────────────────────────────
  preferredLang: BlueprintPreferredLang;
  dailyReviewTarget: number;

  // ── Actions ────────────────────────────────────────────
  setSurface: (s: BlueprintSurface) => void;
  setCurrentUnit: (slug: string | null, sectionId?: string | null) => void;
  setCurrentSection: (sectionId: string | null) => void;
  dismissWelcome: () => void;
  openTool: (
    tool: BlueprintToolkitTool,
    entityId?: string | null,
    subMode?: string | null,
  ) => void;
  closeTool: () => void;
  pinTool: (tool: BlueprintToolkitTool | null) => void;
  setPreferredLang: (lang: BlueprintPreferredLang) => void;
  setDailyReviewTarget: (n: number) => void;
  updateUnitProgress: (slug: string, cache: UnitProgressCache) => void;
  hydrate: (partial: Partial<BlueprintStoreState>) => void;
  reset: () => void;
}

type Defaults = Pick<
  BlueprintStoreState,
  | "currentSurface"
  | "currentUnitSlug"
  | "currentSectionId"
  | "unitProgress"
  | "welcomeDismissed"
  | "activeTool"
  | "activeEntityId"
  | "toolkitSubMode"
  | "pinnedTool"
  | "preferredLang"
  | "dailyReviewTarget"
>;

const DEFAULTS: Defaults = {
  currentSurface: "journey",
  currentUnitSlug: null,
  currentSectionId: null,
  unitProgress: {},
  welcomeDismissed: false,
  activeTool: null,
  activeEntityId: null,
  toolkitSubMode: null,
  pinnedTool: null,
  preferredLang: "ts",
  dailyReviewTarget: 10,
};

/**
 * Blueprint module store.
 *
 * Non-ephemeral fields (preferences, pinnedTool, welcomeDismissed,
 * unitProgress cache) are persisted to localStorage. Ephemeral
 * surface / unit / tool fields are NOT persisted because they
 * re-derive from the URL on every mount.
 */
export const useBlueprintStore = create<BlueprintStoreState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setSurface: (s) => set({ currentSurface: s }),

      setCurrentUnit: (slug, sectionId = null) =>
        set({ currentUnitSlug: slug, currentSectionId: sectionId }),

      setCurrentSection: (sectionId) =>
        set({ currentSectionId: sectionId }),

      dismissWelcome: () => set({ welcomeDismissed: true }),

      openTool: (tool, entityId = null, subMode = null) =>
        set({
          activeTool: tool,
          activeEntityId: entityId,
          toolkitSubMode: subMode,
        }),

      closeTool: () =>
        set({
          activeTool: null,
          activeEntityId: null,
          toolkitSubMode: null,
        }),

      pinTool: (tool) => set({ pinnedTool: tool }),

      setPreferredLang: (lang) => set({ preferredLang: lang }),

      setDailyReviewTarget: (n) =>
        set({ dailyReviewTarget: Math.max(1, Math.floor(n)) }),

      updateUnitProgress: (slug, cache) =>
        set((s) => ({
          unitProgress: { ...s.unitProgress, [slug]: cache },
        })),

      hydrate: (partial) => set((s) => ({ ...s, ...partial })),

      reset: () => set(DEFAULTS),
    }),
    {
      name: "blueprint-store",
      storage: createJSONStorage(() => localStorage),
      // Persist only non-ephemeral fields. Surface + active tool + current
      // unit reconstruct from URL on every mount.
      partialize: (s) => ({
        welcomeDismissed: s.welcomeDismissed,
        pinnedTool: s.pinnedTool,
        preferredLang: s.preferredLang,
        dailyReviewTarget: s.dailyReviewTarget,
        unitProgress: s.unitProgress,
      }),
    },
  ),
);
