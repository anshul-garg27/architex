/**
 * POST /api/lld/ai/suggest-nodes
 * Body: { nodes, edges, intent? }
 * Returns: { suggestions: NodeSuggestion[] }
 * Rate-limited: 20 calls / hour / user via token-bucket.
 */

import { NextResponse } from "next/server";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { suggestNodes } from "@/lib/lld/ai-node-suggestions";
import { createRateLimiter, type RateLimiter } from "@/lib/security/rate-limiter";

// 20 calls / hour / user = ~1 token every 3 minutes, bucket size 20.
// refillInterval 180_000 ms = 3 min; refillRate 1 per cycle.
let _suggestLimiter: RateLimiter | null = null;
function getSuggestLimiter(): RateLimiter {
  if (!_suggestLimiter) {
    _suggestLimiter = createRateLimiter({
      maxTokens: 20,
      refillRate: 1,
      refillInterval: 180_000, // 3 min
    });
  }
  return _suggestLimiter;
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limiter = getSuggestLimiter();
    const result = limiter.checkLimit(`lld-ai-suggest:${userId}`);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Reset": String(result.resetAt),
          },
        },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      nodes?: unknown[];
      edges?: unknown[];
      intent?: string;
    };
    if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: "nodes and edges arrays are required" },
        { status: 400 },
      );
    }

    const suggestions = await suggestNodes({
      nodes: body.nodes as Parameters<typeof suggestNodes>[0]["nodes"],
      edges: body.edges as Parameters<typeof suggestNodes>[0]["edges"],
      intent: body.intent?.slice(0, 400),
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/ai/suggest-nodes] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
