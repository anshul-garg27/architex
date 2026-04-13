"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Concept Module Links (CROSS-009)
// Renders clickable cross-references to related modules.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo, useCallback } from "react";
import { ExternalLink, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { getConceptModules } from "@/lib/cross-module/concept-module-map";
import type { ConceptModuleRef } from "@/lib/cross-module/concept-module-map";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/cross-module/bridge-types";

interface ConceptModuleLinksProps {
  conceptId: string;
  /** Current module — will be highlighted differently. */
  currentModule?: string;
  className?: string;
}

export const ConceptModuleLinks = memo(function ConceptModuleLinks({
  conceptId,
  currentModule,
  className,
}: ConceptModuleLinksProps) {
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const refs = useMemo(() => getConceptModules(conceptId), [conceptId]);

  const handleNavigate = useCallback(
    (ref: ConceptModuleRef) => {
      setActiveModule(ref.module);
    },
    [setActiveModule],
  );

  if (refs.length === 0) return null;

  // Format concept ID for display
  const conceptLabel = conceptId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <BookOpen className="h-3 w-3" />
        <span>
          <span className="font-medium text-[var(--text-secondary)]">
            {conceptLabel}
          </span>{" "}
          appears in {refs.length} module{refs.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-1">
        {refs.map((ref) => {
          const isCurrent = ref.module === currentModule;
          const color = MODULE_COLORS[ref.module];
          const label = MODULE_LABELS[ref.module];

          return (
            <button
              key={`${ref.module}-${ref.path}`}
              type="button"
              onClick={() => handleNavigate(ref)}
              disabled={isCurrent}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-xs",
                "transition-colors",
                isCurrent
                  ? "cursor-default bg-[var(--bg-tertiary)] opacity-60"
                  : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              <span
                className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--text-primary)]">
                  {label}
                  {isCurrent && (
                    <span className="ml-1.5 text-[10px] text-[var(--text-tertiary)]">
                      (current)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[var(--text-tertiary)]">
                  {ref.description}
                </p>
              </div>
              {!isCurrent && (
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
