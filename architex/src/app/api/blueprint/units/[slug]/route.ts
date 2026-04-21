/**
 * GET /api/blueprint/units/[slug]
 *
 * Returns the full unit record including the section recipe.
 * 404 when the slug doesn't match a published unit.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, blueprintCourses, blueprintUnits } from "@/db";

const COURSE_SLUG = "blueprint-core";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const db = getDb();

    const course = await db
      .select()
      .from(blueprintCourses)
      .where(eq(blueprintCourses.slug, COURSE_SLUG))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: "course not found" },
        { status: 404 },
      );
    }

    const rows = await db
      .select()
      .from(blueprintUnits)
      .where(
        and(
          eq(blueprintUnits.courseId, course[0].id),
          eq(blueprintUnits.slug, slug),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "unit not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[api/blueprint/units/[slug]] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
