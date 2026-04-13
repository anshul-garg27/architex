"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useSimulationStore } from "@/stores/simulation-store";
import type { ModuleType } from "@/stores/ui-store";

const MODULE_SHORTCUTS: Record<string, ModuleType> = {
  "1": "system-design",
  "2": "algorithms",
  "3": "data-structures",
  "4": "lld",
  "5": "database",
  "6": "distributed",
  "7": "networking",
  "8": "os",
  "9": "concurrency",
};

export function useKeyboardShortcuts() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const togglePropertiesPanel = useUIStore((s) => s.togglePropertiesPanel);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setExportDialogOpen = useUIStore((s) => s.setExportDialogOpen);
  const setImportDialogOpen = useUIStore((s) => s.setImportDialogOpen);
  const setTemplateGalleryOpen = useUIStore((s) => s.setTemplateGalleryOpen);
  const setShortcutsDialogOpen = useUIStore((s) => s.setShortcutsDialogOpen);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const simStatus = useSimulationStore((s) => s.status);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);

  // Warn about unsaved changes on page unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const nodes = useCanvasStore.getState().nodes;
      if (nodes.length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+K — Command palette
      if (meta && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Cmd+B — Toggle sidebar
      if (meta && !e.shiftKey && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd+Shift+B — Toggle properties panel
      if (meta && e.shiftKey && e.key === "B") {
        e.preventDefault();
        togglePropertiesPanel();
        return;
      }

      // Cmd+I — Import dialog
      if (meta && !e.shiftKey && e.key === "i") {
        e.preventDefault();
        setImportDialogOpen(true);
        return;
      }

      // Cmd+E — Export dialog
      if (meta && e.key === "e") {
        e.preventDefault();
        setExportDialogOpen(true);
        return;
      }

      // Cmd+T — Template gallery
      if (meta && e.key === "t") {
        e.preventDefault();
        setTemplateGalleryOpen(true);
        return;
      }

      // Cmd+J — Toggle bottom panel
      if (meta && e.key === "j") {
        e.preventDefault();
        toggleBottomPanel();
        return;
      }

      // Cmd+Z — Undo
      if (meta && !e.shiftKey && e.key === "z") {
        useCanvasStore.getState().undo();
        return;
      }

      // Cmd+Shift+Z — Redo
      if (meta && e.shiftKey && e.key === "z") {
        useCanvasStore.getState().redo();
        return;
      }

      // Cmd+1-9 — Module switching
      if (meta && MODULE_SHORTCUTS[e.key]) {
        e.preventDefault();
        setActiveModule(MODULE_SHORTCUTS[e.key]);
        return;
      }

      // Space — Play/pause simulation (only when canvas focused)
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        if (simStatus === "running") pause();
        else if (simStatus === "idle" || simStatus === "paused") play();
        return;
      }

      // Cmd+A — Select all nodes
      if (meta && e.key === "a" && e.target === document.body) {
        e.preventDefault();
        const { nodes, setSelectedNodeIds } = useCanvasStore.getState();
        setSelectedNodeIds(nodes.map((n) => n.id));
        return;
      }

      // Backspace / Delete — Remove selected nodes and edges
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        !meta &&
        e.target === document.body
      ) {
        e.preventDefault();
        const { selectedNodeIds, selectedEdgeIds, removeNodes, removeEdges } =
          useCanvasStore.getState();
        if (selectedNodeIds.length > 0) {
          removeNodes(selectedNodeIds);
        }
        if (selectedEdgeIds.length > 0) {
          removeEdges(selectedEdgeIds);
        }
        return;
      }

      // Cmd+Shift+C — Capacity Calculator
      if (meta && e.shiftKey && e.key === "C") {
        e.preventDefault();
        const store = useUIStore.getState();
        store.setCapacityCalculatorOpen(!store.capacityCalculatorOpen);
        return;
      }

      // Cmd+Shift+E — Estimation Scratch Pad
      if (meta && e.shiftKey && e.key === "E") {
        e.preventDefault();
        const store = useUIStore.getState();
        store.setEstimationPadOpen(!store.estimationPadOpen);
        return;
      }

      // ? — Show keyboard shortcuts
      if (e.key === "?" && !meta && e.target === document.body) {
        e.preventDefault();
        setShortcutsDialogOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleSidebar,
    toggleBottomPanel,
    togglePropertiesPanel,
    setCommandPaletteOpen,
    setExportDialogOpen,
    setImportDialogOpen,
    setTemplateGalleryOpen,
    setShortcutsDialogOpen,
    setActiveModule,
    simStatus,
    play,
    pause,
  ]);
}
