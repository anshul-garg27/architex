// -----------------------------------------------------------------
// Architex -- Double-Ended Queue (Deque) Simulation
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface DequeState {
  data: number[];
}

// ── Create ──────────────────────────────────────────────────

export function createDeque(): DequeState {
  return { data: [] };
}

function cloneDeque(deque: DequeState): DequeState {
  return { data: [...deque.data] };
}

// ── pushFront ───────────────────────────────────────────────

export function dequePushFront(
  deque: DequeState,
  value: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneDeque(deque);

  steps.push(step(`pushFront(${value})`, []));

  // Shift all elements right
  if (copy.data.length > 0) {
    steps.push(
      step(
        `Shift all ${copy.data.length} element(s) right by 1`,
        copy.data.map((_, i) => ({
          targetId: `deque-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'shifting',
        })),
      ),
    );
  }

  copy.data.unshift(value);

  steps.push(
    step(
      `Insert ${value} at front (index 0)`,
      [
        { targetId: 'deque-0', property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  steps.push(
    step(`Deque size: ${copy.data.length}. Front: ${copy.data[0]}, Back: ${copy.data[copy.data.length - 1]}`, []),
  );

  return { steps, snapshot: copy };
}

// ── pushBack ────────────────────────────────────────────────

export function dequePushBack(
  deque: DequeState,
  value: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneDeque(deque);

  steps.push(step(`pushBack(${value})`, []));

  copy.data.push(value);
  const lastIdx = copy.data.length - 1;

  steps.push(
    step(
      `Insert ${value} at back (index ${lastIdx})`,
      [
        { targetId: `deque-${lastIdx}`, property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  steps.push(
    step(`Deque size: ${copy.data.length}. Front: ${copy.data[0]}, Back: ${copy.data[copy.data.length - 1]}`, []),
  );

  return { steps, snapshot: copy };
}

// ── popFront ────────────────────────────────────────────────

export function dequePopFront(
  deque: DequeState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (deque.data.length === 0) {
    steps.push(step('popFront() -- deque is empty', []));
    return { steps, snapshot: deque };
  }

  const copy = cloneDeque(deque);

  steps.push(step(`popFront() -- removing ${copy.data[0]}`, []));

  steps.push(
    step(
      `Remove element ${copy.data[0]} from front (index 0)`,
      [
        { targetId: 'deque-0', property: 'highlight', from: 'default', to: 'deleting' },
      ],
    ),
  );

  copy.data.shift();

  if (copy.data.length > 0) {
    steps.push(
      step(
        `Shift remaining ${copy.data.length} element(s) left`,
        copy.data.map((_, i) => ({
          targetId: `deque-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'shifting',
        })),
      ),
    );
  }

  const summary = copy.data.length > 0
    ? `Deque size: ${copy.data.length}. Front: ${copy.data[0]}, Back: ${copy.data[copy.data.length - 1]}`
    : 'Deque is now empty';
  steps.push(step(summary, []));

  return { steps, snapshot: copy };
}

// ── popBack ─────────────────────────────────────────────────

export function dequePopBack(
  deque: DequeState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (deque.data.length === 0) {
    steps.push(step('popBack() -- deque is empty', []));
    return { steps, snapshot: deque };
  }

  const copy = cloneDeque(deque);
  const lastIdx = copy.data.length - 1;
  const removed = copy.data[lastIdx];

  steps.push(step(`popBack() -- removing ${removed}`, []));

  steps.push(
    step(
      `Remove element ${removed} from back (index ${lastIdx})`,
      [
        { targetId: `deque-${lastIdx}`, property: 'highlight', from: 'default', to: 'deleting' },
      ],
    ),
  );

  copy.data.pop();

  const summary = copy.data.length > 0
    ? `Deque size: ${copy.data.length}. Front: ${copy.data[0]}, Back: ${copy.data[copy.data.length - 1]}`
    : 'Deque is now empty';
  steps.push(step(summary, []));

  return { steps, snapshot: copy };
}

// ── peekFront / peekBack ────────────────────────────────────

export function dequePeekFront(
  deque: DequeState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (deque.data.length === 0) {
    steps.push(step('peekFront() -- deque is empty', []));
  } else {
    steps.push(
      step(
        `peekFront() = ${deque.data[0]}`,
        [
          { targetId: 'deque-0', property: 'highlight', from: 'default', to: 'found' },
        ],
      ),
    );
  }

  return { steps, snapshot: deque };
}

export function dequePeekBack(
  deque: DequeState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (deque.data.length === 0) {
    steps.push(step('peekBack() -- deque is empty', []));
  } else {
    const lastIdx = deque.data.length - 1;
    steps.push(
      step(
        `peekBack() = ${deque.data[lastIdx]}`,
        [
          { targetId: `deque-${lastIdx}`, property: 'highlight', from: 'default', to: 'found' },
        ],
      ),
    );
  }

  return { steps, snapshot: deque };
}
