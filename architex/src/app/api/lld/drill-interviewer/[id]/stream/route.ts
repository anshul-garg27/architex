/**
 * Drill interviewer chat endpoint.
 *
 *   POST /api/lld/drill-interviewer/[id]/stream
 *     Body: { content: string, stage: DrillStage }
 *     Persists the user's turn + returns { ok: true, seq: number }.
 *
 *   GET  /api/lld/drill-interviewer/[id]/stream
 *     SSE stream of the interviewer's reply. Events:
 *       data: {"type":"delta","text":"..."}
 *       data: {"type":"done"}
 *       data: {"type":"error","error":"..."}
 */

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  getDb,
  lldDrillAttempts,
  lldDrillInterviewerTurns,
} from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import {
  buildInterviewerRequest,
  parseTurnHistory,
  type InterviewerTurn,
} from "@/lib/ai/interviewer-persona";
import type { DrillStage } from "@/lib/lld/drill-stages";
import type { InterviewerPersona } from "@/lib/ai/interviewer-prompts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const clerkId = await requireAuth();
  const userId = await resolveUserId(clerkId);
  if (!userId) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    stage?: string;
  };

  if (!body.content || typeof body.content !== "string") {
    return new Response(JSON.stringify({ error: "content required" }), {
      status: 400,
    });
  }

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
    return new Response(JSON.stringify({ error: "Active drill not found" }), {
      status: 404,
    });
  }

  const [prev] = await db
    .select({ seq: lldDrillInterviewerTurns.seq })
    .from(lldDrillInterviewerTurns)
    .where(eq(lldDrillInterviewerTurns.attemptId, id))
    .orderBy(desc(lldDrillInterviewerTurns.seq))
    .limit(1);

  const seq = (prev?.seq ?? -1) + 1;

  await db.insert(lldDrillInterviewerTurns).values({
    attemptId: id,
    role: "user",
    stage: (body.stage ?? attempt.currentStage) as DrillStage,
    persona: "generic",
    seq,
    content: body.content,
  });

  await db
    .update(lldDrillAttempts)
    .set({ lastActivityAt: new Date() })
    .where(eq(lldDrillAttempts.id, id));

  return new Response(JSON.stringify({ ok: true, seq }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const clerkId = await requireAuth();
  const userId = await resolveUserId(clerkId);
  if (!userId) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const { id } = await params;

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
    return new Response(JSON.stringify({ error: "Active drill not found" }), {
      status: 404,
    });
  }

  const turnRows = await db
    .select({
      role: lldDrillInterviewerTurns.role,
      stage: lldDrillInterviewerTurns.stage,
      content: lldDrillInterviewerTurns.content,
      seq: lldDrillInterviewerTurns.seq,
    })
    .from(lldDrillInterviewerTurns)
    .where(eq(lldDrillInterviewerTurns.attemptId, id))
    .orderBy(asc(lldDrillInterviewerTurns.seq));

  const history = parseTurnHistory(
    turnRows.map((r) => ({
      role: r.role as InterviewerTurn["role"],
      stage: r.stage as DrillStage,
      content: r.content,
      seq: r.seq,
    })),
  );

  const persona =
    ((attempt.gradeBreakdown as { persona?: InterviewerPersona })?.persona) ??
    "generic";

  let req;
  try {
    req = buildInterviewerRequest({
      persona,
      stage: attempt.currentStage as DrillStage,
      problemTitle: attempt.problemId,
      history,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Bad history",
      }),
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      try {
        const { ClaudeClient } = await import("@/lib/ai/claude-client");
        const client = ClaudeClient.getInstance();

        let fullReply = "";

        if (!client.isConfigured()) {
          // No API key: emit a helpful opener + done.
          fullReply =
            "(Interviewer persona requires the Anthropic API key to be configured in Settings > AI.)";
          send({ type: "delta", text: fullReply });
        } else {
          const response = await client.call({
            model: req.model,
            systemPrompt: req.system,
            userMessage: req.messages[req.messages.length - 1]!.content,
            maxTokens: req.maxTokens,
          });
          fullReply = response.text;
          send({ type: "delta", text: fullReply });
        }

        // Persist the interviewer's finished turn.
        const [lastSeq] = await db
          .select({ seq: lldDrillInterviewerTurns.seq })
          .from(lldDrillInterviewerTurns)
          .where(eq(lldDrillInterviewerTurns.attemptId, id))
          .orderBy(desc(lldDrillInterviewerTurns.seq))
          .limit(1);

        await db.insert(lldDrillInterviewerTurns).values({
          attemptId: id,
          role: "interviewer",
          stage: attempt.currentStage as DrillStage,
          persona,
          seq: (lastSeq?.seq ?? -1) + 1,
          content: fullReply,
        });

        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Stream failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
