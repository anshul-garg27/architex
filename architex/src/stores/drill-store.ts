import { create } from "zustand";
import type { DrillStage, DrillStageProgress } from "@/lib/lld/drill-stages";
import type { DrillVariant } from "@/lib/lld/drill-variants";
import type { InterviewerPersona } from "@/lib/ai/interviewer-prompts";
import type { InterviewerTurn } from "@/lib/ai/interviewer-persona";
import type { RubricBreakdown } from "@/lib/lld/drill-rubric";
import type { HintTier } from "@/lib/ai/hint-system";

export type StageProgressBag = DrillStageProgress;

export interface HintLogEntry {
  tier: HintTier;
  stage: DrillStage;
  penalty: number;
  usedAt: number;
  content?: string;
}

export interface DrillStoreState {
  /** null before drill is started. */
  attemptId: string | null;
  variant: DrillVariant;
  persona: InterviewerPersona;

  currentStage: DrillStage;
  stageStartedAt: number; // epoch ms — updated on every enterStage
  stageProgress: Partial<Record<DrillStage, StageProgressBag>>;
  stageDurationsMs: Partial<Record<DrillStage, number>>;

  interviewerTurns: InterviewerTurn[];
  hintLog: HintLogEntry[];
  hintPenaltyTotal: number;

  rubricBreakdown: RubricBreakdown | null;
  finalScore: number | null;

  // ── Actions ────────────────────────────────────────────────────────
  reset: () => void;
  beginAttempt: (opts: {
    attemptId: string;
    variant: DrillVariant;
    persona: InterviewerPersona;
  }) => void;
  enterStage: (stage: DrillStage) => void;
  mergeStageProgress: (patch: Partial<StageProgressBag>) => void;
  appendInterviewerTurn: (turn: Omit<InterviewerTurn, "seq">) => void;
  recordHintPenalty: (penalty: number, entry?: Partial<HintLogEntry>) => void;
  setRubric: (rubric: RubricBreakdown, finalScore?: number) => void;
}

const initialState = (): Omit<
  DrillStoreState,
  | "reset"
  | "beginAttempt"
  | "enterStage"
  | "mergeStageProgress"
  | "appendInterviewerTurn"
  | "recordHintPenalty"
  | "setRubric"
> => ({
  attemptId: null,
  variant: "timed-mock",
  persona: "generic",
  currentStage: "clarify",
  stageStartedAt: 0,
  stageProgress: {},
  stageDurationsMs: {},
  interviewerTurns: [],
  hintLog: [],
  hintPenaltyTotal: 0,
  rubricBreakdown: null,
  finalScore: null,
});

export const useDrillStore = create<DrillStoreState>((set, get) => ({
  ...initialState(),

  reset: () => set(initialState()),

  beginAttempt: ({ attemptId, variant, persona }) =>
    set({
      ...initialState(),
      attemptId,
      variant,
      persona,
      stageStartedAt: Date.now(),
    }),

  enterStage: (stage) => {
    const now = Date.now();
    const previous = get();
    // Record the duration the user spent on the outgoing stage.
    const prevStage = previous.currentStage;
    const prevStart = previous.stageStartedAt || now;
    const spent = Math.max(0, now - prevStart);
    set({
      currentStage: stage,
      stageStartedAt: now,
      stageDurationsMs: {
        ...previous.stageDurationsMs,
        [prevStage]: (previous.stageDurationsMs[prevStage] ?? 0) + spent,
      },
    });
  },

  mergeStageProgress: (patch) => {
    const s = get();
    const bag = s.stageProgress[s.currentStage] ?? {};
    set({
      stageProgress: {
        ...s.stageProgress,
        [s.currentStage]: { ...bag, ...patch },
      },
    });
  },

  appendInterviewerTurn: (turn) => {
    const s = get();
    const seq = s.interviewerTurns.length;
    set({
      interviewerTurns: [
        ...s.interviewerTurns,
        { ...turn, seq } as InterviewerTurn,
      ],
    });
  },

  recordHintPenalty: (penalty, entry) => {
    const s = get();
    set({
      hintPenaltyTotal: s.hintPenaltyTotal + penalty,
      hintLog: [
        ...s.hintLog,
        {
          tier: (entry?.tier ?? "nudge") as HintTier,
          stage: (entry?.stage ?? s.currentStage) as DrillStage,
          penalty,
          usedAt: Date.now(),
          content: entry?.content,
        },
      ],
    });
  },

  setRubric: (rubric, finalScore) =>
    set({ rubricBreakdown: rubric, finalScore: finalScore ?? null }),
}));
