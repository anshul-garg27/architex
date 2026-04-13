// -----------------------------------------------------------------
// Architex -- Data Structure Explorer Types  (DST-002)
// -----------------------------------------------------------------

export interface DSOperation {
  type:
    | 'insert'
    | 'delete'
    | 'search'
    | 'push'
    | 'pop'
    | 'enqueue'
    | 'dequeue'
    | 'peek';
  value?: number;
  index?: number;
  key?: string;
}

export interface DSMutation {
  targetId: string;
  property: string;
  from: string | number | boolean;
  to: string | number | boolean;
}

export interface DSStep {
  id: number;
  description: string;
  mutations: DSMutation[];
}

export type DSCategory =
  | 'linear'
  | 'tree'
  | 'hash'
  | 'heap'
  | 'probabilistic'
  | 'system';

export interface DSConfig {
  id: string;
  name: string;
  category: DSCategory;
  operations: Array<string | { id: string; label: string }>;
  complexity: Record<string, string>;
  description: string;
  complexityIntuition?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  realWorld?: string[];
  keyTakeaways?: [string, string, string];
  whenToUse?: { use: string; dontUse: string };
  commonMistakes?: string[];
  interviewTips?: string[];
  edgeCasePresets?: Array<{ name: string; data: string; description: string }>;
}

export interface DSResult<T = unknown> {
  steps: DSStep[];
  /** Final snapshot of the data structure state after the operation. */
  snapshot: T;
}

// ── Typed highlight states (DST-186) ──────────────────────
// Discriminated union of all possible highlight states for DS visualizations.

export type DSHighlightState =
  | 'default'
  | 'comparing'
  | 'visiting'
  | 'visited'
  | 'inserting'
  | 'done'
  | 'deleting'
  | 'shifting'
  | 'found'
  | 'hashing'
  | 'already-set'
  | 'setting'
  | 'not-found'
  | 'updating'
  | 'targeting'
  | 'merging'
  | 'splitting'
  | 'rotating'
  | 'rebalancing'
  | 'in-flight'
  | 'miss'
  | 'receiving'
  | 'sending'
  | 'removed';

// ── Shared step recorder (DST-191) ─────────────────────────
// Eliminates per-file _stepId + step() + resetStepId() boilerplate.
// Each exported operation creates its own recorder via createStepRecorder().

export function createStepRecorder() {
  let id = 0;
  return {
    step(desc: string, mutations: DSMutation[]): DSStep {
      return { id: id++, description: desc, mutations };
    },
  };
}
