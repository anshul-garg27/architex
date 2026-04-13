// ─────────────────────────────────────────────────────────────
// Architex — Weekly Community Challenge
// ─────────────────────────────────────────────────────────────
//
// A rotating pool of 12 weekly design challenges. Each week one
// challenge is active; community members submit designs and
// vote for their favorites.
//
// Public API:
//   getCurrentWeeklyChallenge()                → this week's challenge
//   getChallengeForWeek(weekIndex)             → challenge by rotation index
//   submitDesign(challengeId, design)          → ChallengeSubmission
//   voteForDesign(submissionId)                → optimistic vote result
//   WEEKLY_CHALLENGE_POOL                      → full pool of 12 challenges
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Difficulty tier for a weekly challenge. */
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** A weekly community challenge definition. */
export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  /** Constraints or requirements for the design. */
  constraints: string[];
  difficulty: ChallengeDifficulty;
  /** ISO start date of the week this challenge is active. */
  startDate: string;
  /** ISO end date. */
  endDate: string;
  /** All submissions for this challenge. */
  submissions: ChallengeSubmission[];
  /** Whether voting is currently open. */
  votingOpen: boolean;
}

/** A single user-submitted design. */
export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  /** Title of the submission. */
  title: string;
  /** Markdown description of the approach. */
  description: string;
  /** Number of votes received. */
  votes: number;
  submittedAt: string;
}

/** Result of submitting a design. */
export interface SubmissionResult {
  success: boolean;
  submission: ChallengeSubmission;
}

/** Result of voting for a design. */
export interface VoteResult {
  success: boolean;
  submissionId: string;
  newVoteCount: number;
}

/** Design data the user submits. */
export interface DesignInput {
  userId: string;
  title: string;
  description: string;
}

// ── Challenge Pool (12 rotating challenges) ─────────────────

export const WEEKLY_CHALLENGE_POOL: Omit<WeeklyChallenge, 'startDate' | 'endDate' | 'submissions' | 'votingOpen'>[] = [
  {
    id: 'wc-url-shortener',
    title: 'Design a URL Shortener',
    description: 'Create a system that converts long URLs into short, unique aliases. Focus on scalability and collision handling.',
    constraints: ['Must handle 100M URLs', 'Short URLs should be 7 characters or fewer', 'Support analytics tracking'],
    difficulty: 'beginner',
  },
  {
    id: 'wc-chat-system',
    title: 'Design a Real-Time Chat System',
    description: 'Build the architecture for a messaging platform that supports 1-on-1 and group chats with real-time delivery.',
    constraints: ['Support 10M concurrent users', 'Message delivery under 200ms', 'Offline message sync'],
    difficulty: 'intermediate',
  },
  {
    id: 'wc-news-feed',
    title: 'Design a Social News Feed',
    description: 'Architect a news feed that aggregates posts from followed users with ranking and personalization.',
    constraints: ['Feed generation under 500ms', 'Handle celebrity accounts with millions of followers', 'Support mixed content types'],
    difficulty: 'advanced',
  },
  {
    id: 'wc-rate-limiter',
    title: 'Design a Distributed Rate Limiter',
    description: 'Build a rate-limiting service that protects APIs from abuse across a distributed cluster.',
    constraints: ['Sub-millisecond latency', 'Support per-user and per-IP limits', 'Graceful degradation'],
    difficulty: 'intermediate',
  },
  {
    id: 'wc-notification',
    title: 'Design a Notification System',
    description: 'Create a multi-channel notification platform supporting push, email, SMS, and in-app notifications.',
    constraints: ['Priority-based delivery', 'User preference management', 'Exactly-once delivery guarantee'],
    difficulty: 'intermediate',
  },
  {
    id: 'wc-search-engine',
    title: 'Design a Search Autocomplete',
    description: 'Build a type-ahead search system that suggests completions as the user types.',
    constraints: ['Suggestions under 100ms', 'Personalized results', 'Support 1B queries/day'],
    difficulty: 'advanced',
  },
  {
    id: 'wc-file-storage',
    title: 'Design a Cloud File Storage',
    description: 'Architect a Dropbox-like file storage service with sync, versioning, and sharing.',
    constraints: ['Support files up to 10GB', 'Efficient delta sync', 'Conflict resolution for concurrent edits'],
    difficulty: 'advanced',
  },
  {
    id: 'wc-key-value-store',
    title: 'Design a Distributed Key-Value Store',
    description: 'Build a highly available key-value store with tunable consistency.',
    constraints: ['Consistent hashing for partitioning', 'Configurable replication factor', 'Gossip protocol for failure detection'],
    difficulty: 'advanced',
  },
  {
    id: 'wc-paste-bin',
    title: 'Design a Pastebin',
    description: 'Create a service for sharing text snippets with expiration and access control.',
    constraints: ['Support 5M pastes/day', 'Configurable expiration', 'Syntax highlighting support'],
    difficulty: 'beginner',
  },
  {
    id: 'wc-task-scheduler',
    title: 'Design a Distributed Task Scheduler',
    description: 'Build a cron-like scheduler that runs tasks across a cluster with exactly-once execution.',
    constraints: ['Handle 1M scheduled tasks', 'Sub-second scheduling precision', 'Failover without missed executions'],
    difficulty: 'intermediate',
  },
  {
    id: 'wc-video-streaming',
    title: 'Design a Video Streaming Platform',
    description: 'Architect a YouTube-like platform focusing on upload, transcoding, and adaptive streaming.',
    constraints: ['Support 4K video', 'Adaptive bitrate streaming', 'Global CDN distribution'],
    difficulty: 'advanced',
  },
  {
    id: 'wc-leaderboard',
    title: 'Design a Real-Time Leaderboard',
    description: 'Build a leaderboard that supports millions of players with real-time rank updates.',
    constraints: ['Rank queries under 50ms', 'Support top-N and around-me queries', 'Handle 100K score updates/sec'],
    difficulty: 'beginner',
  },
];

