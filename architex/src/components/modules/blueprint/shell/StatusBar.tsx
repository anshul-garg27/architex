"use client";

import { useBlueprintStore } from "@/stores/blueprint-store";

/**
 * Minimal bottom status strip. For SP1 we only surface the preferred
 * language. Streak, auto-save, review-due count etc. arrive with
 * their respective sub-projects; placeholders are marked `SP#`.
 */
export function StatusBar() {
  const preferredLang = useBlueprintStore((s) => s.preferredLang);

  return (
    <div className="flex h-7 shrink-0 items-center justify-end gap-3 border-t border-border/30 bg-background/60 px-3 text-[10px] text-foreground-muted">
      <span aria-label={`Preferred language ${preferredLang}`}>
        Lang: <span className="font-mono">{preferredLang.toUpperCase()}</span>
      </span>
    </div>
  );
}
