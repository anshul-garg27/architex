// ── INO-012: Daily Design Challenge ─────────────────────────────────
// Deterministic selection based on date hash so every user gets the same
// challenge on the same day.  Difficulty varies by day-of-week:
//   Mon = easy (1-2), Tue = easy-medium (1-2), Wed = medium (2-3),
//   Thu = medium-hard (3-4), Fri = hard (4-5), Sat/Sun = mixed (any).

import { CHALLENGES } from './challenges';
import type { ChallengeDefinition } from './challenges';

// ── Public types ────────────────────────────────────────────────────

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  challengeId: string;
  difficulty: number;
  category: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Simple deterministic hash of a string -> unsigned 32-bit integer. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0; // unsigned
}

/** Format a Date as YYYY-MM-DD in UTC. */
function formatDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Return allowed difficulty range based on UTC day-of-week (0=Sun). */
function difficultyRangeForDay(dayOfWeek: number): [min: number, max: number] {
  switch (dayOfWeek) {
    case 1: return [1, 2]; // Monday  -- easy
    case 2: return [1, 2]; // Tuesday -- easy
    case 3: return [2, 3]; // Wednesday -- medium
    case 4: return [3, 4]; // Thursday -- medium-hard
    case 5: return [4, 5]; // Friday -- hard
    default: return [1, 5]; // Sat/Sun -- any
  }
}

/**
 * Pick a challenge for a given date string deterministically.
 *
 * 1. Derive the allowed difficulty range from the day-of-week.
 * 2. Filter the CHALLENGES pool to that range.
 * 3. Use a date-seeded hash to pick an index into the filtered list.
 * 4. If the filtered list is somehow empty, fall back to the full list.
 */
function pickChallenge(dateStr: string, dayOfWeek: number): ChallengeDefinition {
  const [minD, maxD] = difficultyRangeForDay(dayOfWeek);
  const pool = CHALLENGES.filter(
    (c) => c.difficulty >= minD && c.difficulty <= maxD,
  );
  const candidates = pool.length > 0 ? pool : CHALLENGES;
  const hash = hashString(`daily-challenge-${dateStr}`);
  return candidates[hash % candidates.length];
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get the daily challenge for a given date (defaults to today UTC).
 * Same date always yields the same challenge.
 */
export function getDailyChallenge(date?: Date): DailyChallenge {
  const d = date ?? new Date();
  const dateStr = formatDateUTC(d);
  const dayOfWeek = d.getUTCDay();
  const challenge = pickChallenge(dateStr, dayOfWeek);

  return {
    date: dateStr,
    challengeId: challenge.id,
    difficulty: challenge.difficulty,
    category: challenge.category,
  };
}

/**
 * Get the daily challenges for the past N days (most recent first).
 */
export function getPastChallenges(days: number): DailyChallenge[] {
  const results: DailyChallenge[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    results.push(getDailyChallenge(d));
  }
  return results;
}

/**
 * Milliseconds remaining until the next UTC midnight (next challenge).
 */
export function msUntilNextChallenge(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return tomorrow.getTime() - now.getTime();
}
