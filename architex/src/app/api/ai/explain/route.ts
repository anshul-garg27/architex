// ── AI Pattern Explainer API Route ─────────────────────────────────
//
// POST /api/ai/explain
// Accepts UML classes[] + relationships[], returns pattern analysis
// with detected design patterns, correctness issues, and suggestions.
//
// Rate limit: 10 calls/user/hour (tracked via ai_usage table).
// When ANTHROPIC_API_KEY is not configured, falls back to heuristic
// structural analysis.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { gte, and, eq, count } from "drizzle-orm";
import { getDb, aiUsage } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { sanitizeUserInput } from "@/lib/ai/prompt-safety";
import type {
  UMLClass,
  UMLRelationship,
  UMLRelationshipType,
} from "@/lib/lld/types";

// ── Request / Response types ──────────────────────────────────────

interface ExplainRequestBody {
  classes: UMLClass[];
  relationships: UMLRelationship[];
}

interface DetectedPattern {
  name: string;
  confidence: number;
  evidence: string;
}

interface CorrectnessIssue {
  severity: "error" | "warning" | "info";
  message: string;
}

interface ExplainResponse {
  patterns: DetectedPattern[];
  correctness: CorrectnessIssue[];
  suggestions: string[];
  summary: string;
}

// ── UML serializer ────────────────────────────────────────────────

const VISIBILITY_MAP: Record<string, string> = {
  "+": "public",
  "-": "private",
  "#": "protected",
  "~": "package",
};

const RELATIONSHIP_LABELS: Record<UMLRelationshipType, string> = {
  inheritance: "inherits from",
  composition: "composes",
  aggregation: "aggregates",
  association: "associates with",
  dependency: "depends on",
  realization: "realizes",
};

/**
 * Convert UMLClass[] + UMLRelationship[] to a text representation
 * suitable for an LLM prompt.
 */
export function serializeUMLForPrompt(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): string {
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const classLines = classes.map((c) => {
    const stereo =
      c.stereotype !== "class" ? ` <<${c.stereotype}>>` : "";
    const attrs = c.attributes
      .map(
        (a) =>
          `    ${VISIBILITY_MAP[a.visibility] ?? a.visibility} ${a.name}: ${a.type}`,
      )
      .join("\n");
    const methods = c.methods
      .map((m) => {
        const abs = m.isAbstract ? "abstract " : "";
        const params = m.params.join(", ");
        return `    ${abs}${VISIBILITY_MAP[m.visibility] ?? m.visibility} ${m.name}(${params}): ${m.returnType}`;
      })
      .join("\n");

    let block = `class ${c.name}${stereo} {`;
    if (attrs) block += `\n  Attributes:\n${attrs}`;
    if (methods) block += `\n  Methods:\n${methods}`;
    block += "\n}";
    return block;
  });

  const relLines = relationships.map((r) => {
    const src = classMap.get(r.source) ?? r.source;
    const tgt = classMap.get(r.target) ?? r.target;
    const verb = RELATIONSHIP_LABELS[r.type] ?? r.type;
    const card =
      r.sourceCardinality || r.targetCardinality
        ? ` [${r.sourceCardinality ?? "*"}..${r.targetCardinality ?? "*"}]`
        : "";
    const lbl = r.label ? ` (${r.label})` : "";
    return `${src} ${verb} ${tgt}${card}${lbl}`;
  });

  return [
    `=== UML Class Diagram (${classes.length} classes, ${relationships.length} relationships) ===`,
    "",
    ...classLines,
    "",
    "Relationships:",
    ...relLines,
  ].join("\n");
}

// ── Heuristic fallback ────────────────────────────────────────────

