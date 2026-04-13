import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { openDB, put, get as idbGet } from "@/lib/persistence/idb-store";
import type { IDBHandle } from "@/lib/persistence/idb-store";

// ── IndexedDB persistence for warm-resume ─────────────────

const INTERVIEW_DB_NAME = "architex-interview";
const INTERVIEW_DB_VERSION = 1;
const INTERVIEW_STORE_NAME = "session";
const INTERVIEW_SESSION_KEY = "current";

interface PersistedInterviewState {
  key: string;
  activeChallenge: Challenge | null;
  challengeStatus: ChallengeStatus;
  timerStartedAt: number | null;
  timerDurationMs: number;
  timerPaused: boolean;
  hintsUsed: number;
  revealedHints: RevealedHint[];
  savedAt: number;
}

let _interviewDB: IDBHandle | null = null;

async function getInterviewDB(): Promise<IDBHandle> {
  if (_interviewDB) return _interviewDB;
  _interviewDB = await openDB(INTERVIEW_DB_NAME, INTERVIEW_DB_VERSION, {
    stores: { [INTERVIEW_STORE_NAME]: "key" },
  });
  return _interviewDB;
}

async function persistInterviewState(state: InterviewState): Promise<void> {
  try {
    const handle = await getInterviewDB();
    const data: PersistedInterviewState = {
      key: INTERVIEW_SESSION_KEY,
      activeChallenge: state.activeChallenge,
      challengeStatus: state.challengeStatus,
      timerStartedAt: state.timerStartedAt,
      timerDurationMs: state.timerDurationMs,
      timerPaused: state.timerPaused,
      hintsUsed: state.hintsUsed,
      revealedHints: state.revealedHints,
      savedAt: Date.now(),
    };
    await put(handle, INTERVIEW_STORE_NAME, data);
  } catch {
    // IndexedDB unavailable (SSR, private browsing) — silently skip
  }
}

async function loadInterviewState(): Promise<PersistedInterviewState | null> {
  try {
    const handle = await getInterviewDB();
    const data = await idbGet<PersistedInterviewState>(
      handle,
      INTERVIEW_STORE_NAME,
      INTERVIEW_SESSION_KEY,
    );
    return data ?? null;
  } catch {
    return null;
  }
}

export type ChallengeStatus =
  | "not-started"
  | "in-progress"
  | "submitted"
  | "evaluated";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  timeMinutes: number;
  requirements: string[];
  checklistItems: string[];
}

export interface EvaluationScore {
  functionalRequirements: number;
  apiDesign: number;
  dataModel: number;
  scalability: number;
  reliability: number;
  tradeoffAwareness: number;
  feedback: string;
  suggestions: string[];
}

/** Tracks which hint levels have been revealed and their cost. */
export interface RevealedHint {
  level: 1 | 2 | 3 | 4;
  pointsCost: number;
}

/** Summary shown after submission. */
export interface HintUsageSummary {
  totalUsed: number;
  totalAvailable: number;
  totalPointsDeducted: number;
  breakdown: Array<{ level: number; pointsCost: number }>;
}

interface InterviewState {
  // Challenge
  activeChallenge: Challenge | null;
  challengeStatus: ChallengeStatus;

  // Timer
  timerStartedAt: number | null;
  timerDurationMs: number;
  timerPaused: boolean;

  // Hints
  hintsUsed: number;
  maxHints: number;
  revealedHints: RevealedHint[];

  // AI hint
  aiHintText: string | null;
  aiHintLoading: boolean;
  aiHintError: string | null;

  // Score
  evaluation: EvaluationScore | null;

  // Actions
  startChallenge: (challenge: Challenge) => void;
  submitChallenge: () => void;
  setEvaluation: (evaluation: EvaluationScore) => void;
  useHint: () => void;
  revealHint: (level: 1 | 2 | 3 | 4, pointsCost: number) => void;
  isHintRevealed: (level: number) => boolean;
  setAiHint: (text: string | null, error?: string | null) => void;
  setAiHintLoading: (loading: boolean) => void;
  getHintUsageSummary: () => HintUsageSummary;
  toggleTimer: () => void;
  resetInterview: () => void;
}

