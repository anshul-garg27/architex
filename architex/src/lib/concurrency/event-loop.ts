/**
 * Event Loop Visualizer
 *
 * Simulates the JavaScript event loop for predefined code snippets,
 * producing a step-by-step trace of the call stack, Web API timers,
 * microtask queue (Promises), macrotask queue (setTimeout), and
 * console output.
 *
 * Each demo is hand-crafted (not arbitrary code execution) to
 * accurately demonstrate the ordering guarantees of the spec.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventLoopState {
  callStack: string[];
  webAPIs: Array<{ name: string; timer?: number }>;
  microtaskQueue: string[];
  macrotaskQueue: string[];
  output: string[];
}

export interface EventLoopStep {
  tick: number;
  description: string;
  state: EventLoopState;
  highlight: 'callstack' | 'webapi' | 'microtask' | 'macrotask' | 'output';
}

// ---------------------------------------------------------------------------
// Demo identifiers
// ---------------------------------------------------------------------------

export type EventLoopDemoId =
  | 'setTimeout-vs-promise'
  | 'nested-async'
  | 'multiple-timeouts';

export interface EventLoopDemoDef {
  id: EventLoopDemoId;
  title: string;
  code: string;
  expectedOutput: string;
}

export const EVENT_LOOP_DEMOS: EventLoopDemoDef[] = [
  {
    id: 'setTimeout-vs-promise',
    title: 'setTimeout vs Promise',
    code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
    expectedOutput: '1, 4, 3, 2',
  },
  {
    id: 'nested-async',
    title: 'Nested async/await',
    code: `async function foo() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}
console.log('C');
foo();
console.log('D');`,
    expectedOutput: 'C, A, D, B',
  },
  {
    id: 'multiple-timeouts',
    title: 'Multiple timeouts',
    code: `setTimeout(() => console.log('a'), 100);
setTimeout(() => console.log('b'), 0);
Promise.resolve().then(() => console.log('c'));
console.log('d');`,
    expectedOutput: 'd, c, b, a',
  },
];

// ---------------------------------------------------------------------------
// Helper – deep-clone a state snapshot
// ---------------------------------------------------------------------------

function cloneState(s: EventLoopState): EventLoopState {
  return {
    callStack: [...s.callStack],
    webAPIs: s.webAPIs.map((a) => ({ ...a })),
    microtaskQueue: [...s.microtaskQueue],
    macrotaskQueue: [...s.macrotaskQueue],
    output: [...s.output],
  };
}

// ---------------------------------------------------------------------------
// Demo 1: setTimeout vs Promise
// ---------------------------------------------------------------------------

function demo_setTimeoutVsPromise(): EventLoopStep[] {
  const steps: EventLoopStep[] = [];
  let tick = 0;
  const state: EventLoopState = {
    callStack: [],
    webAPIs: [],
    microtaskQueue: [],
    macrotaskQueue: [],
    output: [],
  };

  // 1 – Push <script> onto call stack
  state.callStack.push('<script>');
  steps.push({
    tick: tick++,
    description: 'Start executing script',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 2 – console.log('1')
  state.callStack.push("console.log('1')");
  steps.push({
    tick: tick++,
    description: "Push console.log('1') onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.output.push('1');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('1') — prints '1'",
    state: cloneState(state),
    highlight: 'output',
  });

  // 3 – setTimeout(..., 0)
  state.callStack.push('setTimeout(cb, 0)');
  steps.push({
    tick: tick++,
    description: 'Push setTimeout(cb, 0) onto the call stack',
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.webAPIs.push({ name: "timer(log '2')", timer: 0 });
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: 'setTimeout registers a Web API timer (0 ms). Callback queued after timer fires.',
    state: cloneState(state),
    highlight: 'webapi',
  });

  // 4 – Promise.resolve().then(...)
  state.callStack.push('Promise.resolve().then(cb)');
  steps.push({
    tick: tick++,
    description: 'Push Promise.resolve().then(cb) onto the call stack',
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.microtaskQueue.push("log '3'");
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Promise resolves immediately — callback added to microtask queue",
    state: cloneState(state),
    highlight: 'microtask',
  });

  // 5 – console.log('4')
  state.callStack.push("console.log('4')");
  steps.push({
    tick: tick++,
    description: "Push console.log('4') onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.output.push('4');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('4') — prints '4'",
    state: cloneState(state),
    highlight: 'output',
  });

  // 6 – Script ends
  state.callStack.pop(); // remove <script>
  steps.push({
    tick: tick++,
    description: 'Script execution complete. Call stack empty. Check microtask queue.',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 7 – Drain microtask queue: log '3'
  state.callStack.push("Promise cb: log '3'");
  state.microtaskQueue.shift();
  steps.push({
    tick: tick++,
    description: "Dequeue microtask: Promise callback. Push onto call stack.",
    state: cloneState(state),
    highlight: 'microtask',
  });

  state.output.push('3');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute Promise callback — prints '3'. Microtasks drained.",
    state: cloneState(state),
    highlight: 'output',
  });

  // 8 – Timer fires, callback goes to macrotask queue
  state.webAPIs.shift();
  state.macrotaskQueue.push("log '2'");
  steps.push({
    tick: tick++,
    description: "Timer (0 ms) fires — callback moved to macrotask queue",
    state: cloneState(state),
    highlight: 'macrotask',
  });

  // 9 – Event loop picks macrotask
  state.callStack.push("setTimeout cb: log '2'");
  state.macrotaskQueue.shift();
  steps.push({
    tick: tick++,
    description: "Dequeue macrotask: setTimeout callback. Push onto call stack.",
    state: cloneState(state),
    highlight: 'macrotask',
  });

  state.output.push('2');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute setTimeout callback — prints '2'. All queues empty.",
    state: cloneState(state),
    highlight: 'output',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Demo 2: Nested async/await
// ---------------------------------------------------------------------------

function demo_nestedAsync(): EventLoopStep[] {
  const steps: EventLoopStep[] = [];
  let tick = 0;
  const state: EventLoopState = {
    callStack: [],
    webAPIs: [],
    microtaskQueue: [],
    macrotaskQueue: [],
    output: [],
  };

  // 1 – Push <script>
  state.callStack.push('<script>');
  steps.push({
    tick: tick++,
    description: 'Start executing script',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 2 – console.log('C')
  state.callStack.push("console.log('C')");
  steps.push({
    tick: tick++,
    description: "Push console.log('C') onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.output.push('C');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('C') — prints 'C'",
    state: cloneState(state),
    highlight: 'output',
  });

  // 3 – foo() called
  state.callStack.push('foo()');
  steps.push({
    tick: tick++,
    description: 'Call foo(). Push onto call stack. Async function starts synchronously.',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 4 – Inside foo: console.log('A')
  state.callStack.push("console.log('A')");
  steps.push({
    tick: tick++,
    description: "Inside foo: push console.log('A') onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.output.push('A');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('A') — prints 'A' (async runs synchronously until first await)",
    state: cloneState(state),
    highlight: 'output',
  });

  // 5 – await Promise.resolve()
  state.callStack.push('await Promise.resolve()');
  steps.push({
    tick: tick++,
    description: "Hit 'await Promise.resolve()'. Promise resolves immediately.",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.microtaskQueue.push("foo resume: log 'B'");
  state.callStack.pop(); // remove await
  state.callStack.pop(); // remove foo() — it suspends
  steps.push({
    tick: tick++,
    description: "await suspends foo(). Continuation (log 'B') scheduled as microtask. foo() returns to caller.",
    state: cloneState(state),
    highlight: 'microtask',
  });

  // 6 – console.log('D') — back in <script>
  state.callStack.push("console.log('D')");
  steps.push({
    tick: tick++,
    description: "Back in script: push console.log('D') onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.output.push('D');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('D') — prints 'D'",
    state: cloneState(state),
    highlight: 'output',
  });

  // 7 – Script ends
  state.callStack.pop(); // remove <script>
  steps.push({
    tick: tick++,
    description: 'Script execution complete. Call stack empty. Check microtask queue.',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 8 – Drain microtask: resume foo
  state.callStack.push("foo (resumed): log 'B'");
  state.microtaskQueue.shift();
  steps.push({
    tick: tick++,
    description: "Dequeue microtask: resume foo() after await.",
    state: cloneState(state),
    highlight: 'microtask',
  });

  state.output.push('B');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('B') — prints 'B'. foo() completes. All queues empty.",
    state: cloneState(state),
    highlight: 'output',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Demo 3: Multiple timeouts
// ---------------------------------------------------------------------------

function demo_multipleTimeouts(): EventLoopStep[] {
  const steps: EventLoopStep[] = [];
  let tick = 0;
  const state: EventLoopState = {
    callStack: [],
    webAPIs: [],
    microtaskQueue: [],
    macrotaskQueue: [],
    output: [],
  };

  // 1 – Push <script>
  state.callStack.push('<script>');
  steps.push({
    tick: tick++,
    description: 'Start executing script',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 2 – setTimeout(..., 100)
  state.callStack.push('setTimeout(cb, 100)');
  steps.push({
    tick: tick++,
    description: "Push setTimeout(cb, 100) onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.webAPIs.push({ name: "timer(log 'a')", timer: 100 });
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Register Web API timer — 100 ms delay for log('a')",
    state: cloneState(state),
    highlight: 'webapi',
  });

  // 3 – setTimeout(..., 0)
  state.callStack.push('setTimeout(cb, 0)');
  steps.push({
    tick: tick++,
    description: "Push setTimeout(cb, 0) onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.webAPIs.push({ name: "timer(log 'b')", timer: 0 });
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Register Web API timer — 0 ms delay for log('b')",
    state: cloneState(state),
    highlight: 'webapi',
  });

  // 4 – Promise.resolve().then(...)
  state.callStack.push('Promise.resolve().then(cb)');
  steps.push({
    tick: tick++,
    description: 'Push Promise.resolve().then(cb) onto the call stack',
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.microtaskQueue.push("log 'c'");
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Promise resolves immediately — callback added to microtask queue",
    state: cloneState(state),
    highlight: 'microtask',
  });

  // 5 – console.log('d')
  state.callStack.push("console.log('d')");
  steps.push({
    tick: tick++,
    description: "Push console.log('d') onto the call stack",
    state: cloneState(state),
    highlight: 'callstack',
  });

  state.output.push('d');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute console.log('d') — prints 'd'",
    state: cloneState(state),
    highlight: 'output',
  });

  // 6 – Script ends
  state.callStack.pop(); // remove <script>
  steps.push({
    tick: tick++,
    description: 'Script execution complete. Call stack empty. Check microtask queue.',
    state: cloneState(state),
    highlight: 'callstack',
  });

  // 7 – Drain microtask queue: log 'c'
  state.callStack.push("Promise cb: log 'c'");
  state.microtaskQueue.shift();
  steps.push({
    tick: tick++,
    description: "Dequeue microtask: Promise callback. Microtasks always run before macrotasks.",
    state: cloneState(state),
    highlight: 'microtask',
  });

  state.output.push('c');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute Promise callback — prints 'c'. Microtasks drained.",
    state: cloneState(state),
    highlight: 'output',
  });

  // 8 – 0 ms timer fires first
  const timerBIdx = state.webAPIs.findIndex((a) => a.timer === 0);
  state.webAPIs.splice(timerBIdx, 1);
  state.macrotaskQueue.push("log 'b'");
  steps.push({
    tick: tick++,
    description: "Timer (0 ms) fires — log('b') callback moved to macrotask queue",
    state: cloneState(state),
    highlight: 'macrotask',
  });

  // 9 – Event loop picks macrotask: log 'b'
  state.callStack.push("setTimeout cb: log 'b'");
  state.macrotaskQueue.shift();
  steps.push({
    tick: tick++,
    description: "Dequeue macrotask: setTimeout(0) callback.",
    state: cloneState(state),
    highlight: 'macrotask',
  });

  state.output.push('b');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute callback — prints 'b'",
    state: cloneState(state),
    highlight: 'output',
  });

  // 10 – 100 ms timer fires
  const timerAIdx = state.webAPIs.findIndex((a) => a.timer === 100);
  state.webAPIs.splice(timerAIdx, 1);
  state.macrotaskQueue.push("log 'a'");
  steps.push({
    tick: tick++,
    description: "Timer (100 ms) fires — log('a') callback moved to macrotask queue",
    state: cloneState(state),
    highlight: 'macrotask',
  });

  // 11 – Event loop picks macrotask: log 'a'
  state.callStack.push("setTimeout cb: log 'a'");
  state.macrotaskQueue.shift();
  steps.push({
    tick: tick++,
    description: "Dequeue macrotask: setTimeout(100) callback.",
    state: cloneState(state),
    highlight: 'macrotask',
  });

  state.output.push('a');
  state.callStack.pop();
  steps.push({
    tick: tick++,
    description: "Execute callback — prints 'a'. All queues empty.",
    state: cloneState(state),
    highlight: 'output',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function simulateEventLoop(demoId: EventLoopDemoId): EventLoopStep[] {
  switch (demoId) {
    case 'setTimeout-vs-promise':
      return demo_setTimeoutVsPromise();
    case 'nested-async':
      return demo_nestedAsync();
    case 'multiple-timeouts':
      return demo_multipleTimeouts();
    default:
      return [];
  }
}
