"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useAutoLayout } from "@/hooks/useAutoLayout";

export interface BuildShortcutOptions {
  enabled: boolean;
  onNewNode?: () => void;
  onOpenTemplates?: () => void;
  onOpenAI?: () => void;
  onCaptureSnapshot?: () => void;
  onExportPNG?: () => void;
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts for Build mode.
 *
 *  Cmd+N         New node (delegates to onNewNode)
 *  Cmd+Shift+T   Open templates
 *  Cmd+Shift+A   Open AI suggestions
 *  Cmd+Shift+L   Auto-layout left-right
 *  Cmd+Shift+Y   Auto-layout layered
 *  Cmd+Shift+O   Auto-layout circular
 *  Cmd+Shift+S   Capture named snapshot
 *  Cmd+Shift+P   Export PNG
 *  Cmd+Z / Cmd+Shift+Z   Undo / Redo
 */
export function useBuildKeyboardShortcuts(opts: BuildShortcutOptions): void {
  const applyLayout = useAutoLayout();
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  useEffect(() => {
    if (!opts.enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      const k = e.key.toLowerCase();

      if (e.shiftKey) {
        switch (k) {
          case "l":
            e.preventDefault();
            applyLayout("left-right");
            return;
          case "t":
            e.preventDefault();
            opts.onOpenTemplates?.();
            return;
          case "a":
            e.preventDefault();
            opts.onOpenAI?.();
            return;
          case "y":
            e.preventDefault();
            applyLayout("layered");
            return;
          case "o":
            e.preventDefault();
            applyLayout("circular");
            return;
          case "s":
            e.preventDefault();
            opts.onCaptureSnapshot?.();
            return;
          case "p":
            e.preventDefault();
            opts.onExportPNG?.();
            return;
          case "z":
            e.preventDefault();
            redo();
            return;
        }
      }

      switch (k) {
        case "n":
          e.preventDefault();
          opts.onNewNode?.();
          return;
        case "z":
          e.preventDefault();
          undo();
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [opts, applyLayout, undo, redo]);
}
