"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the toolbar is visible */
  open: boolean;
  /** Position relative to the viewport or a reference element */
  position?: { x: number; y: number };
  /** Side of the position to anchor from */
  anchor?: "top" | "bottom";
}

const FloatingToolbar = React.forwardRef<HTMLDivElement, FloatingToolbarProps>(
  ({ className, open, position, anchor = "top", children, style, ...props }, ref) => {
    if (!open) return null;

    const positionStyles: React.CSSProperties = position
      ? {
          position: "absolute",
          left: position.x,
          ...(anchor === "top"
            ? { top: position.y }
            : { bottom: position.y }),
        }
      : {};

    return (
      <div
        ref={ref}
        role="toolbar"
        className={cn(
          "z-[var(--z-popover)] flex items-center gap-0.5 rounded-lg border border-border bg-elevated p-1 shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          className,
        )}
        style={{ ...positionStyles, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
FloatingToolbar.displayName = "FloatingToolbar";

/* ── Divider between groups of toolbar items ── */
const FloatingToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mx-0.5 h-5 w-px shrink-0 bg-border", className)}
    {...props}
  />
));
FloatingToolbarSeparator.displayName = "FloatingToolbarSeparator";

export { FloatingToolbar, FloatingToolbarSeparator };
