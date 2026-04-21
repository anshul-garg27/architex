import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModuleType =
  | "system-design"
  | "algorithms"
  | "data-structures"
  | "lld"
  | "blueprint"
  | "database"
  | "distributed"
  | "networking"
  | "os"
  | "concurrency"
  | "security"
  | "ml-design"
  | "interview"
  | "knowledge-graph";

export type Theme = "dark" | "light" | "system";

export type AnimationSpeed = "slow" | "normal" | "fast";

export type LLDMode = "learn" | "build" | "drill" | "review";

export interface RecentlyStudiedEntry {
  module: ModuleType;
  topic: string;
  timestamp: number;
}


interface UIState {
  // Active module
  activeModule: ModuleType;

  // Recent modules — last 3 visited, used to keep components mounted
  recentModules: ModuleType[];

  // Panel visibility
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  bottomPanelOpen: boolean;

  // Bottom panel active tab
  bottomPanelTab: "code" | "timeline" | "metrics" | "console" | "chaos" | "capacity" | "cost" | "sla" | "latency" | "report";

  // Theme
  theme: Theme;

  // Command palette
  commandPaletteOpen: boolean;

  // Export & Template Gallery & Playbook Gallery
  exportDialogOpen: boolean;
  templateGalleryOpen: boolean;
  playbookGalleryOpen: boolean;

  // Import Dialog
  importDialogOpen: boolean;

  // Keyboard Shortcuts Dialog
  shortcutsDialogOpen: boolean;

  // Capacity Calculator
  capacityCalculatorOpen: boolean;

  // Estimation Pad (interview mode)
  estimationPadOpen: boolean;

  // Settings Panel
  settingsPanelOpen: boolean;

  // Version History Panel
  versionHistoryPanelOpen: boolean;

  // Evolution timeline
  timelineVisible: boolean;

  // Minimap visibility
  minimapVisible: boolean;

  // Clear Canvas confirmation
  clearCanvasConfirmOpen: boolean;

  // Animation speed preference
  animationSpeed: AnimationSpeed;

  // Onboarding
  onboardingActive: boolean;
  onboardingStep: number;

  // Recently studied topics (last 10)
  recentlyStudied: RecentlyStudiedEntry[];

  // LLD 4-mode shell (Phase 1)
  lldMode: LLDMode | null; // null = first visit
  lldWelcomeBannerDismissed: boolean;

  // Actions
  addRecentlyStudied: (module: ModuleType, topic: string) => void;
  setActiveModule: (module: ModuleType) => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  toggleBottomPanel: () => void;
  setBottomPanelTab: (tab: UIState["bottomPanelTab"]) => void;
  setTheme: (theme: Theme) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setTemplateGalleryOpen: (open: boolean) => void;
  setPlaybookGalleryOpen: (open: boolean) => void;
  setShortcutsDialogOpen: (open: boolean) => void;
  setCapacityCalculatorOpen: (open: boolean) => void;
  setEstimationPadOpen: (open: boolean) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setClearCanvasConfirmOpen: (open: boolean) => void;
  setVersionHistoryPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setOnboardingActive: (active: boolean) => void;
  setOnboardingStep: (step: number) => void;
  toggleTimeline: () => void;
  toggleMinimap: () => void;
  setLLDMode: (mode: LLDMode) => void;
  dismissLLDWelcomeBanner: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeModule: "system-design",
      recentModules: ["system-design"],
      sidebarOpen: true,
      propertiesPanelOpen: true,
      bottomPanelOpen: false,
      bottomPanelTab: "metrics",
      theme: "dark",
      commandPaletteOpen: false,
      exportDialogOpen: false,
      importDialogOpen: false,
      templateGalleryOpen: false,
      playbookGalleryOpen: false,
      shortcutsDialogOpen: false,
      capacityCalculatorOpen: false,
      estimationPadOpen: false,
      settingsPanelOpen: false,
      clearCanvasConfirmOpen: false,
      versionHistoryPanelOpen: false,
      timelineVisible: false,
      minimapVisible: true,
      animationSpeed: "normal",
      recentlyStudied: [],
      onboardingActive:
        typeof window !== "undefined" &&
        !localStorage.getItem("architex_onboarding_completed"),
      onboardingStep: 0,
      lldMode: null,
      lldWelcomeBannerDismissed: false,

      addRecentlyStudied: (module, topic) =>
        set((s) => {
          const filtered = s.recentlyStudied.filter(
            (e) => !(e.module === module && e.topic === topic),
          );
          const entry: RecentlyStudiedEntry = { module, topic, timestamp: Date.now() };
          return { recentlyStudied: [entry, ...filtered].slice(0, 10) };
        }),
      setActiveModule: (module) =>
        set((s) => {
          // Build the recent modules list: active module at front, max 3 entries
          const filtered = s.recentModules.filter((m) => m !== module);
          const recentModules = [module, ...filtered].slice(0, 3) as ModuleType[];
          return { activeModule: module, recentModules, sidebarOpen: true };
        }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      togglePropertiesPanel: () =>
        set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),
      toggleBottomPanel: () =>
        set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
      setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
      setTheme: (theme) => set({ theme }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
      setImportDialogOpen: (open) => set({ importDialogOpen: open }),
      setTemplateGalleryOpen: (open) => set({ templateGalleryOpen: open }),
      setPlaybookGalleryOpen: (open) => set({ playbookGalleryOpen: open }),
      setShortcutsDialogOpen: (open) => set({ shortcutsDialogOpen: open }),
      setCapacityCalculatorOpen: (open) => set({ capacityCalculatorOpen: open }),
      setEstimationPadOpen: (open) => set({ estimationPadOpen: open }),
      setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
      setClearCanvasConfirmOpen: (open) => set({ clearCanvasConfirmOpen: open }),
      setVersionHistoryPanelOpen: (open) => set({ versionHistoryPanelOpen: open }),
      setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      setOnboardingActive: (active) => set({ onboardingActive: active }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      toggleTimeline: () => set((s) => ({ timelineVisible: !s.timelineVisible })),
      toggleMinimap: () => set((s) => ({ minimapVisible: !s.minimapVisible })),
      setLLDMode: (mode) => set({ lldMode: mode }),
      dismissLLDWelcomeBanner: () => set({ lldWelcomeBannerDismissed: true }),
    }),
    {
      name: "architex-ui",
      partialize: (state) => ({
        activeModule: state.activeModule,
        recentModules: state.recentModules,
        recentlyStudied: state.recentlyStudied,
        sidebarOpen: state.sidebarOpen,
        propertiesPanelOpen: state.propertiesPanelOpen,
        bottomPanelOpen: state.bottomPanelOpen,
        bottomPanelTab: state.bottomPanelTab,
        theme: state.theme,
        animationSpeed: state.animationSpeed,
        timelineVisible: state.timelineVisible,
        minimapVisible: state.minimapVisible,
        lldMode: state.lldMode,
        lldWelcomeBannerDismissed: state.lldWelcomeBannerDismissed,
      }),
    },
  ),
);
