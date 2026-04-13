/**
 * Distributed Visualization Config
 *
 * SINGLE SOURCE OF TRUTH for all distributed systems visualization colors,
 * animation constants, and theming. The god-file refactor (DIS-024) and
 * color migration (DIS-025) import from here instead of using hardcoded values.
 *
 * Add these CSS custom properties to src/app/globals.css inside :root (dark theme):
 *
 * --dis-follower-bg: #374151;
 * --dis-follower-border: #6b7280;
 * --dis-follower-text: #d1d5db;
 * --dis-candidate-bg: #78350f;
 * --dis-candidate-border: #f59e0b;
 * --dis-candidate-text: #fbbf24;
 * --dis-leader-bg: #14532d;
 * --dis-leader-border: #22c55e;
 * --dis-leader-text: #4ade80;
 * --dis-active: #7992f5;
 * --dis-inactive: #6b7280;
 * --dis-error: #ef4444;
 * --dis-success: #4ade80;
 * --dis-warning: #fbbf24;
 * --dis-partition: #ef4444;
 */

// ---------------------------------------------------------------------------
// 1. Role Colors — Raft node roles (follower, candidate, leader)
// ---------------------------------------------------------------------------

/** Background, border, and text colors for each Raft consensus role.
 *  Values reference CSS custom properties so they respond to theme changes. */
export const DISTRIBUTED_ROLE_COLORS = {
  follower: {
    bg: 'var(--dis-follower-bg)',
    border: 'var(--dis-follower-border)',
    text: 'var(--dis-follower-text)',
  },
  candidate: {
    bg: 'var(--dis-candidate-bg)',
    border: 'var(--dis-candidate-border)',
    text: 'var(--dis-candidate-text)',
  },
  leader: {
    bg: 'var(--dis-leader-bg)',
    border: 'var(--dis-leader-border)',
    text: 'var(--dis-leader-text)',
  },
} as const;

// ---------------------------------------------------------------------------
// 2. Node Colors — categorical palette for hash ring, gossip, etc.
// ---------------------------------------------------------------------------

/** Eight categorical colors based on GitLab Pajamas dark-mode palette.
 *  Used to distinguish individual nodes in consistent hashing, gossip,
 *  and any visualization that renders multiple peer nodes. */
export const DISTRIBUTED_NODE_COLORS = [
  '#7992f5', // blue-400
  '#ef4444', // red-400
  '#4ade80', // green-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#22d3ee', // cyan-400
  '#fb923c', // orange-400
  '#f472b6', // pink-400
] as const;

// ---------------------------------------------------------------------------
// 3. State Colors — consistent across all visualizations
// ---------------------------------------------------------------------------

/** Semantic state colors shared by every distributed visualization.
 *  Values reference CSS custom properties for theme-awareness. */
export const DISTRIBUTED_STATE_COLORS = {
  active: 'var(--dis-active)',
  inactive: 'var(--dis-inactive)',
  error: 'var(--dis-error)',
  success: 'var(--dis-success)',
  warning: 'var(--dis-warning)',
  partition: 'var(--dis-partition)',
} as const;

// ---------------------------------------------------------------------------
// 4. Message Colors — RPC animation colors
// ---------------------------------------------------------------------------

/** Colors for animated RPC messages in Raft and gossip visualizations.
 *  Each message type gets a distinct color so users can track message flow. */
export const DISTRIBUTED_MSG_COLORS = {
  RequestVote: '#fbbf24',
  RequestVoteResponse: '#4ade80',
  AppendEntries: '#7992f5',
  AppendEntriesResponse: '#4ade80',
  gossip: '#fbbf24',
  default: '#9ca3af',
} as const;

// ---------------------------------------------------------------------------
// 5. Phase Colors — step-based protocol phases
// ---------------------------------------------------------------------------

/** Colors for each phase/step in multi-phase protocols (2PC, Saga, Paxos,
 *  MapReduce). Phases that share a semantic meaning share a color:
 *  blue = initiate, amber = in-progress/vote, green = success, red = failure,
 *  violet = transform, cyan = output/learn. */
export const DISTRIBUTED_PHASE_COLORS = {
  // 2PC phases
  prepare: '#7992f5',
  vote: '#fbbf24',
  commit: '#4ade80',
  abort: '#ef4444',
  // Saga phases
  execute: '#7992f5',
  compensate: '#fbbf24',
  complete: '#4ade80',
  fail: '#ef4444',
  // MapReduce phases
  split: '#7992f5',
  map: '#a78bfa',
  shuffle: '#fbbf24',
  reduce: '#4ade80',
  output: '#22d3ee',
  // Paxos phases
  promise: '#a78bfa',
  accept: '#fbbf24',
  accepted: '#4ade80',
  learn: '#22d3ee',
} as const;

// ---------------------------------------------------------------------------
// 6. Animation Constants — shared motion system
// ---------------------------------------------------------------------------

/** Shared animation timing and spring configuration for all distributed
 *  visualizations. Ensures consistent motion feel across Raft, gossip,
 *  consistent hashing, and all step-based protocol canvases. */
export const DISTRIBUTED_ANIMATION = {
  /** Duration in ms for message dot travel animations */
  messageDuration: 300,
  /** Duration in ms for node role color transitions */
  roleTransitionDuration: 300,
  /** Framer-motion spring config for snappy physical animations */
  springConfig: { type: 'spring' as const, stiffness: 150, damping: 18 },
  /** Framer-motion fade-in config */
  fadeIn: { duration: 0.2 },
  /** Framer-motion glow/pulse config (infinite loop) */
  glow: { duration: 2, repeat: Infinity },
} as const;

// ---------------------------------------------------------------------------
// Type Helpers
// ---------------------------------------------------------------------------

/** Union type of all Raft roles */
export type DistributedRole = keyof typeof DISTRIBUTED_ROLE_COLORS;

/** Union type of all semantic states */
export type DistributedState = keyof typeof DISTRIBUTED_STATE_COLORS;

/** Union type of all RPC message types */
export type DistributedMsgType = keyof typeof DISTRIBUTED_MSG_COLORS;

/** Union type of all protocol phases */
export type DistributedPhase = keyof typeof DISTRIBUTED_PHASE_COLORS;
