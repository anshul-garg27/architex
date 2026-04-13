// -----------------------------------------------------------------
// Architex -- Circular Buffer (Ring Buffer) Simulation  (DST-028)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface CircularBufferState {
  /** Fixed-size internal storage */
  data: (number | null)[];
  /** Write (tail) pointer -- next position to write */
  writePtr: number;
  /** Read (head) pointer -- next position to read */
  readPtr: number;
  /** Capacity (fixed) */
  capacity: number;
  /** Current count of elements in the buffer */
  count: number;
  /** Number of times an enqueue has overwritten an unread element */
  overwriteCount: number;
}

// ── Create ──────────────────────────────────────────────────

export function createCircularBuffer(capacity: number): CircularBufferState {
  return {
    data: Array.from({ length: capacity }, () => null),
    writePtr: 0,
    readPtr: 0,
    capacity,
    count: 0,
    overwriteCount: 0,
  };
}

export function cloneCircularBuffer(buf: CircularBufferState): CircularBufferState {
  return {
    data: [...buf.data],
    writePtr: buf.writePtr,
    readPtr: buf.readPtr,
    capacity: buf.capacity,
    count: buf.count,
    overwriteCount: buf.overwriteCount,
  };
}

// ── enqueue ─────────────────────────────────────────────────

export function cbEnqueue(
  buf: CircularBufferState,
  value: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneCircularBuffer(buf);

  steps.push(step(`enqueue(${value})`, []));

  const isFull = copy.count === copy.capacity;

  // Highlight writePtr position
  steps.push(
    step(
      `Write pointer at index ${copy.writePtr}${isFull ? ' (buffer full -- will overwrite)' : ''}`,
      [
        { targetId: `cb-${copy.writePtr}`, property: 'highlight', from: 'default', to: isFull ? 'deleting' : 'inserting' },
        { targetId: `cb-ptr-write`, property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  if (isFull) {
    copy.overwriteCount++;
    // Advance readPtr because we are overwriting the oldest element
    steps.push(
      step(
        `Overwriting oldest element (${copy.data[copy.writePtr]}) at index ${copy.writePtr}. Advance read pointer ${copy.readPtr} -> ${(copy.readPtr + 1) % copy.capacity}`,
        [
          { targetId: `cb-${copy.writePtr}`, property: 'highlight', from: 'default', to: 'deleting' },
          { targetId: `cb-ptr-read`, property: 'highlight', from: 'default', to: 'shifting' },
        ],
      ),
    );
    copy.readPtr = (copy.readPtr + 1) % copy.capacity;
  } else {
    copy.count++;
  }

  copy.data[copy.writePtr] = value;
  const prevWrite = copy.writePtr;
  copy.writePtr = (copy.writePtr + 1) % copy.capacity;

  steps.push(
    step(
      `Wrote ${value} at index ${prevWrite}. Write pointer wraps to ${copy.writePtr}. Count: ${copy.count}/${copy.capacity}. Overwrites: ${copy.overwriteCount}`,
      [
        { targetId: `cb-${prevWrite}`, property: 'highlight', from: 'default', to: 'done' },
        { targetId: `cb-ptr-write`, property: 'highlight', from: 'default', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: copy };
}

// ── dequeue ─────────────────────────────────────────────────

export function cbDequeue(
  buf: CircularBufferState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (buf.count === 0) {
    steps.push(step('dequeue() -- buffer is empty', []));
    return { steps, snapshot: buf };
  }

  const copy = cloneCircularBuffer(buf);
  const val = copy.data[copy.readPtr];

  steps.push(step(`dequeue() -- reading from index ${copy.readPtr}`, []));

  steps.push(
    step(
      `Read pointer at index ${copy.readPtr}, value = ${val}`,
      [
        { targetId: `cb-${copy.readPtr}`, property: 'highlight', from: 'default', to: 'found' },
        { targetId: `cb-ptr-read`, property: 'highlight', from: 'default', to: 'found' },
      ],
    ),
  );

  copy.data[copy.readPtr] = null;
  const prevRead = copy.readPtr;
  copy.readPtr = (copy.readPtr + 1) % copy.capacity;
  copy.count--;

  steps.push(
    step(
      `Removed ${val} from index ${prevRead}. Read pointer wraps to ${copy.readPtr}. Count: ${copy.count}/${copy.capacity}`,
      [
        { targetId: `cb-${prevRead}`, property: 'highlight', from: 'default', to: 'deleting' },
        { targetId: `cb-ptr-read`, property: 'highlight', from: 'default', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: copy };
}

// ── peek ────────────────────────────────────────────────────

export function cbPeek(
  buf: CircularBufferState,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (buf.count === 0) {
    steps.push(step('peek() -- buffer is empty', []));
  } else {
    steps.push(
      step(
        `peek() = ${buf.data[buf.readPtr]} at read pointer index ${buf.readPtr}`,
        [
          { targetId: `cb-${buf.readPtr}`, property: 'highlight', from: 'default', to: 'found' },
        ],
      ),
    );
  }

  return { steps, snapshot: buf };
}

// ── isFull / isEmpty ────────────────────────────────────────

export function cbIsFull(
  buf: CircularBufferState,
): DSResult {
  const { step } = createStepRecorder();
  const full = buf.count === buf.capacity;
  const steps: DSStep[] = [
    step(
      `isFull() = ${full} (${buf.count}/${buf.capacity})`,
      full
        ? buf.data.map((_, i) => ({
            targetId: `cb-${i}`,
            property: 'highlight',
            from: 'default',
            to: 'found',
          }))
        : [],
    ),
  ];
  return { steps, snapshot: buf };
}
