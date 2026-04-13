// ─────────────────────────────────────────────────────────────
// Architex — COL-010 Upvote System
// ─────────────────────────────────────────────────────────────
//
// Optimistic upvote toggling backed by localStorage.
// Provides per-design upvote counts and per-user toggle state.

// ── Constants ─────────────────────────────────────────────────

const STORAGE_KEY_UPVOTES = 'architex:upvotes';
const STORAGE_KEY_USER_UPVOTES = 'architex:user-upvotes';

// ── Storage helpers ───────────────────────────────────────────

/** Read the full upvote count map from localStorage. */
function loadUpvoteCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UPVOTES);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/** Persist the full upvote count map to localStorage. */
function saveUpvoteCounts(counts: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_UPVOTES, JSON.stringify(counts));
}

/** Read the set of design IDs a specific user has upvoted. */
function loadUserUpvotes(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_USER_UPVOTES}:${userId}`);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Persist a user's upvoted design IDs. */
function saveUserUpvotes(userId: string, designIds: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    `${STORAGE_KEY_USER_UPVOTES}:${userId}`,
    JSON.stringify(Array.from(designIds)),
  );
}

// ── Public API ────────────────────────────────────────────────

export interface UpvoteResult {
  /** New upvote count for the design after toggling. */
  count: number;
  /** Whether the user now has an active upvote on this design. */
  upvoted: boolean;
}

/**
 * Toggle an upvote on a design for a given user.
 *
 * - If the user has NOT upvoted this design, adds an upvote (count + 1).
 * - If the user HAS already upvoted, removes the upvote (count - 1).
 *
 * Updates are optimistic — localStorage is written immediately.
 */
export function toggleUpvote(designId: string, userId: string): UpvoteResult {
  const counts = loadUpvoteCounts();
  const userUpvotes = loadUserUpvotes(userId);

  const currentCount = counts[designId] ?? 0;
  const alreadyUpvoted = userUpvotes.has(designId);

  if (alreadyUpvoted) {
    // Remove upvote
    counts[designId] = Math.max(0, currentCount - 1);
    userUpvotes.delete(designId);
  } else {
    // Add upvote
    counts[designId] = currentCount + 1;
    userUpvotes.add(designId);
  }

  saveUpvoteCounts(counts);
  saveUserUpvotes(userId, userUpvotes);

  return {
    count: counts[designId],
    upvoted: !alreadyUpvoted,
  };
}

/** Get the current upvote count for a design. */
export function getUpvoteCount(designId: string): number {
  const counts = loadUpvoteCounts();
  return counts[designId] ?? 0;
}

/** Check whether a specific user has upvoted a design. */
export function hasUserUpvoted(designId: string, userId: string): boolean {
  const userUpvotes = loadUserUpvotes(userId);
  return userUpvotes.has(designId);
}

/** Get all design IDs that a user has upvoted. */
export function getUserUpvotedDesigns(userId: string): string[] {
  return Array.from(loadUserUpvotes(userId));
}
