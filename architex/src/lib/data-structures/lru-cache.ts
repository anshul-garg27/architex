// -----------------------------------------------------------------
// Architex -- LRU Cache Data Structure  (DST-124)
// -----------------------------------------------------------------
// Combines a HashMap (O(1) lookup) with a Doubly Linked List (O(1)
// eviction ordering). LeetCode #146 -- the #1 most asked DS
// interview question.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface LRUNode {
  id: string;
  key: string;
  value: number;
  prev: string | null;
  next: string | null;
}

export interface LRUCacheState {
  capacity: number;
  size: number;
  map: Map<string, LRUNode>; // key -> node for O(1) lookup
  headId: string | null; // most recently used
  tailId: string | null; // least recently used (eviction candidate)
  nodes: LRUNode[]; // for visualization
  evictionCount: number;
}

// ── Factory + Clone ────────────────────────────────────────

export function createLRUCache(capacity: number = 4): LRUCacheState {
  return {
    capacity: Math.max(1, capacity),
    size: 0,
    map: new Map(),
    headId: null,
    tailId: null,
    nodes: [],
    evictionCount: 0,
  };
}

export function cloneLRUCache(state: LRUCacheState): LRUCacheState {
  const clonedMap = new Map<string, LRUNode>();
  const clonedNodes = state.nodes.map((n) => {
    const copy = { ...n };
    clonedMap.set(copy.key, copy);
    return copy;
  });
  return {
    ...state,
    map: clonedMap,
    nodes: clonedNodes,
  };
}

// ── Internal DLL helpers ──────────────────────────────────

function findNode(state: LRUCacheState, id: string): LRUNode | undefined {
  return state.nodes.find((n) => n.id === id);
}

/** Detach a node from its current position in the DLL. */
function detachNode(state: LRUCacheState, node: LRUNode): void {
  if (node.prev !== null) {
    const prevNode = findNode(state, node.prev);
    if (prevNode) prevNode.next = node.next;
  } else {
    // Node was head
    state.headId = node.next;
  }

  if (node.next !== null) {
    const nextNode = findNode(state, node.next);
    if (nextNode) nextNode.prev = node.prev;
  } else {
    // Node was tail
    state.tailId = node.prev;
  }

  node.prev = null;
  node.next = null;
}

/** Insert a node at the head of the DLL (most recently used). */
function addToFront(state: LRUCacheState, node: LRUNode): void {
  node.prev = null;
  node.next = state.headId;

  if (state.headId !== null) {
    const oldHead = findNode(state, state.headId);
    if (oldHead) oldHead.prev = node.id;
  }

  state.headId = node.id;

  if (state.tailId === null) {
    state.tailId = node.id;
  }
}

/** Detach a node from its current position and re-insert at head. */
function moveToFront(state: LRUCacheState, node: LRUNode): void {
  if (state.headId === node.id) return; // already at front
  detachNode(state, node);
  addToFront(state, node);
}

/** Remove and return the tail node (least recently used). */
function removeTail(state: LRUCacheState): LRUNode | null {
  if (state.tailId === null) return null;
  const tail = findNode(state, state.tailId);
  if (!tail) return null;
  detachNode(state, tail);
  state.nodes = state.nodes.filter((n) => n.id !== tail.id);
  state.map.delete(tail.key);
  state.size--;
  return tail;
}

/** Walk forward from head, returning ordered keys for display. */
function walkOrder(state: LRUCacheState): string[] {
  const keys: string[] = [];
  let cur = state.headId;
  while (cur !== null) {
    const node = findNode(state, cur);
    if (!node) break;
    keys.push(node.key);
    cur = node.next;
  }
  return keys;
}

// ── lruGet ────────────────────────────────────────────────