export const useInterviewStore = create<InterviewState>()(subscribeWithSelector((set, get) => ({
  activeChallenge: null,
  challengeStatus: "not-started",
  timerStartedAt: null,
  timerDurationMs: 0,
  timerPaused: false,
  hintsUsed: 0,
  maxHints: 4,
  revealedHints: [],
  aiHintText: null,
  aiHintLoading: false,
  aiHintError: null,
  evaluation: null,

  startChallenge: (challenge) =>
    set({
      activeChallenge: challenge,
      challengeStatus: "in-progress",
      timerStartedAt: Date.now(),
      timerDurationMs: challenge.timeMinutes * 60 * 1000,
      timerPaused: false,
      hintsUsed: 0,
      revealedHints: [],
      aiHintText: null,
      aiHintLoading: false,
      aiHintError: null,
      evaluation: null,
    }),

  submitChallenge: () => set({ challengeStatus: "submitted" }),

  setEvaluation: (evaluation) =>
    set({ evaluation, challengeStatus: "evaluated" }),

  useHint: () =>
    set((s) => ({
      hintsUsed: Math.min(s.hintsUsed + 1, s.maxHints),
    })),

  revealHint: (level, pointsCost) =>
    set((s) => {
      if (s.revealedHints.some((h) => h.level === level)) return s;
      return {
        revealedHints: [...s.revealedHints, { level, pointsCost }],
        hintsUsed: s.hintsUsed + 1,
      };
    }),

  isHintRevealed: (level) => {
    return get().revealedHints.some((h) => h.level === level);
  },

  setAiHint: (text, error = null) =>
    set({ aiHintText: text, aiHintError: error, aiHintLoading: false }),

  setAiHintLoading: (loading) => set({ aiHintLoading: loading }),

  getHintUsageSummary: () => {
    const s = get();
    const totalPointsDeducted = s.revealedHints.reduce(
      (sum, h) => sum + h.pointsCost,
      0,
    );
    return {
      totalUsed: s.revealedHints.length,
      totalAvailable: s.maxHints,
      totalPointsDeducted,
      breakdown: s.revealedHints.map((h) => ({
        level: h.level,
        pointsCost: h.pointsCost,
      })),
    };
  },

  toggleTimer: () => set((s) => ({ timerPaused: !s.timerPaused })),

  resetInterview: () =>
    set({
      activeChallenge: null,
      challengeStatus: "not-started",
      timerStartedAt: null,
      timerDurationMs: 0,
      timerPaused: false,
      hintsUsed: 0,
      revealedHints: [],
      aiHintText: null,
      aiHintLoading: false,
      aiHintError: null,
      evaluation: null,
    }),
})));

// ── Warm-resume: hydrate from IndexedDB on startup ──────────

if (typeof window !== "undefined") {
  loadInterviewState().then((saved) => {
    if (!saved) return;
    // Only restore sessions that are still in-progress and less than 4 hours old
    const MAX_AGE_MS = 4 * 60 * 60 * 1000;
    const isRecent = Date.now() - saved.savedAt < MAX_AGE_MS;
    const isResumable =
      saved.challengeStatus === "in-progress" && saved.activeChallenge !== null;

    if (isRecent && isResumable) {
      useInterviewStore.setState({
        activeChallenge: saved.activeChallenge,
        challengeStatus: saved.challengeStatus,
        timerStartedAt: saved.timerStartedAt,
        timerDurationMs: saved.timerDurationMs,
        timerPaused: true, // Always resume paused so the user can orient
        hintsUsed: saved.hintsUsed,
        revealedHints: saved.revealedHints,
      });
    }
  });

  // Auto-persist on state changes (debounced via microtask)
  let persistQueued = false;
  useInterviewStore.subscribe(
    (state) => ({
      activeChallenge: state.activeChallenge,
      challengeStatus: state.challengeStatus,
      timerStartedAt: state.timerStartedAt,
      timerDurationMs: state.timerDurationMs,
      timerPaused: state.timerPaused,
      hintsUsed: state.hintsUsed,
      revealedHints: state.revealedHints,
    }),
    () => {
      if (persistQueued) return;
      persistQueued = true;
      queueMicrotask(() => {
        persistQueued = false;
        void persistInterviewState(useInterviewStore.getState());
      });
    },
    { equalityFn: shallow },
  );
}
