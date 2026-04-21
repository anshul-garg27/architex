"use client";

import { memo, useState, type ReactNode } from "react";
import { PatternLibraryDock } from "@/components/modules/lld/build-mode/PatternLibraryDock";
import { BuildActionsRail } from "@/components/modules/lld/build-mode/BuildActionsRail";
import { AnnotationLayer } from "@/components/modules/lld/build-mode/AnnotationLayer";
import { AnnotationToolbar } from "@/components/modules/lld/build-mode/AnnotationToolbar";
import { TemplateLoaderDialog } from "@/components/modules/lld/build-mode/TemplateLoaderDialog";
import { AISuggestionsCard } from "@/components/modules/lld/build-mode/AISuggestionsCard";
import { useBuildKeyboardShortcuts } from "@/hooks/useBuildKeyboardShortcuts";
import { useCanvasStore } from "@/stores/canvas-store";

interface Props {
  children: ReactNode; // existing canvas content from useLLDModuleImpl
}

/**
 * Build mode · wraps today's 4-panel UI plus the Phase 3 dock + rail.
 *
 * Layout:
 *   +----------+------------------------------------+
 *   | Dock     |  AnnotationToolbar | ActionsRail   |
 *   | (L)      +------------------------------------+
 *   |          |                                    |
 *   |          |  children (canvas)                 |
 *   |          |  (overlaid: AnnotationLayer)       |
 *   |          |                                    |
 *   +----------+------------------------------------+
 */
export const BuildModeLayout = memo(function BuildModeLayout({
  children,
}: Props) {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const push = useCanvasStore((s) => s.pushNamedSnapshot);

  useBuildKeyboardShortcuts({
    enabled: true,
    onOpenTemplates: () => setTemplatesOpen(true),
    onOpenAI: () => setAiOpen((v) => !v),
    onCaptureSnapshot: () =>
      push(`Snap ${new Date().toLocaleTimeString()}`, null),
    onExportPNG: () => {
      // Forward to global event the BuildExportMenu can listen for later
      window.dispatchEvent(new CustomEvent("lld:export-png"));
    },
    onNewNode: () => {
      window.dispatchEvent(new CustomEvent("lld:new-node"));
    },
  });

  return (
    <div className="flex h-full w-full">
      <PatternLibraryDock />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/20 px-3 py-1.5">
          <AnnotationToolbar />
          <BuildActionsRail />
        </div>

        <div className="relative flex-1 min-h-0">
          {children}
          <AnnotationLayer />
        </div>
      </div>

      {/* Keyboard-triggered surfaces; BuildActionsRail also renders its own
          copies but when the shortcut is used before the button, this
          instance opens the dialog. */}
      <TemplateLoaderDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
      {aiOpen && <AISuggestionsCard onDismiss={() => setAiOpen(false)} />}
    </div>
  );
});