export function lruGet(state: LRUCacheState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLRUCache(state);

  steps.push(
    step(
      `GET '${key}' -- Looking up key '${key}' in the hash map. The hash map gives us O(1) direct access to any entry by key, unlike a plain linked list which would require O(n) traversal.`,
      [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const node = s.map.get(key);

  if (!node) {
    steps.push(
      step(
        `Key '${key}' NOT FOUND in the cache. A cache miss means we return -1 (or undefined). The caller would need to fetch the data from the original source and potentially lruPut it.`,
        [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'miss' }],
      ),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Found! Key '${key}' maps to value ${node.value}. Now we move '${key}' to the FRONT of the list because it was just accessed -- this is the 'Recently Used' part of LRU.`,
      [
        { targetId: `lru-${key}`, property: 'highlight', from: 'default', to: 'found' },
        { targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'found' },
      ],
    ),
  );

  const wasHead = s.headId === node.id;
  moveToFront(s, node);

  if (wasHead) {
    steps.push(
      step(
        `'${key}' was already at the head (most recently used), so no reordering needed. Order: [${walkOrder(s).join(' -> ')}]`,
        [{ targetId: `lru-${key}`, property: 'highlight', from: 'found', to: 'done' }],
      ),
    );
  } else {
    steps.push(
      step(
        `Moved '${key}' to head. This O(1) move-to-front is WHY we use a doubly linked list -- detach the node (update its neighbors' pointers) and re-attach at head. Order: [${walkOrder(s).join(' -> ')}]`,
        [{ targetId: `lru-${key}`, property: 'highlight', from: 'found', to: 'done' }],
      ),
    );
  }

  return { steps, snapshot: s };
}

// ── lruPut ────────────────────────────────────────────────

export function lruPut(state: LRUCacheState, key: string, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLRUCache(state);

  steps.push(
    step(
      `PUT '${key}' = ${value} -- First, check if '${key}' already exists in the hash map. This O(1) lookup determines whether we update or insert.`,
      [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const existing = s.map.get(key);

  // ── Update existing key ──
  if (existing) {
    const oldValue = existing.value;
    existing.value = value;

    steps.push(
      step(
        `Key '${key}' already exists. Updating value from ${oldValue} to ${value} and moving '${key}' to the HEAD -- it's now the most recently used.`,
        [
          { targetId: `lru-${key}`, property: 'value', from: oldValue, to: value },
          { targetId: `lru-${key}`, property: 'highlight', from: 'default', to: 'shifting' },
          { targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'shifting' },
        ],
      ),
    );

    moveToFront(s, existing);

    steps.push(
      step(
        `Update complete. '${key}' is now at head with value ${value}. Size: ${s.size}/${s.capacity}. Order: [${walkOrder(s).join(' -> ')}]`,
        [{ targetId: `lru-${key}`, property: 'highlight', from: 'shifting', to: 'done' }],
      ),
    );

    return { steps, snapshot: s };
  }

  // ── Eviction if at capacity ──
  if (s.size >= s.capacity) {
    const tailNode = findNode(s, s.tailId!);
    const evictKey = tailNode?.key ?? '?';
    const evictValue = tailNode?.value ?? 0;

    steps.push(
      step(
        `Cache is full (${s.size}/${s.capacity}). We must evict the LEAST recently used entry -- that's the node at the TAIL of our list: '${evictKey}' (value ${evictValue}). This is WHY the tail represents the LRU item: every access moves a node to the head, so the tail is whatever hasn't been touched the longest.`,
        [
          { targetId: `lru-${evictKey}`, property: 'highlight', from: 'default', to: 'deleting' },
          { targetId: `lru-map-${evictKey}`, property: 'highlight', from: 'default', to: 'deleting' },
        ],
      ),
    );

    removeTail(s);
    s.evictionCount++;

    steps.push(
      step(
        `Evicted '${evictKey}'. Removed from both the doubly linked list AND the hash map -- both structures must stay in sync. Eviction count: ${s.evictionCount}.`,
        [],
      ),
    );
  }

  // ── Insert new key ──
  const nodeId = `lru-${key}`;
  const newNode: LRUNode = { id: nodeId, key, value, prev: null, next: null };

  steps.push(
    step(
      `Inserting new entry '${key}' = ${value} at the HEAD of the list. We also add it to the hash map for O(1) future lookups.`,
      [
        { targetId: `lru-${key}`, property: 'highlight', from: 'default', to: 'inserting' },
        { targetId: `lru-map-${key}`, property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  s.nodes.push(newNode);
  s.map.set(key, newNode);
  addToFront(s, newNode);
  s.size++;

  steps.push(
    step(
      `Insert complete. '${key}' is at head. Size: ${s.size}/${s.capacity}. Order: [${walkOrder(s).join(' -> ')}]`,
      [
        { targetId: `lru-${key}`, property: 'highlight', from: 'inserting', to: 'done' },
        { targetId: `lru-map-${key}`, property: 'highlight', from: 'inserting', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: s };
}

// ── lruDelete ─────────────────────────────────────────────

export function lruDelete(state: LRUCacheState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLRUCache(state);

  steps.push(
    step(
      `DELETE '${key}' -- Look up '${key}' in the hash map to find the node in O(1).`,
      [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const node = s.map.get(key);

  if (!node) {
    steps.push(
      step(
        `Key '${key}' not found in cache -- nothing to delete.`,
        [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'miss' }],
      ),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Found '${key}' (value ${node.value}). Detaching from the doubly linked list -- we update its prev node's next pointer AND its next node's prev pointer. This is O(1) because we already have the node reference from the hash map.`,
      [
        { targetId: `lru-${key}`, property: 'highlight', from: 'default', to: 'deleting' },
        { targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'deleting' },
      ],
    ),
  );

  detachNode(s, node);
  s.nodes = s.nodes.filter((n) => n.id !== node.id);
  s.map.delete(key);
  s.size--;

  steps.push(
    step(
      `Delete complete. Removed '${key}' from both the list and the hash map. Size: ${s.size}/${s.capacity}. Order: [${walkOrder(s).join(' -> ') || '(empty)'}]`,
      [],
    ),
  );

  return { steps, snapshot: s };
}

// ── lruPeek ───────────────────────────────────────────────

export function lruPeek(state: LRUCacheState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLRUCache(state);

  steps.push(
    step(
      `PEEK '${key}' -- Looking up key '${key}' in the hash map WITHOUT moving it to the front. Peek is a read-only operation that does not affect eviction order.`,
      [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const node = s.map.get(key);

  if (!node) {
    steps.push(
      step(
        `Key '${key}' NOT FOUND in the cache. Cache miss on peek.`,
        [{ targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'miss' }],
      ),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Found! Key '${key}' has value ${node.value}. Unlike GET, we do NOT move this node to the front -- peek preserves the current eviction order. This is useful for inspecting the cache without side effects. Order unchanged: [${walkOrder(s).join(' -> ')}]`,
      [
        { targetId: `lru-${key}`, property: 'highlight', from: 'default', to: 'found' },
        { targetId: `lru-map-${key}`, property: 'highlight', from: 'comparing', to: 'found' },
      ],
    ),
  );

  return { steps, snapshot: s };
}
