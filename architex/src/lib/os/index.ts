/**
 * OS Concepts Module
 *
 * Re-exports all operating system simulation modules:
 * - **scheduling** -- CPU scheduling algorithms (FCFS, SJF/SRTF, Round Robin, Priority, MLFQ)
 * - **page-replacement** -- Page replacement algorithms (FIFO, LRU, Optimal, Clock)
 * - **deadlock** -- Deadlock detection (RAG cycle detection) and avoidance (Banker's Algorithm)
 * - **memory** -- Virtual memory address translation and TLB simulation
 * - **thread-sync** -- Thread synchronization primitives (Mutex, Semaphore, Reader-Writer Lock)
 */

export {
  type Process,
  type ScheduleEvent,
  type ScheduleResult,
  fcfs,
  sjf,
  roundRobin,
  priorityScheduling,
  mlfq,
  compareAlgorithms,
} from './scheduling';

export {
  type PageEvent,
  type PageResult,
  fifoPageReplacement,
  lruPageReplacement,
  optimalPageReplacement,
  clockPageReplacement,
  generateReferenceString,
  comparePageAlgorithms,
} from './page-replacement';

export {
  type Resource,
  type ProcessState,
  type DeadlockResult,
  detectDeadlock,
  bankersAlgorithm,
} from './deadlock';

export {
  type PageTableEntry,
  type AddressTranslation,
  translateAddress,
  simulateVirtualMemory,
} from './memory';

export {
  type SyncEvent,
  simulateMutex,
  simulateSemaphore,
  simulateReaderWriterLock,
  simulateConditionVariable,
} from './thread-sync';

export {
  type MemoryBlock,
  type MemoryAllocStep,
  type MemoryAllocRequest,
  simulateFirstFit,
  simulateBestFit,
  simulateWorstFit,
  compareAllocAlgorithms,
} from './memory-alloc';

export {
  type MLFQQueueConfig,
  type MLFQConfig,
  type MLFQProcess,
  type MLFQStep,
  DEFAULT_MLFQ_CONFIG,
  mlfqScheduler,
} from './mlfq-scheduler';

export {
  type BankersStep,
  type BankersState,
  type SafetyResult,
  type RequestResult,
  isSafe,
  requestResources,
  cloneBankersState,
} from './bankers-algorithm';

export {
  type StackFrame,
  type OverflowEvent,
  type OverflowResult,
  simulateBufferOverflow,
  simulateWithCanary,
  simulateWithASLR,
} from './buffer-overflow';
