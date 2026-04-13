import { describe, it, expect } from 'vitest';
import {
  reviewDesign,
  countBySeverity,
  getAffectedNodeIds,
  getNodeSeverity,
  type ReviewNode,
  type ReviewEdge,
} from '@/lib/ai/design-reviewer';

// ── Test helpers ────────────────────────────────────────────────────

function makeNode(
  id: string,
  label: string,
  category: ReviewNode['category'],
  componentType: string,
): ReviewNode {
  return { id, label, category, componentType };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  edgeType: ReviewEdge['edgeType'],
): ReviewEdge {
  return { id, source, target, edgeType };
}

describe('design-reviewer', () => {
  // ── Single points of failure ──────────────────────────────────

  describe('single points of failure', () => {
    it('detects a single compute node with incoming traffic', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const spofIssues = result.issues.filter(
        (i) => i.title === 'Single point of failure',
      );
      expect(spofIssues.length).toBeGreaterThan(0);
      expect(spofIssues[0].affectedNodes).toContain('api');
      expect(spofIssues[0].severity).toBe('critical');
    });

    it('does not flag compute nodes that have multiple instances', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api1', 'API Server 1', 'compute', 'web-server'),
        makeNode('api2', 'API Server 2', 'compute', 'web-server'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api1', 'http'),
        makeEdge('e2', 'client', 'api2', 'http'),
      ];

      const result = reviewDesign(nodes, edges);
      const spofIssues = result.issues.filter(
        (i) => i.title === 'Single point of failure',
      );
      expect(spofIssues).toHaveLength(0);
    });

    it('does not flag compute nodes without incoming edges', () => {
      const nodes: ReviewNode[] = [
        makeNode('worker', 'Background Worker', 'compute', 'worker'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const spofIssues = result.issues.filter(
        (i) => i.title === 'Single point of failure',
      );
      expect(spofIssues).toHaveLength(0);
    });
  });

  // ── Missing caching layer ─────────────────────────────────────

  describe('missing caching layer', () => {
    it('detects missing cache when database exists but no cache', () => {
      const nodes: ReviewNode[] = [
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const cacheIssues = result.issues.filter(
        (i) => i.title === 'No caching layer',
      );
      expect(cacheIssues).toHaveLength(1);
      expect(cacheIssues[0].severity).toBe('warning');
    });

    it('does not flag when cache is present', () => {
      const nodes: ReviewNode[] = [
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('cache', 'Redis Cache', 'storage', 'redis'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'api', 'cache', 'cache-lookup'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const cacheIssues = result.issues.filter(
        (i) => i.title === 'No caching layer',
      );
      expect(cacheIssues).toHaveLength(0);
    });

    it('recognises memcached as a cache', () => {
      const nodes: ReviewNode[] = [
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('mc', 'Memcached', 'storage', 'memcached'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const cacheIssues = result.issues.filter(
        (i) => i.title === 'No caching layer',
      );
      expect(cacheIssues).toHaveLength(0);
    });
  });

  // ── No load balancer ──────────────────────────────────────────

  describe('no load balancer', () => {
    it('detects missing load balancer when compute nodes exist', () => {
      const nodes: ReviewNode[] = [
        makeNode('api1', 'API Server 1', 'compute', 'web-server'),
        makeNode('api2', 'API Server 2', 'compute', 'web-server'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const lbIssues = result.issues.filter(
        (i) => i.title === 'No load balancer',
      );
      expect(lbIssues).toHaveLength(1);
      // With multiple compute nodes, this should be critical
      expect(lbIssues[0].severity).toBe('critical');
    });

    it('reports warning (not critical) with single compute node', () => {
      const nodes: ReviewNode[] = [
        makeNode('api', 'API Server', 'compute', 'web-server'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const lbIssues = result.issues.filter(
        (i) => i.title === 'No load balancer',
      );
      expect(lbIssues).toHaveLength(1);
      expect(lbIssues[0].severity).toBe('warning');
    });

    it('does not flag when load balancer is present', () => {
      const nodes: ReviewNode[] = [
        makeNode('lb', 'Load Balancer', 'load-balancing', 'load-balancer-l7'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'lb', 'api', 'http'),
      ];

      const result = reviewDesign(nodes, edges);
      const lbIssues = result.issues.filter(
        (i) => i.title === 'No load balancer',
      );
      expect(lbIssues).toHaveLength(0);
    });
  });

  // ── Database without replication ──────────────────────────────

  describe('database without replication', () => {
    it('detects unreplicated database', () => {
      const nodes: ReviewNode[] = [
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const repIssues = result.issues.filter(
        (i) => i.title === 'Database without replication',
      );
      expect(repIssues).toHaveLength(1);
      expect(repIssues[0].severity).toBe('warning');
      expect(repIssues[0].affectedNodes).toContain('db');
    });

    it('does not flag when replication edge exists', () => {
      const nodes: ReviewNode[] = [
        makeNode('db-primary', 'Primary DB', 'storage', 'postgresql'),
        makeNode('db-replica', 'Replica DB', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'db-primary', 'db-replica', 'replication'),
      ];

      const result = reviewDesign(nodes, edges);
      const repIssues = result.issues.filter(
        (i) => i.title === 'Database without replication',
      );
      expect(repIssues).toHaveLength(0);
    });

    it('does not flag when multiple instances of same DB type exist', () => {
      const nodes: ReviewNode[] = [
        makeNode('db1', 'DB Node 1', 'storage', 'cassandra'),
        makeNode('db2', 'DB Node 2', 'storage', 'cassandra'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const repIssues = result.issues.filter(
        (i) => i.title === 'Database without replication',
      );
      expect(repIssues).toHaveLength(0);
    });

    it('ignores blob storage (S3) for replication check', () => {
      const nodes: ReviewNode[] = [
        makeNode('blob', 'S3 Bucket', 'storage', 's3'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const repIssues = result.issues.filter(
        (i) => i.title === 'Database without replication',
      );
      expect(repIssues).toHaveLength(0);
    });

    it('ignores cache nodes for replication check', () => {
      const nodes: ReviewNode[] = [
        makeNode('cache', 'Redis Cache', 'storage', 'redis'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const repIssues = result.issues.filter(
        (i) => i.title === 'Database without replication',
      );
      expect(repIssues).toHaveLength(0);
    });
  });

  // ── Missing monitoring ────────────────────────────────────────

  describe('missing monitoring', () => {
    it('detects missing monitoring in designs with 3+ nodes', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const monIssues = result.issues.filter(
        (i) => i.title === 'No monitoring or observability',
      );
      expect(monIssues).toHaveLength(1);
      expect(monIssues[0].severity).toBe('suggestion');
    });

    it('does not flag when observability node is present', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
        makeNode('monitoring', 'Prometheus', 'observability', 'prometheus'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const monIssues = result.issues.filter(
        (i) => i.title === 'No monitoring or observability',
      );
      expect(monIssues).toHaveLength(0);
    });

    it('does not flag tiny designs (< 3 nodes)', () => {
      const nodes: ReviewNode[] = [
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [];

      const result = reviewDesign(nodes, edges);
      const monIssues = result.issues.filter(
        (i) => i.title === 'No monitoring or observability',
      );
      expect(monIssues).toHaveLength(0);
    });
  });

  // ── Client directly accesses database ─────────────────────────

  describe('direct database access', () => {
    it('detects client-to-database connection', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const directIssues = result.issues.filter(
        (i) => i.title === 'Client directly accesses database',
      );
      expect(directIssues).toHaveLength(1);
      expect(directIssues[0].severity).toBe('critical');
      expect(directIssues[0].affectedNodes).toContain('client');
      expect(directIssues[0].affectedNodes).toContain('db');
    });

    it('does not flag client-to-API connections', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
      ];

      const result = reviewDesign(nodes, edges);
      const directIssues = result.issues.filter(
        (i) => i.title === 'Client directly accesses database',
      );
      expect(directIssues).toHaveLength(0);
    });
  });

  // ── Score calculation ─────────────────────────────────────────

  describe('score calculation', () => {
    it('returns 100 for a design with no issues', () => {
      // Well-designed architecture with all bases covered
      const nodes: ReviewNode[] = [
        makeNode('lb', 'Load Balancer', 'load-balancing', 'load-balancer-l7'),
        makeNode('api1', 'API Server 1', 'compute', 'web-server'),
        makeNode('api2', 'API Server 2', 'compute', 'web-server'),
        makeNode('cache', 'Redis', 'storage', 'redis'),
        makeNode('db1', 'Primary DB', 'storage', 'postgresql'),
        makeNode('db2', 'Replica DB', 'storage', 'postgresql'),
        makeNode('queue', 'Kafka', 'messaging', 'kafka'),
        makeNode('worker1', 'Worker 1', 'processing', 'worker'),
        makeNode('worker2', 'Worker 2', 'processing', 'worker'),
        makeNode('monitoring', 'Prometheus', 'observability', 'prometheus'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'lb', 'api1', 'http'),
        makeEdge('e2', 'lb', 'api2', 'http'),
        makeEdge('e3', 'api1', 'cache', 'cache-lookup'),
        makeEdge('e4', 'api1', 'db1', 'db-query'),
        makeEdge('e5', 'db1', 'db2', 'replication'),
        makeEdge('e6', 'api1', 'queue', 'event-stream'),
        makeEdge('e7', 'queue', 'worker1', 'message-queue'),
        makeEdge('e8', 'queue', 'worker2', 'message-queue'),
      ];

      const result = reviewDesign(nodes, edges);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });

    it('reduces score for critical issues', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      expect(result.score).toBeLessThan(100);
    });

    it('never returns a score below 0', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Issue ordering ────────────────────────────────────────────

  describe('issue ordering', () => {
    it('sorts issues by severity: critical first', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      if (result.issues.length >= 2) {
        const severities = result.issues.map((i) => i.severity);
        const criticalIdx = severities.indexOf('critical');
        const warningIdx = severities.indexOf('warning');
        const suggestionIdx = severities.indexOf('suggestion');

        if (criticalIdx >= 0 && warningIdx >= 0) {
          expect(criticalIdx).toBeLessThan(warningIdx);
        }
        if (warningIdx >= 0 && suggestionIdx >= 0) {
          expect(warningIdx).toBeLessThan(suggestionIdx);
        }
      }
    });
  });

  // ── Helper functions ──────────────────────────────────────────

  describe('countBySeverity', () => {
    it('counts issues correctly', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const counts = countBySeverity(result.issues);

      expect(counts.critical + counts.warning + counts.suggestion).toBe(
        result.issues.length,
      );
    });

    it('returns zeros for no issues', () => {
      const counts = countBySeverity([]);
      expect(counts.critical).toBe(0);
      expect(counts.warning).toBe(0);
      expect(counts.suggestion).toBe(0);
    });
  });

  describe('getAffectedNodeIds', () => {
    it('returns all unique affected node IDs', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);
      const affected = getAffectedNodeIds(result.issues);

      // Should be a set (unique IDs)
      expect(affected).toBeInstanceOf(Set);
    });
  });

  describe('getNodeSeverity', () => {
    it('returns the highest severity for a node', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
        makeNode('db', 'PostgreSQL', 'storage', 'postgresql'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
        makeEdge('e2', 'api', 'db', 'db-query'),
      ];

      const result = reviewDesign(nodes, edges);

      // The 'api' node should be flagged as a SPOF (critical)
      const severity = getNodeSeverity('api', result.issues);
      expect(severity).toBe('critical');
    });

    it('returns null for a node with no issues', () => {
      const nodes: ReviewNode[] = [
        makeNode('client', 'Client', 'client', 'web-browser'),
        makeNode('api', 'API Server', 'compute', 'web-server'),
      ];
      const edges: ReviewEdge[] = [
        makeEdge('e1', 'client', 'api', 'http'),
      ];

      const result = reviewDesign(nodes, edges);
      const severity = getNodeSeverity('client', result.issues);
      expect(severity).toBeNull();
    });
  });
});
