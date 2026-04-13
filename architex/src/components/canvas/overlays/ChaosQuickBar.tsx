'use client';

/**
 * ChaosQuickBar (UI-003)
 *
 * Floating toolbar with 7 chaos categories at the bottom center of the
 * canvas during active simulation. Each button opens a popover with
 * category-specific chaos events that can be dragged onto canvas nodes.
 *
 * Visible only when simulation status is 'running' or 'paused'.
 */

import { memo, useState, useCallback, useRef } from 'react';
import {
  Cloud,
  Cpu,
  Database,
  Globe,
  Lock,
  Network,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import {
  CHAOS_EVENTS,
  type ChaosCategory,
  type ChaosEventType,
  type ChaosSeverity,
} from '@/lib/simulation/chaos-engine';

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

interface CategoryConfig {
  id: ChaosCategory;
  label: string;
  icon: React.ElementType;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'infrastructure', label: 'Infra', icon: Cpu, color: 'var(--node-compute)' },
  { id: 'network', label: 'Network', icon: Network, color: 'var(--node-networking)' },
  { id: 'data', label: 'Data', icon: Database, color: 'var(--node-storage)' },
  { id: 'traffic', label: 'Traffic', icon: Zap, color: 'var(--node-messaging)' },
  { id: 'dependency', label: 'Deps', icon: Globe, color: 'var(--node-processing)' },
  { id: 'application', label: 'App', icon: Cloud, color: 'var(--node-observability)' },
  { id: 'security', label: 'Security', icon: Lock, color: 'var(--node-client)' },
];

const SEVERITY_COLORS: Record<ChaosSeverity, string> = {
  low: 'bg-severity-low/20 text-severity-low',
  medium: 'bg-severity-medium/20 text-severity-medium',
  high: 'bg-severity-high/20 text-severity-high',
  critical: 'bg-severity-critical/20 text-severity-critical',
};

// ---------------------------------------------------------------------------
// Pre-grouped events
// ---------------------------------------------------------------------------

function getEventsForCategory(category: ChaosCategory): ChaosEventType[] {
  return CHAOS_EVENTS.filter((e) => e.category === category);
}

// ---------------------------------------------------------------------------
// ChaosQuickBar
// ---------------------------------------------------------------------------

export const ChaosQuickBar = memo(function ChaosQuickBar() {
  const status = useSimulationStore((s) => s.status);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const [openCategory, setOpenCategory] = useState<ChaosCategory | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isActive = status === 'running' || status === 'paused';

  const handleCategoryClick = useCallback(
    (category: ChaosCategory) => {
      setOpenCategory((prev) => (prev === category ? null : category));
    },
    [],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, event: ChaosEventType) => {
      e.dataTransfer.setData(
        'application/architex-chaos',
        JSON.stringify({ eventTypeId: event.id, name: event.name }),
      );
      e.dataTransfer.effectAllowed = 'copy';
    },
    [],
  );

  if (!isActive) return null;

  const popoverEvents = openCategory
    ? getEventsForCategory(openCategory)
    : [];

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      {/* Popover for selected category */}
      {openCategory && popoverEvents.length > 0 && (
        <div
          ref={popoverRef}
          className="mb-2 max-h-64 w-80 overflow-y-auto rounded-xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-sm"
        >
          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            {CATEGORIES.find((c) => c.id === openCategory)?.label} Events
          </div>
          <div className="space-y-1">
            {popoverEvents.map((event) => (
              <div
                key={event.id}
                draggable
                onDragStart={(e) => handleDragStart(e, event)}
                className="flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-elevated active:cursor-grabbing"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {event.name}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1 py-0.5 text-[9px] font-medium uppercase',
                        SEVERITY_COLORS[event.defaultSeverity],
                      )}
                    >
                      {event.defaultSeverity}
                    </span>
                  </div>
                  <span className="truncate text-[10px] text-foreground-muted">
                    {event.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category buttons bar */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-background/90 px-2 py-1.5 shadow-lg backdrop-blur-sm">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isOpen = openCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors',
                isOpen
                  ? 'bg-elevated text-foreground'
                  : 'text-foreground-muted hover:bg-elevated/50 hover:text-foreground',
              )}
              title={`${cat.label} chaos events`}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
