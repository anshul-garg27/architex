'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  MousePointer2,
  Hand,
  Link,
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  Square,
  Minus,
  Plus,
  Maximize,
  Map,
  Flame,
  Route,
  FlaskConical,
  History,
  GitCompareArrows,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';
import { useViewportStore } from '@/stores/viewport-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { useUIStore } from '@/stores/ui-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { HeatmapMetric } from '@/stores/simulation-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutPicker } from '@/components/canvas/overlays/LayoutPicker';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ExportManager } from '@/lib/export/export-manager';
import type { ExportFormat } from '@/lib/export/export-manager';

// ── Types ────────────────────────────────────────────────────

type CanvasTool = 'select' | 'pan' | 'connect';

// ── Export menu items ───────────────────────────────────────

interface ExportItem {
  format: ExportFormat;
  label: string;
  group: 'native' | 'iac' | 'diagram' | 'image';
}

const EXPORT_ITEMS: ExportItem[] = [
  { format: 'json', label: 'JSON (native)', group: 'native' },
  { format: 'terraform-hcl', label: 'Terraform HCL', group: 'iac' },
  { format: 'c4-structurizr', label: 'C4 (Structurizr DSL)', group: 'diagram' },
  { format: 'excalidraw', label: 'Excalidraw', group: 'diagram' },
  { format: 'png', label: 'PNG', group: 'image' },
  { format: 'svg', label: 'SVG', group: 'image' },
];

// ── Roving tabindex hook ────────────────────────────────────

function useRovingTabIndex(itemCount: number) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let nextIndex: number | null = null;
      switch (e.key) {
        case 'ArrowRight':
          nextIndex = (focusedIndex + 1) % itemCount;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          nextIndex = (focusedIndex - 1 + itemCount) % itemCount;
          e.preventDefault();
          break;
        case 'Home':
          nextIndex = 0;
          e.preventDefault();
          break;
        case 'End':
          nextIndex = itemCount - 1;
          e.preventDefault();
          break;
      }
      if (nextIndex != null) {
        setFocusedIndex(nextIndex);
      }
    },
    [focusedIndex, itemCount],
  );

  // Focus the button at the current index when it changes via keyboard
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const buttons = toolbar.querySelectorAll<HTMLButtonElement>(
      '[data-toolbar-item]',
    );
    buttons[focusedIndex]?.focus();
  }, [focusedIndex]);

  return { focusedIndex, onKeyDown, toolbarRef };
}

// ── Toolbar button ───────────────────────────────────────────

interface ToolbarButtonProps {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
  tabIndex?: number;
}

