"use client";

import { useCallback, useMemo, useState } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { variantConfigFor } from "@/lib/lld/drill-variants";
import type { HintTier } from "@/lib/ai/hint-system";

// Phase 4 penalty schedule (study = 0 regardless of tier).
const TIER_PENALTY: Record<HintTier, number> = {
  nudge: 3,
  guided: 10,
  "full-explanation": 20,
};

// Alias the Phase 4 UI tier names → existing HintTier.
export type UITier = "nudge" | "hint" | "reveal";
const UI_TO_ENGINE: Record<UITier, HintTier> = {
  nudge: "nudge",
  hint: "guided",
  reveal: "full-explanation",
};
const TIER_ORDER: UITier[] = ["nudge", "hint", "reveal"];

export interface UseDrillHintLadderResult {
  remainingBudget: number | null; // null = unlimited (study)
  consumedTiers: UITier[];
  canRequestTier: (tier: UITier) => boolean;
  requestTier: (tier: UITier) => Promise<string | null>;
  lastHintContent: string | null;
  isLoading: boolean;
}

export function useDrillHintLadder(
  attemptId: string | null,
): UseDrillHintLadderResult {
  const variant = useDrillStore((s) => s.variant);
  const hintLog = useDrillStore((s) => s.hintLog);
  const hintPenaltyTotal = useDrillStore((s) => s.hintPenaltyTotal);
  const currentStage = useDrillStore((s) => s.currentStage);
  const recordHintPenalty = useDrillStore((s) => s.recordHintPenalty);
  const [lastHintContent, setLastHintContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cfg = variantConfigFor(variant);

  const consumedTiers = useMemo<UITier[]>(
    () =>
      hintLog
        .filter((h) => h.stage === currentStage)
        .map((h) => {
          const entry = (Object.entries(UI_TO_ENGINE) as [UITier, HintTier][])
            .find(([, engineTier]) => engineTier === h.tier);
          return entry?.[0] ?? "nudge";
        }),
    [hintLog, currentStage],
  );

  const highestConsumedIdx = useMemo(() => {
    if (consumedTiers.length === 0) return -1;
    return consumedTiers.reduce(
      (max, t) => Math.max(max, TIER_ORDER.indexOf(t)),
      -1,
    );
  }, [consumedTiers]);

  const remainingBudget =
    cfg.maxHintPenalty === null
      ? null
      : Math.max(0, cfg.maxHintPenalty - hintPenaltyTotal);

  const canRequestTier = useCallback(
    (tier: UITier): boolean => {
      if (!cfg.hintsAllowed) return false;
      const tierIdx = TIER_ORDER.indexOf(tier);
      // Must be the next tier in the ladder.
      if (tierIdx !== highestConsumedIdx + 1) return false;
      // Budget check (timed-mock only).
      if (remainingBudget !== null) {
        const cost = variant === "study" ? 0 : TIER_PENALTY[UI_TO_ENGINE[tier]];
        if (cost > remainingBudget) return false;
      }
      return true;
    },
    [cfg.hintsAllowed, highestConsumedIdx, remainingBudget, variant],
  );

  const requestTier = useCallback(
    async (tier: UITier): Promise<string | null> => {
      if (!attemptId) return null;
      if (!canRequestTier(tier)) return null;

      const engineTier = UI_TO_ENGINE[tier];
      const penalty = variant === "study" ? 0 : TIER_PENALTY[engineTier];

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/lld/drill-attempts/${attemptId}/hint`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tier: engineTier,
              stage: currentStage,
            }),
          },
        );
        if (!res.ok) return null;
        const json = (await res.json()) as { content?: string };
        const content = json.content ?? null;
        recordHintPenalty(penalty, {
          tier: engineTier,
          stage: currentStage,
          content: content ?? undefined,
        });
        setLastHintContent(content);
        return content;
      } finally {
        setIsLoading(false);
      }
    },
    [attemptId, canRequestTier, variant, currentStage, recordHintPenalty],
  );

  return {
    remainingBudget,
    consumedTiers,
    canRequestTier,
    requestTier,
    lastHintContent,
    isLoading,
  };
}
