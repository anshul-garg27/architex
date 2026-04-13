/**
 * Thread Lifecycle State Machine
 *
 * Models the seven standard Java/JVM thread states and the legal
 * transitions between them.  Provides three example threads with
 * scripted state-change timelines for the visualization.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreadState =
  | 'new'
  | 'runnable'
  | 'running'
  | 'blocked'
  | 'waiting'
  | 'timed-waiting'
  | 'terminated';

export interface ThreadTransition {
  from: ThreadState;
  to: ThreadState;
  label: string;
}

/** A single moment in an example thread's life. */
export interface ThreadTimelineEntry {
  tick: number;
  state: ThreadState;
  description: string;
}

export interface ExampleThread {
  id: string;
  name: string;
  color: string;
  timeline: ThreadTimelineEntry[];
}

// ---------------------------------------------------------------------------
// State machine definition
// ---------------------------------------------------------------------------

export const THREAD_STATES: ThreadState[] = [
  'new',
  'runnable',
  'running',
  'blocked',
  'waiting',
  'timed-waiting',
  'terminated',
];

export const THREAD_STATE_COLORS: Record<ThreadState, string> = {
  new: '#6b7280',
  runnable: '#3b82f6',
  running: '#22c55e',
  blocked: '#ef4444',
  waiting: '#f59e0b',
  'timed-waiting': '#a855f7',
  terminated: '#374151',
};

export const THREAD_STATE_LABELS: Record<ThreadState, string> = {
  new: 'New',
  runnable: 'Runnable',
  running: 'Running',
  blocked: 'Blocked',
  waiting: 'Waiting',
  'timed-waiting': 'Timed Waiting',
  terminated: 'Terminated',
};

export const TRANSITIONS: ThreadTransition[] = [
  { from: 'new', to: 'runnable', label: 'start()' },
  { from: 'runnable', to: 'running', label: 'scheduler dispatch' },
  { from: 'running', to: 'runnable', label: 'yield / preempt' },
  { from: 'running', to: 'blocked', label: 'acquire lock (contended)' },
  { from: 'running', to: 'waiting', label: 'wait() / join()' },
  { from: 'running', to: 'timed-waiting', label: 'sleep(n) / wait(n)' },
  { from: 'running', to: 'terminated', label: 'run() returns' },
  { from: 'blocked', to: 'runnable', label: 'lock acquired' },
  { from: 'waiting', to: 'runnable', label: 'notify() / notifyAll()' },
  { from: 'timed-waiting', to: 'runnable', label: 'timeout / notify()' },
];

// ---------------------------------------------------------------------------
// Example threads
// ---------------------------------------------------------------------------

export const EXAMPLE_THREADS: ExampleThread[] = [
  {
    id: 'thread-1',
    name: 'Worker-1',
    color: '#3b82f6',
    timeline: [
      { tick: 0, state: 'new', description: 'Thread created' },
      { tick: 1, state: 'runnable', description: 'start() called — enters ready queue' },
      { tick: 2, state: 'running', description: 'Scheduler dispatches thread to CPU' },
      { tick: 3, state: 'blocked', description: 'Tries to acquire a lock held by another thread' },
      { tick: 4, state: 'runnable', description: 'Lock released — thread is runnable again' },
      { tick: 5, state: 'running', description: 'Scheduler dispatches thread to CPU' },
      { tick: 6, state: 'terminated', description: 'run() method completes' },
    ],
  },
  {
    id: 'thread-2',
    name: 'Worker-2',
    color: '#22c55e',
    timeline: [
      { tick: 0, state: 'new', description: 'Thread created' },
      { tick: 1, state: 'runnable', description: 'start() called — enters ready queue' },
      { tick: 2, state: 'running', description: 'Scheduled on CPU' },
      { tick: 3, state: 'waiting', description: 'Calls wait() — waiting for notification' },
      { tick: 4, state: 'runnable', description: 'notify() received from another thread' },
      { tick: 5, state: 'running', description: 'Resumes execution' },
      { tick: 6, state: 'runnable', description: 'Preempted by scheduler (yield)' },
      { tick: 7, state: 'running', description: 'Re-dispatched' },
      { tick: 8, state: 'terminated', description: 'run() method completes' },
    ],
  },
  {
    id: 'thread-3',
    name: 'Timer-1',
    color: '#a855f7',
    timeline: [
      { tick: 0, state: 'new', description: 'Thread created' },
      { tick: 1, state: 'runnable', description: 'start() called' },
      { tick: 2, state: 'running', description: 'Begins execution' },
      { tick: 3, state: 'timed-waiting', description: 'Calls Thread.sleep(500)' },
      { tick: 4, state: 'runnable', description: 'Sleep timeout elapsed' },
      { tick: 5, state: 'running', description: 'Resumes on CPU' },
      { tick: 6, state: 'timed-waiting', description: 'Calls wait(1000) with timeout' },
      { tick: 7, state: 'runnable', description: 'Timeout expired, re-enters ready queue' },
      { tick: 8, state: 'running', description: 'Dispatched to CPU' },
      { tick: 9, state: 'terminated', description: 'run() method completes' },
    ],
  },
];

/**
 * Maximum tick across all example threads.
 */
export function maxTick(): number {
  let max = 0;
  for (const t of EXAMPLE_THREADS) {
    for (const entry of t.timeline) {
      if (entry.tick > max) max = entry.tick;
    }
  }
  return max;
}
