import { describe, it, expect } from 'vitest';
import { exportToMermaid } from '../to-mermaid';
import type { Node, Edge } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  label: string,
  data: Record<string, unknown> = {},
): Node {
  return {
    id,
    type: 'system-design',
    position: { x: 0, y: 0 },
    data: { label, ...data },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  data: Record<string, unknown> = {},
): Edge {
  return { id, source, target, data };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('exportToMermaid', () => {
  // ── Basic structure ──────────────────────────────────────────

  it('starts with "graph LR"', () => {
    const result = exportToMermaid([], []);
    expect(result).toMatch(/^graph LR/);
  });

  it('generates node declarations', () => {
    const nodes = [makeNode('api-server', 'API Server')];
    const result = exportToMermaid(nodes, []);

    expect(result).toContain('api_server');
    expect(result).toContain('API Server');
  });

  it('generates edge declarations', () => {
    const nodes = [
      makeNode('a', 'Service A'),
      makeNode('b', 'Service B'),
    ];
    const edges = [makeEdge('e1', 'a', 'b')];
    const result = exportToMermaid(nodes, edges);

    expect(result).toContain('a -->');
    expect(result).toContain('b');
  });

  // ── Node shapes ──────────────────────────────────────────────

  it('uses cylindrical shape for database nodes', () => {
    const nodes = [makeNode('db', 'PostgreSQL', { componentType: 'database' })];
    const result = exportToMermaid(nodes, []);

    expect(result).toContain('[(');
    expect(result).toContain(')]');
  });

  it('uses flag shape for queue nodes', () => {
    const nodes = [makeNode('q', 'SQS', { componentType: 'sqs-queue' })];
    const result = exportToMermaid(nodes, []);

    expect(result).toContain('>');
  });

  it('uses double-circle for client nodes', () => {
    const nodes = [makeNode('c', 'Browser', { category: 'client' })];
    const result = exportToMermaid(nodes, []);

    expect(result).toContain('((');
    expect(result).toContain('))');
  });

  it('uses stadium shape for cache nodes', () => {
    const nodes = [makeNode('r', 'Redis', { componentType: 'redis-cache' })];
    const result = exportToMermaid(nodes, []);

    expect(result).toContain('([');
    expect(result).toContain('])');
  });

  it('uses rectangle for default service nodes', () => {
    const nodes = [makeNode('svc', 'API', { componentType: 'api-server' })];
    const result = exportToMermaid(nodes, []);

    expect(result).toMatch(/\[API\]/);
  });

  // ── Edge arrows ──────────────────────────────────────────────

  it('uses bidirectional arrow for websocket edges', () => {
    const nodes = [makeNode('a', 'A'), makeNode('b', 'B')];
    const edges = [makeEdge('e1', 'a', 'b', { edgeType: 'websocket' })];
    const result = exportToMermaid(nodes, edges);

    expect(result).toContain('<-->');
  });

  it('uses dotted arrow for message-queue edges', () => {
    const nodes = [makeNode('a', 'A'), makeNode('b', 'B')];
    const edges = [makeEdge('e1', 'a', 'b', { edgeType: 'message-queue' })];
    const result = exportToMermaid(nodes, edges);

    expect(result).toContain('-.->');
  });

  it('uses thick arrow for replication edges', () => {
    const nodes = [makeNode('a', 'A'), makeNode('b', 'B')];
    const edges = [makeEdge('e1', 'a', 'b', { edgeType: 'replication' })];
    const result = exportToMermaid(nodes, edges);

    expect(result).toContain('==>');
  });

  // ── Edge labels ──────────────────────────────────────────────

  it('includes latency in edge label when present', () => {
    const nodes = [makeNode('a', 'A'), makeNode('b', 'B')];
    const edges = [makeEdge('e1', 'a', 'b', { edgeType: 'http', latency: 50 })];
    const result = exportToMermaid(nodes, edges);

    expect(result).toContain('50ms');
    expect(result).toContain('HTTP');
  });

  // ── Sanitization ─────────────────────────────────────────────

  it('sanitizes special characters from labels', () => {
    const nodes = [makeNode('n1', 'Load [Balancer] (L7)')];
    const result = exportToMermaid(nodes, []);

    // Should not contain brackets or parens from the original label
    expect(result).not.toMatch(/\[Balancer\]/);
    expect(result).toContain('Load Balancer L7');
  });

  it('replaces non-alphanumeric characters in node IDs', () => {
    const nodes = [makeNode('my-node.1', 'Test')];
    const result = exportToMermaid(nodes, []);

    expect(result).toContain('my_node_1');
  });
});
