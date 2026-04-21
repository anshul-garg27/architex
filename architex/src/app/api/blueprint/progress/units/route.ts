/**
 * GET /api/blueprint/progress/units
 *
 * Returns per-unit progress for the current user across all published
 * units in the course. Units the user hasn't touched are returned with
 * a derived `state` of "available" (if prereqs met) or "locked"
 * (if prereqs missing). The client is trusted to render state-based
 * styling consistently.
 *
 * Response:
 *   { rows: Array<{
 *       unitSlug, ordinal, state,
 *       completedSectionCount, totalSections,
 *       completedAt, masteredAt, lastSeenAt
 *     }> }
 *
 * Auth required.
 */

import { NextResponse } from "next/server";
import { and, eq, isNotNull, asc } from "drizzle-orm";
import {
  getDb,
  blueprintCourses,
  blueprintUnits,
  blueprintUserProgress,
  type BlueprintUnitState,
} from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const COURSE_SLUG = "blueprint-core";

interface UnitRow {
  unitSlug: string;
  ordinal: number;
  state: BlueprintUnitState;
  completedSectionCount: number;
  totalSections: number;
  completedAt: string | null;
  masteredAt: string | null;
  lastSeenAt: string | null;
}

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();

    const course = await db
      .select()
      .from(blueprintCourses)
      .where(eq(blueprintCourses.slug, COURSE_SLUG))
      .limit(1);
    if (course.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    const units = await db
      .select({
        id: blueprintUnits.id,
        slug: blueprintUnits.slug,
        ordinal: blueprintUnits.ordinal,
        prereqUnitSlugs: blueprintUnits.prereqUnitSlugs,
        recipeJson: blueprintUnits.recipeJson,
      })
      .from(blueprintUnits)
      .where(
        and(
          eq(blueprintUnits.courseId, course[0].id),
          isNotNull(blueprintUnits.publishedAt),
        ),
      )
      .orderBy(asc(blueprintUnits.ordinal));

    const userProgress = await db
      .select({
        unitId: blueprintUserProgress.unitId,
        state: blueprintUserProgress.state,
        sectionStates: blueprintUserProgress.sectionStates,
        completedAt: blueprintUserProgress.completedAt,
        masteredAt: blueprintUserProgress.masteredAt,
        updatedAt: blueprintUserProgress.updatedAt,
      })
      .from(blueprintUserProgress)
      .where(eq(blueprintUserProgress.userId, userId));

    const progressByUnitId = new Map(userProgress.map((p) => [p.unitId, p]));

    const completedSlugs = new Set(
      units
        .filter((u) => {
          const p = progressByUnitId.get(u.id);
          return p?.state === "completed" || p?.state === "mastered";
        })
        .map((u) => u.slug),
    );

    const rows: UnitRow[] = units.map((u) => {
      const progress = progressByUnitId.get(u.id);
      const totalSections = u.recipeJson?.sections?.length ?? 0;
      const completedSectionCount = progress?.sectionStates
        ? Object.values(progress.sectionStates).filter(
            (s) => s?.completedAt != null,
          ).length
        : 0;

      let state: BlueprintUnitState;
      if (progress) {
        state = progress.state;
      } else {
        const prereqsMet = u.prereqUnitSlugs.every((slug) =>
          completedSlugs.has(slug),
        );
        state = prereqsMet ? "available" : "locked";
      }

      return {
        unitSlug: u.slug,
        ordinal: u.ordinal,
        state,
        completedSectionCount,
        totalSections,
        completedAt: progress?.completedAt
          ? progress.completedAt.toISOString()
          : null,
        masteredAt: progress?.masteredAt
          ? progress.masteredAt.toISOString()
          : null,
        lastSeenAt: progress?.updatedAt
          ? progress.updatedAt.toISOString()
          : null,
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/blueprint/progress/units] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
