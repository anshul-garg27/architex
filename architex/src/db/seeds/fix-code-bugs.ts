/**
 * Fix leaked metadata in pattern code strings + broken problem cross-refs.
 *
 * Issues:
 *   1. Three patterns (chain-of-responsibility, saga, react-pattern) have
 *      interviewTips/commonMistakes/relatedPatterns arrays accidentally
 *      embedded inside their TypeScript code sample strings.
 *   2. Two problems (atm, airline-booking) reference "stock-exchange" which
 *      doesn't exist — should be "stock-brokerage".
 *
 * Run: DATABASE_URL=... npx tsx src/db/seeds/fix-code-bugs.ts
 */

import { getDb } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import { eq, and } from "drizzle-orm";

const MODULE_ID = "lld";

/**
 * Remove leaked metadata blocks from a code string.
 * Matches patterns like:
 *   interviewTips: [\n    ...\n  ],
 *   commonMistakes: [\n    ...\n  ],
 *   relatedPatterns: [\n    ...\n  ],
 */
function stripLeakedMetadata(code: string): string {
  // Remove interviewTips, commonMistakes, relatedPatterns array blocks
  // These appear as object properties inside code string literals
  const metadataPattern =
    /,?\s*(?:interviewTips|commonMistakes|relatedPatterns)\s*:\s*\[[\s\S]*?\],?/g;
  return code.replace(metadataPattern, "");
}

async function main() {
  const db = getDb();
  let fixed = 0;

  // ── Fix 1: Remove leaked metadata from pattern code strings ──
  const AFFECTED_PATTERNS = [
    "chain-of-responsibility",
    "saga",
    "react-pattern",
  ];

  for (const slug of AFFECTED_PATTERNS) {
    const rows = await db
      .select()
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, slug),
        ),
      );

    if (rows.length === 0) {
      console.log(`  ⚠ Pattern not found: ${slug}`);
      continue;
    }

    const row = rows[0];
    const content = row.content as Record<string, unknown>;
    const code = content.code as Record<string, string> | undefined;

    if (!code?.typescript) {
      console.log(`  ⚠ No TypeScript code for: ${slug}`);
      continue;
    }

    const original = code.typescript;
    const cleaned = stripLeakedMetadata(original);

    if (original === cleaned) {
      console.log(`  ✓ ${slug} — no leaked metadata found`);
      continue;
    }

    code.typescript = cleaned;
    content.code = code;

    await db
      .update(moduleContent)
      .set({ content, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, slug),
        ),
      );

    console.log(`  ✓ ${slug} — cleaned leaked metadata from code`);
    fixed++;
  }

  // ── Fix 2: Fix broken problem cross-references ──
  const CROSS_REF_FIXES: Array<{
    slug: string;
    wrong: string;
    correct: string;
  }> = [
    { slug: "atm", wrong: "stock-exchange", correct: "stock-brokerage" },
    {
      slug: "airline-booking",
      wrong: "stock-exchange",
      correct: "stock-brokerage",
    },
  ];

  for (const { slug, wrong, correct } of CROSS_REF_FIXES) {
    const rows = await db
      .select()
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "problem"),
          eq(moduleContent.slug, slug),
        ),
      );

    if (rows.length === 0) {
      console.log(`  ⚠ Problem not found: ${slug}`);
      continue;
    }

    const row = rows[0];
    const content = row.content as Record<string, unknown>;
    const related = content.relatedProblems as string[] | undefined;

    if (!related || !related.includes(wrong)) {
      console.log(`  ✓ ${slug} — cross-ref already correct`);
      continue;
    }

    content.relatedProblems = related.map((r) => (r === wrong ? correct : r));

    await db
      .update(moduleContent)
      .set({ content, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "problem"),
          eq(moduleContent.slug, slug),
        ),
      );

    console.log(`  ✓ ${slug} — fixed cross-ref: ${wrong} → ${correct}`);
    fixed++;
  }

  console.log(`\nFixed ${fixed} content rows.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("fix-code-bugs failed:", e);
  process.exit(1);
});
