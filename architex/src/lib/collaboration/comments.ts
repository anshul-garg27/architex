// ─────────────────────────────────────────────────────────────
// Architex — COL-011 Comment System
// ─────────────────────────────────────────────────────────────
//
// Threaded comments with Markdown support, backed by localStorage.
// Supports flat storage with parentId-based tree assembly.

// ── Types ─────────────────────────────────────────────────────

export interface Comment {
  id: string;
  designId: string;
  author: string;
  text: string;
  createdAt: number;
  parentId?: string;
}

/** A comment with nested children, assembled from flat storage. */
export interface ThreadedComment extends Comment {
  children: ThreadedComment[];
}

// ── Constants ─────────────────────────────────────────────────

const STORAGE_KEY = 'architex:comments';

// ── Storage helpers ───────────────────────────────────────────

/** Load all comments from localStorage. */
function loadAllComments(): Comment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Comment[]) : [];
  } catch {
    return [];
  }
}

/** Save all comments to localStorage. */
function saveAllComments(comments: Comment[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

/** Generate a unique comment ID. */
function generateCommentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `cmt_${timestamp}_${random}`;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Add a comment to a design.
 *
 * @param designId  - The design the comment belongs to.
 * @param author    - Display name of the comment author.
 * @param text      - Markdown-formatted comment text.
 * @param parentId  - Optional parent comment ID for threading.
 * @returns The newly created comment.
 */
export function addComment(
  designId: string,
  author: string,
  text: string,
  parentId?: string,
): Comment {
  const all = loadAllComments();

  const comment: Comment = {
    id: generateCommentId(),
    designId,
    author,
    text,
    createdAt: Date.now(),
    ...(parentId ? { parentId } : {}),
  };

  all.push(comment);
  saveAllComments(all);

  return comment;
}

/**
 * Delete a comment by ID.
 * Also deletes all descendant (nested reply) comments.
 *
 * @returns true if the comment was found and deleted.
 */
export function deleteComment(commentId: string): boolean {
  const all = loadAllComments();
  const idsToDelete = collectDescendantIds(commentId, all);
  idsToDelete.add(commentId);

  const filtered = all.filter((c) => !idsToDelete.has(c.id));

  if (filtered.length === all.length) return false;

  saveAllComments(filtered);
  return true;
}

/**
 * Get all comments for a design, assembled into a threaded tree.
 *
 * Top-level comments (no parentId) appear first, sorted by createdAt ascending.
 * Each top-level comment contains a `children` array of threaded replies.
 */
export function getComments(designId: string): ThreadedComment[] {
  const all = loadAllComments().filter((c) => c.designId === designId);
  return buildCommentTree(all);
}

/**
 * Get the flat list of all comments for a design (unthreaded).
 * Useful for counting or searching.
 */
export function getCommentsFlat(designId: string): Comment[] {
  return loadAllComments().filter((c) => c.designId === designId);
}

/** Get the total number of comments for a design. */
export function getCommentCount(designId: string): number {
  return loadAllComments().filter((c) => c.designId === designId).length;
}

// ── Tree building ─────────────────────────────────────────────

/**
 * Build a threaded comment tree from a flat array.
 *
 * Algorithm:
 *   1. Index all comments by ID.
 *   2. For each comment, attach it to its parent's children array.
 *   3. Return the top-level comments (those without a parentId).
 */
export function buildCommentTree(comments: Comment[]): ThreadedComment[] {
  const map = new Map<string, ThreadedComment>();

  // Initialize threaded wrappers
  for (const comment of comments) {
    map.set(comment.id, { ...comment, children: [] });
  }

  const roots: ThreadedComment[] = [];

  for (const comment of comments) {
    const threaded = map.get(comment.id)!;

    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.children.push(threaded);
    } else {
      roots.push(threaded);
    }
  }

  // Sort roots and children by createdAt ascending
  const sortByDate = (a: ThreadedComment, b: ThreadedComment) =>
    a.createdAt - b.createdAt;

  roots.sort(sortByDate);

  function sortChildren(node: ThreadedComment): void {
    node.children.sort(sortByDate);
    for (const child of node.children) {
      sortChildren(child);
    }
  }

  for (const root of roots) {
    sortChildren(root);
  }

  return roots;
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Collect all descendant IDs of a given comment (recursive).
 * Used for cascade-deleting replies when a parent is deleted.
 */
function collectDescendantIds(parentId: string, all: Comment[]): Set<string> {
  const ids = new Set<string>();
  const queue = [parentId];

  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const c of all) {
      if (c.parentId === current && !ids.has(c.id)) {
        ids.add(c.id);
        queue.push(c.id);
      }
    }
  }

  return ids;
}
