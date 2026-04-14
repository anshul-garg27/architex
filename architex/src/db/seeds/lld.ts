/**
 * LLD module seed script.
 *
 * Extracts content from src/lib/lld/ data files into the module_content table.
 * Idempotent via onConflictDoUpdate — safe to run multiple times.
 *
 * Content types seeded:
 *   pattern         — 36 design patterns
 *   problem         — 33 LLD interview problems
 *   solid-demo      — 5 SOLID principle demos
 *   solid-quiz      — 26+ quiz questions
 *   oop-demo        — 2 OOP concept demos
 *   sequence-example — 10 sequence diagram examples
 *   state-machine   — 6 state machine examples
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import type { NewModuleContent } from "@/db/schema/module-content";
import { sql } from "drizzle-orm";

const MODULE_ID = "lld";

export async function seed(db: Database) {
  // Dynamic imports to avoid bundling these in the app
  const { DESIGN_PATTERNS } = await import("@/lib/lld/patterns");
  const { LLD_PROBLEMS } = await import("@/lib/lld/problems");
  const { SOLID_DEMOS, SOLID_QUIZ_QUESTIONS } = await import(
    "@/lib/lld/solid-demos"
  );
  const { OOP_DEMOS } = await import("@/lib/lld/oop-demos");
  const { SEQUENCE_EXAMPLES } = await import("@/lib/lld/sequence-diagram");
  const { STATE_MACHINE_EXAMPLES } = await import("@/lib/lld/state-machine");

  const rows: NewModuleContent[] = [];

  // Debug: check Strategy pattern enrichment
  const strategyDbg = DESIGN_PATTERNS.find((p) => p.id === "strategy");
  if (strategyDbg) {
    console.log(`    [DEBUG] Strategy classes: ${strategyDbg.classes.map((c) => c.name).join(", ")}`);
    console.log(`    [DEBUG] Strategy hasComplexity: ${!!strategyDbg.complexityAnalysis}`);
    console.log(`    [DEBUG] Strategy hasRationale: ${!!strategyDbg.designRationale}`);
  }

  // ── Design Patterns (36) ─────────────────────────────────
  for (let i = 0; i < DESIGN_PATTERNS.length; i++) {
    const p = DESIGN_PATTERNS[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "pattern",
      slug: p.id,
      name: p.name,
      category: p.category,
      difficulty: difficultyLabel(p.difficulty),
      sortOrder: i,
      summary: p.description.slice(0, 300),
      tags: [
        p.category,
        ...(p.realWorldExamples?.slice(0, 3) ?? []),
      ],
      content: stripForDb(p),
    });
  }

  // ── LLD Problems (33) ────────────────────────────────────
  for (let i = 0; i < LLD_PROBLEMS.length; i++) {
    const p = LLD_PROBLEMS[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "problem",
      slug: p.slug ?? p.id,
      name: p.name,
      category: p.category ?? null,
      difficulty: difficultyLabel(p.difficulty),
      sortOrder: i,
      summary: p.description.slice(0, 300),
      tags: [
        ...(p.keyPatterns ?? []),
        p.interviewFrequency ?? "",
        p.seoDifficulty ?? "",
      ].filter(Boolean),
      content: stripForDb(p),
    });
  }

  // ── SOLID Demos (5) ──────────────────────────────────────
  for (let i = 0; i < SOLID_DEMOS.length; i++) {
    const d = SOLID_DEMOS[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "solid-demo",
      slug: d.id,
      name: d.name,
      category: d.principle,
      difficulty: "intermediate",
      sortOrder: i,
      summary: d.description.slice(0, 300),
      tags: ["solid", d.principle.toLowerCase()],
      content: stripForDb(d),
    });
  }

  // ── SOLID Quiz Questions (26+) ───────────────────────────
  for (let i = 0; i < SOLID_QUIZ_QUESTIONS.length; i++) {
    const q = SOLID_QUIZ_QUESTIONS[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "solid-quiz",
      slug: q.id,
      name: `SOLID Quiz: ${q.violatedPrinciple} #${i + 1}`,
      category: q.violatedPrinciple,
      difficulty: "intermediate",
      sortOrder: i,
      summary: q.hint,
      tags: ["solid", "quiz", q.violatedPrinciple.toLowerCase()],
      content: stripForDb(q),
    });
  }

  // ── OOP Demos (2) ────────────────────────────────────────
  for (let i = 0; i < OOP_DEMOS.length; i++) {
    const d = OOP_DEMOS[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "oop-demo",
      slug: d.id,
      name: d.name,
      category: d.principle,
      difficulty: "beginner",
      sortOrder: i,
      summary: d.description.slice(0, 300),
      tags: ["oop", d.principle],
      content: stripForDb(d),
    });
  }

  // ── Sequence Diagram Examples (10) ───────────────────────
  for (let i = 0; i < SEQUENCE_EXAMPLES.length; i++) {
    const s = SEQUENCE_EXAMPLES[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "sequence-example",
      slug: s.id,
      name: s.name,
      category: null,
      difficulty: null,
      sortOrder: i,
      summary: s.description?.slice(0, 300) ?? null,
      tags: ["sequence-diagram"],
      content: stripForDb(s),
    });
  }

  // ── State Machine Examples (6) ───────────────────────────
  for (let i = 0; i < STATE_MACHINE_EXAMPLES.length; i++) {
    const sm = STATE_MACHINE_EXAMPLES[i];
    rows.push({
      moduleId: MODULE_ID,
      contentType: "state-machine",
      slug: sm.id,
      name: sm.name,
      category: null,
      difficulty: null,
      sortOrder: i,
      summary: sm.description?.slice(0, 300) ?? null,
      tags: ["state-machine"],
      content: stripForDb(sm),
    });
  }

  // ── Delete existing LLD rows and re-insert fresh ──────────
  // Using delete+insert instead of upsert to guarantee content updates
  console.log(`    Deleting existing LLD rows...`);
  await db.delete(moduleContent).where(
    sql`${moduleContent.moduleId} = ${MODULE_ID}`,
  );

  console.log(`    Inserting ${rows.length} fresh LLD content rows...`);
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(moduleContent).values(batch);
  }

  console.log(`    ✓ ${rows.length} rows upserted`);
}

// ── Helpers ──────────────────────────────────────────────────

function difficultyLabel(n: number): string {
  const map: Record<number, string> = {
    1: "beginner",
    2: "intermediate",
    3: "advanced",
    4: "expert",
    5: "expert",
  };
  return map[n] ?? "intermediate";
}

/** Strip the object to a plain JSON-serializable form for JSONB storage. */
function stripForDb(obj: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}
