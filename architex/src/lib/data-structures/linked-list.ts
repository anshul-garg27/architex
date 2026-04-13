// -----------------------------------------------------------------
// Architex -- Singly Linked List  (DST-005)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Node type ───────────────────────────────────────────────

// WHY ID-based pointers instead of object references: Using string IDs (e.g., "ll-node-3")
// instead of direct object references makes it possible to serialize the list state to JSON
// for step recording, undo/redo, and React state management. Object references create
// circular structures that cannot be serialized or compared with === in React's reconciler.
// The trade-off is O(n) lookups via nodes.find() instead of O(1) pointer derefs, but
// for educational visualization with small lists, correctness and serializability matter more.
export interface LLNode {
  id: string;
  value: number;
  next: string | null; // id of next node, null for tail
}

export interface LLState {
  nodes: LLNode[];
  headId: string | null;
}

let _nodeIdCounter = 0;

function newNodeId(): string {
  return `ll-node-${_nodeIdCounter++}`;
}

// WHY shallow clone is sufficient: Each LLNode only contains primitives (id, value)
// and a string pointer (next). Spread creates independent copies of these primitives,
// so mutating a cloned node's next pointer does not affect the original list.
function cloneList(nodes: LLNode[]): LLNode[] {
  return nodes.map((n) => ({ ...n }));
}

// ── Insert at Head ──────────────────────────────────────────