// ── Week calculation helpers ────────────────────────────────

/**
 * Epoch for week 0 — Monday 2025-01-06 00:00:00 UTC.
 * All week indices are computed relative to this date.
 */
const EPOCH_MS = Date.UTC(2025, 0, 6); // Jan 6 2025
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Get the week index (0-based) for a given timestamp. */
export function getWeekIndex(timestampMs: number = Date.now()): number {
  return Math.floor((timestampMs - EPOCH_MS) / WEEK_MS);
}

/** Get the ISO start and end dates for a given week index. */
export function getWeekBounds(weekIndex: number): { start: string; end: string } {
  const startMs = EPOCH_MS + weekIndex * WEEK_MS;
  const endMs = startMs + WEEK_MS - 1;
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
  };
}

// ── Core API ────────────────────────────────────────────────

/**
 * Get the challenge for a specific week index.
 * Rotates through the pool of 12.
 */
export function getChallengeForWeek(weekIndex: number): WeeklyChallenge {
  const poolIndex = ((weekIndex % WEEKLY_CHALLENGE_POOL.length) + WEEKLY_CHALLENGE_POOL.length) % WEEKLY_CHALLENGE_POOL.length;
  const template = WEEKLY_CHALLENGE_POOL[poolIndex];
  const bounds = getWeekBounds(weekIndex);

  return {
    ...template,
    startDate: bounds.start,
    endDate: bounds.end,
    submissions: [],
    votingOpen: true,
  };
}

/**
 * Get this week's active challenge.
 * Uses the current timestamp to determine the week index.
 */
export function getCurrentWeeklyChallenge(): WeeklyChallenge {
  return getChallengeForWeek(getWeekIndex());
}

// ── Submission ──────────────────────────────────────────────

let submissionCounter = 0;

/**
 * Submit a design for a weekly challenge.
 *
 * @param challengeId  The challenge to submit to.
 * @param design       The design details.
 * @returns A SubmissionResult with the new submission.
 */
export function submitDesign(
  challengeId: string,
  design: DesignInput,
): SubmissionResult {
  submissionCounter += 1;

  const submission: ChallengeSubmission = {
    id: `sub-${submissionCounter}-${Date.now()}`,
    challengeId,
    userId: design.userId,
    title: design.title,
    description: design.description,
    votes: 0,
    submittedAt: new Date().toISOString(),
  };

  return { success: true, submission };
}

// ── Voting ──────────────────────────────────────────────────

/**
 * Cast an optimistic vote for a submission.
 * In a real app this would hit a backend; here we return
 * the new vote count immediately for optimistic UI.
 *
 * @param submissionId  The submission to vote for.
 * @param currentVotes  The current vote count (for optimistic update).
 * @returns A VoteResult with the new count.
 */
export function voteForDesign(
  submissionId: string,
  currentVotes: number = 0,
): VoteResult {
  return {
    success: true,
    submissionId,
    newVoteCount: currentVotes + 1,
  };
}
