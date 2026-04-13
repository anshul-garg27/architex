"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Available playback speed presets */
const SPEED_PRESETS = [0.25, 0.5, 1, 2, 4] as const;
export type SpeedPreset = (typeof SPEED_PRESETS)[number];

/** Keyboard shortcut labels for each speed (for display only) */
const SPEED_SHORTCUTS: Record<SpeedPreset, string> = {
  0.25: "",
  0.5: "",
  1: "1",
  2: "2",
  4: "4",
};

const speedButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]",
  {
    variants: {
      active: {
        true: "bg-primary text-primary-foreground",
        false: "text-foreground-muted hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-7 min-w-[40px] px-2",
        sm: "h-6 min-w-[32px] px-1.5 text-[11px]",
      },
    },
    defaultVariants: {
      active: false,
      size: "default",
    },
  },
);

type SpeedControlMode = "toggle-group" | "dropdown";

export interface SpeedControlProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    Pick<VariantProps<typeof speedButtonVariants>, "size"> {
  /** Current speed */
  value: SpeedPreset;
  /** Called when user selects a new speed */
  onChange?: (speed: SpeedPreset) => void;
  /** Display mode */
  mode?: SpeedControlMode;
  /** Show keyboard shortcut labels */
  showShortcuts?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const SpeedControl = React.forwardRef<HTMLDivElement, SpeedControlProps>(
  (
    {
      className,
      value,
      onChange,
      size,
      mode = "toggle-group",
      showShortcuts = false,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    const handleSelect = React.useCallback(
      (speed: SpeedPreset) => {
        if (disabled) return;
        onChange?.(speed);
        setDropdownOpen(false);
      },
      [disabled, onChange],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        const key = e.key;
        // Number key shortcuts
        if (key === "1") {
          e.preventDefault();
          onChange?.(1);
        } else if (key === "2") {
          e.preventDefault();
          onChange?.(2);
        } else if (key === "4") {
          e.preventDefault();
          onChange?.(4);
        }
      },
      [disabled, onChange],
    );

    if (mode === "dropdown") {
      return (
        <div
          ref={ref}
          className={cn("relative", className)}
          onKeyDown={handleKeyDown}
          {...props}
        >
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={`Speed: ${value}x`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={cn(
              speedButtonVariants({ active: false, size }),
              "border border-border",
            )}
          >
            {value}x
          </button>
          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Playback speed"
              className="absolute bottom-full left-0 z-[var(--z-dropdown)] mb-1 flex flex-col gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md"
            >
              {SPEED_PRESETS.map((speed) => (
                <button
                  key={speed}
                  role="option"
                  aria-selected={speed === value}
                  type="button"
                  onClick={() => handleSelect(speed)}
                  className={cn(
                    speedButtonVariants({ active: speed === value, size }),
                    "w-full",
                  )}
                >
                  {speed}x
                  {showShortcuts && SPEED_SHORTCUTS[speed] && (
                    <kbd className="ml-1.5 rounded bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground">
                      {SPEED_SHORTCUTS[speed]}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Toggle group mode (default)
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Playback speed"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5",
          disabled && "opacity-[var(--opacity-disabled)]",
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {SPEED_PRESETS.map((speed) => (
          <button
            key={speed}
            role="radio"
            type="button"
            aria-checked={speed === value}
            aria-label={`${speed}x speed`}
            disabled={disabled}
            onClick={() => handleSelect(speed)}
            className={cn(speedButtonVariants({ active: speed === value, size }))}
          >
            {speed}x
            {showShortcuts && SPEED_SHORTCUTS[speed] && (
              <kbd className="ml-1 rounded bg-muted/50 px-1 py-0.5 font-mono text-[9px] text-muted-foreground">
                {SPEED_SHORTCUTS[speed]}
              </kbd>
            )}
          </button>
        ))}
      </div>
    );
  },
);
SpeedControl.displayName = "SpeedControl";

export { SpeedControl, SPEED_PRESETS, SPEED_SHORTCUTS, speedButtonVariants };
