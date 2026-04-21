/**
 * POST /api/lld/drill-attempts/[id]/hint
 *
 * Body: { tier: HintTier, stage: DrillStage }
 *
 * Generates and records a hint. Returns the hint content + updated
 * hint log + new penalty total.
 */

import { NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { variantConfigFor, type DrillVariant } from "@/lib/lld/drill-variants";
import type { DrillStage } from "@/lib/lld/drill-stages";
import {
  TIER_CREDIT_COST,
  TIER_ORDER,
  generateHint,
  type HintTier,
} from "@/lib/ai/hint-system";

interface StoredHintLogEntry {
  tier: HintTier;
  stage: DrillStage;
  penalty: number;
  usedAt: number;
  content?: string;
}

// Map engine credit cost to drill "penalty" points. Penalties are
// subtracted from the final score and capped by variantConfig.
const TIER_PENALTY_POINTS: Record<HintTier, number> = {
  nudge: 3,
  guided: 10,
  "full-explanation": 20,
};

const TIER_SET = new Set<HintTier>(TIER_ORDER);

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
      tier?: unknown;
      stage?: unknown;
    };

    if (!TIER_SET.has(body.tier as HintTier)) {
      return NextResponse.json(
        {
          error: `tier must be one of ${Array.from(TIER_SET).join(", ")}`,
        },
        { status: 400 },
      );
    }
    const tier = body.tier as HintTier;
    const stage = (body.stage ?? "canvas") as DrillStage;

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

    const variant = attempt.variant as DrillVariant;
    const cfg = variantConfigFor(variant);
    if (!cfg.hintsAllowed) {
      return NextResponse.json(
        { error: "Hints are not allowed in this variant", code: "EXAM_MODE" },
        { status: 403 },
      );
    }

    // Ladder order check (scoped to current stage).
    const hintLog = (attempt.hintLog as StoredHintLogEntry[]) ?? [];
    const stageLog = hintLog.filter((h) => h.stage === stage);
    const highestIdx = stageLog.reduce(
      (max, h) => Math.max(max, TIER_ORDER.indexOf(h.tier)),
      -1,
    );
    if (TIER_ORDER.indexOf(tier) !== highestIdx + 1) {
      return NextResponse.json(
        {
          error: "Tier ladder violation — must consume tiers in order",
          code: "TIER_LADDER",
        },
        { status: 409 },
      );
    }

    // Budget check.
    const penalty = variant === "study" ? 0 : TIER_PENALTY_POINTS[tier];
    if (cfg.maxHintPenalty !== null) {
      const total = hintLog.reduce((acc, h) => acc + h.penalty, 0);
      if (total + penalty > cfg.maxHintPenalty) {
        return NextResponse.json(
          { error: "Hint budget exhausted", code: "BUDGET_EXHAUSTED" },
          { status: 409 },
        );
      }
    }

    // Generate the hint content via existing engine.
    const hint = generateHint(
      {
        id: attempt.problemId,
        title: attempt.problemId,
      },
      JSON.stringify(attempt.canvasState ?? {}),
      tier,
    );

    const newEntry: StoredHintLogEntry = {
      tier,
      stage,
      penalty,
      usedAt: Date.now(),
      content: hint.content,
    };

    // Append atomically via jsonb concatenation.
    await db
      .update(lldDrillAttempts)
      .set({
        hintLog: sql`
          COALESCE(${lldDrillAttempts.hintLog}, '[]'::jsonb) || ${JSON.stringify([newEntry])}::jsonb
        `,
        lastActivityAt: new Date(),
      })
      .where(eq(lldDrillAttempts.id, id));

    return NextResponse.json({
      content: hint.content,
      followUp: hint.followUp,
      tier,
      penalty,
      creditCost: TIER_CREDIT_COST[tier],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id/hint] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
