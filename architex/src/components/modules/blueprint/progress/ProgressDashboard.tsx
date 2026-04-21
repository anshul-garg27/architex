"use client";

import Link from "next/link";
import { CheckCircle2, Star, Clock, Flame, ArrowRight } from "lucide-react";
import { useProgressSummary } from "@/hooks/blueprint/useProgressSummary";
import { cn } from "@/lib/utils";

function formatMs(ms: number): string {
  if (ms < 60_000) return "< 1 min";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours}h`;
}

/**
 * Progress dashboard landing — three stat cards plus quick links.
 * Heat strip is V1 minimal (30 cells, all unfilled) — real data wires
 * up with the review-session schedule in SP6.
 */
export function ProgressDashboard() {
  const { data, isLoading } = useProgressSummary();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading dashboard"
        className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border/30 bg-background/40"
          />
        ))}
      </div>
    );
  }

  const s = data ?? {
    unitsCompleted: 0,
    unitsMastered: 0,
    totalTimeMs: 0,
    streakDays: 0,
  };

  const cards = [
    {
      label: "Units completed",
      value: s.unitsCompleted.toString(),
      detail: `${s.unitsMastered} mastered`,
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    {
      label: "Patterns mastered",
      value: s.unitsMastered.toString(),
      detail: "Retention verified",
      icon: Star,
      tone: "text-amber-500",
    },
    {
      label: "Total time invested",
      value: formatMs(s.totalTimeMs),
      detail: "across all units",
      icon: Clock,
      tone: "text-indigo-500",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Your progress
          </h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            A snapshot of the work you&apos;ve put in.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-foreground-muted">
          <Flame className="h-3.5 w-3.5" aria-hidden />
          <span>
            <span className="tabular-nums">{s.streakDays}</span>
            -day streak
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/60 p-5"
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5",
                  c.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-foreground-muted">
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                  {c.value}
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {c.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Drill in
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              href: "/modules/blueprint/progress/patterns",
              title: "Pattern mastery",
              sub: "See which of 36 patterns you own",
            },
            {
              href: "/modules/blueprint/progress/problems",
              title: "Problem history",
              sub: "Your drill attempts and grades",
            },
            {
              href: "/modules/blueprint/progress/streak",
              title: "Streak detail",
              sub: "Daily activity heatmap",
            },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 px-4 py-3 transition-colors hover:border-indigo-400/60"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {l.title}
                </p>
                <p className="text-xs text-foreground-muted">{l.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-foreground-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
