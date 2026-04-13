/**
 * Go Goroutine Simulator
 *
 * Simulates Go concurrency primitives -- goroutines, channels, select,
 * WaitGroups, and deadlock -- producing a step-by-step trace suitable
 * for animated visualization.
 *
 * Each demo is hand-crafted to accurately demonstrate channel semantics
 * (unbuffered rendezvous, buffered send/receive, select multiplexing,
 * WaitGroup synchronization, and circular-wait deadlock).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Goroutine {
  id: string;
  name: string;
  state: 'running' | 'waiting' | 'blocked' | 'done';
  channel?: string;
}

export interface Channel {
  id: string;
  name: string;
  buffer: number[];
  capacity: number;
  senders: string[];
  receivers: string[];
}

export interface GoroutineStep {
  tick: number;
  goroutines: Goroutine[];
  channels: Channel[];
  description: string;
  action: 'spawn' | 'send' | 'receive' | 'select' | 'done' | 'block';
}

// ---------------------------------------------------------------------------
// Demo type
// ---------------------------------------------------------------------------

export type GoroutineDemoId =
  | 'basic-channel'
  | 'buffered-channel'
  | 'select'
  | 'waitgroup'
  | 'deadlock';

export interface GoroutineDemoDef {
  id: GoroutineDemoId;
  title: string;
  code: string;
}

export const GOROUTINE_DEMOS: GoroutineDemoDef[] = [
  {
    id: 'basic-channel',
    title: 'Basic Channel',
    code: `ch := make(chan int)
go func() { ch <- 42 }()
val := <-ch`,
  },
  {
    id: 'buffered-channel',
    title: 'Buffered Channel',
    code: `ch := make(chan int, 3)
go producer(ch)
go consumer(ch)`,
  },
  {
    id: 'select',
    title: 'Select',
    code: `select {
case v := <-ch1: ...
case v := <-ch2: ...
case <-timeout:  ...
}`,
  },
  {
    id: 'waitgroup',
    title: 'WaitGroup',
    code: `var wg sync.WaitGroup
wg.Add(3)
go worker(&wg)  // x3
wg.Wait()`,
  },
  {
    id: 'deadlock',
    title: 'Deadlock',
    code: `// G1: ch1 <- 1; <-ch2
// G2: ch2 <- 2; <-ch1
// Both block forever!`,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function g(id: string, name: string, state: Goroutine['state'], channel?: string): Goroutine {
  return { id, name, state, channel };
}

function ch(id: string, name: string, capacity: number, buffer: number[] = [], senders: string[] = [], receivers: string[] = []): Channel {
  return { id, name, buffer, capacity, senders, receivers };
}

// ---------------------------------------------------------------------------
// Demo: Basic Channel
// ---------------------------------------------------------------------------

function basicChannel(): GoroutineStep[] {
  const steps: GoroutineStep[] = [];

  // Tick 0: main spawns sender goroutine
  steps.push({
    tick: 0,
    goroutines: [
      g('main', 'main', 'running'),
    ],
    channels: [
      ch('ch', 'ch', 0),
    ],
    description: 'main() starts. Creates unbuffered channel ch.',
    action: 'spawn',
  });

  // Tick 1: spawn sender
  steps.push({
    tick: 1,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender', 'running'),
    ],
    channels: [
      ch('ch', 'ch', 0),
    ],
    description: 'main spawns sender goroutine (go func).',
    action: 'spawn',
  });

  // Tick 2: sender tries to send on unbuffered channel, blocks waiting for receiver
  steps.push({
    tick: 2,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender', 'waiting', 'ch'),
    ],
    channels: [
      ch('ch', 'ch', 0, [], ['g1'], []),
    ],
    description: 'sender tries ch <- 42. Unbuffered channel: blocks until receiver ready.',
    action: 'send',
  });

  // Tick 3: main starts receiving
  steps.push({
    tick: 3,
    goroutines: [
      g('main', 'main', 'waiting', 'ch'),
      g('g1', 'sender', 'waiting', 'ch'),
    ],
    channels: [
      ch('ch', 'ch', 0, [], ['g1'], ['main']),
    ],
    description: 'main executes val := <-ch. Both sides now ready for rendezvous.',
    action: 'receive',
  });

  // Tick 4: rendezvous completes -- value 42 transfers
  steps.push({
    tick: 4,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender', 'running'),
    ],
    channels: [
      ch('ch', 'ch', 0, [42], [], []),
    ],
    description: 'Rendezvous! Value 42 passes from sender to main through ch.',
    action: 'receive',
  });

  // Tick 5: sender done
  steps.push({
    tick: 5,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender', 'done'),
    ],
    channels: [
      ch('ch', 'ch', 0),
    ],
    description: 'sender goroutine completes. main has val = 42.',
    action: 'done',
  });

  // Tick 6: main done
  steps.push({
    tick: 6,
    goroutines: [
      g('main', 'main', 'done'),
      g('g1', 'sender', 'done'),
    ],
    channels: [
      ch('ch', 'ch', 0),
    ],
    description: 'main completes. Program exits.',
    action: 'done',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Demo: Buffered Channel
// ---------------------------------------------------------------------------

function bufferedChannel(): GoroutineStep[] {
  const steps: GoroutineStep[] = [];
  const cap = 3;

  // Tick 0: create buffered channel
  steps.push({
    tick: 0,
    goroutines: [g('main', 'main', 'running')],
    channels: [ch('ch', 'ch', cap)],
    description: 'main creates buffered channel ch with capacity 3.',
    action: 'spawn',
  });

  // Tick 1: spawn producer and consumer
  steps.push({
    tick: 1,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'running'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap)],
    description: 'main spawns producer and consumer goroutines, then waits.',
    action: 'spawn',
  });

  // Tick 2: producer sends 1
  steps.push({
    tick: 2,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'running'),
      g('cons', 'consumer', 'waiting', 'ch'),
    ],
    channels: [ch('ch', 'ch', cap, [1], ['prod'], [])],
    description: 'producer sends 1 into buffer. Buffer: [1]. Consumer waiting.',
    action: 'send',
  });

  // Tick 3: producer sends 2
  steps.push({
    tick: 3,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'running'),
      g('cons', 'consumer', 'waiting', 'ch'),
    ],
    channels: [ch('ch', 'ch', cap, [1, 2], ['prod'], [])],
    description: 'producer sends 2 into buffer. Buffer: [1, 2].',
    action: 'send',
  });

  // Tick 4: producer sends 3 -- buffer full
  steps.push({
    tick: 4,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'running'),
      g('cons', 'consumer', 'waiting', 'ch'),
    ],
    channels: [ch('ch', 'ch', cap, [1, 2, 3], ['prod'], [])],
    description: 'producer sends 3. Buffer FULL: [1, 2, 3].',
    action: 'send',
  });

  // Tick 5: producer tries to send 4, blocks (buffer full)
  steps.push({
    tick: 5,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'blocked', 'ch'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap, [1, 2, 3], ['prod'], [])],
    description: 'producer tries to send 4 but buffer full -- BLOCKED. Consumer wakes.',
    action: 'block',
  });

  // Tick 6: consumer receives 1
  steps.push({
    tick: 6,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'running'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap, [2, 3, 4], [], ['cons'])],
    description: 'consumer receives 1. producer unblocked, sends 4. Buffer: [2, 3, 4].',
    action: 'receive',
  });

  // Tick 7: consumer receives 2
  steps.push({
    tick: 7,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'running'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap, [3, 4, 5], [], ['cons'])],
    description: 'consumer receives 2. producer sends 5. Buffer: [3, 4, 5].',
    action: 'receive',
  });

  // Tick 8: producer done, consumer drains
  steps.push({
    tick: 8,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'done'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap, [4, 5], [], ['cons'])],
    description: 'producer finishes (sent 5 total). Consumer receives 3. Buffer: [4, 5].',
    action: 'receive',
  });

  // Tick 9: consumer drains
  steps.push({
    tick: 9,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'done'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap, [5], [], ['cons'])],
    description: 'consumer receives 4. Buffer: [5].',
    action: 'receive',
  });

  // Tick 10: consumer drains last
  steps.push({
    tick: 10,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('prod', 'producer', 'done'),
      g('cons', 'consumer', 'running'),
    ],
    channels: [ch('ch', 'ch', cap, [], [], ['cons'])],
    description: 'consumer receives 5. Buffer empty.',
    action: 'receive',
  });

  // Tick 11: consumer done
  steps.push({
    tick: 11,
    goroutines: [
      g('main', 'main', 'running'),
      g('prod', 'producer', 'done'),
      g('cons', 'consumer', 'done'),
    ],
    channels: [ch('ch', 'ch', cap)],
    description: 'consumer done. main resumes.',
    action: 'done',
  });

  // Tick 12: main done
  steps.push({
    tick: 12,
    goroutines: [
      g('main', 'main', 'done'),
      g('prod', 'producer', 'done'),
      g('cons', 'consumer', 'done'),
    ],
    channels: [ch('ch', 'ch', cap)],
    description: 'main completes. All goroutines finished.',
    action: 'done',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Demo: Select
// ---------------------------------------------------------------------------

function selectDemo(): GoroutineStep[] {
  const steps: GoroutineStep[] = [];

  // Tick 0
  steps.push({
    tick: 0,
    goroutines: [g('main', 'main', 'running')],
    channels: [
      ch('ch1', 'ch1', 0),
      ch('ch2', 'ch2', 0),
      ch('timeout', 'timeout', 0),
    ],
    description: 'main creates ch1, ch2, and timeout channels.',
    action: 'spawn',
  });

  // Tick 1: spawn senders
  steps.push({
    tick: 1,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender-1', 'running'),
      g('g2', 'sender-2', 'running'),
      g('timer', 'timer', 'running'),
    ],
    channels: [
      ch('ch1', 'ch1', 0),
      ch('ch2', 'ch2', 0),
      ch('timeout', 'timeout', 0),
    ],
    description: 'main spawns sender-1, sender-2, and timer goroutines.',
    action: 'spawn',
  });

  // Tick 2: main enters select, waits on all three
  steps.push({
    tick: 2,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('g1', 'sender-1', 'running'),
      g('g2', 'sender-2', 'running'),
      g('timer', 'timer', 'running'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], [], ['main']),
      ch('ch2', 'ch2', 0, [], [], ['main']),
      ch('timeout', 'timeout', 0, [], [], ['main']),
    ],
    description: 'main enters select{} -- waiting on ch1, ch2, or timeout.',
    action: 'select',
  });

  // Tick 3: sender-2 sends to ch2 first
  steps.push({
    tick: 3,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('g1', 'sender-1', 'running'),
      g('g2', 'sender-2', 'waiting', 'ch2'),
      g('timer', 'timer', 'running'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], [], ['main']),
      ch('ch2', 'ch2', 0, [], ['g2'], ['main']),
      ch('timeout', 'timeout', 0, [], [], ['main']),
    ],
    description: 'sender-2 tries ch2 <- 99. Rendezvous with select receiver.',
    action: 'send',
  });

  // Tick 4: select picks ch2
  steps.push({
    tick: 4,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender-1', 'running'),
      g('g2', 'sender-2', 'running'),
      g('timer', 'timer', 'running'),
    ],
    channels: [
      ch('ch1', 'ch1', 0),
      ch('ch2', 'ch2', 0, [99]),
      ch('timeout', 'timeout', 0),
    ],
    description: 'select picks case ch2: v = 99. main resumes with value from ch2.',
    action: 'select',
  });

  // Tick 5: sender-1 still wants to send on ch1 but no receiver
  steps.push({
    tick: 5,
    goroutines: [
      g('main', 'main', 'running'),
      g('g1', 'sender-1', 'waiting', 'ch1'),
      g('g2', 'sender-2', 'done'),
      g('timer', 'timer', 'done'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], ['g1'], []),
      ch('ch2', 'ch2', 0),
      ch('timeout', 'timeout', 0),
    ],
    description: 'sender-1 blocks on ch1 (no receiver). sender-2 and timer done.',
    action: 'block',
  });

  // Tick 6: main done, leaked goroutine
  steps.push({
    tick: 6,
    goroutines: [
      g('main', 'main', 'done'),
      g('g1', 'sender-1', 'waiting', 'ch1'),
      g('g2', 'sender-2', 'done'),
      g('timer', 'timer', 'done'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], ['g1'], []),
      ch('ch2', 'ch2', 0),
      ch('timeout', 'timeout', 0),
    ],
    description: 'main exits. sender-1 is leaked (still blocked on ch1). Goroutine leak!',
    action: 'done',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Demo: WaitGroup
// ---------------------------------------------------------------------------

function waitgroupDemo(): GoroutineStep[] {
  const steps: GoroutineStep[] = [];

  // Tick 0
  steps.push({
    tick: 0,
    goroutines: [g('main', 'main', 'running')],
    channels: [],
    description: 'main creates WaitGroup and calls wg.Add(3).',
    action: 'spawn',
  });

  // Tick 1: spawn 3 workers
  steps.push({
    tick: 1,
    goroutines: [
      g('main', 'main', 'running'),
      g('w1', 'worker-1', 'running'),
      g('w2', 'worker-2', 'running'),
      g('w3', 'worker-3', 'running'),
    ],
    channels: [],
    description: 'main spawns worker-1, worker-2, worker-3. WaitGroup counter = 3.',
    action: 'spawn',
  });

  // Tick 2: main calls wg.Wait()
  steps.push({
    tick: 2,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('w1', 'worker-1', 'running'),
      g('w2', 'worker-2', 'running'),
      g('w3', 'worker-3', 'running'),
    ],
    channels: [],
    description: 'main calls wg.Wait() -- blocks until counter reaches 0.',
    action: 'block',
  });

  // Tick 3: worker-1 processing
  steps.push({
    tick: 3,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('w1', 'worker-1', 'running'),
      g('w2', 'worker-2', 'running'),
      g('w3', 'worker-3', 'running'),
    ],
    channels: [],
    description: 'All workers processing concurrently. WaitGroup counter = 3.',
    action: 'spawn',
  });

  // Tick 4: worker-2 finishes first
  steps.push({
    tick: 4,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('w1', 'worker-1', 'running'),
      g('w2', 'worker-2', 'done'),
      g('w3', 'worker-3', 'running'),
    ],
    channels: [],
    description: 'worker-2 calls wg.Done(). WaitGroup counter = 2.',
    action: 'done',
  });

  // Tick 5: worker-1 finishes
  steps.push({
    tick: 5,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('w1', 'worker-1', 'done'),
      g('w2', 'worker-2', 'done'),
      g('w3', 'worker-3', 'running'),
    ],
    channels: [],
    description: 'worker-1 calls wg.Done(). WaitGroup counter = 1.',
    action: 'done',
  });

  // Tick 6: worker-3 finishes
  steps.push({
    tick: 6,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('w1', 'worker-1', 'done'),
      g('w2', 'worker-2', 'done'),
      g('w3', 'worker-3', 'done'),
    ],
    channels: [],
    description: 'worker-3 calls wg.Done(). WaitGroup counter = 0.',
    action: 'done',
  });

  // Tick 7: main resumes
  steps.push({
    tick: 7,
    goroutines: [
      g('main', 'main', 'running'),
      g('w1', 'worker-1', 'done'),
      g('w2', 'worker-2', 'done'),
      g('w3', 'worker-3', 'done'),
    ],
    channels: [],
    description: 'wg.Wait() returns. main resumes -- all workers finished.',
    action: 'done',
  });

  // Tick 8: main done
  steps.push({
    tick: 8,
    goroutines: [
      g('main', 'main', 'done'),
      g('w1', 'worker-1', 'done'),
      g('w2', 'worker-2', 'done'),
      g('w3', 'worker-3', 'done'),
    ],
    channels: [],
    description: 'main completes. Program exits cleanly.',
    action: 'done',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Demo: Deadlock
// ---------------------------------------------------------------------------

function deadlockDemo(): GoroutineStep[] {
  const steps: GoroutineStep[] = [];

  // Tick 0
  steps.push({
    tick: 0,
    goroutines: [g('main', 'main', 'running')],
    channels: [
      ch('ch1', 'ch1', 0),
      ch('ch2', 'ch2', 0),
    ],
    description: 'main creates two unbuffered channels ch1 and ch2.',
    action: 'spawn',
  });

  // Tick 1: spawn G1 and G2
  steps.push({
    tick: 1,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('g1', 'G1', 'running'),
      g('g2', 'G2', 'running'),
    ],
    channels: [
      ch('ch1', 'ch1', 0),
      ch('ch2', 'ch2', 0),
    ],
    description: 'main spawns G1 and G2, then waits. G1 will send on ch1 then recv ch2. G2 vice versa.',
    action: 'spawn',
  });

  // Tick 2: G1 tries to send on ch1
  steps.push({
    tick: 2,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('g1', 'G1', 'blocked', 'ch1'),
      g('g2', 'G2', 'running'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], ['g1'], []),
      ch('ch2', 'ch2', 0),
    ],
    description: 'G1 tries ch1 <- 1. No receiver on ch1 -- G1 BLOCKED.',
    action: 'block',
  });

  // Tick 3: G2 tries to send on ch2
  steps.push({
    tick: 3,
    goroutines: [
      g('main', 'main', 'waiting'),
      g('g1', 'G1', 'blocked', 'ch1'),
      g('g2', 'G2', 'blocked', 'ch2'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], ['g1'], []),
      ch('ch2', 'ch2', 0, [], ['g2'], []),
    ],
    description: 'G2 tries ch2 <- 2. No receiver on ch2 -- G2 BLOCKED.',
    action: 'block',
  });

  // Tick 4: DEADLOCK
  steps.push({
    tick: 4,
    goroutines: [
      g('main', 'main', 'blocked'),
      g('g1', 'G1', 'blocked', 'ch1'),
      g('g2', 'G2', 'blocked', 'ch2'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], ['g1'], []),
      ch('ch2', 'ch2', 0, [], ['g2'], []),
    ],
    description: 'DEADLOCK! G1 waits for ch1 receiver (would be G2). G2 waits for ch2 receiver (would be G1). Neither can proceed.',
    action: 'block',
  });

  // Tick 5: runtime detects
  steps.push({
    tick: 5,
    goroutines: [
      g('main', 'main', 'blocked'),
      g('g1', 'G1', 'blocked', 'ch1'),
      g('g2', 'G2', 'blocked', 'ch2'),
    ],
    channels: [
      ch('ch1', 'ch1', 0, [], ['g1'], []),
      ch('ch2', 'ch2', 0, [], ['g2'], []),
    ],
    description: 'Go runtime detects: all goroutines are asleep -- fatal error: deadlock!',
    action: 'block',
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function simulateGoroutines(demo: GoroutineDemoId): GoroutineStep[] {
  switch (demo) {
    case 'basic-channel':
      return basicChannel();
    case 'buffered-channel':
      return bufferedChannel();
    case 'select':
      return selectDemo();
    case 'waitgroup':
      return waitgroupDemo();
    case 'deadlock':
      return deadlockDemo();
  }
}
