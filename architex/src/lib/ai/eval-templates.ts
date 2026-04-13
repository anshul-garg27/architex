// ── AIX-003: Evaluation prompt template builder ─────────────────────
//
// Pre-built evaluation prompts for grading system designs across
// multiple quality dimensions. Client-side only — no API calls.
//
// Templates cover: scalability, reliability, cost, security, performance.
// `buildEvalPrompt(design, criteria)` → structured prompt string
// `parseEvalResponse(response)` → { scores, feedback, suggestions }

// ── Types ───────────────────────────────────────────────────────────

export type EvalCriterion =
  | 'scalability'
  | 'reliability'
  | 'cost'
  | 'security'
  | 'performance';

export interface EvalDesignInput {
  /** Human-readable summary of the design, e.g. "3 services behind an ALB" */
  summary: string;
  /** Component types present in the design */
  componentTypes: string[];
  /** Readable connection descriptors */
  connections: string[];
  /** Per-component configuration (keyed by label) */
  config?: Record<string, Record<string, unknown>>;
}

export interface EvalScore {
  criterion: EvalCriterion;
  /** Score from 1 to 10 */
  score: number;
  /** Brief justification for the score */
  rationale: string;
}

export interface EvalResult {
  scores: EvalScore[];
  /** Overall weighted score (1-10) */
  overallScore: number;
  feedback: string[];
  suggestions: string[];
}

export interface EvalParseError {
  error: string;
}

// ── Template fragments per criterion ────────────────────────────────

interface CriterionTemplate {
  label: string;
  description: string;
  rubricItems: string[];
  weight: number;
}

const CRITERION_TEMPLATES: Record<EvalCriterion, CriterionTemplate> = {
  scalability: {
    label: 'Scalability',
    description: 'Ability to handle growth in users, data volume, and request throughput.',
    rubricItems: [
      'Horizontal scaling strategy (stateless services, auto-scaling)',
      'Database scaling (read replicas, sharding, partitioning)',
      'Caching layers (CDN, application cache, query cache)',
      'Async processing for non-critical paths',
      'Back-of-envelope capacity estimates',
    ],
    weight: 0.25,
  },
  reliability: {
    label: 'Reliability',
    description: 'Fault tolerance, redundancy, and graceful degradation under failure.',
    rubricItems: [
      'Redundancy at every layer (no single points of failure)',
      'Health checks and automatic failover',
      'Circuit breakers and bulkheads between services',
      'Retry logic with exponential backoff',
      'Dead letter queues for failed async operations',
    ],
    weight: 0.25,
  },
  cost: {
    label: 'Cost Efficiency',
    description: 'Appropriate resource allocation without over-provisioning or waste.',
    rubricItems: [
      'Right-sized compute instances for expected load',
      'Tiered storage (hot/warm/cold) based on access patterns',
      'Spot or reserved instances where applicable',
      'Efficient data transfer (compression, batching)',
      'Cost-aware architectural choices (serverless vs always-on)',
    ],
    weight: 0.15,
  },
  security: {
    label: 'Security',
    description: 'Authentication, authorisation, encryption, and defence in depth.',
    rubricItems: [
      'Authentication mechanism (OAuth 2.0, JWT, API keys)',
      'Authorisation model (RBAC, ABAC)',
      'Encryption at rest and in transit (TLS 1.3, AES-256)',
      'Input validation and injection prevention',
      'Rate limiting and DDoS protection',
    ],
    weight: 0.20,
  },
  performance: {
    label: 'Performance',
    description: 'Latency, throughput, and resource utilisation under expected load.',
    rubricItems: [
      'Request latency budget and bottleneck identification',
      'Connection pooling and keep-alive',
      'Efficient serialisation (protobuf, binary) for internal calls',
      'Index strategy aligned with query patterns',
      'CDN and edge caching for static content',
    ],
    weight: 0.15,
  },
};

export const ALL_CRITERIA: EvalCriterion[] = [
  'scalability',
  'reliability',
  'cost',
  'security',
  'performance',
];

// ── Prompt builder ──────────────────────────────────────────────────

/**
 * Build a structured evaluation prompt for grading a system design
 * against one or more quality criteria.
 *
 * @param design  Serialised representation of the candidate's design.
 * @param criteria  Dimensions to evaluate (defaults to all five).
 * @returns  A fully formatted prompt string ready for an LLM.
 */
