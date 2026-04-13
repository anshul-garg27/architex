import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChallengeAttempt {
  challengeId: string;
  completedAt: string; // ISO date
  score: number;
  timeSpentSeconds: number;
  hintsUsed: number;
  scores: Record<string, number>; // per-dimension
}

interface ProgressState {
  attempts: ChallengeAttempt[];
  totalXP: number;
  streakDays: number;
  lastActiveDate: string; // ISO date

  // Actions
  addAttempt: (attempt: ChallengeAttempt) => void;
  addXP: (amount: number) => void;
  updateStreak: () => void;
  getAttemptsByChallenge: (challengeId: string) => ChallengeAttempt[];
  getBestScore: (challengeId: string) => number;
  getCompletedCount: () => number;
  getAverageScore: () => number;
}

function isConsecutiveDay(prev: string, current: string): boolean {
  const prevDate = new Date(prev);
  const currentDate = new Date(current);
  const diffMs = currentDate.getTime() - prevDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      attempts: [],
      totalXP: 0,
      streakDays: 0,
      lastActiveDate: "",

      addAttempt: (attempt) =>
        set((state) => ({
          attempts: [...state.attempts, attempt],
        })),

      addXP: (amount) =>
        set((state) => ({
          totalXP: state.totalXP + amount,
        })),

      updateStreak: () =>
        set((state) => {
          const today = new Date().toISOString();
          const todayStr = today.slice(0, 10);
          const lastStr = state.lastActiveDate
            ? state.lastActiveDate.slice(0, 10)
            : "";

          // Already active today -- no change
          if (lastStr === todayStr) {
            return state;
          }

          // Consecutive day
          if (
            state.lastActiveDate &&
            isConsecutiveDay(state.lastActiveDate, today)
          ) {
            return {
              streakDays: state.streakDays + 1,
              lastActiveDate: today,
            };
          }

          // Same day handled above; if not consecutive, streak resets to 1
          return {
            streakDays: 1,
            lastActiveDate: today,
          };
        }),

      getAttemptsByChallenge: (challengeId) =>
        get().attempts.filter((a) => a.challengeId === challengeId),

      getBestScore: (challengeId) => {
        const challengeAttempts = get().attempts.filter(
          (a) => a.challengeId === challengeId,
        );
        if (challengeAttempts.length === 0) return 0;
        return Math.max(...challengeAttempts.map((a) => a.score));
      },

      getCompletedCount: () => {
        const ids = new Set(get().attempts.map((a) => a.challengeId));
        return ids.size;
      },

      getAverageScore: () => {
        const { attempts } = get();
        if (attempts.length === 0) return 0;
        const sum = attempts.reduce((acc, a) => acc + a.score, 0);
        return Math.round((sum / attempts.length) * 10) / 10;
      },
    }),
    {
      name: "architex-progress",
    },
  ),
);
