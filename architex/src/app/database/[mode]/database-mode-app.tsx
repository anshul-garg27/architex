"use client";

import dynamic from "next/dynamic";
import { WorkspaceLayout } from "@/components/shared/workspace-layout";
import { CommandPalette } from "@/components/shared/command-palette";
import { ExportDialog } from "@/components/shared/export-dialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { KeyboardShortcutsDialog } from "@/components/shared/keyboard-shortcuts-dialog";
import { ShowYourWorkCalculator } from "@/components/shared/show-your-work-calculator";
import { SettingsPanel } from "@/components/shared/settings-panel";
import { OnboardingOverlay } from "@/components/shared/onboarding-overlay";
import { SimulationAnnouncer } from "@/components/shared/SimulationAnnouncer";
import { useUIStore } from "@/stores/ui-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import React, { useCallback, useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ModuleContent } from "@/components/modules/module-content";
import type { DatabaseMode } from "@/components/modules/DatabaseModule";

import { useModuleVisitNotifications } from "@/hooks/use-notification-triggers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import { BridgeConsumer } from "@/components/cross-module/BridgeConsumer";
import { ModuleContextBar } from "@/components/cross-module/ModuleContextBar";
import { BridgePanel } from "@/components/cross-module/BridgePanel";
import { RecommendedBridges } from "@/components/cross-module/RecommendedBridges";

// Lazy-load only the database wrapper (SSR disabled)
const DatabaseModuleContent = dynamic(
  () => import("@/components/modules/wrappers/DatabaseWrapper"),
  { ssr: false },
);

/**
 * Renders the full workspace app shell with the database module pre-selected
 * and a specific database mode active. Used by the /database/[mode] SEO routes.
 */
export function DatabaseModeApp({ mode }: { mode: DatabaseMode }) {
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  // Force the database module active on mount
  useEffect(() => {
    setActiveModule("database");
  }, [setActiveModule]);

  useKeyboardShortcuts();
  useModuleVisitNotifications();
  useDocumentTitle();

  const contentRef = React.useRef<ModuleContent>({
    sidebar: null,
    canvas: null,
    properties: null,
    bottomPanel: null,
  });
  const [, forceRender] = React.useState(0);
  const handleContent = useCallback((c: ModuleContent) => {
    contentRef.current = c;
    forceRender((n) => n + 1);
  }, []);

  const exportOpen = useUIStore((s) => s.exportDialogOpen);
  const setExportOpen = useUIStore((s) => s.setExportDialogOpen);
  const importOpen = useUIStore((s) => s.importDialogOpen);
  const setImportOpen = useUIStore((s) => s.setImportDialogOpen);
  const clearCanvasConfirmOpen = useUIStore((s) => s.clearCanvasConfirmOpen);
  const setClearCanvasConfirmOpen = useUIStore((s) => s.setClearCanvasConfirmOpen);

  const handleClearCanvasConfirm = useCallback(() => {
    useCanvasStore.getState().clearCanvas();
    setClearCanvasConfirmOpen(false);
  }, [setClearCanvasConfirmOpen]);

  const handleClearCanvasCancel = useCallback(() => {
    setClearCanvasConfirmOpen(false);
  }, [setClearCanvasConfirmOpen]);

  const { sidebar, canvas, properties, bottomPanel, mockOverlay } = contentRef.current;

  const composedSidebar = (
    <>
      {sidebar}
      <BridgePanel className="mx-2 my-3" />
    </>
  );

  const composedProperties = (
    <>
      {properties}
      <RecommendedBridges className="mx-2 my-3" />
    </>
  );

  return (
    <>
      <DatabaseModuleContent onContent={handleContent} initialMode={mode} />
      <ModuleContextBar className="fixed top-0 left-12 right-0 z-40" />
      <WorkspaceLayout
        sidebar={composedSidebar}
        canvas={canvas}
        properties={composedProperties}
        bottomPanel={bottomPanel}
      />
      <BridgeConsumer />
      <CommandPalette />
      <KeyboardShortcutsDialog />
      <ShowYourWorkCalculator />
      <SettingsPanel />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <OnboardingOverlay />
      <SimulationAnnouncer />
      <ConfirmDialog
        open={clearCanvasConfirmOpen}
        title="Clear Canvas"
        description="This will remove all nodes and edges. This action cannot be undone."
        confirmLabel="Clear"
        variant="destructive"
        onConfirm={handleClearCanvasConfirm}
        onCancel={handleClearCanvasCancel}
      />
      {mockOverlay ?? null}
    </>
  );
}
