/**
 * POST /api/lld/drill-attempts/[id]/postmortem
 *
 * Generates the AI postmortem and stores it in the `postmortem` column.
 * Idempotent.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDrillAttempts } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import {
  buildPostmortemPrompt,
  parsePostmortemResponse,
  PostmortemParseError,
  type PostmortemInput,
  type PostmortemOutput,
} from "@/lib/ai/postmortem-generator";
import type { DrillStage } from "@/lib/lld/drill-stages";
import type { DrillVariant } from "@/lib/lld/drill-variants";
import { getCanonicalFor } from "@/lib/lld/drill-canonical";
import type { RubricBreakdown } from "@/lib/lld/drill-rubric";
import type { InterviewerPersona } from "@/lib/ai/interviewer-prompts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const db = getDb();
    const [attempt] = await db
      .select()
      .from(lldDrillAttempts)
      .where(
        and(eq(lldDrillAttempts.id, id), eq(lldDrillAttempts.userId, userId)),
      )
      .limit(1);

    if (!attempt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!attempt.submittedAt) {
      return NextResponse.json(
        {
          error: "Can only generate postmortem after drill is submitted",
        },
        { status: 409 },
      );
    }

    // Idempotent return.
    if (attempt.postmortem) {
      return NextResponse.json({ postmortem: attempt.postmortem, cached: true });
    }

    const rubric = attempt.rubricBreakdown as RubricBreakdown;
    if (!rubric) {
      return NextResponse.json(
        { error: "Attempt has no rubric breakdown — regrade first" },
        { status: 409 },
      );
    }

    const stages =
      (attempt.stages as Record<string, { durationMs?: number }>) ?? {};

    const canvasNodes =
      (attempt.canvasState as { nodes?: unknown[] } | null)?.nodes?.length ?? 0;
    const canvasEdges =
      (attempt.canvasState as { edges?: unknown[] } | null)?.edges?.length ?? 0;

    const canonical = getCanonicalFor(attempt.problemId);

    const input: PostmortemInput = {
      problemId: attempt.problemId,
      problemTitle: attempt.problemId,
      variant: attempt.variant as DrillVariant,
      persona:
        (attempt.gradeBreakdown as { persona?: InterviewerPersona })?.persona ??
        "generic",
      rubric,
      finalScore: (attempt.gradeScore as number) ?? 0,
      stageDurationsMs: {
        clarify: stages.clarify?.durationMs ?? 0,
        rubric: stages.rubric?.durationMs ?? 0,
        canvas: stages.canvas?.durationMs ?? 0,
        walkthrough: stages.walkthrough?.durationMs ?? 0,
        reflection: stages.reflection?.durationMs ?? 0,
      } as Record<DrillStage, number>,
      canvasSummary: `${canvasNodes} classes, ${canvasEdges} edges`,
      canonical: canonical
        ? {
            patternsExpected: canonical.patterns,
            keyTradeoffs: canonical.keyTradeoffs,
          }
        : null,
    };

    const req = buildPostmortemPrompt(input);

    // Call Claude via the existing singleton.
    const { ClaudeClient } = await import("@/lib/ai/claude-client");
    const client = ClaudeClient.getInstance();

    let postmortem: PostmortemOutput;
    try {
      if (!client.isConfigured()) {
        throw new PostmortemParseError("Claude API not configured");
      }
      const response = await client.call({
        model: req.model,
        systemPrompt: req.system,
        userMessage: req.user,
        maxTokens: req.maxTokens,
        cacheKey: `postmortem:${id}`,
        cacheTtlMs: 24 * 60 * 60 * 1000,
      });
      postmortem = parsePostmortemResponse(response.text);
    } catch (err) {
      if (
        err instanceof PostmortemParseError ||
        (err instanceof Error && /not configured/i.test(err.message))
      ) {
        // Fallback: minimal rubric-derived postmortem.
        postmortem = {
          tldr: `Final score ${input.finalScore}. AI postmortem unavailable.`,
          strengths: Object.entries(rubric)
            .filter(([, r]) => r.score >= 75)
            .map(([axis]) => `${axis} was strong`)
            .slice(0, 3),
          gaps: Object.entries(rubric)
            .filter(([, r]) => r.score < 60)
            .map(([axis]) => `${axis} needs work`)
            .slice(0, 3),
          patternCommentary:
            "Postmortem narrative not available without API. See per-axis scores.",
          tradeoffAnalysis:
            "Postmortem narrative not available without API.",
          canonicalDiff: canonical
            ? [`Expected patterns: ${canonical.patterns.join(", ")}`]
            : [],
          followUps: ["Retry this problem", "Review the rubric"],
        };
      } else {
        throw err;
      }
    }

    await db
      .update(lldDrillAttempts)
      .set({ postmortem: postmortem as unknown as Record<string, unknown> })
      .where(eq(lldDrillAttempts.id, id));

    return NextResponse.json({ postmortem });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/drill-attempts/:id/postmortem] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
