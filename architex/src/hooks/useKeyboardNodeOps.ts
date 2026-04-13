"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvas-store";

// ── Types ────────────────────────────────────────────────────

export interface KeyboardNodeOpsOptions {
  /** Small movement increment (px) for arrow keys. Default 20. */
  gridIncrement?: number;
  /** Large movement increment (px) for Shift+Arrow. Default 100. */
  largeIncrement?: number;
  /** Called when Enter is pressed on a selected node. */
  onEditNode?: (nodeId: string) => void;
  /** Whether the hook is active. Default true. */
  enabled?: boolean;
}

// ── Hook ─────────────────────────────────────────────────────

export function useKeyboardNodeOps(options: KeyboardNodeOpsOptions = {}) {
  const {
    gridIncrement = 20,
    largeIncrement = 100,
    onEditNode,
    enabled = true,
  } = options;

  const announcerRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message;
    }
  }, []);

  // ── Mount the announcer element once ──
  useEffect(() => {
    if (!enabled) return;

    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "assertive");
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    el.id = "keyboard-node-ops-announcer";
    document.body.appendChild(el);
    announcerRef.current = el;

    return () => {
      el.remove();
      announcerRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // Do not intercept when typing in form fields
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable
      ) {
        return;
      }

      const meta = e.metaKey || e.ctrlKey;
      const state = useCanvasStore.getState();
      const { nodes, selectedNodeIds, setSelectedNodeIds, clearSelection, removeNodes, setNodes } = state;

      // ── Tab: cycle through nodes ──
      if (e.key === "Tab" && !meta && !e.altKey) {
        if (nodes.length === 0) return;
        e.preventDefault();

        const currentId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;
        const currentIndex = currentId
          ? nodes.findIndex((n) => n.id === currentId)
          : -1;

        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex <= 0 ? nodes.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= nodes.length - 1 ? 0 : currentIndex + 1;
        }

        const nextNode = nodes[nextIndex];
        setSelectedNodeIds([nextNode.id]);
        const label = typeof nextNode.data?.label === "string"
          ? nextNode.data.label
          : nextNode.id;
        announce(
          `Selected node ${label}, ${nextIndex + 1} of ${nodes.length}`,
        );
        return;
      }

      // ── Arrow keys: move selected nodes ──
      if (
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight") &&
        !meta &&
        !e.altKey &&
        selectedNodeIds.length > 0
      ) {
        e.preventDefault();
        const step = e.shiftKey ? largeIncrement : gridIncrement;
        let dx = 0;
        let dy = 0;

        switch (e.key) {
          case "ArrowUp":
            dy = -step;
            break;
          case "ArrowDown":
            dy = step;
            break;
          case "ArrowLeft":
            dx = -step;
            break;
          case "ArrowRight":
            dx = step;
            break;
        }

        const selectedSet = new Set(selectedNodeIds);
        const updatedNodes = nodes.map((n) => {
          if (!selectedSet.has(n.id)) return n;
          return {
            ...n,
            position: {
              x: n.position.x + dx,
              y: n.position.y + dy,
            },
          };
        });
        setNodes(updatedNodes);

        const direction =
          e.key === "ArrowUp"
            ? "up"
            : e.key === "ArrowDown"
              ? "down"
              : e.key === "ArrowLeft"
                ? "left"
                : "right";
        announce(
          `Moved ${selectedNodeIds.length} node${selectedNodeIds.length !== 1 ? "s" : ""} ${direction} by ${step} pixels`,
        );
        return;
      }

      // ── Enter: edit selected node ──
      if (e.key === "Enter" && !meta && selectedNodeIds.length === 1) {
        e.preventDefault();
        const nodeId = selectedNodeIds[0];
        const node = nodes.find((n) => n.id === nodeId);
        const label = typeof node?.data?.label === "string"
          ? node.data.label
          : nodeId;
        announce(`Editing node ${label}`);
        onEditNode?.(nodeId);
        return;
      }

      // ── Delete / Backspace: delete selected nodes ──
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !meta &&
        selectedNodeIds.length > 0
      ) {
        // Only act when the body/canvas is focused, not in inputs
        e.preventDefault();

        // Check if any selected nodes have connections
        const { edges } = state;
        const connectedIds = selectedNodeIds.filter((id) =>
          edges.some((edge) => edge.source === id || edge.target === id),
        );

        if (connectedIds.length > 0) {
          const proceed = window.confirm(
            `Delete ${selectedNodeIds.length} node${selectedNodeIds.length !== 1 ? "s" : ""}? ${connectedIds.length} connected node${connectedIds.length !== 1 ? "s" : ""} will lose ${connectedIds.length !== 1 ? "their" : "its"} connections.`,
          );
          if (!proceed) return;
        }

        removeNodes(selectedNodeIds);
        announce(
          `Deleted ${selectedNodeIds.length} node${selectedNodeIds.length !== 1 ? "s" : ""}`,
        );
        return;
      }

      // ── Escape: deselect all ──
      if (e.key === "Escape" && !meta) {
        clearSelection();
        announce("Selection cleared");
        return;
      }

      // ── Ctrl/Cmd+A: select all nodes ──
      if (meta && e.key === "a" && nodes.length > 0) {
        e.preventDefault();
        setSelectedNodeIds(nodes.map((n) => n.id));
        announce(`Selected all ${nodes.length} nodes`);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, gridIncrement, largeIncrement, onEditNode, announce]);
}
