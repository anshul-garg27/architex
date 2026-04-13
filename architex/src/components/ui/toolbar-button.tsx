"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const toolbarButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-foreground-muted hover:bg-accent hover:text-accent-foreground",
        active:
          "bg-accent text-foreground",
        ghost:
          "text-foreground-muted hover:text-foreground",
      },
      size: {
        default: "h-8 w-8 [&_svg]:size-4",
        sm: "h-6 w-6 [&_svg]:size-3.5",
        lg: "h-9 w-9 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toolbarButtonVariants> {
  /** Tooltip text shown on hover */
  tooltip?: string;
  /** Side where tooltip appears */
  tooltipSide?: "top" | "bottom" | "left" | "right";
  /** Keyboard shortcut displayed in tooltip */
  shortcut?: string;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      className,
      variant,
      size,
      tooltip,
      tooltipSide = "bottom",
      shortcut,
      children,
      ...props
    },
    ref,
  ) => {
    const button = (
      <button
        ref={ref}
        className={cn(toolbarButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>
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
ToolbarButton.displayName = "ToolbarButton";

export { ToolbarButton, toolbarButtonVariants };
