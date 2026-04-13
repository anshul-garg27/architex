// ─────────────────────────────────────────────────────────────
// Architex — Algorithm Computation Web Worker
//
// Runs step generation off the main thread to avoid UI jank
// for large inputs. Imports algorithm functions directly.
// ─────────────────────────────────────────────────────────────

import type { AlgorithmResult } from '@/lib/algorithms/types';
import {
  bubbleSort,
  mergeSort,
  quickSort,
  heapSort,
  insertionSort,
  selectionSort,
  shellSort,
  countingSort,
  radixSort,
  bucketSort,
  timSort,
  cocktailShakerSort,
  combSort,
  pancakeSort,
  bogoSort,
  radixSortMSD,
} from '@/lib/algorithms/sorting';
import type {
  WorkerMessage,
  WorkerResponse,
  ComputeAlgoPayload,
  ComputeAlgoResult,
} from './types';
import { COMPUTE_ALGO_STEP } from './types';

// ── Algorithm Registry ─────────────────────────────────────

/** Map of algorithm id to its execution function. */
const SORTING_REGISTRY: Record<
  string,
  (arr: number[]) => AlgorithmResult
> = {
  'bubble-sort': bubbleSort,
  'merge-sort': mergeSort,
  'quick-sort': quickSort,
  'heap-sort': heapSort,
  'insertion-sort': insertionSort,
  'selection-sort': selectionSort,
  'shell-sort': shellSort,
  'counting-sort': countingSort,
  'radix-sort': radixSort,
  'bucket-sort': bucketSort,
  'tim-sort': timSort,
  'cocktail-shaker-sort': cocktailShakerSort,
  'comb-sort': combSort,
  'pancake-sort': pancakeSort,
  'bogo-sort': bogoSort,
  'radix-sort-msd': radixSortMSD,
};

/**
 * Execute the requested algorithm on the provided input data.
 */
function handleComputeAlgo(
  payload: ComputeAlgoPayload,
): ComputeAlgoResult {
  const { algorithmName, input } = payload;

  const sortFn = SORTING_REGISTRY[algorithmName];
  if (sortFn) {
    return { result: sortFn(input) };
  }

  throw new Error(`Unknown algorithm: ${algorithmName}`);
}

// ── Worker message handler ─────────────────────────────────

// DedicatedWorkerGlobalScope is only available with the `webworker` lib,
// which conflicts with `dom`. Use a minimal local declaration instead.
declare const self: {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage(message: unknown): void;
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    switch (type) {
      case COMPUTE_ALGO_STEP: {
        const result = handleComputeAlgo(
          payload as ComputeAlgoPayload,
        );
        const response: WorkerResponse<ComputeAlgoResult> = {
          type: COMPUTE_ALGO_STEP,
          payload: result,
          id,
        };
        self.postMessage(response);
        break;
      }
      default: {
        const errorResponse: WorkerResponse<null> = {
          type,
          payload: null,
          id,
          error: `Unknown message type: ${type}`,
        };
        self.postMessage(errorResponse);
      }
    }
  } catch (err) {
    const errorResponse: WorkerResponse<null> = {
      type,
      payload: null,
      id,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorResponse);
  }
};
