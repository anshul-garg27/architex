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
import TemplateGallery from "@/components/shared/template-gallery";
import PlaybookGallery from "@/components/shared/playbook-gallery";
import { useUIStore } from "@/stores/ui-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { DiagramTemplate } from "@/lib/templates";
import type { ArchitecturePlaybook } from "@/lib/patterns/playbook";
import type { ModuleType } from "@/stores/ui-store";
import type { ModuleContent } from "@/components/modules/module-content";

// Notification triggers
import { useModuleVisitNotifications } from "@/hooks/use-notification-triggers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Cross-module bridge system (CROSS-010)
import { BridgeConsumer } from "@/components/cross-module/BridgeConsumer";
import { ModuleContextBar } from "@/components/cross-module/ModuleContextBar";
import { BridgePanel } from "@/components/cross-module/BridgePanel";
import { RecommendedBridges } from "@/components/cross-module/RecommendedBridges";
import { NextModuleNudge } from "@/components/shared/NextModuleNudge";

// ── Lazy-loaded module wrapper components (SSR disabled) ────
const SystemDesignModuleContent = dynamic(
  () => import("@/components/modules/wrappers/SystemDesignWrapper"),
  { ssr: false },
);
const AlgorithmModuleContent = dynamic(
  () => import("@/components/modules/wrappers/AlgorithmWrapper"),
  { ssr: false },
);
const DataStructuresModuleContent = dynamic(
  () => import("@/components/modules/wrappers/DataStructuresWrapper"),
  { ssr: false },
);
const DistributedModuleContent = dynamic(
  () => import("@/components/modules/wrappers/DistributedWrapper"),
  { ssr: false },
);
const NetworkingModuleContent = dynamic(
  () => import("@/components/modules/wrappers/NetworkingWrapper"),
  { ssr: false },
);
const OSModuleContent = dynamic(
  () => import("@/components/modules/wrappers/OSWrapper"),
  { ssr: false },
);
const ConcurrencyModuleContent = dynamic(
  () => import("@/components/modules/wrappers/ConcurrencyWrapper"),
  { ssr: false },
);
const InterviewModuleContent = dynamic(
  () => import("@/components/modules/wrappers/InterviewWrapper"),
  { ssr: false },
);
const SecurityModuleContent = dynamic(
  () => import("@/components/modules/wrappers/SecurityWrapper"),
  { ssr: false },
);
const MLDesignModuleContent = dynamic(
  () => import("@/components/modules/wrappers/MLDesignWrapper"),
  { ssr: false },
);
const DatabaseModuleContent = dynamic(
  () => import("@/components/modules/wrappers/DatabaseWrapper"),
  { ssr: false },
);
const LLDModuleContent = dynamic(
  () => import("@/components/modules/wrappers/LLDWrapper"),
  { ssr: false },
);
const KnowledgeGraphModuleContent = dynamic(
  () => import("@/components/modules/wrappers/KnowledgeGraphWrapper"),
  { ssr: false },
);
const PlaceholderModuleContent = dynamic(
  () => import("@/components/modules/wrappers/PlaceholderWrapper"),
  { ssr: false },
);

// Map from module type to its wrapper component
const MODULE_COMPONENTS: Record<
  string,
  React.ComponentType<{ onContent: (c: ModuleContent) => void; activeModule?: ModuleType }>
> = {
  "system-design": SystemDesignModuleContent,
  "algorithms": AlgorithmModuleContent,
  "data-structures": DataStructuresModuleContent,
  "distributed": DistributedModuleContent,
  "networking": NetworkingModuleContent,
  "os": OSModuleContent,
  "concurrency": ConcurrencyModuleContent,
  "interview": InterviewModuleContent,
  "security": SecurityModuleContent,
  "ml-design": MLDesignModuleContent,
  "database": DatabaseModuleContent,
  "lld": LLDModuleContent,
  "knowledge-graph": KnowledgeGraphModuleContent,
};

// ── Template Gallery Overlay ────────────────────────────────

