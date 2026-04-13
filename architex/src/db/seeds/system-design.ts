/**
 * System Design module seed script.
 *
 * Extracts content from templates, simulation, and blueprint files
 * into the module_content table. Idempotent via onConflictDoUpdate.
 *
 * Content types seeded:
 *   template      — 55 system design diagram templates
 *   blueprint     — 15 solution blueprints with simulation metadata
 *   chaos-event   — 88 chaos event definitions
 *   topology-rule — 81 topology profile rules
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import type { NewModuleContent } from "@/db/schema/module-content";

const MODULE_ID = "system-design";

export async function seed(db: Database) {
  const { SYSTEM_DESIGN_TEMPLATES, getSolutionBlueprints } = await import(
    "@/lib/templates"
  );
  const { CHAOS_EVENTS } = await import("@/lib/simulation/chaos-engine");
  const { RULE_DATABASE } = await import("@/lib/simulation/rule-database");

  const rows: NewModuleContent[] = [];

  // ── Templates (55) ───────────────────────────────────────
  for (let i = 0; i < SYSTEM_DESIGN_TEMPLATES.length; i++) {
    const t = SYSTEM_DESIGN_TEMPLATES[i] as unknown as Record<string, unknown>;
    rows.push({
      moduleId: MODULE_ID,
      contentType: "template",
      slug: (t.id as string) ?? `template-${i}`,
      name: (t.name as string) ?? `Template ${i}`,
      category: (t.category as string) ?? null,
      difficulty: difficultyLabel(t.difficulty as number),
      sortOrder: i,
      summary: ((t.description as string) ?? "").slice(0, 300),
      tags: (t.tags as string[]) ?? [],
      content: stripForDb(t),
    });
  }

  // ── Blueprints (15) ──────────────────────────────────────
  try {
    const blueprints = getSolutionBlueprints?.() ?? [];
    for (let i = 0; i < blueprints.length; i++) {
      const b = blueprints[i] as unknown as Record<string, unknown>;
      rows.push({
        moduleId: MODULE_ID,
        contentType: "blueprint",
        slug: (b.id as string) ?? `blueprint-${i}`,
        name: (b.name as string) ?? `Blueprint ${i}`,
        category: (b.category as string) ?? null,
        difficulty: difficultyLabel(b.difficulty as number),
        sortOrder: i,
        summary: ((b.description as string) ?? "").slice(0, 300),
        tags: ["blueprint", ...((b.tags as string[]) ?? [])],
        content: stripForDb(b),
      });
    }
  } catch {
    console.warn("    Skipping blueprints (export not found)");
  }

  // ── Chaos Events (88) ────────────────────────────────────
  for (let i = 0; i < CHAOS_EVENTS.length; i++) {
    const e = CHAOS_EVENTS[i] as unknown as Record<string, unknown>;
    rows.push({
      moduleId: MODULE_ID,
      contentType: "chaos-event",
      slug: (e.id as string) ?? `chaos-${i}`,
      name: (e.name as string) ?? `Chaos Event ${i}`,
      category: (e.category as string) ?? null,
      difficulty: severityToDifficulty(e.defaultSeverity as string),
      sortOrder: i,
      summary: ((e.description as string) ?? "").slice(0, 300),
      tags: [
        "chaos",
        (e.category as string) ?? "",
        (e.defaultSeverity as string) ?? "",
      ].filter(Boolean),
      content: stripForDb(e),
    });
  }

  // ── Topology Rules (81) ──────────────────────────────────
  try {
    const profiles =
      typeof RULE_DATABASE.getAllProfiles === "function"
        ? RULE_DATABASE.getAllProfiles()
        : (RULE_DATABASE as unknown as { profiles: unknown[] }).profiles ?? [];

    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i] as unknown as Record<string, unknown>;
      rows.push({
        moduleId: MODULE_ID,
        contentType: "topology-rule",
        slug: (p.profileId as string) ?? `rule-${i}`,
        name: (p.profileId as string) ?? `Rule ${i}`,
        category: (p.componentType as string) ?? null,
        difficulty: null,
        sortOrder: i,
        summary: `${p.componentType} topology profile with ${((p.issues as string[]) ?? []).length} issue checks`,
        tags: [
          "topology",
          (p.componentType as string) ?? "",
        ].filter(Boolean),
        content: stripForDb(p),
      });
    }
  } catch {
    console.warn("    Skipping topology rules (export structure unexpected)");
  }

  // ── Upsert all rows ──────────────────────────────────────
  console.log(`    Upserting ${rows.length} system-design content rows...`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(moduleContent)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          moduleContent.moduleId,
          moduleContent.contentType,
          moduleContent.slug,
        ],
        set: {
          name: moduleContent.name,
          category: moduleContent.category,
          difficulty: moduleContent.difficulty,
          sortOrder: moduleContent.sortOrder,
          content: moduleContent.content,
          summary: moduleContent.summary,
          tags: moduleContent.tags,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`    ✓ ${rows.length} rows upserted`);
}

// ── Helpers ──────────────────────────────────────────────────

function difficultyLabel(n: number | undefined): string | null {
  if (!n) return null;
  const map: Record<number, string> = {
    1: "beginner",
    2: "intermediate",
    3: "advanced",
    4: "expert",
    5: "expert",
  };
  return map[n] ?? null;
}

function severityToDifficulty(severity: string | undefined): string | null {
  const map: Record<string, string> = {
    low: "beginner",
    medium: "intermediate",
    high: "advanced",
    critical: "expert",
  };
  return map[severity ?? ""] ?? null;
}

function stripForDb(obj: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}