function buildHeuristicAnalysis(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): ExplainResponse {
  const patterns: DetectedPattern[] = [];
  const correctness: CorrectnessIssue[] = [];
  const suggestions: string[] = [];

  const classNames = classes.map((c) => c.name.toLowerCase());
  const classMap = new Map(classes.map((c) => [c.id, c]));

  // --- Pattern detection ---

  // Singleton: private constructor + static getInstance
  for (const c of classes) {
    const hasPrivateCtor = c.methods.some(
      (m) => m.visibility === "-" && m.name.toLowerCase() === "constructor",
    );
    const hasGetInstance = c.methods.some(
      (m) =>
        m.visibility === "+" &&
        m.name.toLowerCase().includes("getinstance"),
    );
    if (hasPrivateCtor || hasGetInstance) {
      patterns.push({
        name: "Singleton",
        confidence: hasPrivateCtor && hasGetInstance ? 0.9 : 0.6,
        evidence: `${c.name} has ${hasPrivateCtor ? "a private constructor" : ""}${hasPrivateCtor && hasGetInstance ? " and " : ""}${hasGetInstance ? "a getInstance method" : ""}.`,
      });
    }
  }

  // Observer: subject with attach/detach/notify + observer interface
  const hasObserverLike = classNames.some(
    (n) => n.includes("observer") || n.includes("listener"),
  );
  const hasSubjectLike = classes.some((c) =>
    c.methods.some(
      (m) =>
        m.name.toLowerCase().includes("notify") ||
        m.name.toLowerCase().includes("subscribe") ||
        m.name.toLowerCase().includes("attach"),
    ),
  );
  if (hasObserverLike && hasSubjectLike) {
    patterns.push({
      name: "Observer",
      confidence: 0.8,
      evidence:
        "Found observer/listener interface with subject notification methods.",
    });
  }

  // Factory: class with create* methods returning abstract/interface types
  for (const c of classes) {
    const createMethods = c.methods.filter((m) =>
      m.name.toLowerCase().startsWith("create"),
    );
    if (createMethods.length > 0) {
      patterns.push({
        name: "Factory Method",
        confidence: 0.7,
        evidence: `${c.name} has factory method(s): ${createMethods.map((m) => m.name).join(", ")}.`,
      });
    }
  }

  // Strategy: interface with single method + multiple implementations
  const interfaces = classes.filter((c) => c.stereotype === "interface");
  for (const iface of interfaces) {
    const implementors = relationships.filter(
      (r) =>
        r.target === iface.id &&
        (r.type === "realization" || r.type === "inheritance"),
    );
    if (implementors.length >= 2 && iface.methods.length <= 2) {
      patterns.push({
        name: "Strategy",
        confidence: 0.75,
        evidence: `${iface.name} interface with ${implementors.length} implementations and ${iface.methods.length} method(s).`,
      });
    }
  }

  // Decorator: class that both extends and composes the same type
  for (const r of relationships) {
    if (r.type === "inheritance" || r.type === "realization") {
      const composesTarget = relationships.some(
        (r2) =>
          r2.source === r.source &&
          r2.target === r.target &&
          r2.type === "composition",
      );
      if (composesTarget) {
        const srcName = classMap.get(r.source)?.name ?? r.source;
        const tgtName = classMap.get(r.target)?.name ?? r.target;
        patterns.push({
          name: "Decorator",
          confidence: 0.8,
          evidence: `${srcName} both inherits from and composes ${tgtName}.`,
        });
      }
    }
  }

  // --- Correctness checks ---

  // Disconnected classes
  const connectedIds = new Set(
    relationships.flatMap((r) => [r.source, r.target]),
  );
  for (const c of classes) {
    if (!connectedIds.has(c.id)) {
      correctness.push({
        severity: "warning",
        message: `${c.name} is not connected to any other class.`,
      });
    }
  }

  // Empty classes
  for (const c of classes) {
    if (c.attributes.length === 0 && c.methods.length === 0) {
      correctness.push({
        severity: "info",
        message: `${c.name} has no attributes or methods defined.`,
      });
    }
  }

  // Interface with attributes
  for (const c of classes) {
    if (c.stereotype === "interface" && c.attributes.length > 0) {
      correctness.push({
        severity: "error",
        message: `Interface ${c.name} should not have attributes (found ${c.attributes.length}).`,
      });
    }
  }

  // Missing abstract methods on abstract classes
  for (const c of classes) {
    if (c.stereotype === "abstract") {
      const hasAbstractMethod = c.methods.some((m) => m.isAbstract);
      if (!hasAbstractMethod) {
        correctness.push({
          severity: "warning",
          message: `Abstract class ${c.name} has no abstract methods.`,
        });
      }
    }
  }

  // --- Suggestions ---

  if (patterns.length === 0) {
    suggestions.push(
      "No common design patterns detected. Consider whether your class responsibilities suggest a pattern like Strategy, Observer, or Factory.",
    );
  }

  if (interfaces.length === 0 && classes.length >= 3) {
    suggestions.push(
      "Consider introducing interfaces to decouple dependencies and enable polymorphism.",
    );
  }

  const inheritanceCount = relationships.filter(
    (r) => r.type === "inheritance",
  ).length;
  if (inheritanceCount > classes.length) {
    suggestions.push(
      "Deep inheritance hierarchies detected. Consider composition over inheritance where possible.",
    );
  }

  if (classes.length >= 5 && relationships.length < classes.length - 1) {
    suggestions.push(
      "Several classes appear loosely connected. Review whether missing relationships should be explicit.",
    );
  }

  const summary =
    patterns.length > 0
      ? `Detected ${patterns.length} design pattern(s): ${patterns.map((p) => p.name).join(", ")}. Found ${correctness.length} issue(s) to review.`
      : `Analyzed ${classes.length} classes with ${relationships.length} relationships. Found ${correctness.length} issue(s) to review.`;

  return { patterns, correctness, suggestions, summary };
}

// ── Rate limiting ─────────────────────────────────────────────────

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(userId: string): Promise<boolean> {
  const db = getDb();
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);

  const [result] = await db
    .select({ total: count() })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.purpose, "explain"),
        gte(aiUsage.createdAt, windowStart),
      ),
    );

  return (result?.total ?? 0) < RATE_LIMIT;
}

// ── Usage logging ─────────────────────────────────────────────────

