/**
 * GET  /api/blueprint/journey-state
 *   → returns the user's journey state (lazy-creates an empty row on first hit)
 *
 * PATCH /api/blueprint/journey-state
 *   body: subset of
 *     { preferredLang, dailyReviewTarget, pinnedTool,
 *       welcomeDismissedAt, currentUnitSlug, currentSectionId }
 *   → upserts the row with provided fields
 *
 * Authentication: required (Clerk). Anonymous users get 401 — their journey
 * state lives in localStorage via the store's persist middleware until they
 * sign in.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, blueprintJourneyState } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

type PatchBody = {
  preferredLang?: "ts" | "py" | "java";
  dailyReviewTarget?: number;
  pinnedTool?: "patterns" | "problems" | "review" | null;
  welcomeDismissedAt?: string | null;
  currentUnitSlug?: string | null;
  currentSectionId?: string | null;
};

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(blueprintJourneyState)
      .where(eq(blueprintJourneyState.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      await db
        .insert(blueprintJourneyState)
        .values({ userId })
        .onConflictDoNothing();
      return NextResponse.json({
        preferredLang: "ts",
        dailyReviewTarget: 10,
        streakDays: 0,
        pinnedTool: null,
        welcomeDismissedAt: null,
        currentUnitSlug: null,
        currentSectionId: null,
      });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
     
    console.error("[api/blueprint/journey-state] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json()) as PatchBody;
    const patch: Record<string, unknown> = {};
    if (body.preferredLang !== undefined) patch.preferredLang = body.preferredLang;
    if (body.dailyReviewTarget !== undefined)
      patch.dailyReviewTarget = body.dailyReviewTarget;
    if (body.pinnedTool !== undefined) patch.pinnedTool = body.pinnedTool;
    if (body.welcomeDismissedAt !== undefined) {
      patch.welcomeDismissedAt = body.welcomeDismissedAt
        ? new Date(body.welcomeDismissedAt)
        : null;
    }
    if (body.currentUnitSlug !== undefined)
      patch.currentUnitSlug = body.currentUnitSlug;
    if (body.currentSectionId !== undefined)
      patch.currentSectionId = body.currentSectionId;

    const db = getDb();
    await db
      .insert(blueprintJourneyState)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: blueprintJourneyState.userId,
        set: patch,
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
     
    console.error("[api/blueprint/journey-state] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
