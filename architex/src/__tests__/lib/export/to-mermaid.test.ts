import { describe, it, expect } from 'vitest';
import { exportToMermaid } from '@/lib/export/to-mermaid';
import type { Node, Edge } from '@xyflow/react';

function makeNode(
  id: string,
  label: string,
  overrides: Record<string, unknown> = {},
): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      label,
      category: 'compute',
      componentType: 'web-server',
      ...overrides,
    },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  data?: Record<string, unknown>,
): Edge {
  return { id, source, target, data };
}

describe('to-mermaid export', () => {
  it('outputs a graph LR header', () => {
    const output = exportToMermaid([], []);
    expect(output).toContain('graph LR');
  });

  it('includes node declarations with Mermaid-safe ids', () => {
    const nodes = [makeNode('node-1', 'API Gateway')];
    const output = exportToMermaid(nodes, []);
    // The id should be sanitized: 'node-1' -> 'node_1'
    expect(output).toContain('node_1');
    expect(output).toContain('API Gateway');
  });

  it('uses cylindrical shape for database nodes', () => {
    const nodes = [makeNode('db1', 'PostgreSQL', { category: 'storage' })];
    const output = exportToMermaid(nodes, []);
    // Database shape: [(label)]
    expect(output).toContain('[(');
    expect(output).toContain('PostgreSQL');
  });

  it('uses flag shape for queue/messaging nodes', () => {
    const nodes = [makeNode('q1', 'Kafka', { category: 'messaging' })];
    const output = exportToMermaid(nodes, []);
    // Queue shape: >label]
    expect(output).toContain('>Kafka]');
  });

  it('uses double-circle shape for client nodes', () => {
    const nodes = [makeNode('c1', 'Browser', { category: 'client' })];
    const output = exportToMermaid(nodes, []);
    // Client shape: ((label))
    expect(output).toContain('((Browser))');
  });

  it('includes edge connections with arrows', () => {
    const nodes = [
      makeNode('a', 'Service A'),
      makeNode('b', 'Service B'),
    ];
    const edges = [makeEdge('e1', 'a', 'b')];
    const output = exportToMermaid(nodes, edges);
    expect(output).toContain('a');
    expect(output).toContain('b');
    // Should have some arrow syntax
    expect(output).toMatch(/-->/);
  });

  it('uses dotted arrow for message-queue edge type', () => {
    const nodes = [
      makeNode('svc', 'Producer'),
      makeNode('q', 'Queue'),
    ];
    const edges = [makeEdge('e1', 'svc', 'q', { edgeType: 'message-queue' })];
    const output = exportToMermaid(nodes, edges);
    expect(output).toContain('-.->' );
  });

  it('uses double arrow for replication edge type', () => {
    const nodes = [
      makeNode('primary', 'Primary DB'),
      makeNode('replica', 'Replica DB'),
    ];
    const edges = [makeEdge('e1', 'primary', 'replica', { edgeType: 'replication' })];
    const output = exportToMermaid(nodes, edges);
    expect(output).toContain('==>');
  });

  it('uses bidirectional arrow for websocket edge type', () => {
    const nodes = [
      makeNode('client', 'Client'),
      makeNode('server', 'Server'),
    ];
    const edges = [makeEdge('e1', 'client', 'server', { edgeType: 'websocket' })];
    const output = exportToMermaid(nodes, edges);
    expect(output).toContain('<-->');
  });

  it('includes latency label on edges when present', () => {
    const nodes = [
      makeNode('a', 'A'),
      makeNode('b', 'B'),
    ];
    const edges = [makeEdge('e1', 'a', 'b', { edgeType: 'http', latency: 50 })];
    const output = exportToMermaid(nodes, edges);
    expect(output).toContain('50ms');
  });

  it('produces valid multi-line Mermaid with nodes and edges', () => {
    const nodes = [
      makeNode('lb', 'Load Balancer'),
      makeNode('svc', 'App Server'),
      makeNode('db', 'PostgreSQL', { category: 'storage' }),
    ];
    const edges = [
      makeEdge('e1', 'lb', 'svc'),
      makeEdge('e2', 'svc', 'db', { edgeType: 'db-query' }),
    ];
    const output = exportToMermaid(nodes, edges);
    const lines = output.split('\n');
    // First line is the graph header
    expect(lines[0]).toBe('graph LR');
    // Should have at least 3 node lines + 2 edge lines + separator
    expect(lines.length).toBeGreaterThanOrEqual(6);
  });
});
