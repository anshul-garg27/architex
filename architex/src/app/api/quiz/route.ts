/**
 * Quiz API — fetch quiz questions by module and type.
 *
 * GET /api/quiz?module=lld&type=scenario
 * GET /api/quiz?module=lld&type=solid
 * GET /api/quiz?module=lld&type=pattern-comparison
 *
 * Public, ISR cached. Returns questions with shuffled order.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { getDb, quizQuestions } from "@/db";

const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const moduleId = searchParams.get("module");
    const quizType = searchParams.get("type");

    if (!moduleId || !quizType) {
      return NextResponse.json(
        { error: 'Both "module" and "type" query params are required.' },
        { status: 400 },
      );
    }

    const db = getDb();

    const rows = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.moduleId, moduleId),
          eq(quizQuestions.quizType, quizType),
        ),
      )
      .orderBy(asc(quizQuestions.sortOrder));

    return NextResponse.json(
      { questions: rows, count: rows.length },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[api/quiz] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
