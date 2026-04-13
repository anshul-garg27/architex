// -----------------------------------------------------------------
// Architex -- Skip List with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const SKIP_LIST_CONFIG: AlgorithmConfig = {
  id: 'skip-list',
  name: 'Skip List',
  category: 'sorting',
  timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)' },
  spaceComplexity: 'O(n log n)',
  stable: false,
  inPlace: false,
  description:
    "What if a linked list had express lanes? A Skip List adds multiple levels of shortcuts \u2014 the top level skips many elements, lower levels skip fewer. Search starts at the top and drops down. Expected O(log n) for search/insert/delete. Used in: Redis sorted sets, LevelDB/RocksDB, concurrent data structures (lock-free).",
  pseudocode: [
    'procedure skipListInsert(list, key)',
    '  level = randomLevel()',
    '  update = array of maxLevel nulls',
    '  current = list.header',
    '  for i = list.level down to 0 do',
    '    while current.next[i] != null and current.next[i].key < key do',
    '      current = current.next[i]',
    '    update[i] = current',
    '  current = current.next[0]',
    '  node = createNode(key, level)',
    '  for i = 0 to level do',
    '    node.next[i] = update[i].next[i]',
    '    update[i].next[i] = node',
    '',
    'procedure skipListSearch(list, key)',
    '  current = list.header',
    '  for i = list.level down to 0 do',
    '    while current.next[i] != null and current.next[i].key < key do',
    '      current = current.next[i]',
    '  current = current.next[0]',
    '  if current != null and current.key == key then',
    '    return FOUND',
    '  return NOT_FOUND',
  ],
  complexityIntuition:
    'Each level halves the number of nodes (on average). With log n levels, search traverses at most O(log n) nodes per level, giving O(log n) total. The worst case O(n) happens if every coin flip produces the same level \u2014 astronomically unlikely.',
  difficulty: 'advanced',
  whenToUse:
    'Use when you need a sorted data structure with O(log n) operations that is simpler to implement than a balanced BST. Especially good for concurrent environments because lock-free skip lists are much simpler than lock-free trees.',
  commonMistakes: [
    'Forgetting to update all levels during insert/delete, not just level 0.',
    'Not capping the maximum level \u2014 theoretically unbounded, practically capped at log2(n).',
    'Using a fixed random seed in tests, masking level distribution bugs.',
  ],
};

// -- Skip List node ------------------------------------------------

interface SkipNode {
  key: number;
  next: (SkipNode | null)[];
}

function createNode(key: number, level: number): SkipNode {
  return { key, next: new Array(level + 1).fill(null) };
}

// Coin-flip level generation: ~50% chance of each additional level
function randomLevel(maxLevel: number): number {
  let level = 0;
  // Use deterministic-ish random for reproducible demos
  while (level < maxLevel && Math.random() < 0.5) {
    level++;
  }
  return level;
}

/** Default values to insert, then search for. */
export const SKIP_LIST_DEFAULT_INSERTS = [3, 6, 7, 9, 12, 19, 17, 26, 21, 25];
export const SKIP_LIST_DEFAULT_SEARCHES = [19, 8, 25];

/**
 * Demonstrates Skip List insert and search operations with step recording.
 *
 * @param arr - Array of numbers (used for engine compatibility)
 * @param inserts - Values to insert into the skip list
 * @param searches - Values to search for after building the list
 * @returns AlgorithmResult with animation steps
 */
