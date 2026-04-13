/**
 * Review API — record spaced-repetition reviews and fetch due items.
 *
 * POST /api/review              — record a review, update FSRS state
 * GET  /api/review?moduleId=lld — fetch items due for review (nextReviewAt <= now)
 *
 * Auth required for all operations.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { getDb, progress } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import {
  scheduleFSRS,
  type FSRSCard,
  type Rating,
  FSRSState,
  Rating as RatingEnum,
} from "@/lib/fsrs";

/** GET /api/review — list items due for review. */
export async function GET(request: NextRequest) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json(
        { error: '"moduleId" query param is required.' },
        { status: 400 },
      );
    }

    const now = new Date();
    const rows = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.moduleId, moduleId),
          isNotNull(progress.nextReviewAt),
          lte(progress.nextReviewAt, now),
        ),
      );

    return NextResponse.json({ items: rows, count: rows.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/review] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/review — record a review and update FSRS state. */
export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const db = getDb();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: {
      moduleId?: string;
      conceptId?: string;
      rating?: number;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { moduleId, conceptId, rating } = body;

    if (!moduleId || !conceptId) {
      return NextResponse.json(
        { error: '"moduleId" and "conceptId" are required.' },
        { status: 400 },
      );
    }

    if (!rating || rating < RatingEnum.Again || rating > RatingEnum.Easy) {
      return NextResponse.json(
        { error: '"rating" must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).' },
        { status: 400 },
      );
    }

    // Fetch existing progress row (if any)
    const [existing] = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.moduleId, moduleId),
          eq(progress.conceptId, conceptId),
        ),
      )
      .limit(1);

    // Build FSRSCard from existing row, or null for new
    const card: FSRSCard | null = existing?.fsrsState != null
      ? {
          stability: existing.stability ?? 0,
          difficulty: existing.difficulty ?? 0,
          elapsedDays: existing.elapsedDays ?? 0,
          scheduledDays: existing.scheduledDays ?? 0,
          reps: existing.reps ?? 0,
          lapses: existing.lapses ?? 0,
          fsrsState: existing.fsrsState as FSRSCard["fsrsState"],
          lastReviewAt: existing.updatedAt,
        }
      : null;

    const result = scheduleFSRS(card, rating as Rating);

    // Derive a mastery score from retrievability (0–1)
    const score = result.fsrsState === FSRSState.Review
      ? Math.min(1, result.stability / 30) // normalize: 30-day stability = 1.0
      : Math.max(0, (result.reps - result.lapses) / Math.max(1, result.reps));

    const [upserted] = await db
      .insert(progress)
      .values({
        userId,
        moduleId,
        conceptId,
        score,
        stability: result.stability,
        difficulty: result.difficulty,
        elapsedDays: result.elapsedDays,
        scheduledDays: result.scheduledDays,
        reps: result.reps,
        lapses: result.lapses,
        fsrsState: result.fsrsState,
        nextReviewAt: result.nextReviewAt,
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.moduleId, progress.conceptId],
        set: {
          score,
          stability: result.stability,
          difficulty: result.difficulty,
          elapsedDays: result.elapsedDays,
          scheduledDays: result.scheduledDays,
          reps: result.reps,
          lapses: result.lapses,
          fsrsState: result.fsrsState,
          nextReviewAt: result.nextReviewAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ progress: upserted }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/review] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
