/**
 * Memory Allocation Simulations
 *
 * Simulates contiguous memory allocation strategies (First Fit, Best Fit,
 * Worst Fit) with allocation, deallocation, and compaction operations.
 * Tracks external fragmentation at each step.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryBlock {
  id: string;
  start: number;
  size: number;
  processId: string | null;
  isFree: boolean;
}

export interface MemoryAllocStep {
  tick: number;
  action: 'allocate' | 'deallocate' | 'compact';
  blocks: MemoryBlock[];
  description: string;
  fragmentation: number;
}

export interface MemoryAllocRequest {
  type: 'alloc' | 'dealloc';
  processId: string;
  size?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let blockIdCounter = 0;

function newBlockId(): string {
  return `blk-${++blockIdCounter}`;
}

function cloneBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  return blocks.map((b) => ({ ...b }));
}

/**
 * Calculate external fragmentation as a percentage.
 * Fragmentation = 1 - (largest free block / total free memory).
 * Returns 0 when no free memory or only one free block exists.
 */
function calcFragmentation(blocks: MemoryBlock[]): number {
  const freeBlocks = blocks.filter((b) => b.isFree);
  if (freeBlocks.length <= 1) return 0;
  const totalFree = freeBlocks.reduce((s, b) => s + b.size, 0);
  if (totalFree === 0) return 0;
  const largestFree = Math.max(...freeBlocks.map((b) => b.size));
  return Math.round((1 - largestFree / totalFree) * 100);
}

/**
 * Merge adjacent free blocks in place. Returns a new array.
 */
function mergeFreeBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  if (blocks.length === 0) return [];
  const result: MemoryBlock[] = [{ ...blocks[0] }];
  for (let i = 1; i < blocks.length; i++) {
    const prev = result[result.length - 1];
    const cur = blocks[i];
    if (prev.isFree && cur.isFree) {
      prev.size += cur.size;
    } else {
      result.push({ ...cur });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Allocation strategies
// ---------------------------------------------------------------------------

type FitStrategy = 'first' | 'best' | 'worst';

function findFreeBlockIndex(blocks: MemoryBlock[], size: number, strategy: FitStrategy): number {
  let chosen = -1;

  for (let i = 0; i < blocks.length; i++) {
    if (!blocks[i].isFree || blocks[i].size < size) continue;

    if (strategy === 'first') {
      return i;
    }

    if (chosen === -1) {
      chosen = i;
      continue;
    }

    if (strategy === 'best' && blocks[i].size < blocks[chosen].size) {
      chosen = i;
    } else if (strategy === 'worst' && blocks[i].size > blocks[chosen].size) {
      chosen = i;
    }
  }

  return chosen;
}

function allocate(
  blocks: MemoryBlock[],
  processId: string,
  size: number,
  strategy: FitStrategy,
): { blocks: MemoryBlock[]; success: boolean } {
  const idx = findFreeBlockIndex(blocks, size, strategy);
  if (idx === -1) {
    return { blocks: cloneBlocks(blocks), success: false };
  }

  const result = cloneBlocks(blocks);
  const freeBlock = result[idx];
  const remaining = freeBlock.size - size;

  // Allocate this block to the process
  freeBlock.size = size;
  freeBlock.processId = processId;
  freeBlock.isFree = false;

  // If there is leftover space, insert a new free block after it
  if (remaining > 0) {
    result.splice(idx + 1, 0, {
      id: newBlockId(),
      start: freeBlock.start + size,
      size: remaining,
      processId: null,
      isFree: true,
    });
  }

  return { blocks: result, success: true };
}

function deallocate(blocks: MemoryBlock[], processId: string): MemoryBlock[] {
  const result = cloneBlocks(blocks);
  for (const block of result) {
    if (block.processId === processId) {
      block.processId = null;
      block.isFree = true;
    }
  }
  return mergeFreeBlocks(result);
}

// ---------------------------------------------------------------------------
// Simulation runner
// ---------------------------------------------------------------------------

function strategyLabel(strategy: FitStrategy): string {
  switch (strategy) {
    case 'first': return 'First Fit';
    case 'best': return 'Best Fit';
    case 'worst': return 'Worst Fit';
  }
}

function strategyReason(strategy: FitStrategy): string {
  switch (strategy) {
    case 'first': return "it's the first block large enough (fast scan from start)";
    case 'best': return "it's the tightest fit, minimizing wasted space";
    case 'worst': return "it's the largest block, leaving the biggest remainder for future requests";
  }
}

function simulate(
  totalMemory: number,
  requests: MemoryAllocRequest[],
  strategy: FitStrategy,
): MemoryAllocStep[] {
  // Reset block ID counter for deterministic IDs per simulation
  blockIdCounter = 0;

  const steps: MemoryAllocStep[] = [];
  let blocks: MemoryBlock[] = [
    { id: newBlockId(), start: 0, size: totalMemory, processId: null, isFree: true },
  ];

  // Initial state
  steps.push({
    tick: 0,
    action: 'allocate',
    blocks: cloneBlocks(blocks),
    description: `Initial: ${totalMemory} bytes free`,
    fragmentation: 0,
  });

  let tick = 1;
  for (const req of requests) {
    if (req.type === 'alloc' && req.size && req.size > 0) {
      const { blocks: newBlocks, success } = allocate(blocks, req.processId, req.size, strategy);
      blocks = newBlocks;
      steps.push({
        tick: tick++,
        action: 'allocate',
        blocks: cloneBlocks(blocks),
        description: success
          ? `Allocate ${req.size} bytes for ${req.processId} — ${strategyLabel(strategy)} chose this block because ${strategyReason(strategy)}`
          : `FAILED: Cannot allocate ${req.size} bytes for ${req.processId} — no single free block is large enough (external fragmentation)`,
        fragmentation: calcFragmentation(blocks),
      });
    } else if (req.type === 'dealloc') {
      blocks = deallocate(blocks, req.processId);
      steps.push({
        tick: tick++,
        action: 'deallocate',
        blocks: cloneBlocks(blocks),
        description: `Deallocate ${req.processId} — memory freed and adjacent free blocks merged to reduce fragmentation`,
        fragmentation: calcFragmentation(blocks),
      });
    }
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function simulateFirstFit(
  totalMemory: number,
  requests: MemoryAllocRequest[],
): MemoryAllocStep[] {
  return simulate(totalMemory, requests, 'first');
}

export function simulateBestFit(
  totalMemory: number,
  requests: MemoryAllocRequest[],
): MemoryAllocStep[] {
  return simulate(totalMemory, requests, 'best');
}

export function simulateWorstFit(
  totalMemory: number,
  requests: MemoryAllocRequest[],
): MemoryAllocStep[] {
  return simulate(totalMemory, requests, 'worst');
}

/**
 * Run all three strategies on the same input and return results keyed by
 * algorithm name.
 */
export function compareAllocAlgorithms(
  totalMemory: number,
  requests: MemoryAllocRequest[],
): Record<string, MemoryAllocStep[]> {
  return {
    'First Fit': simulateFirstFit(totalMemory, requests),
    'Best Fit': simulateBestFit(totalMemory, requests),
    'Worst Fit': simulateWorstFit(totalMemory, requests),
  };
}
