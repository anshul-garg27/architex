"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useBlueprintStore } from "@/stores/blueprint-store";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import {
  blueprintWelcomeShown,
  blueprintWelcomeDismissed,
} from "@/lib/analytics/blueprint-events";
import { cn } from "@/lib/utils";

/**
 * First-visit welcome banner. Visible once per user; dismissal
 * persists to the server (via journey-state sync) and to localStorage
 * (via the store's persist middleware).
 *
 * The three CTAs all dismiss the banner; "Close" (X) dismisses
 * without navigating.
 */
export function WelcomeBanner() {
  const router = useRouter();
  const welcomeDismissed = useBlueprintStore((s) => s.welcomeDismissed);
  const dismissWelcome = useBlueprintStore((s) => s.dismissWelcome);
  const { track } = useBlueprintAnalytics();

  // Fire shown event once per mount when visible.
  useEffect(() => {
    if (!welcomeDismissed) {
      track(blueprintWelcomeShown());
    }
  }, [welcomeDismissed, track]);

  const actions = useMemo(
    () => [
      {
        id: "start_course" as const,
        label: "Start the course",
        sub: "Unit 1 · What is a design pattern?",
        href: "/modules/blueprint/unit/what-is-a-pattern",
        primary: true,
      },
      {
        id: "drill_problem" as const,
        label: "Drill a problem",
        sub: "Jump straight to a timed challenge",
        href: "/modules/blueprint/toolkit/problems",
        primary: false,
      },
      {
        id: "browse_patterns" as const,
        label: "Browse patterns",
        sub: "See all 36 in the library",
        href: "/modules/blueprint/toolkit/patterns",
        primary: false,
      },
    ],
    [],
  );

  if (welcomeDismissed) return null;

  const handleAction = (
    action: "start_course" | "drill_problem" | "browse_patterns" | "close",
    href?: string,
  ) => {
    dismissWelcome();
    track(blueprintWelcomeDismissed({ action }));
    if (href) router.push(href);
  };

  return (
    <div
      role="banner"
      aria-label="Welcome to Blueprint"
      className="relative mx-auto my-6 w-full max-w-5xl overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/8 via-background to-sky-500/5 p-8 shadow-[0_1px_0_rgba(0,0,0,.02),_0_30px_60px_-20px_rgba(99,102,241,.18)]"
    >
      <button
        type="button"
        aria-label="Dismiss welcome"
        onClick={() => handleAction("close")}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
          Welcome to Blueprint
        </p>
        <h1 className="mt-2 text-3xl font-semibold italic text-foreground">
          A course in object-oriented design.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          Twelve hand-authored units, thirty-six canonical patterns, and
          a working studio to try them in. Start where you like — you
          can always find your way back here.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => handleAction(a.id, a.href)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
              a.primary
                ? "border-indigo-400/50 bg-indigo-500/10 hover:bg-indigo-500/15"
                : "border-border bg-background/60 hover:bg-foreground/5",
            )}
          >
            <span
              className={cn(
                "text-sm font-semibold",
                a.primary ? "text-indigo-700 dark:text-indigo-300" : "text-foreground",
              )}
            >
              {a.label}
            </span>
            <span className="text-xs text-foreground-muted">{a.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
