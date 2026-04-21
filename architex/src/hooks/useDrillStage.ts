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
import { useDrillStore } from "@/stores/drill-store";

export interface UseDrillStageResult {
  currentStage: DrillStage;
  nextStage: DrillStage | null;
  previousStage: DrillStage | null;
  isTerminal: boolean;
  gate: GateResult;
  advance: () => void;
  retreat: () => void;
}

export function useDrillStage(): UseDrillStageResult {
  const currentStage = useDrillStore((s) => s.currentStage);
  const enterStage = useDrillStore((s) => s.enterStage);
  const stageProgress = useDrillStore(
    (s) => s.stageProgress[s.currentStage] ?? {},
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
