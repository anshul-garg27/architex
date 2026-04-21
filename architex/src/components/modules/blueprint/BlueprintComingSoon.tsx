"use client";

import { cn } from "@/lib/utils";

/**
 * Placeholder shown on every Blueprint route whose content ships in a
 * later sub-project. The `subprojectId` is baked into the UI so a
 * future contributor can grep back from a screenshot to the right
 * plan.
 */
export function BlueprintComingSoon({
  subprojectId,
  hint,
  className,
}: {
  subprojectId: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-12 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
        {subprojectId}
      </div>
      <h2 className="text-2xl font-semibold italic text-foreground">
        Coming soon.
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-foreground-muted">
        {hint ??
          "This surface is scheduled for a later sub-project. The scaffolding is in place; the content lands next."}
      </p>
    </div>
  );
}
