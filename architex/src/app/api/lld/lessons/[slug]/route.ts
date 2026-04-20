/**
 * GET /api/lld/lessons/[slug]
 *
 * Returns { payload } for the lesson, or { payload: null } if missing.
 * Reads from module_content where moduleId="lld", contentType="lesson".
 */

import { NextResponse } from "next/server";
import { loadLesson } from "@/lib/lld/lesson-loader";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const result = await loadLesson(slug);
  if (!result.ok) {
    if (result.reason === "missing") {
      return NextResponse.json({ payload: null });
    }
    console.error(
      `[api/lld/lessons/${slug}] ${result.reason}: ${result.message}`,
    );
    return NextResponse.json(
      { payload: null, reason: result.reason, message: result.message },
      { status: result.reason === "corrupt" ? 500 : 200 },
    );
  }
  return NextResponse.json({ payload: result.payload });
}
