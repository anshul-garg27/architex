/**
 * Concurrency Module
 *
 * Re-exports all concurrency simulation modules:
 * - **race-condition** -- Demonstrates lost-update race conditions and mutex protection
 * - **producer-consumer** -- Bounded-buffer producer-consumer with synchronisation
 * - **dining-philosophers** -- Classic deadlock scenario with naive and ordered strategies
 * - **event-loop** -- JavaScript event loop visualizer (call stack, microtask/macrotask queues)
 * - **thread-lifecycle** -- Thread state machine with 7 states and example timelines
 * - **goroutines** -- Go goroutine & channel visualization with 5 demos
 * - **readers-writers** -- Classic readers-writers synchronisation problem
 * - **sleeping-barber** -- Sleeping barber scheduling problem
 */

export {
  type ThreadEvent,
  type RaceConditionDemo,
  unsafeIncrement,
  unsafeIncrementRandom,
  safeIncrement,
} from './race-condition';

export {
  type BufferEvent,
  simulateProducerConsumer,
} from './producer-consumer';

export {
  type PhilosopherEvent,
  simulateNaive,
  simulateOrdered,
} from './dining-philosophers';

export {
  type EventLoopState,
  type EventLoopStep,
  type EventLoopDemoId,
  type EventLoopDemoDef,
  EVENT_LOOP_DEMOS,
  simulateEventLoop,
} from './event-loop';

export {
  type ThreadState,
  type ThreadTransition,
  type ThreadTimelineEntry,
  type ExampleThread,
  THREAD_STATES,
  THREAD_STATE_COLORS,
  THREAD_STATE_LABELS,
  TRANSITIONS,
  EXAMPLE_THREADS,
  maxTick,
} from './thread-lifecycle';

export {
  type Goroutine,
  type Channel,
  type GoroutineStep,
  type GoroutineDemoId,
  type GoroutineDemoDef,
  GOROUTINE_DEMOS,
  simulateGoroutines,
} from './goroutines';

export {
  type RWEvent,
  simulateReadersWriters,
} from './readers-writers';

export {
  type BarberEvent,
  simulateSleepingBarber,
} from './sleeping-barber';

export {
  type AsyncStep,
  type AsyncPromise,
  type AsyncPatternId,
  type AsyncPatternDef,
  ASYNC_PATTERN_DEMOS,
  simulateAsyncPattern,
} from './async-patterns';

export {
  type DeadlockStep,
  type DeadlockThread,
  type DeadlockResource,
  simulateDeadlock,
  simulateDeadlockPrevention,
} from './deadlock-demo';

export {
  type MutexThreadState,
  type MutexThreadSnapshot,
  type MutexStep,
  type MutexMetrics,
  simulateSpinLock,
  simulateMutex,
  simulateTTAS,
  computeMetrics,
} from './mutex-comparison';
