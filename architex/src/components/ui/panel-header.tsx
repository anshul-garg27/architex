"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary heading text */
  title: string;
  /** Optional secondary line of text */
  subtitle?: string;
  /** Action elements rendered on the right side */
  actions?: React.ReactNode;
  /** When true, shows a collapse/expand toggle */
  collapsible?: boolean;
  /** Controlled collapsed state (requires collapsible) */
  collapsed?: boolean;
  /** Called when the collapse toggle is clicked */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Hide the bottom separator line */
  hideSeparator?: boolean;
}

const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      actions,
      collapsible = false,
      collapsed = false,
      onCollapsedChange,
      hideSeparator = false,
      ...props
    },
    ref,
  ) => {
    const handleToggle = React.useCallback(() => {
      onCollapsedChange?.(!collapsed);
    }, [collapsed, onCollapsedChange]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          !hideSeparator && "border-b border-border",
          className,
        )}
        {...props}
      >
        <div className="flex min-h-[40px] items-center gap-2 px-4 py-2">
          {/* Collapse toggle */}
          {collapsible && (
            <button
              type="button"
              aria-label={collapsed ? "Expand panel" : "Collapse panel"}
              aria-expanded={!collapsed}
              onClick={handleToggle}
              className="flex-shrink-0 rounded-sm p-0.5 text-foreground-muted transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          )}

          {/* Title + subtitle block */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-tight text-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="truncate text-xs leading-tight text-foreground-muted">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right-aligned actions */}
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-1">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  },
);
PanelHeader.displayName = "PanelHeader";

export { PanelHeader };
