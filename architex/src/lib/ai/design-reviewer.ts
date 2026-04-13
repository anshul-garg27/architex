// ── AIX-014: AI Design Reviewer ─────────────────────────────────────
//
// Static analysis engine that reviews a system design diagram for
// common architectural issues. Checks for single points of failure,
// missing caching, no load balancer, unprotected databases, and
// missing monitoring.
//
// AI-005: Optionally enriches reviews with Claude-powered deeper
// architectural analysis when an API key is configured.

import type { NodeCategory, EdgeType } from '@/lib/types';
import { ClaudeClient } from './claude-client';

// ── Types ───────────────────────────────────────────────────────────

export type IssueSeverity = 'critical' | 'warning' | 'suggestion';

export interface ReviewIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestion: string;
  /** Node IDs affected by this issue */
  affectedNodes: string[];
}

export interface ReviewResult {
  issues: ReviewIssue[];
  suggestions: string[];
  /** Overall design score from 0-100 */
  score: number;
}

/** Simplified node used by the reviewer */
export interface ReviewNode {
  id: string;
  label: string;
  category: NodeCategory;
  componentType: string;
}

/** Simplified edge used by the reviewer */
export interface ReviewEdge {
  id: string;
  source: string;
  target: string;
  edgeType: EdgeType;
}

// ── Rule engine ─────────────────────────────────────────────────────

type ReviewRule = (
  nodes: ReviewNode[],
  edges: ReviewEdge[],
) => ReviewIssue[];

let issueCounter = 0;

function issueId(): string {
  return `issue_${++issueCounter}`;
}

// ── Rule: Single points of failure ──────────────────────────────────

const checkSinglePointsOfFailure: ReviewRule = (nodes, edges) => {
  const issues: ReviewIssue[] = [];

  // A compute/processing node is a SPOF if it has incoming connections
  // but there is only one instance of its componentType
  const computeNodes = nodes.filter(
    (n) => n.category === 'compute' || n.category === 'processing',
  );

  // Group by componentType
  const typeGroups = new Map<string, ReviewNode[]>();
  for (const n of computeNodes) {
    const arr = typeGroups.get(n.componentType) ?? [];
    arr.push(n);
    typeGroups.set(n.componentType, arr);
  }

  for (const [, group] of typeGroups) {
    if (group.length !== 1) continue;
    const single = group[0];

    // Check this node has incoming edges (it serves traffic)
    const hasIncoming = edges.some((e) => e.target === single.id);
    if (!hasIncoming) continue;

    issues.push({
      id: issueId(),
      severity: 'critical',
      title: 'Single point of failure',
      description: `"${single.label}" is the only instance of its type and receives incoming traffic. If it goes down, that path is unavailable.`,
      suggestion: `Add at least one more instance of "${single.label}" behind a load balancer for redundancy.`,
      affectedNodes: [single.id],
    });
  }

  return issues;
};

// ── Rule: Missing caching layer ─────────────────────────────────────

const checkMissingCache: ReviewRule = (nodes, _edges) => {
  const hasDB = nodes.some((n) => n.category === 'storage' && !isCacheComponent(n));
  const hasCache = nodes.some((n) => isCacheComponent(n));

  if (hasDB && !hasCache) {
    const dbNodes = nodes.filter((n) => n.category === 'storage' && !isCacheComponent(n));
    return [
      {
        id: issueId(),
        severity: 'warning',
        title: 'No caching layer',
        description:
          'The design has database storage but no caching layer. Read-heavy workloads will hit the database directly, increasing latency and load.',
        suggestion:
          'Add a caching layer (e.g. Redis or Memcached) between your application servers and database. Use cache-aside for read-heavy data.',
        affectedNodes: dbNodes.map((n) => n.id),
      },
    ];
  }

  return [];
};

// ── Rule: No load balancer ──────────────────────────────────────────

