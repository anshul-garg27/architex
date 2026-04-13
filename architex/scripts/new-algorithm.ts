#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ── ALG-236: --help flag ─────────────────────────────────────
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/new-algorithm.ts [--help]

Scaffolds a new algorithm implementation with:
  - Algorithm source file (src/lib/algorithms/<category>/<id>.ts)
  - Test file scaffold  (src/lib/algorithms/<category>/__tests__/<id>.test.ts)
  - CONFIG export following project conventions
  - element-{index} targetId pattern for mutations

The script will prompt for:
  - Algorithm name       (e.g., "Counting Sort")
  - Algorithm ID         (e.g., "counting-sort")
  - Category             (sorting/graph/tree/dp/string/backtracking/geometry)
  - Time complexity      (best, average, worst)
  - Space complexity

Options:
  --help, -h    Show this help message
`);
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

async function main() {
  const name = await ask('Algorithm name (e.g., "Counting Sort"): ');
  const id = await ask('Algorithm ID (e.g., "counting-sort"): ');
  const category = await ask('Category (sorting/graph/tree/dp/string/backtracking/geometry): ');
  const best = await ask('Best time complexity (e.g., "O(n)"): ');
  const avg = await ask('Average time complexity: ');
  const worst = await ask('Worst time complexity: ');
  const space = await ask('Space complexity: ');

  const funcName = id.replace(/-./g, m => m[1].toUpperCase());
  const dir = path.join('src/lib/algorithms', category);
  const filePath = path.join(dir, `${id}.ts`);

  // ── Algorithm source file ────────────────────────────────
  const template = `import type { AlgorithmConfig, AlgorithmResult, AnimationStep, VisualMutation } from '../types';

export const CONFIG: AlgorithmConfig = {
  id: '${id}',
  name: '${name}',
  category: '${category}' as AlgorithmConfig['category'],
  timeComplexity: { best: '${best}', average: '${avg}', worst: '${worst}' },
  spaceComplexity: '${space}',
  description: 'TODO: Add A-grade description following docs/guides/algorithm-content-style.md',
  pseudocode: ['TODO: Add pseudocode lines'],
};

export function ${funcName}(input: number[]): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;

  // Helper to record a step with element-{index} targetId pattern
  function addStep(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
    comparisons: number,
    swaps: number,
  ): void {
    steps.push({
      id: \`step-\${stepId++}\`,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps },
    });
  }

  // TODO: Implement algorithm with step recording
  // Use targetId: \`element-\${index}\` for array element mutations

  return { config: CONFIG, steps, finalState: [...input] };
}
`;

  // ── Test file scaffold ───────────────────────────────────
  const testDir = path.join(dir, '__tests__');
  const testFilePath = path.join(testDir, `${id}.test.ts`);

  const testTemplate = `import { describe, it, expect } from 'vitest';
import { ${funcName}, CONFIG } from '../${id}';

describe('${name}', () => {
  it('has a valid CONFIG export', () => {
    expect(CONFIG.id).toBe('${id}');
    expect(CONFIG.name).toBe('${name}');
    expect(CONFIG.category).toBe('${category}');
    expect(CONFIG.pseudocode.length).toBeGreaterThan(0);
  });

  it('returns a valid AlgorithmResult', () => {
    const input = [5, 3, 8, 1, 2];
    const result = ${funcName}(input);

    expect(result.config).toBe(CONFIG);
    expect(result.steps).toBeDefined();
    expect(Array.isArray(result.finalState)).toBe(true);
  });

  it('generates steps with element-{index} targetIds', () => {
    const input = [4, 2, 7, 1];
    const result = ${funcName}(input);

    for (const step of result.steps) {
      for (const mutation of step.mutations) {
        expect(mutation.targetId).toMatch(/^element-\\d+$/);
      }
    }
  });

  // TODO: Add algorithm-specific correctness tests
});
`;

  // ── Write files ──────────────────────────────────────────
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, template);
  console.log('  Created: ' + filePath);

  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFilePath, testTemplate);
  console.log('  Created: ' + testFilePath);

  console.log('\nNext steps:');
  console.log('  1. Implement the algorithm logic in ' + filePath);
  console.log('  2. Add pseudocode lines to CONFIG.pseudocode');
  console.log('  3. Add to ' + category + '/index.ts barrel export');
  console.log('  4. Add runner to AlgorithmPanel.tsx');
  console.log('  5. Fill in algorithm-specific tests in ' + testFilePath);
  console.log('  6. Run: pnpm test && pnpm typecheck');

  rl.close();
}

main();
