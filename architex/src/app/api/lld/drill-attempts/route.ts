/**
 * POST /api/lld/drill-attempts     — start a new drill (409 if one active)
 * GET  /api/lld/drill-attempts     — list history (?status=completed)
 */

import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

// Phase 1 accepted { interview, guided, speed }. Phase 4 expanded to
// { exam, timed-mock, study } (see lld-drill-attempts schema). Accept both
// and normalise Phase-1 names to their Phase-4 equivalents so old clients
// keep working during the transition.
const PHASE4_VARIANTS = new Set(["exam", "timed-mock", "study"]);
const PHASE1_TO_PHASE4: Record<string, string> = {
  interview: "timed-mock",
  guided: "study",
  speed: "exam",
};
const LEGACY_MODES = new Set(Object.keys(PHASE1_TO_PHASE4));

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      problemId?: string;
      drillMode?: string;
      variant?: string;
      durationLimitMs?: number;
    };

    const { problemId, durationLimitMs } = body;
    // `variant` is the Phase-4 field; `drillMode` is the Phase-1 alias.
    const rawVariant = body.variant ?? body.drillMode;
    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json(
        { error: "problemId required" },
        { status: 400 },
      );
    }
    if (!rawVariant || typeof rawVariant !== "string") {
      return NextResponse.json(
        { error: "variant (or legacy drillMode) required" },
        { status: 400 },
      );
    }
    const variant = LEGACY_MODES.has(rawVariant)
      ? PHASE1_TO_PHASE4[rawVariant]
      : rawVariant;
    if (!PHASE4_VARIANTS.has(variant)) {
      return NextResponse.json(
        {
          error: `variant must be one of: ${Array.from(PHASE4_VARIANTS).join(", ")}`,
        },
        { status: 400 },
      );
    }
    if (typeof durationLimitMs !== "number" || durationLimitMs < 60_000) {
      return NextResponse.json(
        { error: "durationLimitMs must be a number >= 60000" },
        { status: 400 },
      );
    }

    const db = getDb();

    try {
      const [created] = await db
        .insert(lldDrillAttempts)
        .values({
          userId,
          problemId,
          drillMode: variant,
          variant: variant as "exam" | "timed-mock" | "study",
          durationLimitMs,
        })
        .returning();
      return NextResponse.json({ attempt: created }, { status: 201 });
    } catch (error) {
      // Postgres unique violation (SQLSTATE 23505) against either the
      // partial `one_active_drill_per_user` index or any nested duplicate.
      // Match broadly — drizzle/pg may wrap the error so the literal index
      // name isn't always in `error.message`.
      const err = error as {
        code?: string;
        message?: string;
        constraint?: string;
        cause?: { code?: string; constraint?: string };
      };
      const code = err.code ?? err.cause?.code;
      const constraint = err.constraint ?? err.cause?.constraint ?? "";
      const msg = err.message ?? "";
      if (
        code === "23505" ||
        constraint.includes("one_active_drill_per_user") ||
        msg.includes("one_active_drill_per_user") ||
        msg.toLowerCase().includes("duplicate key value")
      ) {
        return NextResponse.json(
          {
            error: "A drill is already active. Submit or abandon it first.",
            code: "ACTIVE_DRILL_EXISTS",
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const db = getDb();
    const baseWhere = eq(lldDrillAttempts.userId, userId);

    const where =
      status === "completed"
        ? and(baseWhere, isNotNull(lldDrillAttempts.submittedAt))
        : status === "abandoned"
          ? and(baseWhere, isNotNull(lldDrillAttempts.abandonedAt))
          : baseWhere;

    const rows = await db
      .select()
      .from(lldDrillAttempts)
      .where(where)
      .orderBy(desc(lldDrillAttempts.startedAt))
      .limit(100);

    return NextResponse.json({ attempts: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
