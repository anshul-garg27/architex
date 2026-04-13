'use client';

// ─────────────────────────────────────────────────────────────
// IncidentTimeline — Vertical timeline for war story events
// ─────────────────────────────────────────────────────────────
//
// Features:
//   - Vertical timeline with time markers (T+Nm)
//   - Event cards with type-specific icons and colours
//   - Current position indicator synced with playback
//   - Expandable event details on click
//   - Smooth scroll-into-view for active event
//
// Animation: motion spring for card entry, highlight pulse
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { duration, springs, stagger } from '@/lib/constants/motion';
import {
  Zap,
  Search,
  Bell,
  ArrowUp,
  Microscope,
  Shield,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  TimelineEvent,
  TimelineEventType,
} from '@/lib/innovation/war-stories';
import { EVENT_TYPE_CONFIG } from '@/lib/innovation/war-stories';

// ── Types ──────────────────────────────────────────────────

export interface IncidentTimelineProps {
  /** Ordered timeline events. */
  events: TimelineEvent[];
  /** Index of the currently active event (-1 = none). */
  activeIndex: number;
  /** Current playback minute (for position indicator). */
  currentMinute: number;
  /** Called when user clicks an event to jump to it. */
  onJumpTo?: (index: number) => void;
  className?: string;
}

// ── Icon Map ──────────────────────────────────────────────

const EVENT_ICONS: Record<TimelineEventType, typeof Zap> = {
  trigger: Zap,
  detection: Search,
  alert: Bell,
  escalation: ArrowUp,
  investigation: Microscope,
  mitigation: Shield,
  fix: CheckCircle,
  postmortem: FileText,
};

// ── Helpers ───────────────────────────────────────────────

function formatMinutes(m: number): string {
  if (m < 60) return `T+${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `T+${h}h ${rem}m` : `T+${h}h`;
}

// ── Component ──────────────────────────────────────────────

export const IncidentTimeline = memo(function IncidentTimeline({
  events,
  activeIndex,
  currentMinute,
  onJumpTo,
  className,
}: IncidentTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const eventRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll active event into view when it changes.
  useEffect(() => {
    if (activeIndex >= 0 && eventRefs.current[activeIndex]) {
      eventRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  const toggleExpand = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Current minute indicator */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-mono text-zinc-500">Current:</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono font-semibold text-cyan-300">
          {formatMinutes(currentMinute)}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {events.map((event, i) => {
          const config = EVENT_TYPE_CONFIG[event.type];
          const Icon = EVENT_ICONS[event.type];
          const isActive = i === activeIndex;
          const isPast = i < activeIndex || (activeIndex === -1 && currentMinute >= event.minutesOffset);
          const isFuture = activeIndex >= 0 && i > activeIndex;
          const isExpanded = expandedIndex === i;

          return (
            <div
              key={i}
              ref={(el) => { eventRefs.current[i] = el; }}
              className="relative flex gap-3 pl-8"
            >
              {/* Timeline line */}
              <div className="absolute left-[14px] top-0 flex h-full flex-col items-center">
                {/* Dot */}
                <motion.div
                  animate={{
                    scale: isActive ? [1, 1.3, 1] : 1,
                    boxShadow: isActive
                      ? '0 0 8px 2px rgba(34, 211, 238, 0.4)'
                      : '0 0 0 0 transparent',
                  }}
                  transition={isActive ? { repeat: Infinity, duration: 1.5 } : { duration: duration.normal }}
                  className={cn(
                    'relative z-10 mt-2 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                    isActive && 'border-cyan-400 bg-cyan-400/40',
                    isPast && !isActive && 'border-emerald-400 bg-emerald-400/30',
                    isFuture && 'border-zinc-600 bg-zinc-800',
                    !isActive && !isPast && !isFuture && 'border-zinc-500 bg-zinc-700',
                  )}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-cyan-400/20"
                      animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </motion.div>
                {/* Connecting line */}
                {i < events.length - 1 && (
                  <div
                    className={cn(
                      'w-px flex-1 transition-colors',
                      isPast ? 'bg-emerald-500/40' : 'bg-zinc-700/60',
                    )}
                  />
                )}
              </div>

              {/* Event card */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{
                  opacity: isFuture ? 0.4 : 1,
                  x: 0,
                }}
                transition={{ delay: i * stagger.panelContent.delayPerItem, ...springs.snappy }}
                className={cn(
                  'mb-2 min-w-0 flex-1 cursor-pointer rounded-lg border p-2.5 transition-colors',
                  isActive && 'border-cyan-500/50 bg-cyan-500/10',
                  isPast && !isActive && 'border-zinc-700/40 bg-zinc-800/40',
                  isFuture && 'border-zinc-700/20 bg-zinc-900/40',
                  !isActive && !isPast && !isFuture && 'border-zinc-700/40 bg-zinc-800/50',
                )}
                onClick={() => {
                  toggleExpand(i);
                  onJumpTo?.(i);
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                    {formatMinutes(event.minutesOffset)}
                  </span>
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', config.color)} />
                  <span className="min-w-0 truncate text-xs font-semibold text-zinc-100">
                    {event.label}
                  </span>
                  <span
                    className={cn(
                      'ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider',
                      config.color,
                    )}
                  >
                    {config.label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />
                  )}
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: duration.normal }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                        {event.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
