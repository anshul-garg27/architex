/**
 * GET /api/lld/templates-library
 *
 * Optional query params:
 *   ?category=creational|structural|behavioral|architecture|microservices|data|ai
 *   ?difficulty=beginner|intermediate|advanced
 *   ?q=free-text (matches name + description + tags)
 *
 * Public (no auth required) — templates are not user-scoped.
 * Response is cacheable with a stale-while-revalidate header.
 */

import { NextResponse } from "next/server";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { getDb, lldTemplatesLibrary } from "@/db";

const VALID_CATEGORIES = new Set([
  "creational",
  "structural",
  "behavioral",
  "architecture",
  "microservices",
  "data",
  "ai",
]);
const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const difficulty = url.searchParams.get("difficulty");
    const q = url.searchParams.get("q")?.trim();

    const where: SQL[] = [];
    if (category && VALID_CATEGORIES.has(category)) {
      where.push(eq(lldTemplatesLibrary.category, category));
    }
    if (difficulty && VALID_DIFFICULTIES.has(difficulty)) {
      where.push(eq(lldTemplatesLibrary.difficulty, difficulty));
    }
    if (q && q.length > 0) {
      const like = `%${q.toLowerCase()}%`;
      const condition = or(
        ilike(lldTemplatesLibrary.name, like),
        ilike(lldTemplatesLibrary.description, like),
        sql`${lldTemplatesLibrary.tags}::text ILIKE ${like}`,
      );
      if (condition) {
        where.push(condition);
      }
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(lldTemplatesLibrary)
      .where(where.length > 0 ? and(...where) : undefined)
      .orderBy(
        asc(lldTemplatesLibrary.category),
        asc(lldTemplatesLibrary.sortOrder),
      )
      .limit(200);

    return NextResponse.json(
      { templates: rows },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[api/lld/templates-library] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