function ToolbarButton({
  label,
  shortcut,
  active = false,
  disabled = false,
  variant = 'default',
  onClick,
  children,
  tabIndex,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          tabIndex={tabIndex}
          data-toolbar-item
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'text-muted-foreground hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-40',
            active && variant === 'default' && 'bg-primary/15 text-primary',
            active && variant === 'success' && 'bg-emerald-500/15 text-emerald-400',
            !active && variant === 'success' && 'hover:text-emerald-400',
            variant === 'danger' && 'hover:text-red-400',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-1.5">
        <span>{label}</span>
        {shortcut && (
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Divider ──────────────────────────────────────────────────

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border/60" />;
}

// ── Main toolbar ─────────────────────────────────────────────

interface CanvasToolbarProps {
  whatIfOpen?: boolean;
  onToggleWhatIf?: () => void;
  diffOpen?: boolean;
  onToggleDiff?: () => void;
}

export const CanvasToolbar = memo(function CanvasToolbar({
  whatIfOpen = false,
  onToggleWhatIf,
  diffOpen = false,
  onToggleDiff,
}: CanvasToolbarProps) {
  // ── Local state ──
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');

  // ── Store subscriptions ──
  const minimapVisible = useUIStore((s) => s.minimapVisible);
  const toggleMinimap = useUIStore((s) => s.toggleMinimap);
  const zoom = useViewportStore((s) => s.zoom);
  const simStatus = useSimulationStore((s) => s.status);
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const stop = useSimulationStore((s) => s.stop);
  const heatmapEnabled = useSimulationStore((s) => s.heatmapEnabled);
  const heatmapMetric = useSimulationStore((s) => s.heatmapMetric);
  const toggleHeatmap = useSimulationStore((s) => s.toggleHeatmap);
  const setHeatmapMetric = useSimulationStore((s) => s.setHeatmapMetric);
  const traceActive = useSimulationStore((s) => s.traceActive);
  const startTrace = useSimulationStore((s) => s.startTrace);
  const timelineVisible = useUIStore((s) => s.timelineVisible);
  const toggleTimeline = useUIStore((s) => s.toggleTimeline);

  // ── React Flow instance for zoom/fitView ──
  const reactFlow = useReactFlow();

  // ── Handlers ──
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 200 });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 200 });
  }, [reactFlow]);

  const handleZoomReset = useCallback(() => {
    reactFlow.zoomTo(1, { duration: 200 });
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlow]);

  const handleToggleMinimap = useCallback(() => {
    toggleMinimap();
  }, [toggleMinimap]);

  const handleToggleHeatmap = useCallback(() => {
    toggleHeatmap();
  }, [toggleHeatmap]);

  const handleHeatmapMetricChange = useCallback(
    (value: string) => {
      setHeatmapMetric(value as HeatmapMetric);
    },
    [setHeatmapMetric],
  );

  const handleTrace = useCallback(() => {
    if (!traceActive) {
      startTrace('happy');
    }
  }, [traceActive, startTrace]);

  const handleToggleWhatIf = useCallback(() => {
    onToggleWhatIf?.();
  }, [onToggleWhatIf]);

  const handleToggleDiff = useCallback(() => {
    onToggleDiff?.();
  }, [onToggleDiff]);

  const handlePlayPause = useCallback(() => {
    if (simStatus === 'running') {
      pause();
    } else {
      play();
    }
  }, [simStatus, play, pause]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  // ── Export handler ──
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const nodes = reactFlow.getNodes();
      const edges = reactFlow.getEdges();
      const manager = new ExportManager(nodes, edges);

      if (format === 'png') {
        try {
          const blob = await manager.toPNG();
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = ExportManager.suggestFilename(format);
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(url);
        } catch {
          // PNG export failed -- ignore
        }
      } else {
        manager.download(format);
      }
    },
    [reactFlow],
  );

  const zoomPercent = Math.round(zoom * 100);

  // Collapse simulation + overlay groups into overflow menu on narrow viewports
  const isCompact = useMediaQuery('(max-width: 1279px)');

  // Compute the number of toolbar items for roving tabindex.
  // Always visible: Select, Pan, Connect, Undo, Redo, Zoom out, Zoom reset, Zoom in, Fit view, Minimap = 10
  // Wide adds: Play/Pause, Stop, Timeline, What If, Diff, Heatmap, Trace = 7 (LayoutPicker is excluded since it's a popover trigger)
  // Compact adds: More button = 1
  const toolbarItemCount = 10 + (isCompact ? 1 : 7);
  const { focusedIndex, onKeyDown: onToolbarKeyDown, toolbarRef } = useRovingTabIndex(toolbarItemCount);

  // ── Shared group renderers (used inline and in overflow popover) ──

  const simulationGroup = (
    <>
      <ToolbarButton
        label={simStatus === 'running' ? 'Pause' : 'Play'}
        shortcut="Space"
        active={simStatus === 'running'}
        variant="success"
        onClick={handlePlayPause}
      >
        {simStatus === 'running' ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </ToolbarButton>

      <ToolbarButton
        label="Stop"
        variant="danger"
        disabled={simStatus === 'idle'}
        onClick={handleStop}
      >
        <Square className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 min-w-[28px] text-center text-xs font-medium tabular-nums text-muted-foreground">
        {playbackSpeed}x
      </span>
    </>
  );

  const overlayGroup = (
    <>
      <ToolbarButton
        label="Heatmap overlay"
        active={heatmapEnabled}
        disabled={simStatus !== 'running' && simStatus !== 'paused'}
        onClick={handleToggleHeatmap}
      >
        <Flame className="h-4 w-4" />
      </ToolbarButton>

      {heatmapEnabled && (
        <Select value={heatmapMetric} onValueChange={handleHeatmapMetricChange}>
          <SelectTrigger className="h-7 w-[90px] border-0 bg-transparent px-1.5 text-[10px] text-muted-foreground shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="utilization">Utilization</SelectItem>
            <SelectItem value="latency">Latency</SelectItem>
            <SelectItem value="errorRate">Error Rate</SelectItem>
          </SelectContent>
        </Select>
      )}

      <ToolbarButton
        label="Trace request"
        active={traceActive}
        disabled={simStatus !== 'running' && simStatus !== 'paused'}
        onClick={handleTrace}
      >
        <Route className="h-4 w-4" />
      </ToolbarButton>
    </>
  );

  const viewExtrasGroup = (
    <>
      <ToolbarButton
        label="Evolution timeline"
        active={timelineVisible}
        onClick={toggleTimeline}
      >
        <History className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="What If?"
        active={whatIfOpen}
        onClick={handleToggleWhatIf}
      >
        <FlaskConical className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label="Diff"
        active={diffOpen}
        onClick={handleToggleDiff}
      >
        <GitCompareArrows className="h-4 w-4" />
      </ToolbarButton>
    </>
  );

  // Mutable counter used during render to assign sequential tabIndex values.
  // Reset at the start of each render. Only the button at focusedIndex gets tabIndex={0}.
  let _tabIdx = 0;
  const nextTabIndex = () => {
    const idx = _tabIdx++;
    return idx === focusedIndex ? 0 : -1;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Canvas tools"
        onKeyDown={onToolbarKeyDown}
        className={cn(
          'pointer-events-auto',
          'absolute bottom-6 left-1/2 z-50 -translate-x-1/2',
          'flex items-center gap-0.5',
          'rounded-xl border border-border bg-surface/90 shadow-xl backdrop-blur-lg',
          'px-3 py-1.5',
        )}
      >
        {/* ── Left: Tools (always visible) ── */}
        <ToolbarButton
          label="Select"
          shortcut="V"
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          tabIndex={nextTabIndex()}
        >
          <MousePointer2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Pan"
          shortcut="H"
          active={activeTool === 'pan'}
          onClick={() => setActiveTool('pan')}
          tabIndex={nextTabIndex()}
        >
          <Hand className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Connect"
          shortcut="C"
          active={activeTool === 'connect'}
          onClick={() => setActiveTool('connect')}
          tabIndex={nextTabIndex()}
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* ── Undo/Redo (always visible) ── */}
        <ToolbarButton label="Undo" shortcut="⌘Z" onClick={handleUndo} tabIndex={nextTabIndex()}>
          <RotateCcw className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton label="Redo" shortcut="⌘⇧Z" onClick={handleRedo} tabIndex={nextTabIndex()}>
          <RotateCw className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* ── Simulation: inline on wide, collapsed on compact ── */}
        {!isCompact && (
          <>
            <ToolbarButton
              label={simStatus === 'running' ? 'Pause' : 'Play'}
              shortcut="Space"
              active={simStatus === 'running'}
              variant="success"
              onClick={handlePlayPause}
              tabIndex={nextTabIndex()}
            >
              {simStatus === 'running' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </ToolbarButton>

            <ToolbarButton
              label="Stop"
              variant="danger"
              disabled={simStatus === 'idle'}
              onClick={handleStop}
              tabIndex={nextTabIndex()}
            >
              <Square className="h-4 w-4" />
            </ToolbarButton>

            <span className="mx-1 min-w-[28px] text-center text-xs font-medium tabular-nums text-muted-foreground">
              {playbackSpeed}x
            </span>
            <Divider />
          </>
        )}

        {/* ── Zoom controls (always visible) ── */}
        <ToolbarButton label="Zoom out" shortcut="⌘-" onClick={handleZoomOut} tabIndex={nextTabIndex()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleZoomReset}
              tabIndex={nextTabIndex()}
              data-toolbar-item
              className="flex h-8 min-w-[44px] items-center justify-center rounded-lg px-1.5 text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:text-foreground"
            >
              {zoomPercent}%
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Reset to 100%</TooltipContent>
        </Tooltip>

        <ToolbarButton label="Zoom in" shortcut="⌘+" onClick={handleZoomIn} tabIndex={nextTabIndex()}>
          <Plus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton label="Fit view" shortcut="⌘0" onClick={handleFitView} tabIndex={nextTabIndex()}>
          <Maximize className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* ── Minimap (always visible) ── */}
        <ToolbarButton
          label="Toggle minimap"
          active={minimapVisible}
          onClick={handleToggleMinimap}
          tabIndex={nextTabIndex()}
        >
          <Map className="h-4 w-4" />
        </ToolbarButton>

        {/* ── Wide viewport: show all remaining groups inline ── */}
        {!isCompact && (
          <>
            <ToolbarButton
              label="Evolution timeline"
              active={timelineVisible}
              onClick={toggleTimeline}
              tabIndex={nextTabIndex()}
            >
              <History className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              label="What If?"
              active={whatIfOpen}
              onClick={handleToggleWhatIf}
              tabIndex={nextTabIndex()}
            >
              <FlaskConical className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Diff"
              active={diffOpen}
              onClick={handleToggleDiff}
              tabIndex={nextTabIndex()}
            >
              <GitCompareArrows className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              label="Heatmap overlay"
              active={heatmapEnabled}
              disabled={simStatus !== 'running' && simStatus !== 'paused'}
              onClick={handleToggleHeatmap}
              tabIndex={nextTabIndex()}
            >
              <Flame className="h-4 w-4" />
            </ToolbarButton>

            {heatmapEnabled && (
              <Select value={heatmapMetric} onValueChange={handleHeatmapMetricChange}>
                <SelectTrigger className="h-7 w-[90px] border-0 bg-transparent px-1.5 text-[10px] text-muted-foreground shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilization">Utilization</SelectItem>
                  <SelectItem value="latency">Latency</SelectItem>
                  <SelectItem value="errorRate">Error Rate</SelectItem>
                </SelectContent>
              </Select>
            )}

            <ToolbarButton
              label="Trace request"
              active={traceActive}
              disabled={simStatus !== 'running' && simStatus !== 'paused'}
              onClick={handleTrace}
              tabIndex={nextTabIndex()}
            >
              <Route className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            {/* ── Auto Layout ── */}
            <LayoutPicker />

            <Divider />

            {/* ── Export ── */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        'text-muted-foreground hover:text-foreground',
                      )}
                      aria-label="Export diagram"
                      data-toolbar-item
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span>Export</span>
                  <kbd className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {'\u2318'}E
                  </kbd>
                </TooltipContent>
              </Tooltip>

              <DropdownMenuContent side="top" align="end" sideOffset={8}>
                <DropdownMenuLabel>Export diagram</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXPORT_ITEMS.map((item) => (
                  <DropdownMenuItem
                    key={item.format}
                    onClick={() => void handleExport(item.format)}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* ── Compact viewport: "More" overflow popover ── */}
        {isCompact && (
          <>
            <Divider />
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        'text-muted-foreground hover:text-foreground',
                      )}
                      aria-label="More tools"
                      tabIndex={nextTabIndex()}
                      data-toolbar-item
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">More tools</TooltipContent>
              </Tooltip>

              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-auto max-w-[320px] p-2"
              >
                <div className="flex flex-col gap-2">
                  {/* ── Simulation group ── */}
                  <div>
                    <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Simulation
                    </span>
                    <div className="flex items-center gap-0.5">
                      {simulationGroup}
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* ── Overlays group ── */}
                  <div>
                    <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Overlays
                    </span>
                    <div className="flex items-center gap-0.5">
                      {overlayGroup}
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* ── View extras group ── */}
                  <div>
                    <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      View
                    </span>
                    <div className="flex items-center gap-0.5">
                      {viewExtrasGroup}
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* ── Auto Layout ── */}
                  <div>
                    <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Layout
                    </span>
                    <div className="flex items-center gap-0.5">
                      <LayoutPicker />
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* ── Export group ── */}
                  <div>
                    <span className="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Export
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {EXPORT_ITEMS.map((item) => (
                        <button
                          key={item.format}
                          onClick={() => void handleExport(item.format)}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </TooltipProvider>
  );
});
