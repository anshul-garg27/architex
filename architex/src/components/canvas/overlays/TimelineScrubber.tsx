"use client";

import {
  memo,
  useCallback,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs, duration, reducedMotion } from "@/lib/constants/motion";
import { useReducedMotion } from "@/providers/ReducedMotionProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineScrubberProps {
  /** Total number of steps */
  totalSteps: number;
  /** Current step index */
  currentStep: number;
  /** Steps that have milestones (index + label pairs) */
  milestones: Array<{ stepIndex: number; label: string }>;
  /** Whether currently playing */
  isPlaying: boolean;
  /** Callback when user scrubs to a step */
  onScrub: (stepIndex: number) => void;
  /** Callback for play/pause toggle */
  onPlayPause: () => void;
  /** Callback for step forward */
  onStepForward: () => void;
  /** Callback for step backward */
  onStepBackward: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Milestone Marker
// ---------------------------------------------------------------------------

interface MilestoneMarkerProps {
  position: number; // 0..1 fraction along the track
  label: string;
  onClick: () => void;
}

function MilestoneMarker({ position, label, onClick }: MilestoneMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer p-1"
      style={{ left: `${position * 100}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Jump to milestone: ${label}`}
    >
      {/* Diamond marker */}
      <div className="h-2.5 w-2.5 rotate-45 rounded-[1px] bg-amber-400 shadow-sm shadow-amber-400/30 transition-transform hover:scale-125" />

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: duration.fast }}
            className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/40 bg-background/95 px-2 py-1 text-[10px] font-medium text-foreground shadow-lg backdrop-blur-sm"
          >
            {label}
            {/* Tooltip arrow */}
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-border/40 bg-background/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Transport Button
// ---------------------------------------------------------------------------

interface TransportButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}

function TransportButton({
  icon,
  onClick,
  disabled,
  ariaLabel,
}: TransportButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg",
        "border border-border/20 bg-background/50 backdrop-blur-sm",
        "text-muted-foreground transition-colors",
        "hover:bg-background/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "disabled:pointer-events-none disabled:opacity-30",
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TimelineScrubber
// ---------------------------------------------------------------------------

export const TimelineScrubber = memo(function TimelineScrubber({
  totalSteps,
  currentStep,
  milestones,
  isPlaying,
  onScrub,
  onPlayPause,
  onStepForward,
  onStepBackward,
  className,
}: TimelineScrubberProps) {
  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStep, setDragStep] = useState<number | null>(null);

  // The step to render (dragged step takes priority during scrub)
  const displayStep = dragStep ?? currentStep;

  // Progress fraction (0..1)
  const maxStep = Math.max(totalSteps - 1, 1);
  const progressFraction = Math.min(1, Math.max(0, displayStep / maxStep));

  // ── Convert pointer X to step index ────────────────────────

  const stepFromClientX = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      return Math.round(fraction * maxStep);
    },
    [maxStep],
  );

  // ── Pointer event handlers for drag scrubbing ──────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      const step = stepFromClientX(e.clientX);
      setDragStep(step);
      onScrub(step);
    },
    [stepFromClientX, onScrub],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const step = stepFromClientX(e.clientX);
      setDragStep(step);
      onScrub(step);
    },
    [isDragging, stepFromClientX, onScrub],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      // Snap to nearest step on release
      const step = stepFromClientX(e.clientX);
      setDragStep(null);
      onScrub(step);
    },
    [isDragging, stepFromClientX, onScrub],
  );

  // ── Keyboard navigation ────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onStepBackward();
          break;
        case "ArrowRight":
          e.preventDefault();
          onStepForward();
          break;
        case " ":
          e.preventDefault();
          onPlayPause();
          break;
      }
    },
    [onStepBackward, onStepForward, onPlayPause],
  );

  // ── Spring config for handle position ──────────────────────

  const handleTransition = prefersReducedMotion
    ? reducedMotion.instantTransition
    : springs.snappy;

  return (
    <div
      className={cn(
        "absolute bottom-4 left-4 right-4 z-50",
        "pointer-events-auto",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3",
          "border border-border/30 bg-background/80 shadow-lg backdrop-blur-xl",
        )}
        onKeyDown={handleKeyDown}
      >
        {/* ── Transport Controls ─────────────────────────── */}
        <div className="flex items-center gap-1">
          <TransportButton
            icon={<SkipBack className="h-3.5 w-3.5" />}
            onClick={onStepBackward}
            disabled={displayStep <= 0}
            ariaLabel="Step backward"
          />
          <TransportButton
            icon={
              isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 translate-x-[1px]" />
              )
            }
            onClick={onPlayPause}
            ariaLabel={isPlaying ? "Pause" : "Play"}
          />
          <TransportButton
            icon={<SkipForward className="h-3.5 w-3.5" />}
            onClick={onStepForward}
            disabled={displayStep >= totalSteps - 1}
            ariaLabel="Step forward"
          />
        </div>

        {/* ── Track Area ─────────────────────────────────── */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-valuenow={displayStep}
          aria-valuemin={0}
          aria-valuemax={totalSteps > 0 ? totalSteps - 1 : 0}
          aria-label="Algorithm timeline scrubber"
          className={cn(
            "relative flex-1 cursor-pointer py-3",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          {/* Track background (empty portion) */}
          <div className="relative h-1 w-full rounded-full bg-border/30">
            {/* Track fill (filled portion) */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${progressFraction * 100}%` }}
            />

            {/* Milestone markers */}
            {milestones.map((milestone) => {
              const milestonePosition =
                totalSteps > 1
                  ? milestone.stepIndex / maxStep
                  : 0;
              return (
                <MilestoneMarker
                  key={`milestone-${milestone.stepIndex}`}
                  position={milestonePosition}
                  label={milestone.label}
                  onClick={() => onScrub(milestone.stepIndex)}
                />
              );
            })}

            {/* Scrubber handle */}
            <motion.div
              className={cn(
                "absolute top-1/2 z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full",
                "bg-primary ring-2 ring-primary/30",
                "shadow-md shadow-primary/20",
                isDragging && "scale-110",
              )}
              animate={{ left: `${progressFraction * 100}%` }}
              transition={handleTransition}
              style={{ top: "50%" }}
            />
          </div>
        </div>

        {/* ── Step Counter ───────────────────────────────── */}
        <span className="min-w-[56px] text-right font-mono text-xs tabular-nums text-muted-foreground">
          {displayStep}/{totalSteps > 0 ? totalSteps - 1 : 0}
        </span>
      </div>
    </div>
  );
});

TimelineScrubber.displayName = "TimelineScrubber";
