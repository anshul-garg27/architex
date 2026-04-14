/**
 * =============================================================================
 * SEED: Java Code Samples for 36 Design Patterns
 * =============================================================================
 *
 * Adds `content.code.java` to every pattern row in module_content.
 * Java code data lives in @/lib/lld/java-code.ts (shared with client).
 *
 * Run: npx tsx src/db/seeds/java-code-gen.ts
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import { eq, and } from "drizzle-orm";
import { JAVA_CODE } from "@/lib/lld/java-code";

export { JAVA_CODE };

// ─────────────────────────────────────────────────────────────
// Seed function: merge java code into existing pattern content
// ─────────────────────────────────────────────────────────────

export async function seed(db: Database) {
  console.log("[java-code-gen] Starting seed for", Object.keys(JAVA_CODE).length, "patterns...");

  let updated = 0;
  let skipped = 0;

  for (const [slug, javaCode] of Object.entries(JAVA_CODE)) {
    // Find the existing pattern row
    const rows = await db
      .select()
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.slug, slug),
          eq(moduleContent.contentType, "pattern")
        )
      )
      .limit(1);

    if (rows.length === 0) {
      console.log(`  [SKIP] Pattern "${slug}" not found in module_content`);
      skipped++;
      continue;
    }

    const row = rows[0];
    const content = row.content as Record<string, unknown>;
    const code = (content.code ?? {}) as Record<string, string>;

    // Merge java into the code object
    const updatedCode = { ...code, java: javaCode };
    const updatedContent = { ...content, code: updatedCode };

    await db
      .update(moduleContent)
      .set({
        content: updatedContent,
        updatedAt: new Date(),
      })
      .where(eq(moduleContent.id, row.id));

    updated++;
  }

  console.log(`[java-code-gen] Done. Updated: ${updated}, Skipped: ${skipped}`);
}
