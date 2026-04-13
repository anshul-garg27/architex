import { describe, it, expect } from 'vitest';
import {
  createReviewSession,
  createComment,
  addComment,
  resolveComment,
  unresolveComment,
  completeReview,
  getCommentsByType,
  getUnresolvedComments,
  getResolvedComments,
  getCommentsForNode,
  countByType,
  type ReviewSession,
} from '../innovation/design-review';

// ── Helpers ────────────────────────────────────────────────

function makeSession(): ReviewSession {
  return createReviewSession('design-test', 'tester');
}

function addSampleComments(session: ReviewSession): ReviewSession {
  const c1 = createComment('Alice', 'Consider adding a cache layer', { x: 100, y: 50 }, 'suggestion');
  const c2 = createComment('Bob', 'Missing rate limiter', { x: 200, y: 100, nodeId: 'node-api' }, 'issue');
  const c3 = createComment('Carol', 'Great use of load balancers!', { x: 150, y: 75 }, 'praise');
  let s = addComment(session, c1);
  s = addComment(s, c2);
  s = addComment(s, c3);
  return s;
}

// ── Session creation ───────────────────────────────────────

describe('createReviewSession', () => {
  it('creates a session with correct initial state', () => {
    const session = makeSession();
    expect(session.designId).toBe('design-test');
    expect(session.reviewerId).toBe('tester');
    expect(session.status).toBe('in-progress');
    expect(session.verdict).toBeNull();
    expect(session.comments).toHaveLength(0);
    expect(session.completedAt).toBeNull();
  });

  it('generates unique session IDs', () => {
    const s1 = createReviewSession('d1', 'r1');
    const s2 = createReviewSession('d2', 'r2');
    expect(s1.id).not.toBe(s2.id);
  });
});

// ── Comment management ─────────────────────────────────────

describe('Comment management', () => {
  it('creates a comment with correct fields', () => {
    const comment = createComment('Alice', 'Test comment', { x: 10, y: 20 }, 'suggestion');
    expect(comment.author).toBe('Alice');
    expect(comment.text).toBe('Test comment');
    expect(comment.type).toBe('suggestion');
    expect(comment.resolved).toBe(false);
    expect(comment.position.x).toBe(10);
    expect(comment.position.y).toBe(20);
  });

  it('creates a comment pinned to a node', () => {
    const comment = createComment('Bob', 'Pin to node', { x: 50, y: 60, nodeId: 'node-1' }, 'issue');
    expect(comment.position.nodeId).toBe('node-1');
  });

  it('adds a comment to a session', () => {
    const session = makeSession();
    const comment = createComment('Alice', 'Hello', { x: 0, y: 0 }, 'praise');
    const updated = addComment(session, comment);
    expect(updated.comments).toHaveLength(1);
    expect(updated.comments[0].text).toBe('Hello');
  });

  it('does not add comments to a completed session', () => {
    let session = makeSession();
    session = completeReview(session, 'approved');
    const comment = createComment('Alice', 'Late', { x: 0, y: 0 }, 'suggestion');
    const updated = addComment(session, comment);
    expect(updated.comments).toHaveLength(0);
  });

  it('preserves immutability — original session is unchanged', () => {
    const session = makeSession();
    const comment = createComment('Alice', 'New', { x: 0, y: 0 }, 'suggestion');
    const updated = addComment(session, comment);
    expect(session.comments).toHaveLength(0);
    expect(updated.comments).toHaveLength(1);
  });
});

// ── Resolve / unresolve ────────────────────────────────────

describe('resolveComment / unresolveComment', () => {
  it('resolves a comment by ID', () => {
    const session = addSampleComments(makeSession());
    const commentId = session.comments[0].id;
    const updated = resolveComment(session, commentId);
    expect(updated.comments[0].resolved).toBe(true);
    expect(updated.comments[1].resolved).toBe(false);
  });

  it('unresolves a previously resolved comment', () => {
    let session = addSampleComments(makeSession());
    const commentId = session.comments[0].id;
    session = resolveComment(session, commentId);
    expect(session.comments[0].resolved).toBe(true);
    session = unresolveComment(session, commentId);
    expect(session.comments[0].resolved).toBe(false);
  });

  it('does nothing when comment ID does not exist', () => {
    const session = addSampleComments(makeSession());
    const updated = resolveComment(session, 'nonexistent-id');
    expect(updated.comments).toEqual(session.comments);
  });
});

// ── Review completion ──────────────────────────────────────

describe('completeReview', () => {
  it('marks session as completed with approved verdict', () => {
    const session = makeSession();
    const completed = completeReview(session, 'approved');
    expect(completed.status).toBe('completed');
    expect(completed.verdict).toBe('approved');
    expect(completed.completedAt).not.toBeNull();
  });

  it('marks session as completed with changes-requested verdict', () => {
    const session = makeSession();
    const completed = completeReview(session, 'changes-requested');
    expect(completed.status).toBe('completed');
    expect(completed.verdict).toBe('changes-requested');
  });
});

// ── Query helpers ──────────────────────────────────────────

describe('Query helpers', () => {
  it('getCommentsByType returns only matching type', () => {
    const session = addSampleComments(makeSession());
    const suggestions = getCommentsByType(session, 'suggestion');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('suggestion');

    const issues = getCommentsByType(session, 'issue');
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('issue');
  });

  it('getUnresolvedComments returns all when none resolved', () => {
    const session = addSampleComments(makeSession());
    expect(getUnresolvedComments(session)).toHaveLength(3);
  });

  it('getUnresolvedComments filters out resolved', () => {
    let session = addSampleComments(makeSession());
    session = resolveComment(session, session.comments[0].id);
    expect(getUnresolvedComments(session)).toHaveLength(2);
  });

  it('getResolvedComments returns only resolved', () => {
    let session = addSampleComments(makeSession());
    session = resolveComment(session, session.comments[0].id);
    session = resolveComment(session, session.comments[1].id);
    expect(getResolvedComments(session)).toHaveLength(2);
  });

  it('getCommentsForNode returns only pinned comments', () => {
    const session = addSampleComments(makeSession());
    const pinned = getCommentsForNode(session, 'node-api');
    expect(pinned).toHaveLength(1);
    expect(pinned[0].position.nodeId).toBe('node-api');
  });

  it('getCommentsForNode returns empty for no matches', () => {
    const session = addSampleComments(makeSession());
    expect(getCommentsForNode(session, 'nonexistent')).toHaveLength(0);
  });

  it('countByType returns correct counts', () => {
    const session = addSampleComments(makeSession());
    const counts = countByType(session);
    expect(counts.suggestion).toBe(1);
    expect(counts.issue).toBe(1);
    expect(counts.praise).toBe(1);
  });

  it('countByType returns zeros for empty session', () => {
    const session = makeSession();
    const counts = countByType(session);
    expect(counts.suggestion).toBe(0);
    expect(counts.issue).toBe(0);
    expect(counts.praise).toBe(0);
  });
});
