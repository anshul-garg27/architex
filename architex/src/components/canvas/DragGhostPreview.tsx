"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { Box } from "lucide-react";
import {
  Globe,
  Server,
  Zap,
  Database,
  GitBranch,
  Shield,
  Globe2,
  Monitor,
  HardDrive,
  Cog,
  FileJson,
  Table2,
  Search,
  GitFork,
  TrendingUp,
  ListOrdered,
  Megaphone,
  Route,
  AtSign,
  Radio,
  ShieldAlert,
  ClipboardList,
  Workflow,
  Brain,
  Smartphone,
  ExternalLink,
  BarChart3,
  ScrollText,
  Activity,
  KeyRound,
  Gauge,
  Lock,
} from "lucide-react";

const ICON_REGISTRY: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Globe,
  Server,
  Zap,
  Database,
  GitBranch,
  Shield,
  Globe2,
  Monitor,
  HardDrive,
  Cog,
  FileJson,
  Table2,
  Search,
  GitFork,
  TrendingUp,
  ListOrdered,
  Megaphone,
  Route,
  AtSign,
  Radio,
  ShieldAlert,
  ClipboardList,
  Workflow,
  Brain,
  Smartphone,
  ExternalLink,
  BarChart3,
  ScrollText,
  Activity,
  KeyRound,
  Gauge,
  Lock,
  Box,
};

interface DragPayload {
  type: string;
  label: string;
  icon: string;
}

const GRID_SIZE = 16;

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/**
 * DragGhostPreview -- shows a semi-transparent ghost of the node being dragged
 * from the component palette, following the cursor. Snaps to grid when the
 * cursor is over the canvas area.
 */
export const DragGhostPreview = memo(function DragGhostPreview() {
  const [dragging, setDragging] = useState(false);
  const [payload, setPayload] = useState<DragPayload | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [overCanvas, setOverCanvas] = useState(false);

  const handleDragStart = useCallback((e: DragEvent) => {
    const raw = e.dataTransfer?.getData("application/architex-node");
    // dataTransfer.getData returns "" during dragstart in some browsers;
    // we listen for dragenter/dragover instead to detect the payload type.
    // Instead, peek at the drag's types list to confirm it's ours.
    if (!e.dataTransfer?.types.includes("application/architex-node")) return;

    // We can't read dataTransfer data during drag (security).
    // Store the payload from the element's dataset if available.
    const target = e.target as HTMLElement;
    const paletteCard = target.closest("[draggable]");
    if (!paletteCard) return;

    // Read the title or label for display
    const labelEl = paletteCard.querySelector(".truncate");
    const label = labelEl?.textContent ?? "Component";
    // Try to figure out icon from the drag data set on the element
    const iconEl = paletteCard.querySelector("[style]");
    const iconName =
      iconEl?.querySelector("svg")?.closest("span")?.textContent ?? "";

    // We'll capture the payload from the raw data if possible
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DragPayload;
        setPayload(parsed);
      } catch {
        setPayload({ type: "unknown", label, icon: "" });
      }
    } else {
      setPayload({ type: "unknown", label, icon: "" });
    }

    setDragging(true);
    setPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDrag = useCallback(
    (e: DragEvent) => {
      if (!dragging) return;
      // e.clientX/Y can be 0 on the final drag event in some browsers
      if (e.clientX === 0 && e.clientY === 0) return;

      const canvasEl = document.querySelector("[data-onboarding='canvas']");
      const isOver = canvasEl
        ? canvasEl.contains(e.target as Node) ||
          (e.target as HTMLElement).closest?.(
            "[data-onboarding='canvas']",
          ) !== null
        : false;

      setOverCanvas(isOver);

      if (isOver) {
        setPosition({ x: snapToGrid(e.clientX), y: snapToGrid(e.clientY) });
      } else {
        setPosition({ x: e.clientX, y: e.clientY });
      }
    },
    [dragging],
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    setPayload(null);
    setOverCanvas(false);
  }, []);

  useEffect(() => {
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("drag", handleDrag);
    document.addEventListener("dragend", handleDragEnd);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("drag", handleDrag);
      document.removeEventListener("dragend", handleDragEnd);
    };
  }, [handleDragStart, handleDrag, handleDragEnd]);

  if (!dragging || !payload) return null;

  const IconComponent = ICON_REGISTRY[payload.icon] ?? Box;

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg transition-all duration-150 ${
          overCanvas
            ? "border-primary/60 bg-surface/80 opacity-70 scale-100"
            : "border-border/50 bg-popover/70 opacity-50 scale-95"
        }`}
      >
        <IconComponent className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {payload.label}
        </span>
      </div>
      {overCanvas && (
        <div className="mt-1 text-center text-[10px] text-foreground-muted">
          Snap to grid
        </div>
      )}
    </div>
  );
});
