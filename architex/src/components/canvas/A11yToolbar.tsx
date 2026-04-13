"use client";

import { memo, useCallback, useState } from "react";
import {
  Accessibility,
  List,
  Grid3X3,
  Contrast,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useViewportStore } from "@/stores/viewport-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ────────────────────────────────────────────────────

export interface A11yToolbarProps {
  /** Whether the list view is active (vs canvas view). */
  listViewActive: boolean;
  /** Toggle between canvas and list view. */
  onToggleListView: () => void;
  /** Whether grid snap is enabled. */
  gridSnap: boolean;
  /** Toggle grid snapping on/off. */
  onToggleGridSnap: () => void;
  /** Current grid size in px. */
  gridSize: number;
  /** Set grid size. */
  onGridSizeChange: (size: number) => void;
  /** Whether high contrast mode is active. */
  highContrast: boolean;
  /** Toggle high contrast mode. */
  onToggleHighContrast: () => void;
  /** Whether animations are reduced. */
  reduceAnimations: boolean;
  /** Toggle reduce-animations mode. */
  onToggleReduceAnimations: () => void;
}

// ── Component ────────────────────────────────────────────────

export const A11yToolbar = memo(function A11yToolbar({
  listViewActive,
  onToggleListView,
  gridSnap,
  onToggleGridSnap,
  gridSize,
  onGridSizeChange,
  highContrast,
  onToggleHighContrast,
  reduceAnimations,
  onToggleReduceAnimations,
}: A11yToolbarProps) {
  const zoom = useViewportStore((s) => s.zoom);
  const reactFlow = useReactFlow();

  const [expanded, setExpanded] = useState(false);

  const zoomPercent = Math.round(zoom * 100);

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: reduceAnimations ? 0 : 200 });
  }, [reactFlow, reduceAnimations]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: reduceAnimations ? 0 : 200 });
  }, [reactFlow, reduceAnimations]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "absolute right-4 top-4 z-50",
          "flex flex-col items-end gap-2",
        )}
        role="toolbar"
        aria-label="Accessibility controls"
      >
        {/* ── Toggle button ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label="Toggle accessibility toolbar"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "border border-border bg-surface/90 shadow-md backdrop-blur-lg",
                "text-muted-foreground transition-colors hover:text-foreground",
                expanded && "bg-primary/15 text-primary",
              )}
            >
              <Accessibility className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Accessibility options</TooltipContent>
        </Tooltip>

        {/* ── Expanded panel ── */}
        {expanded && (
          <div
            className={cn(
              "w-64 rounded-lg border border-border bg-surface/95 p-3 shadow-xl backdrop-blur-lg",
              "flex flex-col gap-3",
            )}
            role="group"
            aria-label="Accessibility settings"
          >
            {/* ── List view toggle ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Label htmlFor="a11y-list-view" className="text-xs">
                  List view
                </Label>
              </div>
              <Switch
                id="a11y-list-view"
                checked={listViewActive}
                onCheckedChange={onToggleListView}
                aria-label="Toggle list view"
              />
            </div>

            {/* ── Grid snap ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Label htmlFor="a11y-grid-snap" className="text-xs">
                  Grid snap
                </Label>
              </div>
              <div className="flex items-center gap-2">
                {gridSnap && (
                  <Select
                    value={String(gridSize)}
                    onValueChange={(v) => onGridSizeChange(Number(v))}
                  >
                    <SelectTrigger
                      className="h-6 w-[60px] border-0 bg-transparent px-1 text-[10px] shadow-none focus:ring-0"
                      aria-label="Grid size"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="20">20px</SelectItem>
                      <SelectItem value="32">32px</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Switch
                  id="a11y-grid-snap"
                  checked={gridSnap}
                  onCheckedChange={onToggleGridSnap}
                  aria-label="Toggle grid snap"
                />
              </div>
            </div>

            {/* ── High contrast ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Label htmlFor="a11y-high-contrast" className="text-xs">
                  High contrast
                </Label>
              </div>
              <Switch
                id="a11y-high-contrast"
                checked={highContrast}
                onCheckedChange={onToggleHighContrast}
                aria-label="Toggle high contrast mode"
              />
            </div>

            {/* ── Reduce animations ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Label htmlFor="a11y-reduce-animations" className="text-xs">
                  Reduce animations
                </Label>
              </div>
              <Switch
                id="a11y-reduce-animations"
                checked={reduceAnimations}
                onCheckedChange={onToggleReduceAnimations}
                aria-label="Toggle reduce animations"
              />
            </div>

            {/* ── Zoom controls ── */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Zoom</span>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleZoomOut}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                      aria-label="Zoom out"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Zoom out</TooltipContent>
                </Tooltip>

                <span
                  className="min-w-[40px] text-center text-xs font-medium tabular-nums text-foreground"
                  aria-label={`Current zoom: ${zoomPercent} percent`}
                  role="status"
                >
                  {zoomPercent}%
                </span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleZoomIn}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                      aria-label="Zoom in"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Zoom in</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
