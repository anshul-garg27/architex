// -----------------------------------------------------------------
// Architex -- Array / Stack / Queue Data Structures  (DST-004)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Array Operations ────────────────────────────────────────

// WHY we clone before mutating: We create a shallow copy ([...arr]) so the original
// array is never modified. This immutability pattern ensures the step-recorder can
// capture the "before" state for animations while we build the "after" snapshot.
// Without cloning, the caller's state and the recorded steps would both reference
// the same mutated array, causing visual glitches in step playback.
export function arrayInsert(
  arr: number[],
  index: number,
  value: number,
): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = [...arr];
  const idx = Math.max(0, Math.min(index, copy.length));

  steps.push(
    step(`Insert ${value} at index ${idx}. Array insertion requires shifting all elements after this position to make room — this is why insert is O(n).`, [
      { targetId: `arr-${idx}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  // WHY shift is O(n): Arrays store elements contiguously in memory. To insert in the
  // middle, every element after the insertion point must physically move one slot right
  // to make room. This is the fundamental trade-off: arrays give O(1) random access
  // but O(n) insertion/deletion. Linked lists reverse this trade-off.
  // Shift elements right
  for (let i = copy.length; i > idx; i--) {
    steps.push(
      step(`Shift arr[${i - 1}] = ${copy[i - 1]} right to index ${i}. Each element after the insertion point must move one position — the more elements, the more work.`, [
        { targetId: `arr-${i - 1}`, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: `arr-${i}`, property: 'highlight', from: 'default', to: 'shifting' },
      ]),
    );
  }

  copy.splice(idx, 0, value);

  steps.push(
    step(`Placed ${value} at index ${idx}. New length: ${copy.length}`, [
      { targetId: `arr-${idx}`, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: copy };
}

export function arrayDelete(arr: number[], index: number): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = [...arr];

  if (index < 0 || index >= copy.length) {
    steps.push(step(`Index ${index} out of bounds (length ${copy.length})`, []));
    return { steps, snapshot: copy };
  }

  steps.push(
    step(`Delete element ${copy[index]} at index ${index}. Like insertion, deletion requires shifting elements to fill the gap — O(n) because every element after this index must move left.`, [
      { targetId: `arr-${index}`, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Shift elements left
  for (let i = index; i < copy.length - 1; i++) {
    steps.push(
      step(`Shift arr[${i + 1}] = ${copy[i + 1]} left to index ${i}. Filling the gap left by the deleted element — each subsequent element slides one position toward the front.`, [
        { targetId: `arr-${i + 1}`, property: 'highlight', from: 'default', to: 'shifting' },
        { targetId: `arr-${i}`, property: 'highlight', from: 'default', to: 'shifting' },
      ]),
    );
  }

  copy.splice(index, 1);

  steps.push(
    step(`Removed element. New length: ${copy.length}`, []),
  );

  return { steps, snapshot: copy };
}

export function arraySearch(arr: number[], value: number): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  steps.push(step(`Linear search for ${value}. We check each element one by one because arrays have no ordering guarantee — any element could be anywhere.`, []));

  for (let i = 0; i < arr.length; i++) {
    steps.push(
      step(`Compare arr[${i}] = ${arr[i]} with ${value}`, [
        { targetId: `arr-${i}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
    if (arr[i] === value) {
      steps.push(
        step(`Found ${value} at index ${i}!`, [
          { targetId: `arr-${i}`, property: 'highlight', from: 'comparing', to: 'found' },
        ]),
      );
      return { steps, snapshot: arr };
    }
    steps.push(
      step(`${arr[i]} != ${value}, move next`, [
        { targetId: `arr-${i}`, property: 'highlight', from: 'comparing', to: 'visited' },
      ]),
    );
  }

  steps.push(step(`${value} not found in array`, []));
  return { steps, snapshot: arr };
}

// ── Stack Operations ────────────────────────────────────────

export function stackPush(stack: number[], value: number): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = [...stack];

  steps.push(
    step(`Push ${value} onto stack (top = index ${copy.length}). A stack adds to the end of the array — no shifting needed, so push is O(1).`, [
      { targetId: `stack-${copy.length}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  copy.push(value);

  steps.push(
    step(`Stack size: ${copy.length}. Top = ${value}`, [
      { targetId: `stack-${copy.length - 1}`, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: copy };
}

export function stackPop(stack: number[]): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = [...stack];

  if (copy.length === 0) {
    steps.push(step('Stack is empty -- cannot pop', []));
    return { steps, snapshot: copy };
  }

  const topIdx = copy.length - 1;
  const value = copy[topIdx];

  steps.push(
    step(`Pop top element ${value} (index ${topIdx}). LIFO: the last element pushed is the first removed — popping from the end is O(1) since no shifting is needed.`, [
      { targetId: `stack-${topIdx}`, property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  copy.pop();

  steps.push(
    step(`Removed ${value}. Stack size: ${copy.length}${copy.length > 0 ? `. New top = ${copy[copy.length - 1]}` : ''}`, []),
  );

  return { steps, snapshot: copy };
}

export function stackPeek(stack: number[]): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (stack.length === 0) {
    steps.push(step('Stack is empty -- nothing to peek', []));
    return { steps, snapshot: stack };
  }

  const topIdx = stack.length - 1;
  steps.push(
    step(`Peek: top element is ${stack[topIdx]} (index ${topIdx})`, [
      { targetId: `stack-${topIdx}`, property: 'highlight', from: 'default', to: 'found' },
    ]),
  );

  return { steps, snapshot: stack };
}

// ── Queue Operations ────────────────────────────────────────

export function queueEnqueue(queue: number[], value: number): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = [...queue];

  steps.push(
    step(`Enqueue ${value} at rear (index ${copy.length}). FIFO: new elements join at the back, like a real queue — adding to the end is O(1).`, [
      { targetId: `queue-${copy.length}`, property: 'highlight', from: 'default', to: 'inserting' },
    ]),
  );

  copy.push(value);

  steps.push(
    step(`Queue size: ${copy.length}. Front = ${copy[0]}, Rear = ${value}`, [
      { targetId: `queue-${copy.length - 1}`, property: 'highlight', from: 'inserting', to: 'done' },
    ]),
  );

  return { steps, snapshot: copy };
}

export function queueDequeue(queue: number[]): DSResult<number[]> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = [...queue];

  if (copy.length === 0) {
    steps.push(step('Queue is empty -- cannot dequeue', []));
    return { steps, snapshot: copy };
  }

  const value = copy[0];

  // WHY dequeue is O(n) with arrays: Removing from index 0 forces every remaining element
  // to shift left. A circular buffer or linked list avoids this — that is why production
  // queues (e.g., Java's ArrayDeque) use circular arrays instead of plain arrays.
  steps.push(
    step(`Dequeue front element ${value} (index 0). FIFO: the first element enqueued is the first removed. Removing from the front requires shifting all remaining elements — O(n) in an array-based queue.`, [
      { targetId: 'queue-0', property: 'highlight', from: 'default', to: 'deleting' },
    ]),
  );

  // Shift remaining elements
  for (let i = 0; i < copy.length - 1; i++) {
    steps.push(
      step(`Shift queue[${i + 1}] = ${copy[i + 1]} to index ${i}`, [
        { targetId: `queue-${i + 1}`, property: 'highlight', from: 'default', to: 'shifting' },
      ]),
    );
  }

  copy.shift();

  steps.push(
    step(`Removed ${value}. Queue size: ${copy.length}${copy.length > 0 ? `. Front = ${copy[0]}` : ''}`, []),
  );

  return { steps, snapshot: copy };
}
