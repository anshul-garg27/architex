// -----------------------------------------------------------------
// Architex -- Doubly Linked List  (DST-125)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface DLLNode {
  id: string;
  value: number;
  prev: string | null; // ID of previous node
  next: string | null; // ID of next node
}

export interface DLLState {
  nodes: DLLNode[];
  headId: string | null;
  tailId: string | null;
  size: number;
}

// ── Factory + Clone ────────────────────────────────────────

export function createDLL(): DLLState {
  return { nodes: [], headId: null, tailId: null, size: 0 };
}

export function cloneDLL(state: DLLState): DLLState {
  return {
    ...state,
    nodes: state.nodes.map((n) => ({ ...n })),
  };
}

// ── Helpers ────────────────────────────────────────────────

function findNode(state: DLLState, id: string): DLLNode | undefined {
  return state.nodes.find((n) => n.id === id);
}

function findNodeByValue(state: DLLState, value: number): DLLNode | undefined {
  return state.nodes.find((n) => n.value === value);
}

/** Walk forward from head, returning ordered node IDs. */
function walkForward(state: DLLState): string[] {
  const ids: string[] = [];
  let cur = state.headId;
  while (cur !== null) {
    ids.push(cur);
    const node = findNode(state, cur);
    if (!node) break;
    cur = node.next;
  }
  return ids;
}

// ── Insert at Head ─────────────────────────────────────────