const checkNoLoadBalancer: ReviewRule = (nodes, _edges) => {
  const hasLB = nodes.some((n) => n.category === 'load-balancing');
  const computeCount = nodes.filter((n) => n.category === 'compute').length;

  if (!hasLB && computeCount > 0) {
    const computeNodes = nodes.filter((n) => n.category === 'compute');
    return [
      {
        id: issueId(),
        severity: computeCount > 1 ? 'critical' : 'warning',
        title: 'No load balancer',
        description:
          computeCount > 1
            ? `The design has ${computeCount} compute nodes but no load balancer to distribute traffic across them.`
            : 'The design has no load balancer. Adding one enables horizontal scaling and provides a single entry point for health checks.',
        suggestion:
          'Add an L7 load balancer (e.g. ALB, Nginx) in front of your application servers to distribute traffic and enable horizontal scaling.',
        affectedNodes: computeNodes.map((n) => n.id),
      },
    ];
  }

  return [];
};

// ── Rule: Database without replication ──────────────────────────────

const checkDatabaseReplication: ReviewRule = (nodes, edges) => {
  const issues: ReviewIssue[] = [];

  const dbNodes = nodes.filter(
    (n) =>
      n.category === 'storage' &&
      !isCacheComponent(n) &&
      !isBlobStorage(n),
  );

  for (const db of dbNodes) {
    // Check if there is a replication edge from or to this DB
    const hasReplication = edges.some(
      (e) =>
        (e.source === db.id || e.target === db.id) &&
        e.edgeType === 'replication',
    );

    // Check if there is another node of the same componentType that could be a replica
    const hasReplica = nodes.some(
      (n) =>
        n.id !== db.id &&
        n.componentType === db.componentType &&
        n.category === 'storage',
    );

    if (!hasReplication && !hasReplica) {
      issues.push({
        id: issueId(),
        severity: 'warning',
        title: 'Database without replication',
        description: `"${db.label}" has no replication configured. A single database instance is a data loss risk and limits read throughput.`,
        suggestion: `Add at least one read replica for "${db.label}" with automatic failover to improve availability and read performance.`,
        affectedNodes: [db.id],
      });
    }
  }

  return issues;
};

// ── Rule: Missing monitoring / observability ────────────────────────

const checkMissingMonitoring: ReviewRule = (nodes, _edges) => {
  const hasObservability = nodes.some((n) => n.category === 'observability');

  if (!hasObservability && nodes.length >= 3) {
    return [
      {
        id: issueId(),
        severity: 'suggestion',
        title: 'No monitoring or observability',
        description:
          'The design does not include any monitoring, logging, or observability components. Without them, diagnosing issues in production is difficult.',
        suggestion:
          'Add monitoring (e.g. Prometheus + Grafana), structured logging (ELK stack), and distributed tracing (Jaeger/Zipkin) to gain visibility into system behaviour.',
        affectedNodes: [],
      },
    ];
  }

  return [];
};

// ── Rule: Client directly connects to database ──────────────────────

const checkDirectDbAccess: ReviewRule = (nodes, edges) => {
  const issues: ReviewIssue[] = [];

  const clientIds = new Set(
    nodes.filter((n) => n.category === 'client').map((n) => n.id),
  );
  const dbIds = new Set(
    nodes
      .filter((n) => n.category === 'storage' && !isCacheComponent(n))
      .map((n) => n.id),
  );

  for (const e of edges) {
    if (clientIds.has(e.source) && dbIds.has(e.target)) {
      issues.push({
        id: issueId(),
        severity: 'critical',
        title: 'Client directly accesses database',
        description:
          'A client node connects directly to a database, bypassing any API or service layer. This exposes the database to the public internet and makes authorization difficult.',
        suggestion:
          'Route all database access through an API/service layer. Never expose database connections to client applications.',
        affectedNodes: [e.source, e.target],
      });
    }
  }

  return issues;
};

// ── Rule: Missing API gateway in microservices ──────────────────────

const checkMissingApiGateway: ReviewRule = (nodes, edges) => {
  const microserviceCount = nodes.filter(
    (n) => n.componentType === 'microservice',
  ).length;

  if (microserviceCount < 2) return [];

  const hasGateway = nodes.some(
    (n) =>
      n.componentType === 'api-gateway' ||
      n.label.toLowerCase().includes('gateway'),
  );

  if (!hasGateway) {
    const clientNodes = nodes.filter((n) => n.category === 'client');
    const microserviceNodes = nodes.filter(
      (n) => n.componentType === 'microservice',
    );

    // Check if clients talk directly to microservices
    const clientIds = new Set(clientNodes.map((n) => n.id));
    const msIds = new Set(microserviceNodes.map((n) => n.id));
    const directAccess = edges.some(
      (e) => clientIds.has(e.source) && msIds.has(e.target),
    );

    if (directAccess) {
      return [
        {
          id: issueId(),
          severity: 'warning',
          title: 'Missing API gateway',
          description: `The design has ${microserviceCount} microservices accessed directly by clients. An API gateway provides a single entry point for routing, rate limiting, and authentication.`,
          suggestion:
            'Add an API gateway to aggregate microservice endpoints, handle cross-cutting concerns (auth, rate limiting, logging), and simplify client integration.',
          affectedNodes: microserviceNodes.map((n) => n.id),
        },
      ];
    }
  }

  return [];
};

