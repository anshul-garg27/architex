// ── AI-007: Interview Scorer ─────────────────────────────────────────
//
// Claude-powered interview scoring across 8 dimensions. Falls back
// to a rule-based scoring engine when AI is not configured.

import { ClaudeClient } from './claude-client';
import type { ReviewNode, ReviewEdge } from './design-reviewer';

// ── Types ───────────────────────────────────────────────────────────

export type InterviewGrade = 'strong-hire' | 'hire' | 'borderline' | 'no-hire';

export interface ScoringDimensionResult {
  name: string;
  score: number; // 0-100
  feedback: string;
}

export interface InterviewChallenge {
  id: string;
  title: string;
  difficulty: number;
  requirements: string[];
}

export interface EnhancedEvaluation {
  grade: InterviewGrade;
  overallScore: number; // 0-100
  dimensions: ScoringDimensionResult[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

// ── Dimension definitions ───────────────────────────────────────────

const DIMENSIONS = [
  'Scalability',
  'Reliability',
  'Performance',
  'Security',
  'Operability',
  'Cost Efficiency',
  'Correctness',
  'Completeness',
] as const;

// ── Grade mapping ───────────────────────────────────────────────────

function scoreToGrade(score: number): InterviewGrade {
  if (score >= 90) return 'strong-hire';
  if (score >= 70) return 'hire';
  if (score >= 50) return 'borderline';
  return 'no-hire';
}

// ── Rule-based fallback scoring ─────────────────────────────────────

function ruleBasedScore(
  nodes: ReviewNode[],
  edges: ReviewEdge[],
  challenge: InterviewChallenge,
): EnhancedEvaluation {
  const hasLB = nodes.some((n) => n.category === 'load-balancing');
  const hasCache = nodes.some(
    (n) => n.componentType.includes('redis') || n.componentType.includes('cache'),
  );
  const hasDB = nodes.some((n) => n.category === 'storage');
  const hasMonitoring = nodes.some((n) => n.category === 'observability');
  const hasMessaging = nodes.some((n) => n.category === 'messaging');
  const hasSecurity = nodes.some((n) => n.category === 'security');
  const hasCompute = nodes.some((n) => n.category === 'compute');
  const hasReplication = edges.some((e) => e.edgeType === 'replication');

  const componentCount = nodes.length;
  const reqCount = challenge.requirements.length;

  // Score each dimension on 0-100
  const dimensionScores: ScoringDimensionResult[] = [
    {
      name: 'Scalability',
      score: (hasLB ? 30 : 0) + (hasCache ? 25 : 0) + (componentCount > 3 ? 20 : 10) + (hasMessaging ? 25 : 0),
      feedback: hasLB
        ? 'Load balancer present for horizontal scaling.'
        : 'No load balancer — limits horizontal scaling.',
    },
    {
      name: 'Reliability',
      score: (hasReplication ? 35 : 0) + (hasLB ? 25 : 0) + (hasMessaging ? 20 : 0) + (componentCount > 4 ? 20 : 10),
      feedback: hasReplication
        ? 'Database replication improves data durability.'
        : 'No replication — single points of failure for data.',
    },
    {
      name: 'Performance',
      score: (hasCache ? 40 : 0) + (hasLB ? 20 : 0) + (edges.length > 3 ? 20 : 10) + (hasMessaging ? 20 : 0),
      feedback: hasCache
        ? 'Cache layer reduces latency for hot paths.'
        : 'No caching — all reads hit storage directly.',
    },
    {
      name: 'Security',
      score: (hasSecurity ? 40 : 0) + (hasLB ? 15 : 0) + (hasDB ? 15 : 0) + 30,
      feedback: hasSecurity
        ? 'Security components present.'
        : 'No explicit security layer (WAF, auth service, etc.).',
    },
    {
      name: 'Operability',
      score: (hasMonitoring ? 50 : 0) + (componentCount > 3 ? 20 : 10) + 30,
      feedback: hasMonitoring
        ? 'Monitoring/observability included.'
        : 'No monitoring — blind to production issues.',
    },
    {
      name: 'Cost Efficiency',
      score: Math.max(20, 80 - componentCount * 5),
      feedback: componentCount > 8
        ? 'High component count may increase operational costs.'
        : 'Reasonable number of components for the requirements.',
    },
    {
      name: 'Correctness',
      score: (hasCompute ? 25 : 0) + (hasDB ? 25 : 0) + (edges.length > 2 ? 25 : 10) + 25,
      feedback: hasCompute && hasDB
        ? 'Core compute and storage components present.'
        : 'Missing fundamental components.',
    },
    {
      name: 'Completeness',
      score: Math.min(100, Math.round((componentCount / Math.max(1, reqCount)) * 60) + 40),
      feedback: componentCount >= reqCount
        ? 'Component count aligns with requirement count.'
        : 'Fewer components than requirements — some may be unaddressed.',
    },
  ];

  // Cap each dimension at 100
  for (const d of dimensionScores) {
    d.score = Math.max(0, Math.min(100, d.score));
  }

  const overallScore = Math.round(
    dimensionScores.reduce((s, d) => s + d.score, 0) / dimensionScores.length,
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const d of dimensionScores) {
    if (d.score >= 70) strengths.push(`${d.name}: ${d.feedback}`);
    else if (d.score < 50) weaknesses.push(`${d.name}: ${d.feedback}`);
  }

  const suggestions: string[] = [];
  if (!hasLB) suggestions.push('Add a load balancer for horizontal scaling.');
  if (!hasCache) suggestions.push('Add a caching layer (e.g. Redis) to reduce latency.');
  if (!hasMonitoring) suggestions.push('Add monitoring and alerting for production readiness.');
  if (!hasReplication) suggestions.push('Add database replication for fault tolerance.');
  if (!hasMessaging) suggestions.push('Consider async processing for decoupling heavy operations.');

  return {
    grade: scoreToGrade(overallScore),
    overallScore,
    dimensions: dimensionScores,
    strengths,
    weaknesses,
    suggestions,
  };
}

// ── Main scoring function ───────────────────────────────────────────

/**
 * Score an interview design across 8 dimensions using Claude Sonnet.
 * Falls back to rule-based scoring when AI is not configured.
 */
export async function scoreInterviewDesign(
  nodes: ReviewNode[],
  edges: ReviewEdge[],
  challenge: InterviewChallenge,
): Promise<EnhancedEvaluation> {
  const client = ClaudeClient.getInstance();

  // Fallback to rule-based scoring
  if (!client.isConfigured()) {
    return ruleBasedScore(nodes, edges, challenge);
  }

  const nodeSummary = nodes
    .map((n) => `${n.label} (${n.category}/${n.componentType})`)
    .join(', ');
  const edgeSummary = edges
    .map((e) => {
      const src = nodes.find((n) => n.id === e.source)?.label ?? e.source;
      const tgt = nodes.find((n) => n.id === e.target)?.label ?? e.target;
      return `${src} -> ${tgt} (${e.edgeType})`;
    })
    .join(', ');

  try {
    const response = await client.call({
      model: 'claude-sonnet-4-20250514',
      systemPrompt: `You are a senior system design interviewer scoring a candidate's architecture. Be fair but rigorous. Return structured JSON.`,
      userMessage: `Score this system design interview submission.

Challenge: "${challenge.title}" (Difficulty: ${challenge.difficulty}/5)
Requirements: ${challenge.requirements.map((r, i) => `${i + 1}. ${r}`).join('; ')}

Candidate's Design:
- Nodes: ${nodeSummary}
- Edges: ${edgeSummary}

Score across these 8 dimensions (each 0-100):
${DIMENSIONS.map((d) => `- ${d}`).join('\n')}

Return JSON (no markdown fences):
{
  "overallScore": <0-100>,
  "dimensions": [
    { "name": "<dimension>", "score": <0-100>, "feedback": "<specific feedback>" }
  ],
  "strengths": ["<specific strength>", ...],
  "weaknesses": ["<specific weakness>", ...],
  "suggestions": ["<actionable suggestion>", ...]
}`,
      maxTokens: 1536,
      cacheKey: `interview:${challenge.id}:${nodes.length}:${edges.length}`,
      cacheTtlMs: 1_800_000, // 30 min
    });

    const parsed = JSON.parse(response.text) as {
      overallScore?: number;
      dimensions?: Array<{ name: string; score: number; feedback: string }>;
      strengths?: string[];
      weaknesses?: string[];
      suggestions?: string[];
    };

    const overallScore = typeof parsed.overallScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
      : 50;

    const dimensions: ScoringDimensionResult[] = Array.isArray(parsed.dimensions)
      ? parsed.dimensions.map((d) => ({
          name: d.name,
          score: Math.max(0, Math.min(100, Math.round(d.score))),
          feedback: d.feedback,
        }))
      : DIMENSIONS.map((name) => ({ name, score: 50, feedback: 'Score unavailable.' }));

    return {
      grade: scoreToGrade(overallScore),
      overallScore,
      dimensions,
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      suggestions: parsed.suggestions ?? [],
    };
  } catch {
    // AI call failed — fall back to rule-based scoring
    return ruleBasedScore(nodes, edges, challenge);
  }
}
