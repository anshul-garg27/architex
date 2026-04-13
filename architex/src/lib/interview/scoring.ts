// ── Multi-dimensional scoring rubric for system design interviews ───

export interface ScoringDimension {
  id: string;
  name: string;
  weight: number;
  description: string;
  rubric: {
    1: string; 2: string; 3: string; 4: string; 5: string;
    6: string; 7: string; 8: string; 9: string; 10: string;
  };
}

export const SCORING_DIMENSIONS: ScoringDimension[] = [
  {
    id: 'functional',
    name: 'Functional Requirements',
    weight: 0.20,
    description: 'Ability to identify, clarify, and prioritize the core features the system must support.',
    rubric: {
      1: 'No requirements identified; jumped straight into design without understanding what to build.',
      2: 'Mentioned one vague requirement with no prioritization or scope discussion.',
      3: 'Listed a few requirements but missed critical features and did not clarify ambiguities.',
      4: 'Identified most obvious requirements but missed edge cases and did not discuss scope boundaries.',
      5: 'Covered core requirements and attempted prioritization; some gaps in secondary features.',
      6: 'Solid requirement gathering with clear MVP scope; asked clarifying questions proactively.',
      7: 'Comprehensive requirements with explicit priorities; distinguished must-have from nice-to-have.',
      8: 'Thorough functional spec covering core, secondary, and edge-case scenarios with clear acceptance criteria.',
      9: 'Expert-level requirements analysis with phased delivery plan, capacity estimates tied to each feature, and clear non-functional boundaries.',
      10: 'Exceptional: complete functional decomposition with user journey mapping, capacity implications per feature, phased rollout strategy, and explicit out-of-scope boundaries.',
    },
  },
  {
    id: 'api',
    name: 'API Design',
    weight: 0.15,
    description: 'Quality of interface design including endpoints, contracts, versioning, and error handling.',
    rubric: {
      1: 'No API design discussed; no mention of interfaces or contracts.',
      2: 'Mentioned a single endpoint name with no request/response structure.',
      3: 'Sketched a couple of endpoints but with inconsistent naming and no error handling.',
      4: 'Basic REST endpoints defined with some request/response fields; missing pagination, auth, and versioning.',
      5: 'Reasonable API surface with proper HTTP methods; basic error codes but incomplete contracts.',
      6: 'Well-structured RESTful API with consistent naming, pagination, and standard error responses.',
      7: 'Clean API design with versioning strategy, rate limiting headers, idempotency keys, and clear schemas.',
      8: 'Comprehensive API with OpenAPI-level detail, proper status codes, HATEOAS considerations, and backward compatibility plan.',
      9: 'Production-grade API design with webhooks, streaming endpoints where appropriate, SDK-friendly contracts, and deprecation strategy.',
      10: 'Exceptional: complete API ecosystem design with GraphQL/REST tradeoff analysis, API gateway patterns, client SDK considerations, and evolution strategy.',
    },
  },
  {
    id: 'dataModel',
    name: 'Data Model',
    weight: 0.15,
    description: 'Database schema design, storage engine selection, indexing strategy, and data access patterns.',
    rubric: {
      1: 'No data model discussed; no mention of storage or data structures.',
      2: 'Mentioned a database type with no schema or table design.',
      3: 'Basic table sketch with primary keys but no relationships, indexes, or access pattern discussion.',
      4: 'Reasonable schema with a few tables and basic relationships; missing indexing strategy and capacity planning.',
      5: 'Decent data model with normalized tables, primary/foreign keys, and basic index considerations.',
      6: 'Solid schema with clear access patterns driving index choices; appropriate denormalization where needed.',
      7: 'Well-designed data model with composite indexes, partition keys, read/write ratio analysis, and storage engine justification.',
      8: 'Comprehensive model with sharding key selection, hot-spot mitigation, secondary indexes, and migration strategy.',
      9: 'Expert data modeling with multi-storage polyglot design, CQRS where appropriate, event sourcing considerations, and data lifecycle management.',
      10: 'Exceptional: complete data architecture with storage engine benchmarks, partition strategy analysis, consistency model selection, and capacity growth projections.',
    },
  },
  {
    id: 'scalability',
    name: 'Scalability',
    weight: 0.20,
    description: 'Ability to design systems that handle growth in users, data, and traffic.',
    rubric: {
      1: 'No consideration of load or scale; single-server design with no growth discussion.',
      2: 'Mentioned "we can scale later" with no concrete approach.',
      3: 'Added a load balancer or cache but with no justification or capacity math.',
      4: 'Basic horizontal scaling mentioned with load balancer and cache; no back-of-envelope calculations.',
      5: 'Reasonable scaling approach with caching layer and database replication; rough capacity estimates.',
      6: 'Solid scaling design with read replicas, cache hierarchy, and basic throughput calculations.',
      7: 'Well-thought scaling with sharding strategy, async processing queues, CDN integration, and bottleneck identification.',
      8: 'Comprehensive scaling with geographic distribution, multi-tier caching, auto-scaling policies, and load testing strategy.',
      9: 'Expert-level scaling with detailed capacity planning, hot-spot mitigation, back-pressure mechanisms, and graceful degradation under load.',
      10: 'Exceptional: comprehensive horizontal scaling with sharding, multi-layer caching, CDN, async processing, clear bottleneck analysis, and quantified capacity at each tier.',
    },
  },
  {
    id: 'reliability',
    name: 'Reliability',
    weight: 0.15,
    description: 'Fault tolerance, redundancy, monitoring, and disaster recovery capabilities.',
    rubric: {
      1: 'No reliability considerations; single points of failure everywhere.',
      2: 'Mentioned "we need backups" with no concrete redundancy plan.',
      3: 'Added basic redundancy for one component but left multiple single points of failure.',
      4: 'Database replication and basic health checks; no circuit breakers or graceful degradation.',
      5: 'Reasonable redundancy with replicas and retries; basic monitoring mentioned but incomplete failure mode analysis.',
      6: 'Solid reliability with multi-AZ deployment, circuit breakers, and structured logging/alerting.',
      7: 'Well-designed fault tolerance with bulkheads, retry with backoff, dead-letter queues, and runbook references.',
      8: 'Comprehensive reliability with chaos engineering approach, SLO/SLA definitions, and automated failover procedures.',
      9: 'Expert reliability engineering with disaster recovery plan, RTO/RPO targets, multi-region failover, and data consistency guarantees during failures.',
      10: 'Exceptional: complete reliability framework with quantified SLOs, automated chaos testing, zero-downtime deploys, multi-region active-active, and incident response procedures.',
    },
  },
  {
    id: 'tradeoffs',
    name: 'Trade-off Awareness',
    weight: 0.15,
    description: 'Ability to articulate design decisions, alternatives considered, and their implications.',
    rubric: {
      1: 'No tradeoffs discussed; presented a single solution as the only option.',
      2: 'Made choices without explaining why or what alternatives exist.',
      3: 'Mentioned one alternative for one decision but did not analyze pros/cons.',
      4: 'Discussed a couple of tradeoffs but with surface-level analysis and no data to support choices.',
      5: 'Reasonable tradeoff discussions for major decisions; acknowledged CAP theorem or similar constraints.',
      6: 'Solid tradeoff analysis with clear pros/cons for key decisions; considered cost, complexity, and latency.',
      7: 'Well-articulated tradeoffs with quantified comparisons; discussed consistency models, storage engines, and communication patterns.',
      8: 'Comprehensive tradeoff analysis with decision matrices, technology comparisons backed by benchmarks or experience.',
      9: 'Expert tradeoff awareness with second-order effects analysis, reversibility assessment, and migration cost considerations.',
      10: 'Exceptional: systematic tradeoff framework covering technical, operational, and business dimensions with clear decision rationale and future flexibility analysis.',
    },
  },
  {
    id: 'simulation',
    name: 'Simulation',
    weight: 0.0,
    description: 'Automated scoring via simulation engine: availability, latency, error rate, and SPOF detection.',
    rubric: {
      1: 'System fails immediately under any load; no redundancy or fault tolerance.',
      2: 'System handles minimal load but collapses under slight traffic increase.',
      3: 'Basic single-path architecture; availability below 95% in simulation.',
      4: 'Some redundancy but critical SPOFs remain; availability around 95-98%.',
      5: 'Reasonable architecture with caching and replication; availability around 98-99%.',
      6: 'Solid design with load balancing and failover; availability above 99%.',
      7: 'Well-designed system with circuit breakers and monitoring; P99 under 500ms.',
      8: 'Comprehensive fault-tolerant design; availability above 99.5%, P99 under 200ms.',
      9: 'Production-grade architecture with zero SPOFs; availability above 99.9%.',
      10: 'Exceptional: zero SPOFs, availability above 99.99%, P99 under 100ms, full observability.',
    },
  },
];

