// ─────────────────────────────────────────────────────────────
// ALG-247 — Shared Visualization Primitives
//
// Reusable building blocks shared across all visualizer overlays
// (ArrayVisualizer, GraphVisualizer, TreeVisualizer, etc.).
// ─────────────────────────────────────────────────────────────

import { memo } from 'react';
import { cn } from '@/lib/utils';

/** Shared legend component used by all visualizers */
export const VizLegend = memo(function VizLegend({
  items,
  position = 'bottom-right',
}: {
  items: Array<{ color: string; label: string }>;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}) {
  const posClass = {
    'bottom-right': 'absolute bottom-1.5 right-2',
    'bottom-left': 'absolute bottom-1.5 left-2',
    'bottom-center': 'mt-3 flex justify-center',
  }[position];

  return (
    <div className={cn(posClass, 'flex flex-wrap gap-2 rounded-lg bg-background/60 backdrop-blur-md px-3 py-1.5 border border-border/20')}>
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-[8px] text-foreground-subtle">{label}</span>
        </div>
      ))}
    </div>
  );
});

/** Shared empty state for visualizers */
export const VizEmptyState = memo(function VizEmptyState({
  message,
  height = 400,
  className,
}: {
  message: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background',
        className,
      )}
      style={{ height }}
    >
      <p className="text-sm text-foreground-muted">{message}</p>
    </div>
  );
});