// ── Rule: No async processing for heavy operations ──────────────────

const checkMissingAsyncProcessing: ReviewRule = (nodes, _edges) => {
  const hasProcessing = nodes.some((n) => n.category === 'processing');
  const hasMessaging = nodes.some((n) => n.category === 'messaging');
  const computeCount = nodes.filter((n) => n.category === 'compute').length;

  if (!hasMessaging && !hasProcessing && computeCount >= 2) {
    return [
      {
        id: issueId(),
        severity: 'suggestion',
        title: 'No asynchronous processing',
        description:
          'The design processes all operations synchronously. Long-running tasks on the request path increase latency and reduce throughput.',
        suggestion:
          'Identify operations that do not need to complete synchronously (emails, analytics, image processing) and process them asynchronously via a message queue.',
        affectedNodes: [],
      },
    ];
  }

  return [];
};

// ── All rules ───────────────────────────────────────────────────────

const ALL_RULES: ReviewRule[] = [
  checkSinglePointsOfFailure,
  checkMissingCache,
  checkNoLoadBalancer,
  checkDatabaseReplication,
  checkMissingMonitoring,
  checkDirectDbAccess,
  checkMissingApiGateway,
  checkMissingAsyncProcessing,
];

// ── Helpers ─────────────────────────────────────────────────────────

function isCacheComponent(node: ReviewNode): boolean {
  const ct = node.componentType.toLowerCase();
  const label = node.label.toLowerCase();
  return (
    ct.includes('redis') ||
    ct.includes('memcached') ||
    ct.includes('cache') ||
    label.includes('cache')
  );
}

function isBlobStorage(node: ReviewNode): boolean {
  const ct = node.componentType.toLowerCase();
  return ct.includes('s3') || ct.includes('blob') || ct.includes('gcs');
}

// ── Scoring ─────────────────────────────────────────────────────────

const SEVERITY_PENALTY: Record<IssueSeverity, number> = {
  critical: 20,
  warning: 10,
  suggestion: 3,
};

