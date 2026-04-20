/**
 * POST /api/lld/drill-attempts     — start a new drill (409 if one active)
 * GET  /api/lld/drill-attempts     — list history (?status=completed)
 */

import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_MODES = new Set(["interview", "guided", "speed"]);

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
      durationLimitMs?: number;
    };

    const { problemId, drillMode, durationLimitMs } = body;
    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json(
        { error: "problemId required" },
        { status: 400 },
      );
    }
    if (!drillMode || !VALID_MODES.has(drillMode)) {
      return NextResponse.json(
        {
          error: `drillMode must be one of: ${Array.from(VALID_MODES).join(
            ", ",
          )}`,
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
          drillMode,
          durationLimitMs,
        })
        .returning();
      return NextResponse.json({ attempt: created }, { status: 201 });
    } catch (error) {
      // Partial unique index violation = user already has an active drill.
      if (
        error instanceof Error &&
        error.message.includes("one_active_drill_per_user")
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
