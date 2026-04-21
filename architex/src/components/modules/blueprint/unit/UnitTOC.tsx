"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlueprintUnitSectionPayload } from "@/hooks/blueprint/useUnit";

interface Props {
  sections: BlueprintUnitSectionPayload[];
  activeSectionId: string | null;
  completedSectionIds: Set<string>;
  onJump: (id: string) => void;
}

const TYPE_LABEL: Record<string, string> = {
  read: "Read",
  interact: "Quick check",
  retain: "Retain",
  reflect: "Reflect",
  apply: "Apply",
  practice: "Practice",
  checkpoint: "Checkpoint",
};

export function UnitTOC({
  sections,
  activeSectionId,
  completedSectionIds,
  onJump,
}: Props) {
  return (
    <nav
      aria-label="Unit table of contents"
      className="sticky top-[60px] max-h-[calc(100vh-8rem)] w-60 shrink-0 overflow-y-auto border-l border-border/30 px-4 py-6 text-xs"
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
        Contents
      </p>
      <ol className="space-y-1">
        {sections.map((s, idx) => {
          const active = s.id === activeSectionId;
          const done = completedSectionIds.has(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onJump(s.id)}
                className={cn(
                  "group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  active
                    ? "bg-indigo-500/10 text-foreground"
                    : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold tabular-nums",
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : active
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-foreground/20 text-foreground-subtle",
                  )}
                  aria-hidden
                >
                  {done ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-foreground" : "",
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                    {TYPE_LABEL[s.type] ?? s.type}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