/**
 * Calculate weighted overall score from per-dimension scores.
 * Missing dimensions are treated as 0.
 */
export function calculateOverallScore(scores: Record<string, number>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const dim of SCORING_DIMENSIONS) {
    const score = scores[dim.id];
    if (score != null) {
      weightedSum += score * dim.weight;
      totalWeight += dim.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Map a numeric score to a human-readable label.
 */
export function getScoreLabel(
  score: number,
): 'Needs Improvement' | 'Below Average' | 'Average' | 'Good' | 'Excellent' | 'Outstanding' {
  if (score < 3) return 'Needs Improvement';
  if (score < 5) return 'Below Average';
  if (score < 6.5) return 'Average';
  if (score < 8) return 'Good';
  if (score < 9.5) return 'Excellent';
  return 'Outstanding';
}

/**
 * Generate structured feedback from dimension scores.
 */
export function generateFeedback(scores: Record<string, number>): {
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
} {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const nextSteps: string[] = [];

  const sorted = SCORING_DIMENSIONS
    .filter((d) => scores[d.id] != null)
    .map((d) => ({ dim: d, score: scores[d.id] }))
    .sort((a, b) => b.score - a.score);

  // Top dimensions are strengths
  for (const entry of sorted) {
    if (entry.score >= 7) {
      strengths.push(`Strong ${entry.dim.name} (${entry.score}/10): ${entry.dim.rubric[entry.score as keyof typeof entry.dim.rubric] ?? entry.dim.rubric[Math.floor(entry.score) as keyof typeof entry.dim.rubric]}`);
    }
  }

  if (strengths.length === 0 && sorted.length > 0) {
    const best = sorted[0];
    strengths.push(`Relative strength in ${best.dim.name} (${best.score}/10).`);
  }

  // Bottom dimensions are improvements
  for (const entry of sorted) {
    if (entry.score < 6) {
      const targetLevel = Math.min(entry.score + 2, 10) as keyof typeof entry.dim.rubric;
      improvements.push(`Improve ${entry.dim.name} (${entry.score}/10): aim for level ${targetLevel} -- "${entry.dim.rubric[targetLevel]}".`);
    }
  }

  // Generate next steps based on weakest areas
  const weakest = sorted.slice().sort((a, b) => a.score - b.score);
  const nextStepMap: Record<string, string> = {
    functional: 'Practice requirement gathering by writing PRDs for 3 different systems before designing them.',
    api: 'Study REST/GraphQL best practices and design 5 complete API contracts with OpenAPI specs.',
    dataModel: 'Design schemas for 3 different access patterns (read-heavy, write-heavy, mixed) and justify your index choices.',
    scalability: 'Do back-of-envelope calculations for every design; practice estimating QPS, storage, and bandwidth.',
    reliability: 'Study failure modes of distributed systems; practice designing circuit breakers and bulkhead patterns.',
    tradeoffs: 'For every design decision, write down 2 alternatives with pros/cons before committing to one.',
  };

  for (const entry of weakest.slice(0, 3)) {
    const step = nextStepMap[entry.dim.id];
    if (step) {
      nextSteps.push(step);
    }
  }

  return { strengths, improvements, nextSteps };
}