async function logUsage(
  userId: string,
  tokens: number,
  cost: number,
): Promise<void> {
  const db = getDb();
  await db.insert(aiUsage).values({
    userId,
    model: "claude-sonnet-4-6",
    tokens,
    cost,
    purpose: "explain",
  });
}

// ── Route handler ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Auth: required when Clerk is configured, optional in dev without Clerk
    let userId: string | null = null;
    const db = getDb();
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const clerkId = await requireAuth();
      userId = await resolveUserId(clerkId);
      if (!userId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Parse body
    let body: ExplainRequestBody;
    try {
      body = (await request.json()) as ExplainRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 },
      );
    }

    const { classes, relationships } = body;

    if (!classes || !relationships) {
      return NextResponse.json(
        {
          error:
            'Request must include "classes" and "relationships" fields.',
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(classes) || !Array.isArray(relationships)) {
      return NextResponse.json(
        { error: '"classes" and "relationships" must be arrays.' },
        { status: 400 },
      );
    }

    if (classes.length > 30) {
      return NextResponse.json(
        { error: "Payload too large: max 30 classes." },
        { status: 400 },
      );
    }

    if (classes.length === 0) {
      return NextResponse.json(
        { error: "At least one class is required." },
        { status: 400 },
      );
    }

    // Sanitize user-controlled text
    for (const c of classes) {
      c.name = sanitizeUserInput(c.name);
      for (const a of c.attributes) {
        a.name = sanitizeUserInput(a.name);
        a.type = sanitizeUserInput(a.type);
      }
      for (const m of c.methods) {
        m.name = sanitizeUserInput(m.name);
        m.returnType = sanitizeUserInput(m.returnType);
        if (m.params.length > 0 && typeof m.params[0] === "string") {
          m.params = (m.params as string[]).map((p) => sanitizeUserInput(p));
        } else {
          m.params = (m.params as Array<{ name: string; type: string }>).map((p) => ({ ...p, name: sanitizeUserInput(p.name), type: sanitizeUserInput(p.type) }));
        }
      }
    }
    for (const r of relationships) {
      if (r.label) r.label = sanitizeUserInput(r.label);
    }

    // ── Check for API key ─────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const analysis = buildHeuristicAnalysis(classes, relationships);
      return NextResponse.json(
        {
          ...analysis,
          isAI: false,
          message: "AI analysis requires an ANTHROPIC_API_KEY",
        },
        { status: 200 },
      );
    }

    // ── Rate limit ────────────────────────────────────────────
    const withinLimit = userId ? await checkRateLimit(userId) : true;
    if (!withinLimit) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 10 AI explanations per hour.",
        },
        { status: 429 },
      );
    }

    // ── AI-powered analysis ───────────────────────────────────
    const serialized = serializeUMLForPrompt(classes, relationships);

    const systemPrompt = `You are an expert software architect and UML specialist. Analyze the provided UML class diagram for design pattern recognition, correctness issues, and improvement suggestions.

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation outside the JSON):
{
  "patterns": [{"name": "string", "confidence": 0.0-1.0, "evidence": "string"}],
  "correctness": [{"severity": "error|warning|info", "message": "string"}],
  "suggestions": ["string"],
  "summary": "string"
}

Guidelines:
- Identify well-known GoF patterns, SOLID violations, and architectural patterns.
- confidence should reflect how strongly the structure matches the pattern (0.5 = possible, 0.9+ = definitive).
- correctness issues: check for interface violations, missing abstract methods, circular dependencies, disconnected classes, and naming conventions.
- suggestions should be actionable and specific to the diagram.
- summary should be a concise 1-2 sentence overview.`;

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this UML class diagram:\n\n${serialized}`,
        },
      ],
    });

    const text = message.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text",
      )
      .map((block) => block.text)
      .join("");

    const totalTokens =
      message.usage.input_tokens + message.usage.output_tokens;
    // Sonnet pricing: $3/1M input, $15/1M output
    const cost =
      (message.usage.input_tokens / 1_000_000) * 3.0 +
      (message.usage.output_tokens / 1_000_000) * 15.0;

    // Log usage (fire-and-forget)
    logUsage(userId, totalTokens, cost).catch((err) =>
      console.error("[api/ai/explain] Failed to log usage:", err),
    );

    // Parse the AI response
    try {
      const parsed = JSON.parse(text) as ExplainResponse;

      // Validate structure minimally
      if (
        !Array.isArray(parsed.patterns) ||
        !Array.isArray(parsed.correctness) ||
        !Array.isArray(parsed.suggestions) ||
        typeof parsed.summary !== "string"
      ) {
        throw new Error("Invalid response structure");
      }

      return NextResponse.json(
        { ...parsed, isAI: true },
        { status: 200 },
      );
    } catch {
      // AI returned unparseable response — fall back to heuristic
      console.error(
        "[api/ai/explain] Failed to parse AI response, falling back to heuristic",
      );
      const fallback = buildHeuristicAnalysis(classes, relationships);
      return NextResponse.json(
        { ...fallback, isAI: false, aiError: "Failed to parse AI response" },
        { status: 200 },
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/ai/explain] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
