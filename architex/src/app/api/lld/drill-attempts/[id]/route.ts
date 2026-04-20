/**
 * PATCH /api/lld/drill-attempts/[id]
 *
 * action: "heartbeat" | "pause" | "resume" | "submit" | "abandon"
 *
 * Updates lifecycle timestamps + optional canvasState / gradeScore.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_ACTIONS = new Set([
  "heartbeat",
  "pause",
  "resume",
  "submit",
  "abandon",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      canvasState?: unknown;
      gradeScore?: number;
      gradeBreakdown?: unknown;
      elapsedBeforePauseMs?: number;
    };

    const action = body.action;
    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        {
          error: `action must be one of: ${Array.from(VALID_ACTIONS).join(
            ", ",
          )}`,
        },
        { status: 400 },
      );
    }

    const db = getDb();
    const now = new Date();

    const updates: Record<string, unknown> = { lastActivityAt: now };

    switch (action) {
      case "heartbeat":
        break; // only lastActivityAt
      case "pause":
        updates.pausedAt = now;
        if (typeof body.elapsedBeforePauseMs === "number") {
          updates.elapsedBeforePauseMs = body.elapsedBeforePauseMs;
        }
        break;
      case "resume":
        updates.pausedAt = null;
        break;
      case "submit":
        updates.submittedAt = now;
        if (typeof body.gradeScore === "number") {
          updates.gradeScore = body.gradeScore;
        }
        if (body.gradeBreakdown) {
          updates.gradeBreakdown = body.gradeBreakdown;
        }
        if (body.canvasState) {
          updates.canvasState = body.canvasState;
        }
        break;
      case "abandon":
        updates.abandonedAt = now;
        break;
    }

    if (body.canvasState && action !== "submit") {
      updates.canvasState = body.canvasState;
    }

    const [updated] = await db
      .update(lldDrillAttempts)
      .set(updates)
      .where(
        and(
          eq(lldDrillAttempts.id, id),
          eq(lldDrillAttempts.userId, userId), // scope to owner
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    return NextResponse.json({ attempt: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
