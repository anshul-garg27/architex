'use client';

import { memo, useCallback, useRef, useState } from 'react';
import { ChartBar, CircleDot, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Types ────────────────────────────────────────────────────

export type VisualizationView = 'bars' | 'dots' | 'colormap';

export interface ViewToggleProps {
  /** Currently active view */
  activeView: VisualizationView;
  /** Callback when view changes */
  onViewChange: (view: VisualizationView) => void;
  className?: string;
}

// ── View definitions ─────────────────────────────────────────

const VIEW_OPTIONS: Array<{
  id: VisualizationView;
  label: string;
  icon: typeof ChartBar;
}> = [
  { id: 'bars', label: 'Bars', icon: ChartBar },
  { id: 'dots', label: 'Dots', icon: CircleDot },
  { id: 'colormap', label: 'Map', icon: Palette },
];

// ── Persistence hook ─────────────────────────────────────────

const STORAGE_KEY = 'architex-viz-view';

export function useVisualizationView(): [VisualizationView, (v: VisualizationView) => void] {
  const [view, setView] = useState<VisualizationView>(() => {
    if (typeof window === 'undefined') return 'bars';
    return (localStorage.getItem(STORAGE_KEY) as VisualizationView) || 'bars';
  });

  const setViewAndPersist = useCallback((v: VisualizationView) => {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }, []);

  return [view, setViewAndPersist];
}

// ── Component ────────────────────────────────────────────────

export const ViewToggle = memo(function ViewToggle({
  activeView,
  onViewChange,
  className,
}: ViewToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = VIEW_OPTIONS.findIndex((o) => o.id === activeView);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % VIEW_OPTIONS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + VIEW_OPTIONS.length) % VIEW_OPTIONS.length;
      }

      if (nextIndex !== currentIndex) {
        onViewChange(VIEW_OPTIONS[nextIndex].id);
        // Focus the newly active button
        const container = containerRef.current;
        if (container) {
          const buttons = container.querySelectorAll<HTMLButtonElement>('[role="radio"]');
          buttons[nextIndex]?.focus();
        }
      }
    },
    [activeView, onViewChange],
  );

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Visualization view"
        className={cn(
          'absolute top-14 left-4 z-10',
          'inline-flex items-center gap-0.5 rounded-lg border border-border/30 bg-background/70 p-0.5 backdrop-blur-md',
          className,
        )}
        onKeyDown={handleKeyDown}
      >
        {VIEW_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = activeView === option.id;

          return (
            <Tooltip key={option.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={option.label}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onViewChange(option.id)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-md transition-colors duration-150 px-2.5',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                  style={{ height: 28 }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">{option.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {option.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
