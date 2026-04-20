/**
 * POST /api/lld/explain-inline
 *
 * Takes a highlighted snippet + its section context and returns a short
 * 2-3 paragraph explanation from Claude Haiku.
 *
 * Rate limit: 30 explanations/user/hour. Body:
 *   { selection, patternSlug, sectionId, sectionRaw }
 *
 * When ANTHROPIC_API_KEY is not configured, returns a deterministic
 * fallback explanation so the UI has something meaningful to display.
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { and, count, eq, gte } from "drizzle-orm";
import { aiUsage, getDb } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { sanitizeUserInput } from "@/lib/ai/prompt-safety";

interface ExplainInlineBody {
  selection?: string;
  patternSlug?: string;
  sectionId?: string;
  sectionRaw?: string;
}

interface ExplainInlineResponse {
  explanation: string;
  isAI: boolean;
  cacheKey?: string;
}

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function fallbackExplanation(
  selection: string,
  patternSlug: string,
  sectionId: string,
): string {
  return [
    `"${selection.slice(0, 140)}${selection.length > 140 ? "…" : ""}"`,
    "",
    `In the context of the ${patternSlug} pattern's ${sectionId.replace(
      "_",
      " ",
    )} section, this line highlights one of the pattern's characteristic trade-offs.`,
    "Read the paragraphs immediately before and after it for the concrete example that motivates the claim. AI-powered inline explanations require ANTHROPIC_API_KEY.",
  ].join("\n");
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const db = getDb();
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
  const [row] = await db
    .select({ total: count() })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.purpose, "lld-explain-inline"),
        gte(aiUsage.createdAt, windowStart),
      ),
    );
  return (row?.total ?? 0) < RATE_LIMIT;
}

async function logUsage(
  userId: string,
  tokens: number,
  cost: number,
): Promise<void> {
  const db = getDb();
  await db.insert(aiUsage).values({
    userId,
    model: "claude-haiku-4-5",
    tokens,
    cost,
    purpose: "lld-explain-inline",
  });
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const clerkId = await requireAuth();
      userId = await resolveUserId(clerkId);
      if (!userId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    let body: ExplainInlineBody;
    try {
      body = (await request.json()) as ExplainInlineBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const selection = (body.selection ?? "").trim();
    const patternSlug = (body.patternSlug ?? "").trim();
    const sectionId = (body.sectionId ?? "").trim();
    const sectionRaw = (body.sectionRaw ?? "").trim();

    if (!selection || !patternSlug || !sectionId) {
      return NextResponse.json(
        { error: "selection, patternSlug, sectionId required" },
        { status: 400 },
      );
    }
    if (selection.length > 2_000) {
      return NextResponse.json(
        { error: "selection must be <= 2000 chars" },
        { status: 400 },
      );
    }

    const safeSelection = sanitizeUserInput(selection);
    const safePattern = sanitizeUserInput(patternSlug);
    const safeSection = sanitizeUserInput(sectionId);
    const safeContext = sanitizeUserInput(sectionRaw.slice(0, 4_000));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const resp: ExplainInlineResponse = {
        explanation: fallbackExplanation(
          safeSelection,
          safePattern,
          safeSection,
        ),
        isAI: false,
      };
      return NextResponse.json(resp);
    }

    if (userId) {
      const within = await checkRateLimit(userId);
      if (!within) {
        return NextResponse.json(
          {
            error:
              "Rate limit exceeded. Maximum 30 inline explanations per hour.",
          },
          { status: 429 },
        );
      }
    }

    const systemPrompt = `You are a precise, friendly software-design tutor.

A learner highlighted a passage from a Low-Level Design lesson and asked "explain this". Produce exactly 2-3 short paragraphs that:
1. Restate what the highlighted passage is saying in plain English.
2. Tie it to the ${safePattern} pattern's core idea (one concrete example).
3. Flag a common misconception right after the main idea — short, direct.

Rules:
- Do not use Markdown headers. Paragraphs only.
- Keep total length under 220 words.
- Do not invent facts not implied by the context.`;

    const userMessage = `Pattern: ${safePattern}
Section: ${safeSection}

Highlighted passage:
"""${safeSelection}"""

Section context (for your reference, not to quote back):
"""${safeContext}"""`;

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    // Haiku pricing: $0.80/1M input, $4.00/1M output.
    const cost =
      (inputTokens / 1_000_000) * 0.8 +
      (outputTokens / 1_000_000) * 4.0;

    if (userId) {
      logUsage(userId, totalTokens, cost).catch((err) =>
        console.error("[api/lld/explain-inline] log failed:", err),
      );
    }

    const resp: ExplainInlineResponse = {
      explanation: text || fallbackExplanation(safeSelection, safePattern, safeSection),
      isAI: text.length > 0,
    };
    return NextResponse.json(resp);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/explain-inline] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
