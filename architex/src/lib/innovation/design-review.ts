// ─────────────────────────────────────────────────────────────
// Architex — Design Review Mode
// ─────────────────────────────────────────────────────────────
//
// Collaborative review workflow for system-design canvases.
// Reviewers can pin comments on specific nodes or arbitrary
// canvas positions, filter by type, resolve threads, and issue
// an overall verdict (approve / request changes).
//
// Public API:
//   createReviewSession(designId, reviewerId)
//       → ReviewSession
//   addComment(session, comment)
//       → updated session
//   resolveComment(session, commentId)
//       → updated session
//   unresolveComment(session, commentId)
//       → updated session
//   completeReview(session, verdict)
//       → completed session with verdict
//   getCommentsByType(session, type)
//       → filtered comments
//   getUnresolvedComments(session)
//       → unresolved comments only
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Comment type classification. */
export type CommentType = 'suggestion' | 'issue' | 'praise';

/** Position of a comment on the canvas. */
export interface CommentPosition {
  /** Optional node ID the comment is pinned to. */
  nodeId?: string;
  /** Canvas x coordinate. */
  x: number;
  /** Canvas y coordinate. */
  y: number;
}

/** A single review comment. */
export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  position: CommentPosition;
  type: CommentType;
  resolved: boolean;
  createdAt: number;
}

/** Review verdict. */
export type ReviewVerdict = 'approved' | 'changes-requested';

/** Review session status. */
export type ReviewStatus = 'in-progress' | 'completed';

/** A review session. */
export interface ReviewSession {
  id: string;
  designId: string;
  reviewerId: string;
  comments: ReviewComment[];
  status: ReviewStatus;
  verdict: ReviewVerdict | null;
  createdAt: number;
  completedAt: number | null;
}

// ── Session management ──────────────────────────────────────

let reviewCounter = 0;

/** Create a new review session. */
export function createReviewSession(designId: string, reviewerId: string): ReviewSession {
  reviewCounter += 1;
  return {
    id: `review-${reviewCounter}-${Date.now()}`,
    designId,
    reviewerId,
    comments: [],
    status: 'in-progress',
    verdict: null,
    createdAt: Date.now(),
    completedAt: null,
  };
}

// ── Comment management ──────────────────────────────────────

let commentCounter = 0;

/** Create a comment object (does not add it to a session). */
export function createComment(
  author: string,
  text: string,
  position: CommentPosition,
  type: CommentType,
): ReviewComment {
  commentCounter += 1;
  return {
    id: `comment-${commentCounter}-${Date.now()}`,
    author,
    text,
    position,
    type,
    resolved: false,
    createdAt: Date.now(),
  };
}

/** Add a comment to a review session. Returns a new session. */
export function addComment(session: ReviewSession, comment: ReviewComment): ReviewSession {
  if (session.status === 'completed') return session;
  return {
    ...session,
    comments: [...session.comments, comment],
  };
}

/** Mark a comment as resolved. Returns a new session. */
export function resolveComment(session: ReviewSession, commentId: string): ReviewSession {
  return {
    ...session,
    comments: session.comments.map((c) =>
      c.id === commentId ? { ...c, resolved: true } : c,
    ),
  };
}

/** Mark a comment as unresolved. Returns a new session. */
export function unresolveComment(session: ReviewSession, commentId: string): ReviewSession {
  return {
    ...session,
    comments: session.comments.map((c) =>
      c.id === commentId ? { ...c, resolved: false } : c,
    ),
  };
}

// ── Review completion ───────────────────────────────────────

/** Complete the review with a verdict. Returns a new session. */
export function completeReview(
  session: ReviewSession,
  verdict: ReviewVerdict,
): ReviewSession {
  return {
    ...session,
    status: 'completed',
    verdict,
    completedAt: Date.now(),
  };
}

// ── Query helpers ───────────────────────────────────────────

/** Get comments filtered by type. */
export function getCommentsByType(session: ReviewSession, type: CommentType): ReviewComment[] {
  return session.comments.filter((c) => c.type === type);
}

/** Get all unresolved comments. */
export function getUnresolvedComments(session: ReviewSession): ReviewComment[] {
  return session.comments.filter((c) => !c.resolved);
}

/** Get all resolved comments. */
export function getResolvedComments(session: ReviewSession): ReviewComment[] {
  return session.comments.filter((c) => c.resolved);
}

/** Get comments pinned to a specific node. */
export function getCommentsForNode(session: ReviewSession, nodeId: string): ReviewComment[] {
  return session.comments.filter((c) => c.position.nodeId === nodeId);
}

/** Count comments by type. */
export function countByType(session: ReviewSession): Record<CommentType, number> {
  const counts: Record<CommentType, number> = { suggestion: 0, issue: 0, praise: 0 };
  for (const c of session.comments) {
    counts[c.type] += 1;
  }
  return counts;
}
