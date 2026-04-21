"use client";

import { useCallback, useMemo } from "react";
import {
  canAdvance,
  gatePredicateFor,
  isTerminalStage,
  nextStage,
  previousStage,
  type DrillStage,
  type GateResult,
} from "@/lib/lld/drill-stages";
import { useDrillStore, type StageProgressBag } from "@/stores/drill-store";

export interface UseDrillStageResult {
  currentStage: DrillStage;
  nextStage: DrillStage | null;
  previousStage: DrillStage | null;
  isTerminal: boolean;
  gate: GateResult;
  advance: () => void;
  retreat: () => void;
}

// Stable fallback reference — returning a fresh `{}` from the Zustand
// selector on every call tripped React's useSyncExternalStore snapshot
// invariant ("getSnapshot should be cached to avoid an infinite loop").
const EMPTY_PROGRESS: Readonly<StageProgressBag> = Object.freeze(
  {} as StageProgressBag,
);

export function useDrillStage(): UseDrillStageResult {
  const currentStage = useDrillStore((s) => s.currentStage);
  const enterStage = useDrillStore((s) => s.enterStage);
  const stageProgress = useDrillStore(
    (s) => s.stageProgress[s.currentStage] ?? EMPTY_PROGRESS,
  );

  const gate = useMemo<GateResult>(
    () => gatePredicateFor(currentStage)(stageProgress),
    [currentStage, stageProgress],
  );

  const next = useMemo(() => nextStage(currentStage), [currentStage]);
  const prev = useMemo(() => previousStage(currentStage), [currentStage]);

  const advance = useCallback(() => {
    if (!canAdvance(currentStage, stageProgress)) return;
    if (!next) return;
    enterStage(next);
  }, [currentStage, stageProgress, next, enterStage]);

  const retreat = useCallback(() => {
    if (!prev) return;
    enterStage(prev);
  }, [prev, enterStage]);

  return {
    currentStage,
    nextStage: next,
    previousStage: prev,
    isTerminal: isTerminalStage(currentStage),
    gate,
    advance,
    retreat,
  };
}
