/**
 * GET /api/blueprint/units
 *
 * Returns the list of published units for the current course. No auth
 * required — the curriculum is public.
 *
 * Response shape:
 *   { units: Array<{
 *       id, slug, ordinal, title, summary,
 *       durationMinutes, difficulty, prereqUnitSlugs, tags, entityRefs
 *     }> }
 *
 * Sorted by ordinal ASC.
 */

import { NextResponse } from "next/server";
import { and, eq, isNotNull, asc } from "drizzle-orm";
import { getDb, blueprintCourses, blueprintUnits } from "@/db";

const COURSE_SLUG = "blueprint-core";

export async function GET() {
  try {
    const db = getDb();
    const course = await db
      .select()
      .from(blueprintCourses)
      .where(eq(blueprintCourses.slug, COURSE_SLUG))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json({ units: [] });
    }

    const rows = await db
      .select({
        id: blueprintUnits.id,
        slug: blueprintUnits.slug,
        ordinal: blueprintUnits.ordinal,
        title: blueprintUnits.title,
        summary: blueprintUnits.summary,
        durationMinutes: blueprintUnits.durationMinutes,
        difficulty: blueprintUnits.difficulty,
        prereqUnitSlugs: blueprintUnits.prereqUnitSlugs,
        tags: blueprintUnits.tags,
        entityRefs: blueprintUnits.entityRefs,
      })
      .from(blueprintUnits)
      .where(
        and(
          eq(blueprintUnits.courseId, course[0].id),
          isNotNull(blueprintUnits.publishedAt),
        ),
      )
      .orderBy(asc(blueprintUnits.ordinal));

    return NextResponse.json({ units: rows });
  } catch (error) {
     
    console.error("[api/blueprint/units] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
