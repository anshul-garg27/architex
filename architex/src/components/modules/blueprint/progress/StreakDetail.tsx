"use client";

import { Flame } from "lucide-react";
import { useProgressSummary } from "@/hooks/blueprint/useProgressSummary";
import { cn } from "@/lib/utils";

/**
 * Year-of-squares heat map. V1 renders the grid shape with zero
 * active days — actual per-day activity data lands in SP6 when the
 * review session schedule populates a `blueprint_user_daily_activity`
 * table (not yet created; stubbed).
 *
 * Still worth shipping: users want to see the empty heat map as a
 * commitment device.
 */
const DAYS = 12 * 7; // rendered as 7 rows × 12 weeks = ~84 days

export function StreakDetail() {
  const { data } = useProgressSummary();
  const days = data?.streakDays ?? 0;
  const longest = days; // approximation for V1

  const cells = Array.from({ length: DAYS });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Your streak
        </h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
          A streak starts with a single day.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatBlock
          label="Current streak"
          value={`${days}d`}
          icon={<Flame className="h-4 w-4" />}
          tone="text-indigo-600 dark:text-indigo-300"
        />
        <StatBlock
          label="Longest streak"
          value={`${longest}d`}
          icon={<Flame className="h-4 w-4" />}
          tone="text-amber-600 dark:text-amber-300"
        />
        <StatBlock
          label="Target"
          value={`${data?.streakDays ? 30 : 7}d`}
          icon={<Flame className="h-4 w-4" />}
          tone="text-foreground-muted"
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Last 12 weeks
        </h2>
        <div className="flex gap-0.5 overflow-x-auto">
          {Array.from({ length: 12 }).map((_, col) => (
            <div key={col} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }).map((_, row) => {
                const idx = col * 7 + row;
                void idx;
                void cells;
                return (
                  <div
                    key={row}
                    className={cn(
                      "h-3 w-3 rounded-sm bg-foreground/5",
                    )}
                    aria-hidden
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-foreground-muted">
          Daily activity lights up cells here. Fills in as you review.
        </p>
      </section>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/60 p-4">
      <div className={cn("flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider", tone)}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}
