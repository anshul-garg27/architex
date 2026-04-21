/**
 * LLD-018: Drill stage FSM
 *
 * 5-stage gated pipeline mirroring a real interview loop:
 *
 *   clarify → rubric → canvas → walkthrough → reflection
 *
 * Each stage has a "gate predicate". The gate must pass before the user
 * can advance. This keeps Drill mode honest — no sketching before scope,
 * no explaining before you've actually built, no grading until you've
 * articulated the design.
 */

import type { DrillStage } from "@/db/schema/lld-drill-attempts";

export { type DrillStage };

export const STAGE_ORDER: readonly DrillStage[] = [
  "clarify",
  "rubric",
  "canvas",
  "walkthrough",
  "reflection",
] as const;

export interface DrillStageProgress {
  questionsAsked?: number;
  rubricLocked?: boolean;
  canvasClassCount?: number;
  canvasEdgeCount?: number;
  walkthroughChars?: number;
  selfGrade?: number | null;
}

export interface GateResult {
  satisfied: boolean;
  reason?: string;
}

export type GatePredicate = (progress: DrillStageProgress) => GateResult;

const GATES: Record<DrillStage, GatePredicate> = {
  clarify: (p) => {
    const n = p.questionsAsked ?? 0;
    if (n < 2) {
      return {
        satisfied: false,
        reason: "Ask at least 2 clarifying questions.",
      };
    }
    return { satisfied: true };
  },
  rubric: (p) => {
    if (!p.rubricLocked) {
      return {
        satisfied: false,
        reason: "Confirm the scope and weights before moving on.",
      };
    }
    return { satisfied: true };
  },
  canvas: (p) => {
    const classes = p.canvasClassCount ?? 0;
    const edges = p.canvasEdgeCount ?? 0;
    if (classes < 3) {
      return {
        satisfied: false,
        reason: "Canvas needs at least 3 classes before you can narrate.",
      };
    }
    if (edges < 1) {
      return {
        satisfied: false,
        reason: "Classes need at least one relationship between them.",
      };
    }
    return { satisfied: true };
  },
  walkthrough: (p) => {
    const chars = p.walkthroughChars ?? 0;
    if (chars < 120) {
      return {
        satisfied: false,
        reason:
          "Narration is too short — walk through the flow in at least a few sentences.",
      };
    }
    return { satisfied: true };
  },
  reflection: (p) => {
    if (p.selfGrade === null || p.selfGrade === undefined) {
      return {
        satisfied: false,
        reason: "Rate your own performance before submitting.",
      };
    }
    return { satisfied: true };
  },
};

export function gatePredicateFor(stage: DrillStage): GatePredicate {
  return GATES[stage];
}

export function nextStage(stage: DrillStage): DrillStage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1] ?? null;
}

export function previousStage(stage: DrillStage): DrillStage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1] ?? null;
}

export function isTerminalStage(stage: DrillStage): boolean {
  return stage === "reflection";
}

export function canAdvance(
  stage: DrillStage,
  progress: DrillStageProgress,
): boolean {
  if (isTerminalStage(stage)) return false;
  return gatePredicateFor(stage)(progress).satisfied;
}
