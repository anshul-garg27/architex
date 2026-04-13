// ── Template API ────────────────────────────────────────────────────
//
// GET /api/templates — Returns all built-in system design templates.
// Supports server-side filtering via query params:
//   ?category=classic|modern|infrastructure|advanced
//   ?difficulty=1..5   (returns templates at or below this level)
//
// When NEXT_PUBLIC_SYSDESIGN_USE_API is set, reads from module_content DB.
// Otherwise, falls back to in-memory SYSTEM_DESIGN_TEMPLATES.

import { NextResponse } from "next/server";
import { eq, and, asc, lte } from "drizzle-orm";
import { getDb, moduleContent } from "@/db";
import {
  SYSTEM_DESIGN_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByDifficulty,
} from "@/lib/templates";
import type { DiagramTemplate } from "@/lib/templates";

const USE_DB = process.env.NEXT_PUBLIC_SYSDESIGN_USE_API === "true";

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
};

const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as
    | DiagramTemplate["category"]
    | null;
  const difficultyStr = searchParams.get("difficulty");

  // ── Validate inputs ────────────────────────────────────────
  if (category) {
    const validCategories: DiagramTemplate["category"][] = [
      "classic",
      "modern",
      "infrastructure",
      "advanced",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category "${category}". Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  if (difficultyStr) {
    const difficulty = Number(difficultyStr);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: "difficulty must be a number between 1 and 5." },
        { status: 400 },
      );
    }
  }

  // ── DB path ────────────────────────────────────────────────
  if (USE_DB) {
    try {
      const db = getDb();
      const conditions = [
        eq(moduleContent.moduleId, "system-design"),
        eq(moduleContent.contentType, "template"),
        eq(moduleContent.isPublished, true),
      ];

      if (category) {
        conditions.push(eq(moduleContent.category, category));
      }

      if (difficultyStr) {
        const maxDifficulty = Number(difficultyStr);
        // Filter: templates at or below this difficulty level
        const allowedLevels = Object.entries(DIFFICULTY_MAP)
          .filter(([, v]) => v <= maxDifficulty)
          .map(([k]) => k);

        if (allowedLevels.length > 0) {
          // Use sortOrder as proxy since difficulty is stored as label
          conditions.push(
            lte(moduleContent.sortOrder, maxDifficulty * 20),
          );
        }
      }

      const rows = await db
        .select()
        .from(moduleContent)
        .where(and(...conditions))
        .orderBy(asc(moduleContent.sortOrder));

      // Map DB rows back to the DiagramTemplate shape consumers expect
      const templates = rows.map((row) => ({
        ...(row.content as Record<string, unknown>),
        id: row.slug,
        name: row.name,
        category: row.category,
        difficulty:
          DIFFICULTY_MAP[row.difficulty ?? "intermediate"] ?? 2,
      }));

      return NextResponse.json(
        { templates, count: templates.length },
        { headers: CACHE_HEADERS },
      );
    } catch (error) {
      console.error("[api/templates] DB error, falling back to static:", error);
      // Fall through to static path
    }
  }

  // ── Static fallback path ───────────────────────────────────
  let templates: DiagramTemplate[] = SYSTEM_DESIGN_TEMPLATES;

  if (category) {
    templates = getTemplatesByCategory(category);
  }

  if (difficultyStr) {
    const difficulty = Number(difficultyStr);
    const byDifficulty = getTemplatesByDifficulty(difficulty);
    if (category) {
      const difficultyIds = new Set(byDifficulty.map((t) => t.id));
      templates = templates.filter((t) => difficultyIds.has(t.id));
    } else {
      templates = byDifficulty;
    }
  }

  return NextResponse.json(
    { templates, count: templates.length },
    { headers: CACHE_HEADERS },
  );
}
