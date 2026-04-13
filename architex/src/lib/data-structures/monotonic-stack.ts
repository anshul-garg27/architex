// -----------------------------------------------------------------
// Architex -- Monotonic Stack / Queue Data Structure  (DST-132)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface MonotonicState {
  data: number[];
  type: 'increasing' | 'decreasing';
  mode: 'stack' | 'queue';
}

// ── Helpers ────────────────────────────────────────────────

export function createMonotonic(
  type: 'increasing' | 'decreasing' = 'decreasing',
  mode: 'stack' | 'queue' = 'stack',
): MonotonicState {
  return { data: [], type, mode };
}

function cloneMonotonic(state: MonotonicState): MonotonicState {
  return { ...state, data: [...state.data] };
}

/** Returns true if `existing` must be popped before `incoming` can be pushed. */
function violatesProperty(type: 'increasing' | 'decreasing', existing: number, incoming: number): boolean {
  return type === 'increasing'
    ? existing >= incoming   // increasing: all elements must be strictly less
    : existing <= incoming;  // decreasing: all elements must be strictly greater
}

// ── Operations ─────────────────────────────────────────────

export function monotonicPush(state: MonotonicState, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneMonotonic(state);

  const label = `${s.type} monotonic ${s.mode}`;

  if (s.data.length === 0) {
    s.data.push(value);
    steps.push(
      step(`${label} is empty. Push ${value}. ${s.mode === 'stack' ? 'Stack' : 'Queue'}: [${s.data.join(', ')}]`, [
        { targetId: `mono-0`, property: 'highlight', from: 'default', to: 'done' },
      ]),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Pushing ${value} onto ${label} [${s.data.join(', ')}]`, []),
  );

  // Pop elements that violate monotonic property
  // For stack: compare from top (end of array)
  // For queue: also compare from top (end of array) -- the back of the deque
  let popped = 0;
  while (s.data.length > 0) {
    const topIdx = s.data.length - 1;
    const top = s.data[topIdx];

    if (!violatesProperty(s.type, top, value)) {
      break;
    }

    const comparison = s.type === 'decreasing'
      ? `${value} > ${top} (violates decreasing order)`
      : `${value} < ${top} (violates increasing order)`;

    steps.push(
      step(`Since ${comparison}, we pop ${top}. ${s.mode === 'stack' ? 'Stack' : 'Queue'}: [${s.data.slice(0, topIdx).join(', ')}]`, [
        { targetId: `mono-${topIdx}`, property: 'highlight', from: 'default', to: 'deleting' },
      ]),
    );

    s.data.pop();
    popped++;
  }

  // Check the next element to explain why we stop
  if (s.data.length > 0) {
    const topAfter = s.data[s.data.length - 1];
    const reason = s.type === 'decreasing'
      ? `${value} < ${topAfter}`
      : `${value} > ${topAfter}`;
    steps.push(
      step(`Now ${reason}, so we can push. ${s.mode === 'stack' ? 'Stack' : 'Queue'}: [${s.data.join(', ')}] -> push ${value}`, []),
    );
  }

  // Push the new value
  s.data.push(value);
  const newIdx = s.data.length - 1;

  const cleanup = popped > 0
    ? `This automatic cleanup is why monotonic ${s.mode}s solve '${s.type === 'decreasing' ? 'next greater element' : 'next smaller element'}' in O(n).`
    : `No elements violated ${s.type} order -- direct push.`;

  steps.push(
    step(`${s.mode === 'stack' ? 'Stack' : 'Queue'} becomes [${s.data.join(', ')}]. ${cleanup}`, [
      { targetId: `mono-${newIdx}`, property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

export function monotonicPop(state: MonotonicState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneMonotonic(state);

  if (s.data.length === 0) {
    steps.push(step(`${s.type} monotonic ${s.mode} is empty -- nothing to pop`, []));
    return { steps, snapshot: s };
  }

  if (s.mode === 'stack') {
    // Stack: pop from top (end)
    const idx = s.data.length - 1;
    const value = s.data.pop()!;
    steps.push(
      step(`Pop ${value} from top of monotonic stack. Stack: [${s.data.join(', ')}]. Size: ${s.data.length}`, [
        { targetId: `mono-${idx}`, property: 'highlight', from: 'default', to: 'deleting' },
      ]),
    );
  } else {
    // Queue: pop from front
    const value = s.data.shift()!;
    steps.push(
      step(`Dequeue ${value} from front of monotonic queue. Queue: [${s.data.join(', ')}]. Size: ${s.data.length}`, [
        { targetId: `mono-0`, property: 'highlight', from: 'default', to: 'deleting' },
      ]),
    );
  }

  return { steps, snapshot: s };
}

export function monotonicPeek(state: MonotonicState): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneMonotonic(state);

  if (s.data.length === 0) {
    steps.push(step(`${s.type} monotonic ${s.mode} is empty -- nothing to peek`, []));
    return { steps, snapshot: s };
  }

  if (s.mode === 'stack') {
    const idx = s.data.length - 1;
    const value = s.data[idx];
    steps.push(
      step(`Peek at top of monotonic stack: ${value} (index ${idx}). Stack is ${s.type}: [${s.data.join(', ')}]`, [
        { targetId: `mono-${idx}`, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
  } else {
    const value = s.data[0];
    steps.push(
      step(`Peek at front of monotonic queue: ${value}. Queue is ${s.type}: [${s.data.join(', ')}]`, [
        { targetId: `mono-0`, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
  }

  return { steps, snapshot: s };
}