export function buildEvalPrompt(
  design: EvalDesignInput,
  criteria: EvalCriterion[] = ALL_CRITERIA,
): string {
  const selectedTemplates = criteria.map((c) => CRITERION_TEMPLATES[c]);

  const rubricSection = selectedTemplates
    .map((t) => {
      const items = t.rubricItems.map((item) => `    - ${item}`).join('\n');
      return `- **${t.label}** (weight: ${t.weight})\n  ${t.description}\n  Rubric:\n${items}`;
    })
    .join('\n\n');

  const componentList =
    design.componentTypes.length > 0
      ? design.componentTypes.map((c) => `- ${c}`).join('\n')
      : '(none)';

  const connectionList =
    design.connections.length > 0
      ? design.connections.map((c) => `- ${c}`).join('\n')
      : '(none)';

  const configBlock = design.config
    ? Object.entries(design.config)
        .map(([label, cfg]) => `  - ${label}: ${JSON.stringify(cfg)}`)
        .join('\n')
    : '(no configuration details)';

  return `You are an expert system architect evaluating a candidate's design.

## Design Under Review
${design.summary}

### Components
${componentList}

### Connections
${connectionList}

### Configuration
${configBlock}

## Evaluation Criteria
Score each criterion from 1 (poor) to 10 (exceptional):

${rubricSection}

## Instructions
1. Analyse the design against each criterion listed above.
2. Score each criterion from 1 to 10 with a brief rationale.
3. Provide 2-4 pieces of specific feedback about the design.
4. Suggest 2-4 concrete improvements the candidate should make.

## Required Response Format
Respond with ONLY a JSON object:
{
  "scores": [
    { "criterion": "<criterion_id>", "score": <1-10>, "rationale": "<brief justification>" }
  ],
  "feedback": ["<observation>"],
  "suggestions": ["<improvement>"]
}`;
}

// ── Response parser ─────────────────────────────────────────────────

/**
 * Extract a JSON object from a response that may contain markdown fences
 * or surrounding text.
 */
function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }
  return raw.trim();
}

function clampScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(1, Math.min(10, Math.round(value)));
}

const VALID_CRITERIA = new Set<string>(ALL_CRITERIA);

/**
 * Parse an evaluation response string into a validated EvalResult.
 *
 * Handles markdown-fenced JSON, missing fields, and out-of-range scores.
 * Returns the result on success, or `{ error: string }` on failure.
 */
export function parseEvalResponse(
  response: string,
): EvalResult | EvalParseError {
  if (!response || typeof response !== 'string') {
    return { error: 'Empty or non-string response received.' };
  }

  let parsed: unknown;
  try {
    const jsonStr = extractJSON(response);
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    return {
      error: `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { error: 'Response is not a JSON object.' };
  }

  const obj = parsed as Record<string, unknown>;

  // ── Validate scores array ──────────────────────────────────────
  if (!Array.isArray(obj.scores)) {
    return { error: 'Missing or invalid "scores" array.' };
  }

  const scores: EvalScore[] = [];
  for (const raw of obj.scores) {
    if (typeof raw !== 'object' || raw === null) continue;
    const entry = raw as Record<string, unknown>;
    const criterion = entry.criterion;
    if (typeof criterion !== 'string' || !VALID_CRITERIA.has(criterion)) continue;

    const score = clampScore(entry.score);
    if (score === null) continue;

    const rationale = typeof entry.rationale === 'string' ? entry.rationale : '';
    scores.push({ criterion: criterion as EvalCriterion, score, rationale });
  }

  if (scores.length === 0) {
    return { error: 'No valid scores found in response.' };
  }

  // ── Calculate overall weighted score ───────────────────────────
  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of scores) {
    const template = CRITERION_TEMPLATES[s.criterion];
    weightedSum += s.score * template.weight;
    totalWeight += template.weight;
  }
  const overallScore =
    totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10) / 10
      : 0;

  // ── Validate string arrays ────────────────────────────────────
  const feedback = Array.isArray(obj.feedback)
    ? (obj.feedback as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
  const suggestions = Array.isArray(obj.suggestions)
    ? (obj.suggestions as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  return { scores, overallScore, feedback, suggestions };
}
