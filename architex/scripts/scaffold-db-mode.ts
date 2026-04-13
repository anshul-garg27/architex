#!/usr/bin/env node
/**
 * scaffold-db-mode.ts -- Generate boilerplate for a new Database Design Lab mode.
 *
 * Usage:
 *   pnpm scaffold:db-mode --name mvcc --display "MVCC Visualization"
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

// ── Argument Parsing ─────────────────────────────────────────────

function parseArgs(argv: string[]): { name: string; display: string } {
  let name = "";
  let display = "";

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--name" && argv[i + 1]) {
      name = argv[++i];
    } else if (argv[i] === "--display" && argv[i + 1]) {
      display = argv[++i];
    }
  }

  if (!name) {
    console.error("Error: --name is required.\n");
    console.error(
      'Usage: pnpm scaffold:db-mode --name mvcc --display "MVCC Visualization"',
    );
    process.exit(1);
  }

  if (!display) {
    // Auto-generate display name from kebab-case
    display = name
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return { name, display };
}

// ── Helpers ─────────────────────────────────────────────────────

/** Convert kebab-case to PascalCase: "mvcc-log" → "MvccLog" */
function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

// ── Templates ───────────────────────────────────────────────────

function engineTemplate(name: string, display: string): string {
  const Name = toPascalCase(name);
  return `\
/**
 * Database Design Lab -- ${display}
 */

export interface ${Name}Step {
  description: string;
  state: ${Name}State;
  operation: string;
}

export interface ${Name}State {
  // TODO: Define state shape
}

export class ${Name}Viz {
  private state: ${Name}State;

  constructor() {
    this.state = this.createInitialState();
  }

  // TODO: Add operations that return ${Name}Step[]

  getState(): ${Name}State {
    return { ...this.state };
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  private createInitialState(): ${Name}State {
    return {};
  }
}
`;
}

function testTemplate(name: string): string {
  const Name = toPascalCase(name);
  return `\
import { describe, it, expect, beforeEach } from "vitest";
import { ${Name}Viz } from "../${name}-viz";

describe("${Name}Viz", () => {
  let viz: ${Name}Viz;

  beforeEach(() => {
    viz = new ${Name}Viz();
  });

  it("creates an initial state", () => {
    const state = viz.getState();
    expect(state).toBeDefined();
  });

  it("resets to initial state", () => {
    viz.reset();
    const state = viz.getState();
    expect(state).toBeDefined();
  });

  it("returns a copy of state (not a reference)", () => {
    const a = viz.getState();
    const b = viz.getState();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
`;
}

function barrelExportBlock(name: string): string {
  const Name = toPascalCase(name);
  const label = Name.replace(/([a-z])([A-Z])/g, "$1 $2");
  return `
// -- ${label} Visualization ──────────────────────────────────
export { ${Name}Viz } from "./${name}-viz";
export type { ${Name}State, ${Name}Step } from "./${name}-viz";`;
}

// ── Main ────────────────────────────────────────────────────────

function main(): void {
  const { name, display } = parseArgs(process.argv);
  const Name = toPascalCase(name);

  const libDir = resolve("src/lib/database");
  const testDir = join(libDir, "__tests__");

  // Ensure directories exist
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }

  const enginePath = join(libDir, `${name}-viz.ts`);
  const testPath = join(testDir, `${name}-viz.test.ts`);
  const barrelPath = join(libDir, "index.ts");

  // ── Guard: don't overwrite existing files ──
  if (existsSync(enginePath)) {
    console.error(`Error: ${enginePath} already exists. Aborting.`);
    process.exit(1);
  }
  if (existsSync(testPath)) {
    console.error(`Error: ${testPath} already exists. Aborting.`);
    process.exit(1);
  }

  // ── 1. Write engine file ──
  writeFileSync(enginePath, engineTemplate(name, display), "utf-8");
  console.log(`  Created  ${enginePath}`);

  // ── 2. Write test file ──
  writeFileSync(testPath, testTemplate(name), "utf-8");
  console.log(`  Created  ${testPath}`);

  // ── 3. Append to barrel export ──
  if (!existsSync(barrelPath)) {
    console.error(`Warning: Barrel file ${barrelPath} not found. Skipping export update.`);
  } else {
    const barrel = readFileSync(barrelPath, "utf-8");
    if (barrel.includes(`${Name}Viz`)) {
      console.log(`  Skipped  ${barrelPath} (${Name}Viz already exported)`);
    } else {
      const exportBlock = barrelExportBlock(name);
      writeFileSync(barrelPath, barrel.trimEnd() + "\n" + exportBlock + "\n", "utf-8");
      console.log(`  Updated  ${barrelPath}`);
    }
  }

  // ── 4. Print next-steps checklist ──
  console.log(`
────────────────────────────────────────────
  ${display} scaffolded successfully!
────────────────────────────────────────────

Next steps:

  [ ] Define the ${Name}State interface in src/lib/database/${name}-viz.ts
  [ ] Implement operations that return ${Name}Step[] arrays
  [ ] Add the "${name}" mode to DatabaseMode union in DatabaseModule.tsx
  [ ] Create the ${Name}Canvas component in DatabaseModule.tsx
  [ ] Add legend colors following docs/design/database-visual-language.md
  [ ] Write comprehensive tests in src/lib/database/__tests__/${name}-viz.test.ts
  [ ] Update MODES array in DatabaseModule.tsx with name + description
`);
}

main();
