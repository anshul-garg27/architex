"use client";

/**
 * useCanvasKeyboard -- Keyboard shortcuts for the LLD canvas.
 *
 * Handles undo/redo, delete, select-all, duplicate, zoom, and deselect
 * via standard keyboard shortcuts. Only fires when the active element
 * is inside the canvas container (not in an input/textarea).
 */

import React, { useEffect, useCallback } from "react";

export interface CanvasKeyboardActions {
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  duplicateSelected: () => void;
  deselectAll: () => void;
}

/**
 * Attach keyboard shortcuts for the LLD canvas.
 *
 * @param containerRef - Ref to the canvas container element. Shortcuts only fire
 *                       when the event target is inside this container.
 * @param actions      - Callbacks for each keyboard action.
 * @param enabled      - When false the listener is not attached (default true).
 */
export function useCanvasKeyboard(
  containerRef: React.RefObject<HTMLElement | null>,
  actions: CanvasKeyboardActions,
  enabled = true,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when focus is in an input field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Only respond if the event target is inside the canvas container
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node) && e.target !== document.body) return;

      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd+Z -> undo
      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
        return;
      }

      // Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z -> redo
      if (isMod && (e.key === "y" || (e.key === "z" && e.shiftKey) || (e.key === "Z" && e.shiftKey))) {
        e.preventDefault();
        actions.redo();
        return;
      }

      // Delete / Backspace -> delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        actions.deleteSelected();
        return;
      }

      // Ctrl/Cmd+A -> select all
      if (isMod && e.key === "a") {
        e.preventDefault();
        actions.selectAll();
        return;
      }

      // Ctrl/Cmd+D -> duplicate selected
      if (isMod && e.key === "d") {
        e.preventDefault();
        actions.duplicateSelected();
        return;
      }

      // + or = -> zoom in (no modifier)
      if (!isMod && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        actions.zoomIn();
        return;
      }

      // - -> zoom out (no modifier)
      if (!isMod && e.key === "-") {
        e.preventDefault();
        actions.zoomOut();
        return;
      }

      // 0 -> zoom reset (no modifier)
      if (!isMod && e.key === "0") {
        e.preventDefault();
        actions.zoomReset();
        return;
      }

      // Escape -> deselect all
      if (e.key === "Escape") {
        e.preventDefault();
        actions.deselectAll();
        return;
      }
    },
    [actions, containerRef],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
