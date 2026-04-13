"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── TabBar context ── */
interface TabBarContextValue {
  activeId: string;
  onSelect: (id: string) => void;
}

const TabBarContext = React.createContext<TabBarContextValue | null>(null);

function useTabBarContext() {
  const ctx = React.useContext(TabBarContext);
  if (!ctx) {
    throw new Error("TabBarItem must be used within a TabBar");
  }
  return ctx;
}

/* ── TabBar root ── */
export interface TabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Currently active tab id */
  value: string;
  /** Called when a tab is selected */
  onValueChange: (value: string) => void;
}

const TabBar = React.forwardRef<HTMLDivElement, TabBarProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    const ctxValue = React.useMemo<TabBarContextValue>(
      () => ({ activeId: value, onSelect: onValueChange }),
      [value, onValueChange],
    );

    return (
      <TabBarContext.Provider value={ctxValue}>
        <div
          ref={ref}
          role="tablist"
          className={cn(
            "relative flex items-center gap-1 border-b border-border",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TabBarContext.Provider>
    );
  },
);
TabBar.displayName = "TabBar";

/* ── TabBarItem ── */
export interface TabBarItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "id"> {
  /** Unique identifier for this tab */
  id: string;
  /** Optional icon placed before label */
  icon?: React.ReactNode;
}

const TabBarItem = React.forwardRef<HTMLButtonElement, TabBarItemProps>(
  ({ className, id, icon, children, ...props }, ref) => {
    const { activeId, onSelect } = useTabBarContext();
    const isActive = activeId === id;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        className={cn(
          "relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground/80",
          className,
        )}
        onClick={() => onSelect(id)}
        {...props}
      >
        {icon && (
          <span className="[&_svg]:size-4 [&_svg]:shrink-0">{icon}</span>
        )}
        <span>{children}</span>

        {/* Animated active indicator */}
        {isActive && (
          <span
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
            style={{
              animation: "tab-indicator-in 150ms ease-out",
            }}
          />
        )}
      </button>
    );
  },
);
TabBarItem.displayName = "TabBarItem";

export { TabBar, TabBarItem };
