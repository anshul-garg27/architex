/**
 * POST /api/lld/drill-attempts/[id]/grade
 *
 * Grades and submits the drill. Idempotent: once submitted_at is set,
 * returns the stored rubric and does NOT re-grade.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDrillAttempts, lldDrillInterviewerTurns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { gradeDrillAttempt } from "@/lib/lld/grading-engine-v2";
import type { DrillStage } from "@/lib/lld/drill-stages";
import type { DrillVariant } from "@/lib/lld/drill-variants";
import { variantConfigFor } from "@/lib/lld/drill-variants";
import {
  bandForScore,
  computeWeightedScore,
  type RubricBreakdown,
} from "@/lib/lld/drill-rubric";

export async function POST(
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
      walkthroughText?: string;
      selfGrade?: number;
    };

    const db = getDb();
    const [attempt] = await db
      .select()
      .from(lldDrillAttempts)
      .where(
        and(
          eq(lldDrillAttempts.id, id),
          eq(lldDrillAttempts.userId, userId),
        ),
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Idempotency: if already submitted, return stored.
    if (attempt.submittedAt) {
      return NextResponse.json({
        alreadyGraded: true,
        rubric: attempt.rubricBreakdown,
        finalScore: attempt.gradeScore,
        band: bandForScore((attempt.gradeScore as number) ?? 0).key,
      });
    }

    if (attempt.abandonedAt) {
      return NextResponse.json(
        { error: "Cannot grade an abandoned drill" },
        { status: 409 },
      );
    }

    // Shape inputs for the grader.
    const stages =
      (attempt.stages as Record<
        string,
        { durationMs?: number; progress?: unknown }
      >) ?? {};
    const stageDurationsMs: Record<DrillStage, number> = {
      clarify: stages.clarify?.durationMs ?? 0,
      rubric: stages.rubric?.durationMs ?? 0,
      canvas: stages.canvas?.durationMs ?? 0,
      walkthrough: stages.walkthrough?.durationMs ?? 0,
      reflection: stages.reflection?.durationMs ?? 0,
    };

    // Load interviewer turns for qualitative axes.
    const turns = await db
      .select({
        role: lldDrillInterviewerTurns.role,
        stage: lldDrillInterviewerTurns.stage,
        content: lldDrillInterviewerTurns.content,
      })
      .from(lldDrillInterviewerTurns)
      .where(eq(lldDrillInterviewerTurns.attemptId, id));

    const gradeInput = {
      problemId: attempt.problemId,
      canvasState:
        (attempt.canvasState as {
          nodes: Array<{ id: string; data?: unknown }>;
          edges: unknown[];
        }) ?? { nodes: [], edges: [] },
      interviewerTurns: turns.map((t) => ({
        role: t.role as "user" | "interviewer" | "system",
        stage: t.stage as DrillStage,
        content: t.content,
      })),
      walkthroughText: body.walkthroughText ?? "",
      selfGrade: body.selfGrade ?? 3,
      stageDurationsMs,
    };

    const result = await gradeDrillAttempt(gradeInput, {
      mode: "ai-preferred",
    });

    // Apply hint penalty.
    const hintLog =
      (attempt.hintLog as Array<{ penalty: number }>) ?? [];
    const hintPenalty = hintLog.reduce((acc, h) => acc + (h.penalty ?? 0), 0);
    const variant = attempt.variant as DrillVariant;
    const cfg = variantConfigFor(variant);
    const effectivePenalty = cfg.affectsFSRS ? hintPenalty : 0;

    const rawWeighted = computeWeightedScore(result.rubric);
    const finalScore = Math.max(0, rawWeighted - effectivePenalty);
    const band = bandForScore(finalScore).key;

    const now = new Date();
    await db
      .update(lldDrillAttempts)
      .set({
        submittedAt: now,
        lastActivityAt: now,
        gradeScore: finalScore,
        gradeBreakdown: {
          ...(result.rubric as unknown as Record<string, unknown>),
          hintPenalty: effectivePenalty,
        } as RubricBreakdown & { hintPenalty: number },
        rubricBreakdown: result.rubric,
      })
      .where(eq(lldDrillAttempts.id, id));

    return NextResponse.json({
      rubric: result.rubric,
      finalScore,
      hintPenalty: effectivePenalty,
      band,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id/grade] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
