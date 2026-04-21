/**
 * GET  /api/blueprint/units/[slug]/progress
 *   → returns the user's progress for a unit; lazy-creates an empty row
 *     on first hit
 *
 * PATCH /api/blueprint/units/[slug]/progress
 *   body: subset of
 *     { state, sectionStates, lastPosition, totalTimeMs,
 *       completedAt, masteredAt }
 *   → upsert-merges into the row
 *
 * Auth required.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import {
  getDb,
  blueprintCourses,
  blueprintUnits,
  blueprintUserProgress,
} from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import type {
  BlueprintUnitState,
  BlueprintSectionStatesMap,
} from "@/db/schema";

const COURSE_SLUG = "blueprint-core";

async function findUnitId(slug: string): Promise<string | null> {
  const db = getDb();
  const course = await db
    .select()
    .from(blueprintCourses)
    .where(eq(blueprintCourses.slug, COURSE_SLUG))
    .limit(1);
  if (course.length === 0) return null;

  const rows = await db
    .select({ id: blueprintUnits.id })
    .from(blueprintUnits)
    .where(
      and(
        eq(blueprintUnits.courseId, course[0].id),
        eq(blueprintUnits.slug, slug),
      ),
    )
    .limit(1);

  return rows[0]?.id ?? null;
}

type PatchBody = {
  state?: BlueprintUnitState;
  sectionStates?: BlueprintSectionStatesMap;
  lastPosition?: string | null;
  totalTimeMs?: number;
  completedAt?: string | null;
  masteredAt?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { slug } = await params;
    const unitId = await findUnitId(slug);
    if (!unitId) {
      return NextResponse.json(
        { error: "unit not found" },
        { status: 404 },
      );
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(blueprintUserProgress)
      .where(
        and(
          eq(blueprintUserProgress.userId, userId),
          eq(blueprintUserProgress.unitId, unitId),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        unitSlug: slug,
        state: "available" as BlueprintUnitState,
        sectionStates: {},
        totalTimeMs: 0,
        lastPosition: null,
        completedAt: null,
        masteredAt: null,
      });
    }

    return NextResponse.json({ ...rows[0], unitSlug: slug });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(
      "[api/blueprint/units/[slug]/progress] GET error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { slug } = await params;
    const unitId = await findUnitId(slug);
    if (!unitId) {
      return NextResponse.json(
        { error: "unit not found" },
        { status: 404 },
      );
    }

    const body = (await req.json()) as PatchBody;
    const patch: Record<string, unknown> = {};
    if (body.state !== undefined) patch.state = body.state;
    if (body.sectionStates !== undefined) patch.sectionStates = body.sectionStates;
    if (body.lastPosition !== undefined) patch.lastPosition = body.lastPosition;
    if (body.totalTimeMs !== undefined) patch.totalTimeMs = body.totalTimeMs;
    if (body.completedAt !== undefined) {
      patch.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    }
    if (body.masteredAt !== undefined) {
      patch.masteredAt = body.masteredAt ? new Date(body.masteredAt) : null;
    }

    const db = getDb();
    await db
      .insert(blueprintUserProgress)
      .values({ userId, unitId, ...patch })
      .onConflictDoUpdate({
        target: [
          blueprintUserProgress.userId,
          blueprintUserProgress.unitId,
        ],
        set: patch,
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(
      "[api/blueprint/units/[slug]/progress] PATCH error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