export function llInsertHead(nodes: LLNode[], headId: string | null, value: number): DSResult<LLState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneList(nodes);
  const newId = newNodeId();

  steps.push(
    step(`Create new node with value ${value}. Unlike arrays, linked list nodes are allocated individually — each holds a value and a pointer to the next node.`, [
      { targetId: newId, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  steps.push(
    step(`Set new node.next = ${headId ? `head (${nodes.find((n) => n.id === headId)?.value ?? '?'})` : 'null'}. We point the new node at the current head — inserting at head is O(1) because no traversal is needed.`, [
      { targetId: newId, property: 'pointer', from: 'null', to: headId ?? 'null' },
    ]),
  );

  const newNode: LLNode = { id: newId, value, next: headId };
  copy.unshift(newNode);

  steps.push(
    step(`Update head to new node. List length: ${copy.length}`, [
      { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: { nodes: copy, headId: newId } };
}

// ── Insert at Tail ──────────────────────────────────────────

export function llInsertTail(nodes: LLNode[], headId: string | null, value: number): DSResult<LLState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneList(nodes);
  const newId = newNodeId();

  if (copy.length === 0 || !headId) {
    steps.push(
      step(`List is empty. Insert ${value} as head`, [
        { targetId: newId, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    const newNode: LLNode = { id: newId, value, next: null };
    copy.push(newNode);
    return { steps, snapshot: { nodes: copy, headId: newId } };
  }

  steps.push(step(`Traverse to find tail. A singly linked list has no direct access to the tail — we must follow the chain of next pointers from head, making tail insertion O(n).`, []));

  // Walk the list
  let current = copy.find((n) => n.id === headId);
  while (current) {
    steps.push(
      step(`Visit node ${current.value}${current.next ? '' : ' (tail)'}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
    if (!current.next) break;
    const nextNode = copy.find((n) => n.id === current!.next);
    current = nextNode;
  }

  steps.push(
    step(`Create new node ${value} and link from tail`, [
      { targetId: newId, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  const newNode: LLNode = { id: newId, value, next: null };
  if (current) {
    current.next = newId;
  }
  copy.push(newNode);

  steps.push(
    step(`Inserted ${value} at tail. List length: ${copy.length}`, [
      { targetId: newId, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: { nodes: copy, headId } };
}

// ── Insert at Position ──────────────────────────────────────

export function llInsertAt(
  nodes: LLNode[],
  headId: string | null,
  position: number,
  value: number,
): DSResult<LLState> {
  if (position <= 0 || !headId) {
    return llInsertHead(nodes, headId, value);
  }

  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneList(nodes);

  steps.push(step(`Insert ${value} at position ${position}`, []));

  // Walk to position - 1
  let current = copy.find((n) => n.id === headId);
  let idx = 0;
  while (current && idx < position - 1 && current.next) {
    steps.push(
      step(`Traverse node ${current.value} at position ${idx}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'visiting' },
      ]),
    );
    const nextNode = copy.find((n) => n.id === current!.next);
    current = nextNode;
    idx++;
  }

  if (!current) {
    steps.push(step(`Position ${position} exceeds list length`, []));
    return { steps, snapshot: { nodes: copy, headId } };
  }

  steps.push(
    step(`Found insertion point after node ${current.value}`, [
      { targetId: current.id, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  const newId = newNodeId();
  const newNode: LLNode = { id: newId, value, next: current.next };
  current.next = newId;

  // Insert into the copy array at the right position
  const insertIdx = copy.indexOf(current) + 1;
  copy.splice(insertIdx, 0, newNode);

  steps.push(
    step(`Inserted ${value} at position ${position}. List length: ${copy.length}`, [
      { targetId: newId, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: { nodes: copy, headId } };
}

// ── Delete by Value ─────────────────────────────────────────

export function llDelete(nodes: LLNode[], headId: string | null, value: number): DSResult<LLState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneList(nodes);

  if (copy.length === 0 || !headId) {
    steps.push(step('List is empty -- nothing to delete', []));
    return { steps, snapshot: { nodes: copy, headId } };
  }

  // WHY we track the predecessor: In a singly linked list, deletion requires updating
  // the previous node's `next` pointer. Without a `prev` reference, we must walk from
  // the head keeping track of the node before our target. Doubly-linked lists avoid
  // this by storing both `next` and `prev`, enabling O(1) deletion once the node is found.
  steps.push(step(`Delete node with value ${value}. To delete, we must find the node AND its predecessor — the predecessor's next pointer must be rewired to skip the deleted node.`, []));

  const head = copy.find((n) => n.id === headId);
  if (!head) {
    steps.push(step('Head node not found', []));
    return { steps, snapshot: { nodes: copy, headId } };
  }

  // Special case: head is the target
  if (head.value === value) {
    steps.push(
      step(`Head node has value ${value} -- remove it`, [
        { targetId: head.id, property: 'highlight', from: 'default', to: 'deleting' },
      ]),
    );
    const newHeadId = head.next;
    const idx = copy.findIndex((n) => n.id === head.id);
    copy.splice(idx, 1);
    steps.push(
      step(`Deleted head. New head: ${newHeadId ? copy.find((n) => n.id === newHeadId)?.value ?? '?' : 'null'}`, []),
    );
    return { steps, snapshot: { nodes: copy, headId: newHeadId } };
  }

  // Walk to find the node
  let prev = head;
  let current: LLNode | undefined = copy.find((n) => n.id === head.next);

  while (current) {
    steps.push(
      step(`Visit node ${current.value}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (current.value === value) {
      steps.push(
        step(`Found ${value} -- unlink from list`, [
          { targetId: current.id, property: 'highlight', from: 'comparing', to: 'deleting' },
        ]),
      );
      prev.next = current.next;
      const idx = copy.findIndex((n) => n.id === current!.id);
      copy.splice(idx, 1);
      steps.push(
        step(`Deleted ${value}. List length: ${copy.length}`, [
          { targetId: prev.id, property: 'pointer', from: current.id, to: current.next ?? 'null' },
        ]),
      );
      return { steps, snapshot: { nodes: copy, headId } };
    }

    steps.push(
      step(`${current.value} != ${value}, continue`, [
        { targetId: current.id, property: 'highlight', from: 'comparing', to: 'visited' },
      ]),
    );

    prev = current;
    const nextNode = copy.find((n) => n.id === current!.next);
    current = nextNode;
  }

  steps.push(step(`${value} not found in list`, []));
  return { steps, snapshot: { nodes: copy, headId } };
}

// ── Search ──────────────────────────────────────────────────

export function llSearch(nodes: LLNode[], headId: string | null, value: number): DSResult<LLState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (nodes.length === 0 || !headId) {
    steps.push(step('List is empty', []));
    return { steps, snapshot: { nodes, headId } };
  }

  steps.push(step(`Search for ${value}. Linked lists have no random access — we must follow pointers node by node from the head, making search O(n).`, []));

  let current = nodes.find((n) => n.id === headId);
  let idx = 0;

  while (current) {
    steps.push(
      step(`Compare node at position ${idx}: ${current.value} with ${value}`, [
        { targetId: current.id, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (current.value === value) {
      steps.push(
        step(`Found ${value} at position ${idx}!`, [
          { targetId: current.id, property: 'highlight', from: 'comparing', to: 'found' },
        ]),
      );
      return { steps, snapshot: { nodes, headId } };
    }

    steps.push(
      step(`${current.value} != ${value}, follow next pointer. Unlike arrays, we cannot jump to an arbitrary index — we must traverse one node at a time.`, [
        { targetId: current.id, property: 'highlight', from: 'comparing', to: 'visited' },
      ]),
    );

    const nextNode = nodes.find((n) => n.id === current!.next);
    current = nextNode;
    idx++;
  }

  steps.push(step(`${value} not found in list`, []));
  return { steps, snapshot: { nodes, headId } };
}
