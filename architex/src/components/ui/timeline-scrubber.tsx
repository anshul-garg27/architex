"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineScrubberProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current step (0-indexed) */
  value: number;
  /** Total number of steps */
  max: number;
  /** Called when the user seeks to a new step */
  onChange?: (step: number) => void;
  /** Show discrete step markers on the track */
  showMarkers?: boolean;
  /** Maximum number of visible markers (avoids visual clutter) */
  maxVisibleMarkers?: number;
  /** Hide the position label */
  hideLabel?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const TimelineScrubber = React.forwardRef<HTMLDivElement, TimelineScrubberProps>(
  (
    {
      className,
      value,
      max,
      onChange,
      showMarkers = false,
      maxVisibleMarkers = 40,
      hideLabel = false,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const clampedValue = Math.min(Math.max(value, 0), Math.max(max - 1, 0));
    const percentage = max > 1 ? (clampedValue / (max - 1)) * 100 : 0;

    const stepFromPointer = React.useCallback(
      (clientX: number) => {
        const track = trackRef.current;
        if (!track || max <= 1) return 0;
        const rect = track.getBoundingClientRect();
        const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        return Math.round(ratio * (max - 1));
      },
      [max],
    );

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return;
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsDragging(true);
        const step = stepFromPointer(e.clientX);
        onChange?.(step);
      },
      [disabled, stepFromPointer, onChange],
    );

    const handlePointerMove = React.useCallback(
      (e: React.PointerEvent) => {
        if (!isDragging || disabled) return;
        const step = stepFromPointer(e.clientX);
        onChange?.(step);
      },
      [isDragging, disabled, stepFromPointer, onChange],
    );

    const handlePointerUp = React.useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        let nextStep = clampedValue;
        switch (e.key) {
          case "ArrowLeft":
          case "ArrowDown":
            e.preventDefault();
            nextStep = Math.max(clampedValue - 1, 0);
            break;
          case "ArrowRight":
          case "ArrowUp":
            e.preventDefault();
            nextStep = Math.min(clampedValue + 1, max - 1);
            break;
          case "Home":
            e.preventDefault();
            nextStep = 0;
            break;
          case "End":
            e.preventDefault();
            nextStep = max - 1;
            break;
          default:
            return;
        }
        onChange?.(nextStep);
      },
      [disabled, clampedValue, max, onChange],
    );

    // Compute which markers to show (skip if too many)
    const markerSteps = React.useMemo(() => {
      if (!showMarkers || max <= 1) return [];
      if (max <= maxVisibleMarkers) {
        return Array.from({ length: max }, (_, i) => i);
      }
      // Show evenly spaced markers
      const step = Math.ceil(max / maxVisibleMarkers);
      const markers: number[] = [];
      for (let i = 0; i < max; i += step) {
        markers.push(i);
      }
      if (markers[markers.length - 1] !== max - 1) {
        markers.push(max - 1);
      }
      return markers;
    }, [showMarkers, max, maxVisibleMarkers]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3",
          disabled && "opacity-[var(--opacity-disabled)]",
          className,
        )}
        {...props}
      >
        {/* Track area */}
        <div
          ref={trackRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={max > 0 ? max - 1 : 0}
          aria-valuenow={clampedValue}
          aria-label="Timeline position"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "relative flex h-6 flex-1 cursor-pointer items-center",
            disabled && "cursor-default",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          {/* Rail */}
          <div className="absolute left-0 right-0 h-1.5 rounded-full bg-muted" />

          {/* Filled portion */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-primary transition-[width] duration-75"
            style={{ width: `${percentage}%` }}
          />

          {/* Step markers */}
          {markerSteps.map((step) => {
            const pos = max > 1 ? (step / (max - 1)) * 100 : 0;
            return (
              <div
                key={step}
                className={cn(
                  "absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  step <= clampedValue
                    ? "bg-primary-foreground/60"
                    : "bg-foreground-subtle/40",
                )}
                style={{ left: `${pos}%` }}
              />
            );
          })}

          {/* Thumb */}
          <div
            className={cn(
              "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm transition-[left] duration-75",
              isDragging && "scale-110 ring-2 ring-primary/30",
              !disabled && "hover:ring-2 hover:ring-primary/20",
            )}
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Position label */}
        {!hideLabel && (
          <span className="flex-shrink-0 text-xs tabular-nums text-foreground-muted">
            {max > 0
              ? `Step ${clampedValue + 1}/${max}`
              : "Step 0/0"}
          </span>
        )}
      </div>
    );
  },
);
TimelineScrubber.displayName = "TimelineScrubber";

export { TimelineScrubber };
