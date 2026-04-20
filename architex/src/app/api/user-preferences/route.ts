/**
 * GET /api/user-preferences — fetch the current user's preferences blob.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, userPreferences } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return NextResponse.json({
      preferences: row?.preferences ?? {},
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/user-preferences] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
