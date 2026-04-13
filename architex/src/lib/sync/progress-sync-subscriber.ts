/**
 * Progress store → server sync subscriber.
 *
 * Subscribes to Zustand progress-store mutations and debounces
 * POST calls to /api/progress when the feature flag is on.
 *
 * Works outside React (no hooks) so it can run in module scope.
 * Call initProgressSync() once in the app's client entry point.
 */

const USE_API = process.env.NEXT_PUBLIC_PROGRESS_USE_API === "true";
const DEBOUNCE_MS = 2000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncedState: string | null = null;

/**
 * Initialize the progress sync subscriber.
 * Safe to call multiple times — idempotent via flag check.
 */
export function initProgressSync() {
  if (!USE_API || typeof window === "undefined") return;

  // Dynamically import to avoid circular deps at module scope
  import("@/stores/progress-store").then(({ useProgressStore }) => {
    useProgressStore.subscribe((state) => {
      const snapshot = JSON.stringify({
        totalXP: state.totalXP,
        streakDays: state.streakDays,
        completedCount: new Set(state.attempts.map((a) => a.challengeId)).size,
      });

      // Skip if nothing changed
      if (snapshot === lastSyncedState) return;
      lastSyncedState = snapshot;

      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        syncProgressToServer(state).catch((err) => {
          console.warn("[progress-sync] Failed to sync:", err);
        });
      }, DEBOUNCE_MS);
    });
  });
}

async function syncProgressToServer(state: {
  totalXP: number;
  streakDays: number;
  attempts: Array<{ challengeId: string; score: number; completedAt: string }>;
}) {
  // Build per-module progress records from attempts
  const moduleScores = new Map<string, number>();

  for (const attempt of state.attempts) {
    // Extract module from challengeId (e.g., "lld-singleton" → "lld")
    const moduleId = attempt.challengeId.split("-")[0] || "general";
    const existing = moduleScores.get(moduleId) ?? 0;
    moduleScores.set(moduleId, Math.max(existing, attempt.score / 100));
  }

  // Also sync the overall XP as a "global" progress record
  const records = [
    {
      moduleId: "global",
      conceptId: "xp",
      score: Math.min(1, state.totalXP / 10000), // Normalize XP to 0-1
      completedAt: null,
    },
    {
      moduleId: "global",
      conceptId: "streak",
      score: Math.min(1, state.streakDays / 365), // Normalize streak to 0-1
      completedAt: null,
    },
    ...Array.from(moduleScores.entries()).map(([moduleId, score]) => ({
      moduleId,
      conceptId: "overall",
      score,
      completedAt: null,
    })),
  ];

  try {
    await fetch("/api/progress/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
  } catch {
    // Silently fail — localStorage has the data, will retry next change
  }
}
