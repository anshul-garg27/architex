"use client";

import * as React from "react";
import {
  SkipBack,
  Rewind,
  Play,
  Pause,
  FastForward,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { TimelineScrubber } from "@/components/ui/timeline-scrubber";
import { SpeedControl, type SpeedPreset } from "@/components/ui/speed-control";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const transportVariants = cva(
  "flex items-center border border-border bg-surface",
  {
    variants: {
      variant: {
        full: "gap-3 rounded-lg px-4 py-2",
        compact: "gap-1.5 rounded-md px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "full",
    },
  },
);

/* ── Transport button ── */
interface TransportButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  shortcut?: string;
  compact?: boolean;
}

const TransportButton = React.forwardRef<HTMLButtonElement, TransportButtonProps>(
  ({ tooltip, shortcut, compact, className, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
          compact
            ? "h-6 w-6 [&_svg]:size-3.5"
            : "h-8 w-8 [&_svg]:size-4",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top">
          <span className="flex items-center gap-1.5">
            <span>{tooltip}</span>
            {shortcut && (
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {shortcut}
              </kbd>
            )}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  },
);
TransportButton.displayName = "TransportButton";

/* ── SimulationTransport ── */
export interface SimulationTransportProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof transportVariants> {
  /** Whether the simulation is currently playing */
  isPlaying: boolean;
  /** Current simulation tick/step (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Current playback speed */
  speed: SpeedPreset;

  /** Playback control callbacks */
  onPlayPause?: () => void;
  onStepBack?: () => void;
  onStepForward?: () => void;
  onSkipToStart?: () => void;
  onSkipToEnd?: () => void;
  onReset?: () => void;
  onSeek?: (step: number) => void;
  onSpeedChange?: (speed: SpeedPreset) => void;

  /** Disabled state for the entire transport bar */
  disabled?: boolean;
  /** Show step markers on the timeline */
  showMarkers?: boolean;
}

const SimulationTransport = React.forwardRef<
  HTMLDivElement,
  SimulationTransportProps
>(
  (
    {
      className,
      variant,
      isPlaying,
      currentStep,
      totalSteps,
      speed,
      onPlayPause,
      onStepBack,
      onStepForward,
      onSkipToStart,
      onSkipToEnd,
      onReset,
      onSeek,
      onSpeedChange,
      disabled = false,
      showMarkers = false,
      ...props
    },
    ref,
  ) => {
    const isCompact = variant === "compact";

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        switch (e.key) {
          case " ":
            e.preventDefault();
            onPlayPause?.();
            break;
          case "r":
          case "R":
            if (!e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              onReset?.();
            }
            break;
          default:
            break;
        }
      },
      [disabled, onPlayPause, onReset],
    );

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Simulation transport controls"
        className={cn(
          transportVariants({ variant }),
          disabled && "opacity-[var(--opacity-disabled)]",
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Playback controls */}
        <div className="flex items-center gap-0.5">
          <TransportButton
            tooltip="Skip to start"
            shortcut="Home"
            compact={isCompact}
            disabled={disabled || currentStep === 0}
            onClick={onSkipToStart}
          >
            <SkipBack />
          </TransportButton>
          <TransportButton
            tooltip="Step back"
            shortcut={"\u2190"}
            compact={isCompact}
            disabled={disabled || currentStep === 0}
            onClick={onStepBack}
          >
            <Rewind />
          </TransportButton>
          <TransportButton
            tooltip={isPlaying ? "Pause" : "Play"}
            shortcut="Space"
            compact={isCompact}
            disabled={disabled}
            onClick={onPlayPause}
            className={cn(
              isPlaying
                ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                : "",
            )}
          >
            {isPlaying ? <Pause /> : <Play />}
          </TransportButton>
          <TransportButton
            tooltip="Step forward"
            shortcut={"\u2192"}
            compact={isCompact}
            disabled={disabled || currentStep >= totalSteps - 1}
            onClick={onStepForward}
          >
            <FastForward />
          </TransportButton>
          <TransportButton
            tooltip="Skip to end"
            shortcut="End"
            compact={isCompact}
            disabled={disabled || currentStep >= totalSteps - 1}
            onClick={onSkipToEnd}
          >
            <SkipForward />
          </TransportButton>
        </div>

        {/* Timeline scrubber */}
        {!isCompact && (
          <div className="flex-1">
            <TimelineScrubber
              value={currentStep}
              max={totalSteps}
              onChange={onSeek}
              showMarkers={showMarkers}
              disabled={disabled}
            />
          </div>
        )}

        {/* Speed control */}
        <SpeedControl
          value={speed}
          onChange={onSpeedChange}
          mode={isCompact ? "dropdown" : "toggle-group"}
          size={isCompact ? "sm" : "default"}
          disabled={disabled}
        />

        {/* Separator + Reset */}
        <div className={cn(
          "h-5 w-px bg-border",
          isCompact && "h-4",
        )} />
        <TransportButton
          tooltip="Reset"
          shortcut="R"
          compact={isCompact}
          disabled={disabled}
          onClick={onReset}
        >
          <RotateCcw />
        </TransportButton>
      </div>
    );
  },
);
SimulationTransport.displayName = "SimulationTransport";

export { SimulationTransport, transportVariants };
