"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sidebarItemVariants = cva(
  "group relative flex items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-foreground-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
        active:
          "bg-sidebar-accent text-sidebar-foreground font-medium",
        muted:
          "text-foreground-subtle hover:bg-sidebar-accent hover:text-foreground-muted",
      },
      size: {
        default: "h-8 gap-2.5 px-2 text-sm [&_svg]:size-4",
        sm: "h-7 gap-2 px-1.5 text-xs [&_svg]:size-3.5",
        lg: "h-9 gap-3 px-2.5 text-sm [&_svg]:size-5",
      },
      mode: {
        expanded: "w-full justify-start",
        compact: "w-8 justify-center",
      },
    },
    compoundVariants: [
      { mode: "compact", size: "sm", className: "w-7" },
      { mode: "compact", size: "lg", className: "w-9" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      mode: "expanded",
    },
  },
);

export interface SidebarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarItemVariants> {
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Optional badge count displayed after the label */
  badge?: number;
}

const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  (
    { className, variant, size, mode, icon, badge, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(
          sidebarItemVariants({ variant, size, mode, className }),
          disabled && "pointer-events-none opacity-[var(--opacity-disabled)]",
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {mode !== "compact" && (
          <>
            <span className="truncate">{children}</span>
            {badge != null && badge > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-none text-primary-foreground">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);
SidebarItem.displayName = "SidebarItem";

export { SidebarItem, sidebarItemVariants };
