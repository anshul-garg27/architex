// -----------------------------------------------------------------
// Architex -- Priority Queue (backed by binary heap)  (DST-127)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface PQEntry {
  value: number;
  priority: number;
}

export interface PriorityQueueState {
  entries: PQEntry[]; // stored as a binary heap by priority
  type: 'min' | 'max';
  size: number;
}

// ── Factory + Clone ────────────────────────────────────────

export function createPQ(type: 'min' | 'max' = 'min'): PriorityQueueState {
  return { entries: [], type, size: 0 };
}

export function clonePQ(state: PriorityQueueState): PriorityQueueState {
  return {
    ...state,
    entries: state.entries.map((e) => ({ ...e })),
  };
}

// ── Heap helpers ───────────────────────────────────────────

function parentIdx(i: number): number {
  return Math.floor((i - 1) / 2);
}

function leftChildIdx(i: number): number {
  return 2 * i + 1;
}

function rightChildIdx(i: number): number {
  return 2 * i + 2;
}

/** Returns true when child should be above parent according to PQ type. */
function shouldBubbleUp(type: 'min' | 'max', parentPri: number, childPri: number): boolean {
  return type === 'min' ? childPri < parentPri : childPri > parentPri;
}

function pqLabel(type: 'min' | 'max'): string {
  return type === 'min' ? 'min-PQ' : 'max-PQ';
}

// ── Enqueue ────────────────────────────────────────────────

export function pqEnqueue(
  state: PriorityQueueState,
  value: number,
  priority: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = clonePQ(state);

  const entry: PQEntry = { value, priority };
  s.entries.push(entry);
  s.size++;
  let idx = s.entries.length - 1;

  steps.push(
    step(
      `Enqueue element ${value} with priority ${priority}. In a priority queue, elements are served by priority, not arrival order — like a hospital ER where critical patients go first.`,
      [{ targetId: `pq-${idx}`, property: 'highlight', from: 'default', to: 'inserting' }],
    ),
  );

  // Bubble up
  while (idx > 0) {
    const p = parentIdx(idx);
    steps.push(
      step(
        `Compare pq[${idx}] (priority ${s.entries[idx].priority}) with parent pq[${p}] (priority ${s.entries[p].priority}).`,
        [
          { targetId: `pq-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
          { targetId: `pq-${p}`, property: 'highlight', from: 'default', to: 'comparing' },
        ],
      ),
    );

    if (shouldBubbleUp(s.type, s.entries[p].priority, s.entries[idx].priority)) {
      steps.push(
        step(
          `Swap pq[${idx}] with pq[${p}] — child has ${s.type === 'min' ? 'lower' : 'higher'} priority, so it should be closer to the front of the queue.`,
          [
            { targetId: `pq-${idx}`, property: 'highlight', from: 'comparing', to: 'shifting' },
            { targetId: `pq-${p}`, property: 'highlight', from: 'comparing', to: 'shifting' },
          ],
        ),
      );
      [s.entries[idx], s.entries[p]] = [s.entries[p], s.entries[idx]];
      idx = p;
    } else {
      steps.push(
        step(
          `Heap property satisfied — element ${value} is in the correct position.`,
          [{ targetId: `pq-${idx}`, property: 'highlight', from: 'comparing', to: 'done' }],
        ),
      );
      break;
    }
  }

  if (idx === 0) {
    steps.push(
      step(
        `Element ${value} (priority ${priority}) bubbled up to root — it is now the highest-priority element in the ${pqLabel(s.type)}. Size: ${s.size}`,
        [{ targetId: 'pq-0', property: 'highlight', from: 'default', to: 'done' }],
      ),
    );
  }

  return { steps, snapshot: s };
}

// ── Dequeue ────────────────────────────────────────────────

export function pqDequeue(state: PriorityQueueState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = clonePQ(state);

  if (s.size === 0) {
    steps.push(step('Priority queue is empty — nothing to dequeue.', []));
    return { steps, snapshot: s };
  }

  const extracted = s.entries[0];
  steps.push(
    step(
      `Dequeue the highest-priority element. The ${pqLabel(s.type)} always serves the element with the ${s.type === 'min' ? 'smallest' : 'largest'} priority value. Internally, this is a heap extract-${s.type}.`,
      [{ targetId: 'pq-0', property: 'highlight', from: 'default', to: 'deleting' }],
    ),
  );

  steps.push(
    step(
      `Remove root: value = ${extracted.value}, priority = ${extracted.priority}.`,
      [{ targetId: 'pq-0', property: 'highlight', from: 'deleting', to: 'deleting' }],
    ),
  );

  if (s.size === 1) {
    s.entries.pop();
    s.size--;
    steps.push(step('Queue is now empty.', []));
    return { steps, snapshot: s };
  }

  // Move last element to root
  const last = s.entries.pop()!;
  s.entries[0] = last;
  s.size--;

  steps.push(
    step(
      `Move last element (value ${last.value}, priority ${last.priority}) to root to maintain complete binary tree shape.`,
      [{ targetId: 'pq-0', property: 'highlight', from: 'deleting', to: 'shifting' }],
    ),
  );

  // Bubble down
  let idx = 0;
  const n = s.entries.length;

  while (true) {
    const l = leftChildIdx(idx);
    const r = rightChildIdx(idx);
    let target = idx;

    if (l < n) {
      steps.push(
        step(
          `Compare pq[${idx}] (priority ${s.entries[idx].priority}) with left child pq[${l}] (priority ${s.entries[l].priority}).`,
          [
            { targetId: `pq-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
            { targetId: `pq-${l}`, property: 'highlight', from: 'default', to: 'comparing' },
          ],
        ),
      );
      if (shouldBubbleUp(s.type, s.entries[target].priority, s.entries[l].priority)) {
        target = l;
      }
    }

    if (r < n) {
      steps.push(
        step(
          `Compare pq[${target}] (priority ${s.entries[target].priority}) with right child pq[${r}] (priority ${s.entries[r].priority}).`,
          [
            { targetId: `pq-${target}`, property: 'highlight', from: 'default', to: 'comparing' },
            { targetId: `pq-${r}`, property: 'highlight', from: 'default', to: 'comparing' },
          ],
        ),
      );
      if (shouldBubbleUp(s.type, s.entries[target].priority, s.entries[r].priority)) {
        target = r;
      }
    }

    if (target === idx) {
      steps.push(
        step(
          `Heap property restored at index ${idx} — element is in the correct position.`,
          [{ targetId: `pq-${idx}`, property: 'highlight', from: 'default', to: 'done' }],
        ),
      );
      break;
    }

    steps.push(
      step(
        `Swap pq[${idx}] (priority ${s.entries[idx].priority}) with pq[${target}] (priority ${s.entries[target].priority}) — restoring heap order.`,
        [
          { targetId: `pq-${idx}`, property: 'highlight', from: 'comparing', to: 'shifting' },
          { targetId: `pq-${target}`, property: 'highlight', from: 'comparing', to: 'shifting' },
        ],
      ),
    );
    [s.entries[idx], s.entries[target]] = [s.entries[target], s.entries[idx]];
    idx = target;
  }

  steps.push(
    step(
      `Dequeued value ${extracted.value} (priority ${extracted.priority}). Size: ${s.size}`,
      [],
    ),
  );

  return { steps, snapshot: s };
}

