"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Recommended Bridges Widget (CROSS-008)
// Shows recommended related modules based on current activity.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { ModuleType } from "@/stores/ui-store";
import {
  evaluateRules,
  type BridgeRuleContext,
} from "@/lib/cross-module/bridge-rules";
import { BridgeButton } from "./BridgeButton";

interface RecommendedBridgesProps {
  conceptId?: string;
  algorithmId?: string;
  dataStructureId?: string;
  patternId?: string;
  topic?: string;
  exerciseCompleted?: boolean;
  tags?: string[];
  className?: string;
}

export const RecommendedBridges = memo(function RecommendedBridges({
  conceptId,
  algorithmId,
  dataStructureId,
  patternId,
  topic,
  exerciseCompleted,
  tags,
  className,
}: RecommendedBridgesProps) {
  const activeModule = useUIStore((s) => s.activeModule);

  const context: BridgeRuleContext = useMemo(
    () => ({
      activeModule,
      conceptId,
      algorithmId,
      dataStructureId,
      patternId,
      topic,
      exerciseCompleted,
      tags,
    }),
    [activeModule, conceptId, algorithmId, dataStructureId, patternId, topic, exerciseCompleted, tags],
  );

  const matchingRules = useMemo(() => evaluateRules(context), [context]);

  if (matchingRules.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-primary)] px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        <h4 className="text-xs font-semibold text-[var(--text-primary)]">
          Related Modules
        </h4>
        <span className="rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
          {matchingRules.length}
        </span>
      </div>

      <div className="space-y-1 p-2">
        {matchingRules.map((rule) => {
          const payload = rule.createPayload(context);
          return (
            <BridgeButton
              key={rule.id}
              payload={payload}
              label={rule.label}
              sourceModule={rule.sourceModule}
              targetModule={rule.targetModule}
              variant="card"
            />
          );
        })}
      </div>
    </div>
  );
});