export function dllInsertHead(state: DLLState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDLL(state);

  // Local counter scoped to this call
  const newId = `dll-${s.size}`;

  const newNode: DLLNode = { id: newId, value, prev: null, next: s.headId };

  steps.push(
    step(
      `Insert ${value} at head. The new node becomes head because DLL allows O(1) head insertion — we just update the head pointer and set prev/next links.`,
      [{ targetId: newId, property: 'highlight', from: 'default', to: 'inserting' }],
    ),
  );

  if (s.headId !== null) {
    const oldHead = findNode(s, s.headId);
    if (oldHead) {
      steps.push(
        step(
          `Link old head (${oldHead.value}) backward to the new node. In a DLL every node has both prev and next pointers, enabling O(1) traversal in either direction.`,
          [
            { targetId: oldHead.id, property: 'prev', from: 'null', to: newId },
            { targetId: newId, property: 'next', from: 'null', to: oldHead.id },
          ],
        ),
      );
      oldHead.prev = newId;
    }
  } else {
    steps.push(
      step(`List was empty — the new node is both head and tail.`, [
        { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
      ]),
    );
    s.tailId = newId;
  }

  s.headId = newId;
  s.nodes.push(newNode);
  s.size++;

  steps.push(
    step(`Insert complete. Head → ${value}. Size: ${s.size}`, [
      { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Insert at Tail ─────────────────────────────────────────

export function dllInsertTail(state: DLLState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDLL(state);

  const newId = `dll-${s.size}`;
  const newNode: DLLNode = { id: newId, value, prev: s.tailId, next: null };

  steps.push(
    step(
      `Insert ${value} at tail. DLL maintains a tail pointer, so appending is O(1) — no traversal needed.`,
      [{ targetId: newId, property: 'highlight', from: 'default', to: 'inserting' }],
    ),
  );

  if (s.tailId !== null) {
    const oldTail = findNode(s, s.tailId);
    if (oldTail) {
      steps.push(
        step(
          `Link old tail (${oldTail.value}) forward to the new node, and new node backward to old tail.`,
          [
            { targetId: oldTail.id, property: 'next', from: 'null', to: newId },
            { targetId: newId, property: 'prev', from: 'null', to: oldTail.id },
          ],
        ),
      );
      oldTail.next = newId;
    }
  } else {
    steps.push(
      step(`List was empty — the new node is both head and tail.`, [
        { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
      ]),
    );
    s.headId = newId;
  }

  s.tailId = newId;
  s.nodes.push(newNode);
  s.size++;

  steps.push(
    step(`Insert complete. Tail → ${value}. Size: ${s.size}`, [
      { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Insert at Position ─────────────────────────────────────

export function dllInsertAt(state: DLLState, value: number, position: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  // Clamp position
  const pos = Math.max(0, Math.min(position, state.size));

  // Delegate to head/tail for boundary cases
  if (pos === 0) {
    steps.push(
      step(`Position ${position} is the head — delegating to head insertion.`, []),
    );
    const headResult = dllInsertHead(state, value);
    return { steps: [...steps, ...headResult.steps], snapshot: headResult.snapshot };
  }
  if (pos === state.size) {
    steps.push(
      step(`Position ${position} equals list size — delegating to tail insertion.`, []),
    );
    const tailResult = dllInsertTail(state, value);
    return { steps: [...steps, ...tailResult.steps], snapshot: tailResult.snapshot };
  }

  const s = cloneDLL(state);
  const newId = `dll-${s.size}`;

  steps.push(
    step(
      `Insert ${value} at position ${pos}. Unlike arrays, DLL requires sequential access — we must traverse from head to find the insertion point.`,
      [{ targetId: newId, property: 'highlight', from: 'default', to: 'inserting' }],
    ),
  );

  // Traverse to find the node currently at `pos`
  const orderedIds = walkForward(s);
  for (let i = 0; i < pos; i++) {
    const visiting = findNode(s, orderedIds[i]);
    if (visiting) {
      steps.push(
        step(
          `Traverse forward from head to find position ${pos}. Visiting node ${visiting.value} at position ${i}. Unlike arrays, DLL requires sequential access — we can't jump to index ${pos} directly.`,
          [{ targetId: visiting.id, property: 'highlight', from: 'default', to: 'visiting' }],
        ),
      );
    }
  }

  const nodeAtPos = findNode(s, orderedIds[pos]);
  const prevNode = nodeAtPos ? findNode(s, nodeAtPos.prev!) : undefined;

  if (!nodeAtPos || !prevNode) {
    steps.push(step(`Error: could not locate nodes around position ${pos}.`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Found position ${pos}. Insert ${value} between ${prevNode.value} and ${nodeAtPos.value}. We update four pointers: prevNode.next, newNode.prev, newNode.next, and nodeAtPos.prev.`,
      [
        { targetId: prevNode.id, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: nodeAtPos.id, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: newId, property: 'highlight', from: 'inserting', to: 'shifting' },
      ],
    ),
  );

  const newNode: DLLNode = { id: newId, value, prev: prevNode.id, next: nodeAtPos.id };
  prevNode.next = newId;
  nodeAtPos.prev = newId;

  s.nodes.push(newNode);
  s.size++;

  steps.push(
    step(`Insert complete. ${prevNode.value} ↔ ${value} ↔ ${nodeAtPos.value}. Size: ${s.size}`, [
      { targetId: newId, property: 'highlight', from: 'shifting', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Delete by Value ────────────────────────────────────────

export function dllDelete(state: DLLState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDLL(state);

  if (s.size === 0) {
    steps.push(step('List is empty — nothing to delete.', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Search for node with value ${value} to delete. DLL deletion is O(1) once we have the node reference — the cost is finding it (O(n) linear scan).`,
      [],
    ),
  );

  // Walk forward to find the target node
  const orderedIds = walkForward(s);
  let targetNode: DLLNode | undefined;

  for (const id of orderedIds) {
    const node = findNode(s, id);
    if (!node) continue;

    const isMatch = node.value === value;
    steps.push(
      step(
        `Check node ${node.value}${isMatch ? ' — FOUND' : ''}`,
        [
          {
            targetId: node.id,
            property: 'highlight',
            from: 'default',
            to: isMatch ? 'found' : 'comparing',
          },
        ],
      ),
    );

    if (isMatch) {
      targetNode = node;
      break;
    }
  }

  if (!targetNode) {
    steps.push(step(`Value ${value} not found in the list.`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Delete node ${value}. We update its prev node's next pointer AND its next node's prev pointer — this is why DLL deletion is O(1) once we have the node reference.`,
      [{ targetId: targetNode.id, property: 'highlight', from: 'found', to: 'deleting' }],
    ),
  );

  // Update prev node's next pointer
  if (targetNode.prev !== null) {
    const prevNode = findNode(s, targetNode.prev);
    if (prevNode) {
      prevNode.next = targetNode.next;
      steps.push(
        step(
          `Update prev node (${prevNode.value}).next to skip over deleted node — now points to ${targetNode.next !== null ? findNode(s, targetNode.next)?.value ?? 'null' : 'null'}.`,
          [
            { targetId: prevNode.id, property: 'next', from: targetNode.id, to: targetNode.next ?? 'null' },
          ],
        ),
      );
    }
  } else {
    // Target was head — advance head
    s.headId = targetNode.next;
    steps.push(
      step(`Deleted node was head. Advance head pointer to the next node.`, []),
    );
  }

  // Update next node's prev pointer
  if (targetNode.next !== null) {
    const nextNode = findNode(s, targetNode.next);
    if (nextNode) {
      nextNode.prev = targetNode.prev;
      steps.push(
        step(
          `Update next node (${nextNode.value}).prev to skip over deleted node — now points to ${targetNode.prev !== null ? findNode(s, targetNode.prev)?.value ?? 'null' : 'null'}.`,
          [
            { targetId: nextNode.id, property: 'prev', from: targetNode.id, to: targetNode.prev ?? 'null' },
          ],
        ),
      );
    }
  } else {
    // Target was tail — move tail back
    s.tailId = targetNode.prev;
    steps.push(
      step(`Deleted node was tail. Move tail pointer to the previous node.`, []),
    );
  }

  // Remove from nodes array
  s.nodes = s.nodes.filter((n) => n.id !== targetNode!.id);
  s.size--;

  steps.push(
    step(`Delete complete. Removed ${value}. Size: ${s.size}`, []),
  );

  return { steps, snapshot: s };
}

// ── Search ─────────────────────────────────────────────────

export function dllSearch(state: DLLState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDLL(state);

  if (s.size === 0) {
    steps.push(step('List is empty — nothing to search.', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Search for ${value} in DLL (${s.size} nodes). Linear scan from head — DLL does not support random access, so we must traverse sequentially.`,
      [],
    ),
  );

  const orderedIds = walkForward(s);

  for (let i = 0; i < orderedIds.length; i++) {
    const node = findNode(s, orderedIds[i]);
    if (!node) continue;

    const isMatch = node.value === value;
    const direction = i < orderedIds.length / 2 ? 'forward from head' : 'continuing toward tail';

    steps.push(
      step(
        `Check node at position ${i}: value = ${node.value} (traversing ${direction})${isMatch ? ' — FOUND' : ''}`,
        [
          {
            targetId: node.id,
            property: 'highlight',
            from: 'default',
            to: isMatch ? 'found' : 'comparing',
          },
        ],
      ),
    );

    if (isMatch) {
      steps.push(
        step(
          `Found ${value} at position ${i}. In a DLL with a known position, we could also reach this node by traversing backward from tail — bidirectional traversal is the key advantage of DLL over singly linked lists.`,
          [{ targetId: node.id, property: 'highlight', from: 'found', to: 'done' }],
        ),
      );
      return { steps, snapshot: s };
    }
  }

  steps.push(step(`Value ${value} not found after scanning all ${s.size} nodes.`, []));
  return { steps, snapshot: s };
}

// ── Reverse ────────────────────────────────────────────────

export function dllReverse(state: DLLState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneDLL(state);

  if (s.size <= 1) {
    steps.push(
      step(
        s.size === 0
          ? 'List is empty — nothing to reverse.'
          : 'List has only one node — already reversed.',
        [],
      ),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Reverse DLL with ${s.size} nodes. We swap every node's prev and next pointers, then swap the head and tail pointers. This is O(n) — we must visit every node.`,
      [],
    ),
  );

  const orderedIds = walkForward(s);

  for (const id of orderedIds) {
    const node = findNode(s, id);
    if (!node) continue;

    const oldPrev = node.prev;
    const oldNext = node.next;
    node.prev = oldNext;
    node.next = oldPrev;

    steps.push(
      step(
        `Swap prev/next pointers for node ${node.value}: prev was ${oldPrev ?? 'null'} → now ${node.prev ?? 'null'}, next was ${oldNext ?? 'null'} → now ${node.next ?? 'null'}.`,
        [
          { targetId: node.id, property: 'prev', from: oldPrev ?? 'null', to: node.prev ?? 'null' },
          { targetId: node.id, property: 'next', from: oldNext ?? 'null', to: node.next ?? 'null' },
          { targetId: node.id, property: 'highlight', from: 'default', to: 'shifting' },
        ],
      ),
    );
  }

  // Swap head and tail
  const oldHead = s.headId;
  const oldTail = s.tailId;
  s.headId = oldTail;
  s.tailId = oldHead;

  steps.push(
    step(
      `Swap head and tail pointers. Old head → new tail, old tail → new head. The list is now fully reversed.`,
      [
        { targetId: s.headId ?? '', property: 'highlight', from: 'shifting', to: 'done' },
        { targetId: s.tailId ?? '', property: 'highlight', from: 'shifting', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: s };
}