// ── Peek ───────────────────────────────────────────────────

export function pqPeek(state: PriorityQueueState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = clonePQ(state);

  if (s.size === 0) {
    steps.push(step('Priority queue is empty — nothing to peek.', []));
    return { steps, snapshot: s };
  }

  const top = s.entries[0];

  steps.push(
    step(
      `Peek at the highest-priority element in the ${pqLabel(s.type)}. The root of the internal heap always holds the element that would be dequeued next.`,
      [{ targetId: 'pq-0', property: 'highlight', from: 'default', to: 'visiting' }],
    ),
  );

  steps.push(
    step(
      `Top element: value = ${top.value}, priority = ${top.priority}. Peek is O(1) because the heap root is always the ${s.type === 'min' ? 'minimum' : 'maximum'}-priority element.`,
      [{ targetId: 'pq-0', property: 'highlight', from: 'visiting', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── Change Priority ────────────────────────────────────────

export function pqChangePriority(
  state: PriorityQueueState,
  value: number,
  newPriority: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = clonePQ(state);

  if (s.size === 0) {
    steps.push(step('Priority queue is empty — nothing to update.', []));
    return { steps, snapshot: s };
  }

  // Find the element by value
  let foundIdx = -1;
  for (let i = 0; i < s.entries.length; i++) {
    const isMatch = s.entries[i].value === value;
    steps.push(
      step(
        `Scan pq[${i}]: value = ${s.entries[i].value}${isMatch ? ' — FOUND' : ''}`,
        [
          {
            targetId: `pq-${i}`,
            property: 'highlight',
            from: 'default',
            to: isMatch ? 'found' : 'comparing',
          },
        ],
      ),
    );
    if (isMatch) {
      foundIdx = i;
      break;
    }
  }

  if (foundIdx === -1) {
    steps.push(step(`Value ${value} not found in the priority queue.`, []));
    return { steps, snapshot: s };
  }

  const oldPriority = s.entries[foundIdx].priority;
  s.entries[foundIdx].priority = newPriority;

  const priorityIncreased = s.type === 'min'
    ? newPriority < oldPriority
    : newPriority > oldPriority;
  const directionLabel = priorityIncreased ? 'UP' : 'DOWN';

  steps.push(
    step(
      `Change priority of element ${value} from ${oldPriority} to ${newPriority}. The element bubbles ${directionLabel} because its new priority is ${priorityIncreased ? 'higher' : 'lower'} (${s.type === 'min' ? 'lower number = higher priority in min-PQ' : 'higher number = higher priority in max-PQ'}).`,
      [{ targetId: `pq-${foundIdx}`, property: 'highlight', from: 'found', to: 'shifting' }],
    ),
  );

  let idx = foundIdx;

  if (priorityIncreased) {
    // Bubble up
    while (idx > 0) {
      const p = parentIdx(idx);
      if (shouldBubbleUp(s.type, s.entries[p].priority, s.entries[idx].priority)) {
        steps.push(
          step(
            `Bubble up: swap pq[${idx}] (priority ${s.entries[idx].priority}) with parent pq[${p}] (priority ${s.entries[p].priority}).`,
            [
              { targetId: `pq-${idx}`, property: 'highlight', from: 'default', to: 'shifting' },
              { targetId: `pq-${p}`, property: 'highlight', from: 'default', to: 'shifting' },
            ],
          ),
        );
        [s.entries[idx], s.entries[p]] = [s.entries[p], s.entries[idx]];
        idx = p;
      } else {
        break;
      }
    }
  } else {
    // Bubble down
    const n = s.entries.length;
    while (true) {
      const l = leftChildIdx(idx);
      const r = rightChildIdx(idx);
      let target = idx;

      if (l < n && shouldBubbleUp(s.type, s.entries[target].priority, s.entries[l].priority)) {
        target = l;
      }
      if (r < n && shouldBubbleUp(s.type, s.entries[target].priority, s.entries[r].priority)) {
        target = r;
      }

      if (target === idx) break;

      steps.push(
        step(
          `Bubble down: swap pq[${idx}] (priority ${s.entries[idx].priority}) with pq[${target}] (priority ${s.entries[target].priority}).`,
          [
            { targetId: `pq-${idx}`, property: 'highlight', from: 'default', to: 'shifting' },
            { targetId: `pq-${target}`, property: 'highlight', from: 'default', to: 'shifting' },
          ],
        ),
      );
      [s.entries[idx], s.entries[target]] = [s.entries[target], s.entries[idx]];
      idx = target;
    }
  }

  steps.push(
    step(
      `Priority change complete. Element ${value} now at index ${idx} with priority ${newPriority}.`,
      [{ targetId: `pq-${idx}`, property: 'highlight', from: 'shifting', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── Search ─────────────────────────────────────────────────

export function pqSearch(state: PriorityQueueState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = clonePQ(state);

  if (s.size === 0) {
    steps.push(step('Priority queue is empty — nothing to search.', []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Search for value ${value} in ${pqLabel(s.type)} (${s.size} elements). Heap structure does not help — we must do a linear scan, making search O(n).`,
      [],
    ),
  );

  for (let i = 0; i < s.entries.length; i++) {
    const isMatch = s.entries[i].value === value;
    steps.push(
      step(
        `Check pq[${i}]: value = ${s.entries[i].value}, priority = ${s.entries[i].priority}${isMatch ? ' — FOUND' : ''}`,
        [
          {
            targetId: `pq-${i}`,
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
          `Found value ${value} at index ${i} with priority ${s.entries[i].priority}.`,
          [{ targetId: `pq-${i}`, property: 'highlight', from: 'found', to: 'done' }],
        ),
      );
      return { steps, snapshot: s };
    }
  }

  steps.push(step(`Value ${value} not found in the priority queue.`, []));
  return { steps, snapshot: s };
}
