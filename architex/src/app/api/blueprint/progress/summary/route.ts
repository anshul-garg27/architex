/**
 * GET /api/blueprint/progress/summary
 *
 * User's aggregate progress across all units, plus streak + current
 * position. Used by the progress dashboard and the resume card.
 */

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import {
  getDb,
  blueprintJourneyState,
  blueprintUserProgress,
} from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();

    const stateRows = await db
      .select()
      .from(blueprintJourneyState)
      .where(eq(blueprintJourneyState.userId, userId))
      .limit(1);
    const state = stateRows[0];

    const countsRows = await db
      .select({
        completed: sql<number>`count(*) filter (where ${blueprintUserProgress.state} in ('completed','mastered'))::int`,
        mastered: sql<number>`count(*) filter (where ${blueprintUserProgress.state} = 'mastered')::int`,
        inProgress: sql<number>`count(*) filter (where ${blueprintUserProgress.state} = 'in_progress')::int`,
        totalTimeMs: sql<number>`coalesce(sum(${blueprintUserProgress.totalTimeMs}), 0)::bigint::int`,
      })
      .from(blueprintUserProgress)
      .where(eq(blueprintUserProgress.userId, userId));
    const counts = countsRows[0];

    return NextResponse.json({
      streakDays: state?.streakDays ?? 0,
      currentUnitSlug: state?.currentUnitSlug ?? null,
      currentSectionId: state?.currentSectionId ?? null,
      unitsCompleted: counts?.completed ?? 0,
      unitsMastered: counts?.mastered ?? 0,
      unitsInProgress: counts?.inProgress ?? 0,
      totalTimeMs: counts?.totalTimeMs ?? 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
     
    console.error("[api/blueprint/progress/summary] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