export function skipList(
  arr: number[],
  inserts: number[] = SKIP_LIST_DEFAULT_INSERTS,
  searches: number[] = SKIP_LIST_DEFAULT_SEARCHES,
): AlgorithmResult {
  const MAX_LEVEL = 4;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Create header node (sentinel)
  const header: SkipNode = createNode(-Infinity, MAX_LEVEL);
  let listLevel = 0;

  // Helper to get a snapshot of all keys at each level for descriptions
  function describeList(): string {
    const levels: string[] = [];
    for (let lv = listLevel; lv >= 0; lv--) {
      const keys: number[] = [];
      let curr = header.next[lv];
      while (curr) {
        keys.push(curr.key);
        curr = curr.next[lv];
      }
      levels.push(`L${lv}: [${keys.join(' -> ')}]`);
    }
    return levels.join(' | ');
  }

  // Step 0: overview
  steps.push({
    id: stepId++,
    description:
      `Build a Skip List by inserting ${inserts.length} values, then search for ${searches.length} keys. Each node gets a random level (coin flips). Higher levels act as express lanes.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 700,
  });

  // ---- INSERT phase ----
  for (let insIdx = 0; insIdx < inserts.length; insIdx++) {
    const key = inserts[insIdx];
    const nodeLevel = randomLevel(MAX_LEVEL);

    // Step: announce insert
    steps.push({
      id: stepId++,
      description:
        `INSERT ${key} with level ${nodeLevel} (${nodeLevel + 1} lane${nodeLevel > 0 ? 's' : ''}). Start at the top level and find the correct position at each level.`,
      pseudocodeLine: 0,
      mutations: [
        {
          targetId: `element-${insIdx}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    // Find update positions (where to splice at each level)
    const update: (SkipNode | null)[] = new Array(MAX_LEVEL + 1).fill(null);
    let current = header;

    for (let i = listLevel; i >= 0; i--) {
      while (current.next[i] !== null && current.next[i]!.key < key) {
        comparisons++;
        reads++;
        current = current.next[i]!;
      }
      comparisons++;
      reads++;
      update[i] = current;
    }

    // Show traversal path
    steps.push({
      id: stepId++,
      description:
        `Traversed from top level down to level 0, finding insert position for ${key}. ${comparisons} comparisons so far across all express lanes.`,
      pseudocodeLine: 4,
      mutations: [
        {
          targetId: `element-${insIdx}`,
          property: 'highlight',
          from: 'active',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 350,
    });

    // Update list level if needed
    if (nodeLevel > listLevel) {
      for (let i = listLevel + 1; i <= nodeLevel; i++) {
        update[i] = header;
      }
      listLevel = nodeLevel;
    }

    // Create and splice the new node
    const newNode = createNode(key, nodeLevel);
    writes++;

    for (let i = 0; i <= nodeLevel; i++) {
      newNode.next[i] = update[i]!.next[i];
      update[i]!.next[i] = newNode;
      writes += 2;
    }

    // Show inserted node
    steps.push({
      id: stepId++,
      description:
        `Inserted ${key} at levels 0..${nodeLevel}. Pointers updated at each level. ${describeList()}`,
      pseudocodeLine: 12,
      mutations: [
        {
          targetId: `element-${insIdx}`,
          property: 'highlight',
          from: 'comparing',
          to: 'found',
          easing: 'spring',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 450,
      milestone: `Inserted ${key}`,
    });
  }

  // Show full list after all inserts
  steps.push({
    id: stepId++,
    description:
      `Skip List built! ${inserts.length} nodes across ${listLevel + 1} levels. ${describeList()}. Now searching.`,
    pseudocodeLine: 13,
    mutations: inserts.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'found' as string,
      to: 'sorted' as string,
      easing: 'ease-out' as const,
    })),
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // ---- SEARCH phase ----
  const insertSet = new Set(inserts);

  for (const searchKey of searches) {
    let current = header;
    let hops = 0;

    steps.push({
      id: stepId++,
      description:
        `SEARCH for ${searchKey}. Start at the top level (L${listLevel}) and drop down, using express lanes to skip ahead.`,
      pseudocodeLine: 14,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    for (let i = listLevel; i >= 0; i--) {
      while (current.next[i] !== null && current.next[i]!.key < searchKey) {
        comparisons++;
        reads++;
        hops++;
        current = current.next[i]!;
      }
      comparisons++;
      reads++;

      // Show level traversal
      const nextKey = current.next[i] ? current.next[i]!.key : 'null';
      steps.push({
        id: stepId++,
        description:
          `Level ${i}: advanced to ${current.key === -Infinity ? 'header' : current.key}, next is ${nextKey}${nextKey === searchKey ? ' \u2014 found target!' : nextKey === 'null' ? ' \u2014 end of level, drop down.' : ` >= ${searchKey}, drop down.`}`,
        pseudocodeLine: 17,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
    }

    // Check level 0 successor
    current = current.next[0]!;
    const found = current !== null && current.key === searchKey;
    const actuallyPresent = insertSet.has(searchKey);

    if (found) {
      steps.push({
        id: stepId++,
        description:
          `Found ${searchKey} in ${hops + 1} hops! Without express lanes, a linked list would need up to ${inserts.length} hops. Skip List achieved O(log n).`,
        pseudocodeLine: 21,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 450,
      });
    } else {
      steps.push({
        id: stepId++,
        description:
          `${searchKey} not found \u2014 ${actuallyPresent ? 'unexpected miss' : 'correctly determined absent'} after ${hops + 1} hops. The key does not exist in the skip list.`,
        pseudocodeLine: 22,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 450,
      });
    }
  }

  // Final summary
  const allKeys: number[] = [];
  let curr = header.next[0];
  while (curr) {
    allKeys.push(curr.key);
    curr = curr.next[0];
  }

  const finalMutations: VisualMutation[] = inserts.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: 'sorted' as string,
    to: 'sorted' as string,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description:
      `Done! Skip List contains ${allKeys.length} elements in sorted order: [${allKeys.join(', ')}]. ${listLevel + 1} levels. ${comparisons} total comparisons across all operations.`,
    pseudocodeLine: 22,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 600,
  });

  return { config: SKIP_LIST_CONFIG, steps, finalState: allKeys };
}
