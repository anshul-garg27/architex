/**
 * GET /api/lld/drill-attempts/active
 *
 * Returns the user's currently active drill, or null.
 * Auto-abandons drills that have been idle > 30 minutes.
 */

import { NextResponse } from "next/server";
import { and, eq, isNull, lt } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const STALE_THRESHOLD_MS = 30 * 60 * 1000;

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();

    // Auto-abandon stale drills in a single UPDATE.
    const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    const abandoned = await db
      .update(lldDrillAttempts)
      .set({ abandonedAt: new Date() })
      .where(
        and(
          eq(lldDrillAttempts.userId, userId),
          isNull(lldDrillAttempts.submittedAt),
          isNull(lldDrillAttempts.abandonedAt),
          lt(lldDrillAttempts.lastActivityAt, staleCutoff),
        ),
      )
      .returning({
        id: lldDrillAttempts.id,
        lastActivityAt: lldDrillAttempts.lastActivityAt,
      });

    for (const row of abandoned) {
      const staleMs = Date.now() - row.lastActivityAt.getTime();
      console.log(
        `[api/lld/drill-attempts/active] auto-abandoned stale drill id=${row.id} idleMs=${staleMs} (~${Math.round(staleMs / 60_000)}min) lastActivityAt=${row.lastActivityAt.toISOString()}`,
      );
    }

    // Fetch remaining active (if any).
    const [active] = await db
      .select()
      .from(lldDrillAttempts)
      .where(
        and(
          eq(lldDrillAttempts.userId, userId),
          isNull(lldDrillAttempts.submittedAt),
          isNull(lldDrillAttempts.abandonedAt),
        ),
      )
      .limit(1);

    return NextResponse.json({ active: active ?? null });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/active] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
