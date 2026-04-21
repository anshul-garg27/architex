/**
 * POST /api/lld/drill-attempts/[id]/resume
 *
 * Clears paused_at on an active drill + returns full state for client
 * rehydration (stages, current stage, canvas, interviewer turns,
 * hint log). Used when the user reloads the tab mid-drill.
 */

import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import {
  getDb,
  lldDrillAttempts,
  lldDrillInterviewerTurns,
} from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const db = getDb();
    const [attempt] = await db
      .select()
      .from(lldDrillAttempts)
      .where(
        and(
          eq(lldDrillAttempts.id, id),
          eq(lldDrillAttempts.userId, userId),
          isNull(lldDrillAttempts.submittedAt),
          isNull(lldDrillAttempts.abandonedAt),
        ),
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json(
        {
          error: "Drill is not active (submitted, abandoned, or not found)",
          code: "DRILL_NOT_ACTIVE",
        },
        { status: 404 },
      );
    }

    const now = new Date();
    const wasPaused = attempt.pausedAt !== null;
    const pausedMs = wasPaused
      ? now.getTime() - new Date(attempt.pausedAt!).getTime()
      : 0;

    await db
      .update(lldDrillAttempts)
      .set({
        pausedAt: null,
        lastActivityAt: now,
        // Extend startedStageAt so timing accounting ignores pause duration.
        startedStageAt: new Date(
          new Date(attempt.startedStageAt).getTime() + pausedMs,
        ),
      })
      .where(eq(lldDrillAttempts.id, id));

    const turns = await db
      .select()
      .from(lldDrillInterviewerTurns)
      .where(eq(lldDrillInterviewerTurns.attemptId, id))
      .orderBy(asc(lldDrillInterviewerTurns.seq));

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        problemId: attempt.problemId,
        variant: attempt.variant,
        currentStage: attempt.currentStage,
        stages: attempt.stages,
        canvasState: attempt.canvasState,
        hintLog: attempt.hintLog,
        durationLimitMs: attempt.durationLimitMs,
        elapsedBeforePauseMs: attempt.elapsedBeforePauseMs,
      },
      turns,
      resumedAt: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id/resume] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