function TemplateGalleryOverlay() {
  const open = useUIStore((s) => s.templateGalleryOpen);
  const setOpen = useUIStore((s) => s.setTemplateGalleryOpen);

  const handleSelect = useCallback(
    (template: DiagramTemplate) => {
      useCanvasStore.getState().setNodes(template.nodes as never[]);
      useCanvasStore.getState().setEdges(template.edges as never[]);
      setOpen(false);
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true" aria-label="Template Gallery">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Content */}
      <div className="relative z-10 mx-auto mt-12 flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-popover p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Template Gallery</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <TemplateGallery onSelectTemplate={handleSelect} />
        </div>
      </div>
    </div>
  );
}

// ── Playbook Gallery Overlay ───────────────────────────────

function PlaybookGalleryOverlay() {
  const open = useUIStore((s) => s.playbookGalleryOpen);
  const setOpen = useUIStore((s) => s.setPlaybookGalleryOpen);

  const handleLoad = useCallback(
    (playbook: ArchitecturePlaybook) => {
      useCanvasStore.getState().setNodes(playbook.nodes);
      useCanvasStore.getState().setEdges(playbook.edges);
      setOpen(false);
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true" aria-label="Architecture Playbook Library">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Content */}
      <div className="relative z-10 mx-auto mt-12 flex h-[calc(100vh-6rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-popover p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Architecture Playbook Library</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <PlaybookGallery onLoadPlaybook={handleLoad} />
        </div>
      </div>
    </div>
  );
}

// ── App Shell ───────────────────────────────────────────────

function AppShell() {
  useKeyboardShortcuts();
  useModuleVisitNotifications();
  useDocumentTitle();
  const activeModule = useUIStore((s) => s.activeModule);
  const recentModules = useUIStore((s) => s.recentModules);

  // Keep a per-module content ref so each mounted module can independently
  // report its layout content. Only the active module's content is forwarded
  // to WorkspaceLayout.
  const contentMapRef = useRef<Record<string, ModuleContent>>({});
  const [, forceRender] = useState(0);

  // Stable per-module callbacks — memoised so wrapper components don't
  // re-render when a sibling module updates.
  const handleContentCallbacks = useRef<Record<string, (c: ModuleContent) => void>>({});
  const getContentCallback = useCallback(
    (moduleId: string) => {
      if (!handleContentCallbacks.current[moduleId]) {
        handleContentCallbacks.current[moduleId] = (c: ModuleContent) => {
          contentMapRef.current[moduleId] = c;
          // Only trigger a re-render when the active module's content changes
          if (useUIStore.getState().activeModule === moduleId) {
            forceRender((n) => n + 1);
          }
        };
      }
      return handleContentCallbacks.current[moduleId];
    },
    [],
  );

  // Force re-render when active module changes so we pick up the right content
  useEffect(() => {
    forceRender((n) => n + 1);
  }, [activeModule]);

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

  // Read layout content from the active module
  const activeContent = contentMapRef.current[activeModule] ?? {
    sidebar: null,
    canvas: null,
    properties: null,
    bottomPanel: null,
  };
  const { sidebar, canvas, properties, bottomPanel, mockOverlay, confirmDialog, breadcrumb } = activeContent;

  // Compose sidebar with BridgePanel and NextModuleNudge appended
  const composedSidebar = (
    <>
      {sidebar}
      <BridgePanel className="mx-2 my-3" />
      <NextModuleNudge className="my-3" />
    </>
  );

  // Compose properties panel with RecommendedBridges appended
  const composedProperties = (
    <>
      {properties}
      <RecommendedBridges className="mx-2 my-3" />
    </>
  );

  // Render up to 3 recent modules simultaneously. The active one is visible;
  // the rest stay mounted but hidden (display:none) to preserve their state.
  const mountedModules = useMemo(() => {
    // Ensure activeModule is always in the list
    const modules = recentModules.includes(activeModule)
      ? recentModules
      : [activeModule, ...recentModules.slice(0, 2)];
    return modules.slice(0, 3);
  }, [recentModules, activeModule]);

  return (
    <>
      {mountedModules.map((moduleId) => {
        const Component = MODULE_COMPONENTS[moduleId];
        const isActive = moduleId === activeModule;
        return (
          <div
            key={moduleId}
            style={isActive ? undefined : { display: "none" }}
            aria-hidden={!isActive}
          >
            {Component ? (
              <Component onContent={getContentCallback(moduleId)} activeModule={moduleId} />
            ) : (
              <PlaceholderModuleContent activeModule={moduleId} onContent={getContentCallback(moduleId)} />
            )}
          </div>
        );
      })}
      <ModuleContextBar className="fixed top-0 left-12 right-0 z-40" />
      <WorkspaceLayout
        sidebar={composedSidebar}
        canvas={canvas}
        properties={composedProperties}
        bottomPanel={bottomPanel}
        breadcrumb={breadcrumb}
      />
      <BridgeConsumer />
      <CommandPalette />
      <KeyboardShortcutsDialog />
      <ShowYourWorkCalculator />
      <SettingsPanel />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <TemplateGalleryOverlay />
      <PlaybookGalleryOverlay />
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
      {confirmDialog ?? null}
    </>
  );
}

export default function HomePage() {
  return <AppShell />;
}
