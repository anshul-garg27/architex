'use client';

import { memo } from 'react';
import { GraduationCap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTemplateMetaStore } from '@/stores/template-meta-store';
import { useSimulationStore } from '@/stores/simulation-store';

/**
 * Floating "Tour" trigger for the canvas. Visible only when the active
 * template ships learnSteps, the tour is not already open, and the
 * simulation dashboard is not occupying the top strip. Self-positioned
 * (top-left) — just mount it inside DesignCanvas's relative wrapper.
 */
export const TourButton = memo(function TourButton() {
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);
  const tourOpen = useTemplateMetaStore((s) => s.tourOpen);
  const openTour = useTemplateMetaStore((s) => s.openTour);
  const simStatus = useSimulationStore((s) => s.status);

  const stepCount = activeTemplate?.learnSteps?.length ?? 0;

  // SimulationDashboard spans the full top strip while running/paused.
  const simOverlayActive = simStatus === 'running' || simStatus === 'paused';

  if (stepCount === 0 || tourOpen || simOverlayActive) return null;

  return (
    <button
      type="button"
      onClick={openTour}
      aria-label={`Start guided tour (${stepCount} steps)`}
      className={cn(
        'pointer-events-auto group',
        'absolute left-4 top-4 z-30',
        'flex items-center gap-2 rounded-full border border-border bg-surface/90 py-1.5 pl-2.5 pr-2 shadow-lg backdrop-blur-lg',
        'transition-[border-color,box-shadow,transform] duration-200',
        'hover:border-primary/50 hover:shadow-[0_0_16px_color-mix(in_srgb,var(--primary)_25%,transparent)]',
        'active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <GraduationCap className="h-4 w-4 text-primary transition-transform duration-200 group-hover:-rotate-12" />
      <span className="text-xs font-medium text-foreground">Tour</span>
      <span
        aria-hidden="true"
        className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary"
      >
        {stepCount}
      </span>
    </button>
  );
});
