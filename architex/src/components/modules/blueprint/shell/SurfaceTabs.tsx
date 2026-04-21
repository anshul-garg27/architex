"use client";

import Link from "next/link";
import { Compass, Wrench, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlueprintRoute } from "@/hooks/blueprint/useBlueprintRoute";

interface Tab {
  id: "journey" | "toolkit" | "progress";
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  {
    id: "journey",
    label: "Journey",
    href: "/modules/blueprint",
    icon: Compass,
  },
  {
    id: "toolkit",
    label: "Toolkit",
    href: "/modules/blueprint/toolkit",
    icon: Wrench,
  },
  {
    id: "progress",
    label: "Progress",
    href: "/modules/blueprint/progress",
    icon: LineChart,
  },
];

/**
 * Three top-level surface tabs. Active surface derives from the URL
 * via useBlueprintRoute, never from local state.
 */
export function SurfaceTabs() {
  const { surface } = useBlueprintRoute();
  return (
    <nav
      className="flex items-center gap-1"
      aria-label="Blueprint surfaces"
      role="tablist"
    >
      {TABS.map((t) => {
        const active = t.id === surface;
        const Icon = t.icon;
        return (
          <Link
            key={t.id}
            href={t.href}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"
                : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
