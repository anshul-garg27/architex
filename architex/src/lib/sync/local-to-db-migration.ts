"use client";

/**
 * One-time migration: localStorage → database.
 *
 * On first authenticated session, reads all architex-* localStorage keys,
 * extracts progress data, POSTs to /api/progress/sync, and sets a flag
 * to prevent re-running.
 *
 * Safe to call multiple times — skips if already migrated or not authenticated.
 */

const MIGRATED_KEY = "architex:migrated-to-db";

interface LocalProgressData {
  attempts?: Array<{
    challengeId: string;
    score: number;
    completedAt: string;
  }>;
  totalXP?: number;
  streakDays?: number;
}

interface LocalCrossModuleData {
  moduleMastery?: Record<
    string,
    { theory: number; practice: number }
  >;
  conceptProgress?: Record<
    string,
    { completed: boolean; score?: number }
  >;
}

/**
 * Attempt to migrate localStorage progress to the database.
 * Returns true if migration was performed, false if skipped.
 */
export async function migrateLocalStorageToDb(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Skip if already migrated
  if (localStorage.getItem(MIGRATED_KEY) === "true") return false;

  const records: Array<{
    moduleId: string;
    conceptId?: string | null;
    score: number;
    completedAt?: string | null;
  }> = [];

  // ── Extract from progress-store ──────────────────────────
  try {
    const raw = localStorage.getItem("architex-progress");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: LocalProgressData };
      const state = parsed.state ?? (parsed as unknown as LocalProgressData);

      // Migrate XP
      if (state.totalXP && state.totalXP > 0) {
        records.push({
          moduleId: "global",
          conceptId: "xp",
          score: Math.min(1, state.totalXP / 10000),
        });
      }

      // Migrate streak
      if (state.streakDays && state.streakDays > 0) {
        records.push({
          moduleId: "global",
          conceptId: "streak",
          score: Math.min(1, state.streakDays / 365),
        });
      }

      // Migrate individual challenge attempts
      if (state.attempts) {
        const bestScores = new Map<string, number>();
        for (const attempt of state.attempts) {
          const existing = bestScores.get(attempt.challengeId) ?? 0;
          bestScores.set(
            attempt.challengeId,
            Math.max(existing, attempt.score / 100),
          );
        }
        for (const [challengeId, score] of bestScores) {
          const moduleId = challengeId.split("-")[0] || "general";
          records.push({
            moduleId,
            conceptId: challengeId,
            score: Math.min(1, score),
          });
        }
      }
    }
  } catch {
    // Corrupted localStorage — skip gracefully
  }

  // ── Extract from cross-module-store ──────────────────────
  try {
    const raw = localStorage.getItem("architex-cross-module");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: LocalCrossModuleData };
      const state = parsed.state ?? (parsed as unknown as LocalCrossModuleData);

      // Migrate per-module mastery
      if (state.moduleMastery) {
        for (const [moduleId, mastery] of Object.entries(state.moduleMastery)) {
          const avgScore = (mastery.theory + mastery.practice) / 200;
          if (avgScore > 0) {
            records.push({
              moduleId,
              conceptId: "mastery",
              score: Math.min(1, avgScore),
            });
          }
        }
      }

      // Migrate concept progress
      if (state.conceptProgress) {
        for (const [conceptId, progress] of Object.entries(state.conceptProgress)) {
          if (progress.completed || (progress.score && progress.score > 0)) {
            records.push({
              moduleId: "cross-module",
              conceptId,
              score: progress.score ? Math.min(1, progress.score / 100) : 1,
              completedAt: progress.completed
                ? new Date().toISOString()
                : null,
            });
          }
        }
      }
    }
  } catch {
    // Corrupted localStorage — skip gracefully
  }

  // ── Send to server ───────────────────────────────────────
  if (records.length === 0) {
    // Nothing to migrate but mark as done so we don't keep checking
    localStorage.setItem(MIGRATED_KEY, "true");
    return false;
  }

  try {
    const res = await fetch("/api/progress/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });

    if (res.ok) {
      localStorage.setItem(MIGRATED_KEY, "true");
      return true;
    }

    // 401 = not authenticated yet, don't set migrated flag (try again later)
    if (res.status === 401) return false;

    // Other errors — set flag to avoid infinite retries
    localStorage.setItem(MIGRATED_KEY, "true");
    return false;
  } catch {
    // Network error — don't set flag, retry on next load
    return false;
  }
}
