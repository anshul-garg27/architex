// ── Diagram serializer for AI evaluation ────────────────────────────
//
// Converts React Flow nodes/edges into a compact text representation
// that can be included in an LLM evaluation prompt.

import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData, SystemDesignEdgeData, EdgeType } from '@/lib/types';
import { SCORING_DIMENSIONS } from '@/lib/interview/scoring';
import type { Challenge } from '@/stores/interview-store';

// ── Serialized diagram ──────────────────────────────────────────────

export interface SerializedDiagram {
  /** Human-readable one-liner, e.g. "Architecture with 8 nodes and 7 connections" */
  summary: string;
  /** Unique component types present, e.g. ["web-server", "load-balancer", "database"] */
  nodeTypes: string[];
  /** Readable connection list, e.g. ["web-server → load-balancer (HTTP)"] */
  connections: string[];
  /** Key configuration values per node, keyed by node label */
  config: Record<string, Record<string, unknown>>;
  /** Simulation metrics when available, keyed by node label */
  metrics?: Record<string, Record<string, unknown>>;
}

// ── Challenge definition accepted by the prompt builder ─────────────

export interface ChallengeDefinition {
  id: string;
  title: string;
  difficulty: number;
  timeMinutes: number;
  requirements: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatEdgeType(edgeType?: EdgeType | string): string {
  if (!edgeType) return 'data-flow';
  const labels: Record<string, string> = {
    http: 'HTTP',
    grpc: 'gRPC',
    graphql: 'GraphQL',
    websocket: 'WebSocket',
    'message-queue': 'Message Queue',
    'event-stream': 'Event Stream',
    'db-query': 'DB Query',
    'cache-lookup': 'Cache Lookup',
    replication: 'Replication',
  };
  return labels[edgeType] ?? edgeType;
}

function nodeLabelById(nodes: Node[], id: string): string {
  const node = nodes.find((n) => n.id === id);
  if (!node) return id;
  const data = node.data as SystemDesignNodeData | undefined;
  return data?.label ?? id;
}

// ── Core serializer ─────────────────────────────────────────────────

/**
 * Convert React Flow nodes and edges into a compact serialized form
 * suitable for inclusion in an AI evaluation prompt.
 */
export function serializeDiagramForAI(
  nodes: Node[],
  edges: Edge[],
): SerializedDiagram {
  // Collect unique component types
  const nodeTypes = Array.from(
    new Set(
      nodes.map((n) => {
        const data = n.data as SystemDesignNodeData | undefined;
        return data?.componentType ?? n.type ?? 'unknown';
      }),
    ),
  );

  // Build readable connection strings
  const connections = edges.map((e) => {
    const sourceLabel = nodeLabelById(nodes, e.source);
    const targetLabel = nodeLabelById(nodes, e.target);
    const edgeData = e.data as SystemDesignEdgeData | undefined;
    const protocol = formatEdgeType(edgeData?.edgeType);
    return `${sourceLabel} → ${targetLabel} (${protocol})`;
  });

  // Collect per-node config
  const config: Record<string, Record<string, unknown>> = {};
  const metrics: Record<string, Record<string, unknown>> = {};
  let hasMetrics = false;

  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData | undefined;
    if (!data) continue;

    const label = data.label;
    if (data.config && Object.keys(data.config).length > 0) {
      config[label] = { ...data.config };
    }

    if (data.metrics) {
      const m = data.metrics;
      const nonNull = Object.entries(m).filter(([, v]) => v != null && v !== 0);
      if (nonNull.length > 0) {
        metrics[label] = Object.fromEntries(nonNull);
        hasMetrics = true;
      }
    }
  }

  const summary = `Architecture with ${nodes.length} node${nodes.length === 1 ? '' : 's'} and ${edges.length} connection${edges.length === 1 ? '' : 's'}`;

  return {
    summary,
    nodeTypes,
    connections,
    config,
    ...(hasMetrics ? { metrics } : {}),
  };
}

// ── Prompt builder ──────────────────────────────────────────────────

/**
 * Build the full evaluation prompt sent to the AI model.
 * Includes the diagram topology, challenge requirements, scoring rubric,
 * and instructions for a structured JSON response.
 */
export function buildEvaluationPrompt(
  diagram: SerializedDiagram,
  challenge: ChallengeDefinition,
): string {
  // Build the scoring rubric section from the existing dimensions
  const rubricLines = SCORING_DIMENSIONS.map(
    (dim) =>
      `- **${dim.name}** (id: "${dim.id}", weight: ${dim.weight}): ${dim.description}`,
  ).join('\n');

  const configBlock = Object.entries(diagram.config)
    .map(([label, cfg]) => `  - ${label}: ${JSON.stringify(cfg)}`)
    .join('\n');

  const metricsBlock = diagram.metrics
    ? Object.entries(diagram.metrics)
        .map(([label, m]) => `  - ${label}: ${JSON.stringify(m)}`)
        .join('\n')
    : null;

  return `You are an expert system design interviewer evaluating a candidate's architecture diagram.

## Challenge
**${challenge.title}** (Difficulty: ${challenge.difficulty}/5, Time limit: ${challenge.timeMinutes} min)

### Requirements
${challenge.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Candidate's Diagram
${diagram.summary}

### Component Types
${diagram.nodeTypes.map((t) => `- ${t}`).join('\n')}

### Connections
${diagram.connections.length > 0 ? diagram.connections.map((c) => `- ${c}`).join('\n') : '(none)'}

### Node Configuration
${configBlock || '(no configuration details)'}
${
  metricsBlock
    ? `
### Simulation Metrics
${metricsBlock}
`
    : ''
}
## Scoring Rubric
Evaluate the diagram across these 6 dimensions, each scored 1-10:
${rubricLines}

## Instructions
1. Analyze the diagram against the challenge requirements.
2. Score each dimension from 1 to 10.
3. Provide specific, actionable feedback.
4. Identify strengths and areas for improvement.
5. Ask follow-up questions that would probe the candidate's deeper understanding.

## Required Response Format
Respond with ONLY a JSON object (no markdown fences, no commentary outside the JSON):
{
  "scores": {
    "functional": <number 1-10>,
    "api": <number 1-10>,
    "dataModel": <number 1-10>,
    "scalability": <number 1-10>,
    "reliability": <number 1-10>,
    "tradeoffs": <number 1-10>
  },
  "feedback": [
    "<specific observation about the architecture>",
    "<another specific observation>"
  ],
  "strengths": [
    "<concrete strength>",
    "<another concrete strength>"
  ],
  "improvements": [
    "<actionable improvement suggestion>",
    "<another actionable improvement>"
  ],
  "followUpQuestions": [
    "<probing question>",
    "<another probing question>"
  ]
}`;
}
