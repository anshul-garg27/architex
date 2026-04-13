import { describe, it, expect } from 'vitest';
import {
  compareAPIs,
  getAPIQualitativeMetrics,
  getAPIRequestExamples,
  getAPIOperationDescriptions,
} from '@/lib/networking/api-comparison';
import type { APIOperation } from '@/lib/networking/api-comparison';

const ALL_OPERATIONS: APIOperation[] = [
  'list-users',
  'get-user-by-id',
  'create-user',
  'stream-updates',
];

// ── compareAPIs ──────────────────────────────────────────

describe('compareAPIs', () => {
  for (const op of ALL_OPERATIONS) {
    describe(`operation: ${op}`, () => {
      const result = compareAPIs(op);

      it('returns metrics for all three protocols', () => {
        expect(result.rest).toBeDefined();
        expect(result.graphql).toBeDefined();
        expect(result.grpc).toBeDefined();
      });

      it('each protocol has positive requests, bytes, and latency', () => {
        for (const proto of ['rest', 'graphql', 'grpc'] as const) {
          expect(result[proto].requests).toBeGreaterThan(0);
          expect(result[proto].totalBytes).toBeGreaterThan(0);
          expect(result[proto].latencyMs).toBeGreaterThan(0);
        }
      });

      it('gRPC has lowest byte count (binary encoding)', () => {
        expect(result.grpc.totalBytes).toBeLessThan(result.rest.totalBytes);
        expect(result.grpc.totalBytes).toBeLessThan(result.graphql.totalBytes);
      });

      it('gRPC has lowest latency (HTTP/2 + protobuf)', () => {
        expect(result.grpc.latencyMs).toBeLessThanOrEqual(result.rest.latencyMs);
        expect(result.grpc.latencyMs).toBeLessThanOrEqual(result.graphql.latencyMs);
      });

      it('GraphQL always uses exactly 1 request', () => {
        expect(result.graphql.requests).toBe(1);
      });

      it('gRPC always uses exactly 1 request', () => {
        expect(result.grpc.requests).toBe(1);
      });
    });
  }

  it('get-user-by-id requires 3 REST requests (user, posts, profile)', () => {
    const result = compareAPIs('get-user-by-id');
    expect(result.rest.requests).toBe(3);
  });

  it('stream-updates requires 10 REST polling requests', () => {
    const result = compareAPIs('stream-updates');
    expect(result.rest.requests).toBe(10);
  });

  it('list-users requires only 1 REST request', () => {
    const result = compareAPIs('list-users');
    expect(result.rest.requests).toBe(1);
  });

  it('GraphQL payload is smaller than REST (no over-fetching)', () => {
    const result = compareAPIs('list-users');
    expect(result.graphql.totalBytes).toBeLessThan(result.rest.totalBytes);
  });
});

// ── getAPIQualitativeMetrics ─────────────────────────────

