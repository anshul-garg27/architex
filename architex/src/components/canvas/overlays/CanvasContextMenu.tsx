"use client";

import React, { useCallback } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { useCanvasStore } from "@/stores/canvas-store";
import { useUIStore } from "@/stores/ui-store";
import { useReactFlow } from "@xyflow/react";
import { getNodeClipboard } from "./NodeContextMenu";
import type { Node } from "@xyflow/react";

// ── Top 8 component types for the Add Component submenu ────

const COMPONENT_TYPES = [
  { type: "web-server", label: "Web Server", category: "compute", icon: "globe" },
  { type: "load-balancer", label: "Load Balancer", category: "load-balancing", icon: "git-branch" },
  { type: "database", label: "Database", category: "storage", icon: "database" },
  { type: "cache", label: "Cache", category: "storage", icon: "zap" },
  { type: "message-queue", label: "Message Queue", category: "messaging", icon: "mail" },
  { type: "api-gateway", label: "API Gateway", category: "networking", icon: "shield" },
  { type: "cdn", label: "CDN", category: "networking", icon: "cloud" },
  { type: "app-server", label: "App Server", category: "compute", icon: "server" },
] as const;

function generateNodeId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── CanvasContextMenu ──────────────────────────────────────

interface CanvasContextMenuProps {
  children: React.ReactNode;
}

export function CanvasContextMenu({ children }: CanvasContextMenuProps) {
  const addNode = useCanvasStore((s) => s.addNode);
  const nodes = useCanvasStore((s) => s.nodes);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);
  const setTemplateGalleryOpen = useUIStore((s) => s.setTemplateGalleryOpen);
  const setExportDialogOpen = useUIStore((s) => s.setExportDialogOpen);

  const reactFlow = useReactFlow();

  const handlePaste = useCallback(() => {
    const clip = getNodeClipboard();
    if (!clip) return;
    const newNode: Node = {
      ...clip,
      id: generateNodeId(),
      position: {
        x: clip.position.x + 40,
        y: clip.position.y + 40,
      },
      selected: false,
    };
    addNode(newNode);
  }, [addNode]);

  const handleAddComponent = useCallback(
    (comp: (typeof COMPONENT_TYPES)[number]) => {
      const viewport = reactFlow.getViewport();
      // Place near center of the current viewport
      const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
      const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

      const newNode: Node = {
        id: generateNodeId(),
        type: comp.type,
        position: { x: centerX, y: centerY },
        data: {
          label: comp.label,
          category: comp.category,
          componentType: comp.type,
          icon: comp.icon,
          config: {},
          metrics: {},
          state: "idle",
        },
      };
      addNode(newNode);
    },
    [addNode, reactFlow],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedNodeIds(nodes.map((n) => n.id));
  }, [nodes, setSelectedNodeIds]);

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlow]);

  const handleLoadTemplate = useCallback(() => {
    setTemplateGalleryOpen(true);
  }, [setTemplateGalleryOpen]);

  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, [setExportDialogOpen]);

  const clipboardData = getNodeClipboard();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg"
        >
          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed"
            onSelect={handlePaste}
            disabled={!clipboardData}
          >
            Paste
            <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
              {"\u2318"}V
            </span>
          </ContextMenu.Item>

          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]">
              Add Component
              <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
                {"\u25B8"}
              </span>
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className="min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg"
                sideOffset={4}
              >
                {COMPONENT_TYPES.map((comp) => (
                  <ContextMenu.Item
                    key={comp.type}
                    className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
                    onSelect={() => handleAddComponent(comp)}
                  >
                    {comp.label}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />

          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleSelectAll}
          >
            Select All
            <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
              {"\u2318"}A
            </span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleFitView}
          >
            Fit View
            <span className="ml-4 text-[10px] text-[var(--foreground-muted)]">
              {"\u2318\u21E7"}F
            </span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-[var(--border)]" />

          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleLoadTemplate}
          >
            Load Template
          </ContextMenu.Item>

          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded-md px-3 py-1.5 text-xs text-[var(--foreground)] outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
            onSelect={handleExport}
          >
            Export
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
