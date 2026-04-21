/**
 * PATCH /api/lld/drill-attempts/[id]/stage
 *
 * Body: { targetStage: DrillStage, progress: DrillStageProgress }
 *
 * Advances the drill to `targetStage` if:
 *   - targetStage == nextStage(current)
 *   - gate predicate on current stage is satisfied by `progress`
 *
 * Also supports retreat (targetStage == previousStage).
 */

import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import {
  STAGE_ORDER,
  canAdvance,
  nextStage,
  previousStage,
  type DrillStage,
  type DrillStageProgress,
} from "@/lib/lld/drill-stages";

const STAGE_SET = new Set<DrillStage>(STAGE_ORDER);

function isStage(v: unknown): v is DrillStage {
  return typeof v === "string" && STAGE_SET.has(v as DrillStage);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const body = (await request.json().catch(() => ({}))) as {
      targetStage?: unknown;
      progress?: DrillStageProgress;
    };

    if (!isStage(body.targetStage)) {
      return NextResponse.json(
        { error: "targetStage must be a valid DrillStage" },
        { status: 400 },
      );
    }

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
        { error: "Active drill not found" },
        { status: 404 },
      );
    }

    const current = attempt.currentStage as DrillStage;
    const target = body.targetStage;
    const progress = body.progress ?? {};

    // Determine direction.
    const isAdvance = target === nextStage(current);
    const isRetreat = target === previousStage(current);

    if (!isAdvance && !isRetreat) {
      return NextResponse.json(
        {
          error: `Cannot jump from ${current} to ${target}`,
          code: "INVALID_STAGE_TRANSITION",
        },
        { status: 400 },
      );
    }

    if (isAdvance && !canAdvance(current, progress)) {
      return NextResponse.json(
        {
          error: "Gate predicate failed — stage not complete",
          code: "GATE_UNSATISFIED",
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const spentMs =
      now.getTime() - new Date(attempt.startedStageAt).getTime();

    const existingStages =
      (attempt.stages as Record<
        string,
        { durationMs?: number; progress?: unknown }
      >) ?? {};
    const updatedStages = {
      ...existingStages,
      [current]: {
        ...(existingStages[current] ?? {}),
        durationMs: (existingStages[current]?.durationMs ?? 0) + spentMs,
        progress,
      },
    };

    await db
      .update(lldDrillAttempts)
      .set({
        currentStage: target,
        startedStageAt: now,
        lastActivityAt: now,
        stages: updatedStages,
      })
      .where(eq(lldDrillAttempts.id, id));

    return NextResponse.json({
      ok: true,
      currentStage: target,
      stages: updatedStages,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id/stage] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