describe('getAPIQualitativeMetrics', () => {
  const metrics = getAPIQualitativeMetrics();

  it('returns exactly 3 protocol entries', () => {
    expect(metrics).toHaveLength(3);
  });

  it('covers REST, GraphQL, and gRPC', () => {
    const protocols = metrics.map((m) => m.protocol);
    expect(protocols).toContain('REST');
    expect(protocols).toContain('GraphQL');
    expect(protocols).toContain('gRPC');
  });

  it('each entry has all required metric fields', () => {
    for (const m of metrics) {
      expect(m.streamingSupport).toBeTruthy();
      expect(m.browserSupport).toBeTruthy();
      expect(m.codeGeneration).toBeTruthy();
      expect(m.schemaEnforcement).toBeTruthy();
      expect(m.learningCurve).toBeTruthy();
      expect(m.payloadEfficiency).toBeTruthy();
    }
  });

  it('each entry has explanatory notes for all features', () => {
    for (const m of metrics) {
      expect(m.notes.streamingSupport.length).toBeGreaterThan(10);
      expect(m.notes.browserSupport.length).toBeGreaterThan(10);
      expect(m.notes.codeGeneration.length).toBeGreaterThan(10);
      expect(m.notes.schemaEnforcement.length).toBeGreaterThan(10);
      expect(m.notes.learningCurve.length).toBeGreaterThan(10);
    }
  });

  it('gRPC has full streaming support', () => {
    const grpc = metrics.find((m) => m.protocol === 'gRPC')!;
    expect(grpc.streamingSupport).toBe('full');
  });

  it('REST has limited streaming support', () => {
    const rest = metrics.find((m) => m.protocol === 'REST')!;
    expect(rest.streamingSupport).toBe('limited');
  });

  it('REST has full browser support', () => {
    const rest = metrics.find((m) => m.protocol === 'REST')!;
    expect(rest.browserSupport).toBe('full');
  });

  it('gRPC has limited browser support', () => {
    const grpc = metrics.find((m) => m.protocol === 'gRPC')!;
    expect(grpc.browserSupport).toBe('limited');
  });

  it('gRPC has full code generation', () => {
    const grpc = metrics.find((m) => m.protocol === 'gRPC')!;
    expect(grpc.codeGeneration).toBe('full');
  });

  it('GraphQL has full schema enforcement', () => {
    const gql = metrics.find((m) => m.protocol === 'GraphQL')!;
    expect(gql.schemaEnforcement).toBe('full');
  });

  it('REST has lowest learning curve', () => {
    const rest = metrics.find((m) => m.protocol === 'REST')!;
    expect(rest.learningCurve).toBe('low');
  });

  it('gRPC has highest learning curve', () => {
    const grpc = metrics.find((m) => m.protocol === 'gRPC')!;
    expect(grpc.learningCurve).toBe('high');
  });
});

// ── getAPIRequestExamples ────────────────────────────────

describe('getAPIRequestExamples', () => {
  for (const op of ALL_OPERATIONS) {
    describe(`operation: ${op}`, () => {
      const examples = getAPIRequestExamples(op);

      it('returns examples for all three protocols', () => {
        expect(examples.rest).toBeDefined();
        expect(examples.graphql).toBeDefined();
        expect(examples.grpc).toBeDefined();
      });

      it('each example has protocol, request, response, and payloadBytes', () => {
        for (const proto of ['rest', 'graphql', 'grpc'] as const) {
          const ex = examples[proto];
          expect(ex.protocol).toBeTruthy();
          expect(ex.request.length).toBeGreaterThan(10);
          expect(ex.response.length).toBeGreaterThan(10);
          expect(ex.payloadBytes).toBeGreaterThan(0);
        }
      });

      it('gRPC example payload is smallest', () => {
        expect(examples.grpc.payloadBytes).toBeLessThan(examples.rest.payloadBytes);
      });

      it('REST example shows HTTP method and path', () => {
        expect(examples.rest.request).toMatch(/GET|POST|PUT|DELETE/);
      });

      it('GraphQL example contains query or mutation keyword', () => {
        expect(examples.graphql.request).toMatch(/query|mutation|subscription/i);
      });

      it('gRPC example references protobuf messages', () => {
        expect(examples.grpc.request).toMatch(/message|rpc|service/i);
      });
    });
  }
});

// ── getAPIOperationDescriptions ──────────────────────────

describe('getAPIOperationDescriptions', () => {
  for (const op of ALL_OPERATIONS) {
    it(`${op} returns descriptions for all 3 protocols`, () => {
      const desc = getAPIOperationDescriptions(op);
      expect(desc.rest.length).toBeGreaterThan(20);
      expect(desc.graphql.length).toBeGreaterThan(20);
      expect(desc.grpc.length).toBeGreaterThan(20);
    });
  }
});

// ── Data consistency across functions ────────────────────

describe('data consistency', () => {
  it('all operations in compareAPIs also have request examples', () => {
    for (const op of ALL_OPERATIONS) {
      expect(() => compareAPIs(op)).not.toThrow();
      expect(() => getAPIRequestExamples(op)).not.toThrow();
      expect(() => getAPIOperationDescriptions(op)).not.toThrow();
    }
  });

  it('qualitative metrics are stable across calls', () => {
    const m1 = getAPIQualitativeMetrics();
    const m2 = getAPIQualitativeMetrics();
    expect(m1).toEqual(m2);
  });
});
