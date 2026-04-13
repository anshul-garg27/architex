import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addComment,
  deleteComment,
  getComments,
  getCommentsFlat,
  getCommentCount,
  buildCommentTree,
} from '@/lib/collaboration/comments';
import type { Comment, ThreadedComment } from '@/lib/collaboration/comments';

// ── localStorage mock ────────────────────────────────────────

const store: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
});

// ── addComment ───────────────────────────────────────────────

describe('addComment', () => {
  it('creates a top-level comment', () => {
    const c = addComment('design-1', 'Alice', 'Hello world');
    expect(c.id).toBeTruthy();
    expect(c.designId).toBe('design-1');
    expect(c.author).toBe('Alice');
    expect(c.text).toBe('Hello world');
    expect(c.createdAt).toBeGreaterThan(0);
    expect(c.parentId).toBeUndefined();
  });

  it('creates a reply comment with parentId', () => {
    const parent = addComment('design-1', 'Alice', 'Top-level');
    const reply = addComment('design-1', 'Bob', 'Reply', parent.id);
    expect(reply.parentId).toBe(parent.id);
  });

  it('persists across calls', () => {
    addComment('design-1', 'Alice', 'First');
    addComment('design-1', 'Bob', 'Second');
    expect(getCommentCount('design-1')).toBe(2);
  });
});

// ── deleteComment ────────────────────────────────────────────

describe('deleteComment', () => {
  it('removes a comment by ID', () => {
    const c = addComment('design-1', 'Alice', 'To delete');
    expect(deleteComment(c.id)).toBe(true);
    expect(getCommentCount('design-1')).toBe(0);
  });

  it('returns false for non-existent ID', () => {
    expect(deleteComment('nonexistent')).toBe(false);
  });

  it('cascade-deletes nested replies', () => {
    const root = addComment('d1', 'Alice', 'Root');
    const child = addComment('d1', 'Bob', 'Child', root.id);
    addComment('d1', 'Carol', 'Grandchild', child.id);
    addComment('d1', 'Dave', 'Sibling reply', root.id);

    // Delete root should remove root + all descendants
    expect(deleteComment(root.id)).toBe(true);
    expect(getCommentCount('d1')).toBe(0);
  });

  it('only deletes target subtree, not siblings', () => {
    const root1 = addComment('d1', 'Alice', 'Root 1');
    const root2 = addComment('d1', 'Bob', 'Root 2');
    addComment('d1', 'Carol', 'Reply to root1', root1.id);

    expect(deleteComment(root1.id)).toBe(true);
    expect(getCommentCount('d1')).toBe(1);
    expect(getCommentsFlat('d1')[0].id).toBe(root2.id);
  });
});

// ── getComments (threaded) ───────────────────────────────────

describe('getComments — threading', () => {
  it('returns empty array for design with no comments', () => {
    const tree = getComments('empty-design');
    expect(tree).toEqual([]);
  });

  it('returns flat comments as roots when no parentId', () => {
    addComment('d1', 'Alice', 'First');
    addComment('d1', 'Bob', 'Second');

    const tree = getComments('d1');
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toEqual([]);
    expect(tree[1].children).toEqual([]);
  });

  it('nests a reply under its parent', () => {
    const parent = addComment('d1', 'Alice', 'Parent');
    addComment('d1', 'Bob', 'Reply', parent.id);

    const tree = getComments('d1');
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].author).toBe('Bob');
    expect(tree[0].children[0].text).toBe('Reply');
  });

  it('handles multi-level nesting', () => {
    const root = addComment('d1', 'Alice', 'Root');
    const child = addComment('d1', 'Bob', 'Child', root.id);
    const grandchild = addComment('d1', 'Carol', 'Grandchild', child.id);

    const tree = getComments('d1');
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].text).toBe('Grandchild');
  });

  it('handles multiple replies to the same parent', () => {
    const root = addComment('d1', 'Alice', 'Root');
    addComment('d1', 'Bob', 'Reply 1', root.id);
    addComment('d1', 'Carol', 'Reply 2', root.id);
    addComment('d1', 'Dave', 'Reply 3', root.id);

    const tree = getComments('d1');
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(3);
  });

  it('filters by designId', () => {
    addComment('d1', 'Alice', 'Design 1 comment');
    addComment('d2', 'Bob', 'Design 2 comment');

    expect(getComments('d1')).toHaveLength(1);
    expect(getComments('d2')).toHaveLength(1);
    expect(getComments('d1')[0].text).toBe('Design 1 comment');
  });

  it('supports markdown in text', () => {
    const c = addComment('d1', 'Alice', '**bold** and `code`');
    const tree = getComments('d1');
    expect(tree[0].text).toBe('**bold** and `code`');
  });
});

// ── buildCommentTree (pure function) ─────────────────────────

describe('buildCommentTree — pure', () => {
  const now = Date.now();

  function makeComment(overrides: Partial<Comment>): Comment {
    return {
      id: `cmt-${Math.random().toString(36).slice(2, 6)}`,
      designId: 'd1',
      author: 'Tester',
      text: 'text',
      createdAt: now,
      ...overrides,
    };
  }

  it('returns empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('orphaned replies (parentId pointing to non-existent) become roots', () => {
    const orphan = makeComment({ parentId: 'nonexistent' });
    const tree = buildCommentTree([orphan]);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(orphan.id);
  });

  it('sorts roots by createdAt ascending', () => {
    const a = makeComment({ id: 'a', createdAt: now + 200 });
    const b = makeComment({ id: 'b', createdAt: now + 100 });
    const c = makeComment({ id: 'c', createdAt: now });

    const tree = buildCommentTree([a, b, c]);
    expect(tree.map((n) => n.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts children by createdAt ascending', () => {
    const root = makeComment({ id: 'root', createdAt: now });
    const childLate = makeComment({ id: 'late', parentId: 'root', createdAt: now + 200 });
    const childEarly = makeComment({ id: 'early', parentId: 'root', createdAt: now + 100 });

    const tree = buildCommentTree([root, childLate, childEarly]);
    expect(tree[0].children.map((n) => n.id)).toEqual(['early', 'late']);
  });

  it('builds a deep tree correctly', () => {
    const root = makeComment({ id: 'r', createdAt: now });
    const c1 = makeComment({ id: 'c1', parentId: 'r', createdAt: now + 10 });
    const c2 = makeComment({ id: 'c2', parentId: 'c1', createdAt: now + 20 });
    const c3 = makeComment({ id: 'c3', parentId: 'c2', createdAt: now + 30 });

    const tree = buildCommentTree([root, c1, c2, c3]);
    expect(tree).toHaveLength(1);

    let node: ThreadedComment = tree[0];
    const ids: string[] = [node.id];
    while (node.children.length > 0) {
      node = node.children[0];
      ids.push(node.id);
    }
    expect(ids).toEqual(['r', 'c1', 'c2', 'c3']);
  });
});
