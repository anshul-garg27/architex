"use client";

import React, { useCallback, useState } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUIStore } from "@/stores/ui-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Node } from "@xyflow/react";

// ── Group colour palette (matches node category colours) ──

const GROUP_COLORS = [
  'hsl(217 91% 60%)',   // compute
  'hsl(142 71% 45%)',   // storage
  'hsl(25 95% 53%)',    // messaging
  'hsl(271 81% 56%)',   // networking
  'hsl(0 72% 51%)',     // security
  'hsl(38 92% 50%)',    // observability
  'hsl(199 89% 48%)',   // client
  'hsl(340 82% 52%)',   // processing
];

// ── Clipboard helpers ──────────────────────────────────────

let clipboard: Node | null = null;

export function getNodeClipboard() {
  return clipboard;
}

// ── NodeContextMenu ────────────────────────────────────────

interface NodeContextMenuProps {
  nodeId: string;
  children: React.ReactNode;
}

export function NodeContextMenu({ nodeId, children }: NodeContextMenuProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // AUD-055: Remove full nodes/edges subscriptions. Read via getState() only in handlers.
  const addNode = useCanvasStore((s) => s.addNode);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);
  const addGroup = useCanvasStore((s) => s.addGroup);
  const togglePropertiesPanel = useUIStore((s) => s.togglePropertiesPanel);
  const propertiesPanelOpen = useUIStore((s) => s.propertiesPanelOpen);

  const canGroup = selectedNodeIds.length >= 2;

  const getNode = useCallback(
    () => useCanvasStore.getState().nodes.find((n) => n.id === nodeId),
    [nodeId],
  );

  const handleEditLabel = useCallback(() => {
    const n = getNode();
    if (!n) return;
    setEditValue((n.data as Record<string, unknown>).label as string);
    setEditing(true);
  }, [getNode]);

  const commitLabel = useCallback(() => {
    if (editValue.trim()) {
      updateNodeData(nodeId, { label: editValue.trim() });
    }
    setEditing(false);
  }, [nodeId, editValue, updateNodeData]);

  const handleDuplicate = useCallback(() => {
    const n = getNode();
    if (!n) return;
    const newNode: Node = {
      ...n,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      position: {
        x: n.position.x + 40,
        y: n.position.y + 40,
      },
      selected: false,
    };
    addNode(newNode);
  }, [getNode, addNode]);

  const handleCut = useCallback(() => {
    const n = getNode();
    if (!n) return;
    clipboard = { ...n };
    removeNodes([nodeId]);
  }, [getNode, nodeId, removeNodes]);

  const handleCopy = useCallback(() => {
    const n = getNode();
    if (!n) return;
    clipboard = { ...n };
  }, [getNode]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const newNode: Node = {
      ...clipboard,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      position: {
        x: clipboard.position.x + 40,
        y: clipboard.position.y + 40,
      },
      selected: false,
    };
    addNode(newNode);
  }, [addNode]);

  const handleDelete = useCallback(() => {
    const currentEdges = useCanvasStore.getState().edges;
    const hasConnections = currentEdges.some(
      (e) => e.source === nodeId || e.target === nodeId,
    );
    if (hasConnections) {
      setConfirmDeleteOpen(true);
      return;
    }
    removeNodes([nodeId]);
  }, [nodeId, removeNodes]);

  const handleConfirmDelete = useCallback(() => {
    setConfirmDeleteOpen(false);
    removeNodes([nodeId]);
  }, [nodeId, removeNodes]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteOpen(false);
  }, []);

  const handleConfigure = useCallback(() => {
    setSelectedNodeIds([nodeId]);
    if (!propertiesPanelOpen) {
      togglePropertiesPanel();
    }
  }, [nodeId, setSelectedNodeIds, propertiesPanelOpen, togglePropertiesPanel]);

  const handleGroupSelected = useCallback(() => {
    const name = window.prompt("Enter group name:");
    if (!name || !name.trim()) return;
    const color = GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
    addGroup({
      id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: name.trim(),
      color,
      nodeIds: [...selectedNodeIds],
    });
  }, [selectedNodeIds, addGroup]);

  if (editing) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-lg">
          <input
            autoFocus
            aria-label="Rename node"
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLabel();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
    <ConfirmDialog
      open={confirmDeleteOpen}
      title="Delete Node"
      description="This node has connections. Deleting it will also remove all connected edges. Are you sure?"
      confirmLabel="Delete"
      cancelLabel="Keep"
      variant="destructive"
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
    />
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg"
        >
          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleEditLabel}
          >
            Edit Label
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleDuplicate}
          >
            Duplicate
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />

          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleCut}
          >
            Cut
            <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
              {"\u2318"}X
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleCopy}
          >
            Copy
            <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
              {"\u2318"}C
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handlePaste}
            disabled={!clipboard}
          >
            Paste
            <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
              {"\u2318"}V
            </span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />

          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-red-400 outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleDelete}
          >
            Delete
            <span className="ml-4 text-[10px] text-red-400/60">
              {"\u232B"}
            </span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />

          {canGroup && (
            <ContextMenu.Item
              className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
              onSelect={handleGroupSelected}
            >
              Group Selected ({selectedNodeIds.length})
            </ContextMenu.Item>
          )}

          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleConfigure}
          >
            Configure
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
    </>
  );
}