function calculateScore(issues: ReviewIssue[]): number {
  let penalty = 0;
  for (const issue of issues) {
    penalty += SEVERITY_PENALTY[issue.severity];
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

// ── Main review function ────────────────────────────────────────────

/**
 * Review a system design for common architectural issues.
 *
 * @param nodes  Simplified node descriptors.
 * @param edges  Simplified edge descriptors.
 * @returns `{ issues, suggestions, score }` where score is 0-100.
 */
export function reviewDesign(
  nodes: ReviewNode[],
  edges: ReviewEdge[],
): ReviewResult {
  // Reset counter for deterministic IDs within a single review
  issueCounter = 0;

  const issues: ReviewIssue[] = [];

  for (const rule of ALL_RULES) {
    issues.push(...rule(nodes, edges));
  }

  // Sort by severity: critical first, then warning, then suggestion
  const severityOrder: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 1,
    suggestion: 2,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Gather suggestions from all issues
  const suggestions = issues.map((i) => i.suggestion);

  const score = calculateScore(issues);

  return { issues, suggestions, score };
}

/**
 * Get the count of issues by severity.
 */
export function countBySeverity(
  issues: ReviewIssue[],
): Record<IssueSeverity, number> {
  const counts: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 0,
    suggestion: 0,
  };
  for (const issue of issues) {
    counts[issue.severity]++;
  }
  return counts;
}

/**
 * Get all unique node IDs affected by any issue.
 */
export function getAffectedNodeIds(issues: ReviewIssue[]): Set<string> {
  const ids = new Set<string>();
  for (const issue of issues) {
    for (const nodeId of issue.affectedNodes) {
      ids.add(nodeId);
    }
  }
  return ids;
}

/**
 * Get the highest severity for a given node across all issues.
 */
export function getNodeSeverity(
  nodeId: string,
  issues: ReviewIssue[],
): IssueSeverity | null {
  let highest: IssueSeverity | null = null;
  const priority: Record<IssueSeverity, number> = {
    critical: 0,
    warning: 1,
    suggestion: 2,
  };

  for (const issue of issues) {
    if (!issue.affectedNodes.includes(nodeId)) continue;
    if (highest === null || priority[issue.severity] < priority[highest]) {
      highest = issue.severity;
    }
  }

  return highest;
}

// ── AI-005: Claude-powered architectural analysis ───────────────────

export interface DesignReview extends ReviewResult {
  /** AI-generated insights (empty when AI not configured). */
  aiInsights: string[];
  /** AI-generated architectural recommendations. */
  aiRecommendations: string[];
}

/**
 * Review a design with optional AI enrichment.
 * Always runs static rules first, then optionally enriches with
 * Claude Sonnet analysis when configured.
 */
export async function reviewDesignWithAI(
  nodes: ReviewNode[],
  edges: ReviewEdge[],
  context?: string,
): Promise<DesignReview> {
  // 1. Always run static review
  const staticResult = reviewDesign(nodes, edges);
  const review: DesignReview = {
    ...staticResult,
    aiInsights: [],
    aiRecommendations: [],
  };

  // 2. Enrich with AI if configured
  const client = ClaudeClient.getInstance();
  if (!client.isConfigured()) return review;

  try {
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
    const staticIssues = staticResult.issues
      .map((i) => `[${i.severity}] ${i.title}: ${i.description}`)
      .join('\n');

    const response = await client.call({
      model: 'claude-sonnet-4-20250514',
      systemPrompt:
        'You are a senior systems architect reviewing a design diagram. Provide deeper analysis beyond basic pattern checks. Return a JSON object.',
      userMessage: `Review this system design for architectural quality.

Nodes: ${nodeSummary}
Edges: ${edgeSummary}
${context ? `Context: ${context}` : ''}

Static analysis already found these issues:
${staticIssues || '(none)'}

Provide additional insights a static checker would miss. Return JSON (no markdown fences):
{
  "insights": ["<deeper observation>", ...],
  "recommendations": ["<actionable recommendation>", ...],
  "score_adjustment": <number -20 to +10 to adjust the static score>
}`,
      maxTokens: 1024,
      cacheKey: `review:${nodeSummary.length}:${edgeSummary.length}:${staticResult.score}`,
      cacheTtlMs: 1_800_000, // 30 min
    });

    const parsed = JSON.parse(response.text) as {
      insights?: string[];
      recommendations?: string[];
      score_adjustment?: number;
    };

    review.aiInsights = parsed.insights ?? [];
    review.aiRecommendations = parsed.recommendations ?? [];

    if (typeof parsed.score_adjustment === 'number') {
      review.score = Math.max(0, Math.min(100, review.score + parsed.score_adjustment));
    }
  } catch {
    // AI call failed — return static review only
  }

  return review;
}

// ── AI-005: Design Fix Functions ────────────────────────────────────

let fixIdCounter = 0;
function nextFixId(prefix: string): string {
  return `${prefix}-${++fixIdCounter}`;
}

/**
 * Insert a load balancer in front of the target node, rewiring
 * all incoming edges through the new LB.
 */
export function addLoadBalancer(
  targetNodeId: string,
  nodes: ReviewNode[],
  edges: ReviewEdge[],
): { nodes: ReviewNode[]; edges: ReviewEdge[] } {
  const target = nodes.find((n) => n.id === targetNodeId);
  if (!target) return { nodes, edges };

  const lbId = nextFixId('lb');
  const lb: ReviewNode = {
    id: lbId,
    label: `LB (${target.label})`,
    category: 'load-balancing',
    componentType: 'load-balancer-l7',
  };

  const newNodes = [...nodes, lb];
  const newEdges = edges.map((e) =>
    e.target === targetNodeId
      ? { ...e, target: lbId, id: `${e.id}-rewired` }
      : e,
  );
  // Add edge from LB to target
  newEdges.push({
    id: nextFixId('edge'),
    source: lbId,
    target: targetNodeId,
    edgeType: 'http' as EdgeType,
  });

  return { nodes: newNodes, edges: newEdges };
}

/**
 * Insert a cache node upstream of the target node.
 */
export function addCache(
  targetNodeId: string,
  nodes: ReviewNode[],
  edges: ReviewEdge[],
): { nodes: ReviewNode[]; edges: ReviewEdge[] } {
  const target = nodes.find((n) => n.id === targetNodeId);
  if (!target) return { nodes, edges };

  const cacheId = nextFixId('cache');
  const cache: ReviewNode = {
    id: cacheId,
    label: `Cache (${target.label})`,
    category: 'storage',
    componentType: 'redis',
  };

  const newNodes = [...nodes, cache];

  // Find nodes that point to the target with db-query edges — insert cache
  const newEdges: ReviewEdge[] = [];
  for (const e of edges) {
    if (e.target === targetNodeId && (e.edgeType === 'db-query' || e.edgeType === 'http')) {
      // Reroute through cache
      newEdges.push({ ...e, target: cacheId, id: `${e.id}-to-cache` });
      newEdges.push({
        id: nextFixId('edge'),
        source: cacheId,
        target: targetNodeId,
        edgeType: 'cache-lookup' as EdgeType,
      });
    } else {
      newEdges.push(e);
    }
  }

  return { nodes: newNodes, edges: newEdges };
}

/**
 * Add a replica downstream of the target node with a replication edge.
 */
export function addReplica(
  targetNodeId: string,
  nodes: ReviewNode[],
  edges: ReviewEdge[],
): { nodes: ReviewNode[]; edges: ReviewEdge[] } {
  const target = nodes.find((n) => n.id === targetNodeId);
  if (!target) return { nodes, edges };

  const replicaId = nextFixId('replica');
  const replica: ReviewNode = {
    id: replicaId,
    label: `${target.label} (Replica)`,
    category: target.category,
    componentType: target.componentType,
  };

  const newNodes = [...nodes, replica];
  const newEdges = [
    ...edges,
    {
      id: nextFixId('edge'),
      source: targetNodeId,
      target: replicaId,
      edgeType: 'replication' as EdgeType,
    },
  ];

  return { nodes: newNodes, edges: newEdges };
}

/**
 * Add a monitoring node connected to all service/compute nodes.
 */
export function addMonitoring(
  nodes: ReviewNode[],
  edges: ReviewEdge[],
): { nodes: ReviewNode[]; edges: ReviewEdge[] } {
  const monitorId = nextFixId('monitor');
  const monitor: ReviewNode = {
    id: monitorId,
    label: 'Monitoring',
    category: 'observability',
    componentType: 'prometheus',
  };

  const newEdges = [...edges];
  const serviceNodes = nodes.filter(
    (n) => n.category === 'compute' || n.category === 'processing' || n.category === 'storage',
  );

  for (const svc of serviceNodes) {
    newEdges.push({
      id: nextFixId('edge'),
      source: svc.id,
      target: monitorId,
      edgeType: 'http' as EdgeType,
    });
  }

  return { nodes: [...nodes, monitor], edges: newEdges };
}

/**
 * Add an API gateway as the entry point, rewiring client edges.
 */
export function addGateway(
  nodes: ReviewNode[],
  edges: ReviewEdge[],
): { nodes: ReviewNode[]; edges: ReviewEdge[] } {
  const gatewayId = nextFixId('gateway');
  const gateway: ReviewNode = {
    id: gatewayId,
    label: 'API Gateway',
    category: 'networking',
    componentType: 'api-gateway',
  };

  const clientIds = new Set(
    nodes.filter((n) => n.category === 'client').map((n) => n.id),
  );

  const newEdges: ReviewEdge[] = [];
  const serviceTargets = new Set<string>();

  for (const e of edges) {
    if (clientIds.has(e.source)) {
      // Reroute client -> service to client -> gateway
      newEdges.push({ ...e, target: gatewayId, id: `${e.id}-to-gw` });
      serviceTargets.add(e.target);
    } else {
      newEdges.push(e);
    }
  }

  // Add edges from gateway to all original service targets
  for (const target of serviceTargets) {
    newEdges.push({
      id: nextFixId('edge'),
      source: gatewayId,
      target,
      edgeType: 'http' as EdgeType,
    });
  }

  return { nodes: [...nodes, gateway], edges: newEdges };
}
