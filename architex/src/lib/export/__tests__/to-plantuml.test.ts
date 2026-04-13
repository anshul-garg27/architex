import { describe, it, expect } from 'vitest';
import { exportToPlantUML } from '../to-plantuml';
import type { Node, Edge } from '@xyflow/react';

function makeNode(
  id: string,
  overrides: Record<string, unknown> = {},
): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      label: overrides.label ?? id,
      category: overrides.category ?? 'compute',
      componentType: overrides.componentType ?? '',
      ...overrides,
    },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  overrides: Record<string, unknown> = {},
): Edge {
  return {
    id,
    source,
    target,
    type: overrides.type as string | undefined,
    data: overrides.data as Record<string, unknown> | undefined,
  };
}

describe('exportToPlantUML', () => {
  it('wraps output in @startuml / @enduml', () => {
    const result = exportToPlantUML([], []);
    expect(result).toContain('@startuml');
    expect(result).toContain('@enduml');
  });

  it('includes skinparam directive', () => {
    const result = exportToPlantUML([], []);
    expect(result).toContain('skinparam componentStyle rectangle');
  });

  it('renders a single node with correct label and id', () => {
    const nodes = [makeNode('web-server-1', { label: 'Web Server' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('component "Web Server" as web_server_1');
  });

  it('maps storage category to database keyword', () => {
    const nodes = [makeNode('db1', { label: 'PostgreSQL', category: 'storage' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('database "PostgreSQL" as db1');
  });

  it('maps messaging category to queue keyword', () => {
    const nodes = [makeNode('q1', { label: 'Kafka', category: 'messaging' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('queue "Kafka" as q1');
  });

  it('maps client category to actor keyword', () => {
    const nodes = [makeNode('c1', { label: 'Browser', category: 'client' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('actor "Browser" as c1');
  });

  it('maps networking category to boundary keyword', () => {
    const nodes = [makeNode('lb1', { label: 'LB', category: 'networking' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('boundary "LB" as lb1');
  });

  it('maps componentType containing cache to storage keyword', () => {
    const nodes = [makeNode('r1', { label: 'Redis', componentType: 'redis-cache' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('storage "Redis" as r1');
  });

  it('maps componentType containing cdn to cloud keyword', () => {
    const nodes = [makeNode('cdn1', { label: 'CDN', componentType: 'cdn' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('cloud "CDN" as cdn1');
  });

  it('renders a basic HTTP edge with --> arrow', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b')];
    const result = exportToPlantUML(nodes, edges);
    expect(result).toContain('a --> b : HTTP');
  });

  it('renders websocket edge with bidirectional arrow', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b', { data: { edgeType: 'websocket' } })];
    const result = exportToPlantUML(nodes, edges);
    expect(result).toContain('a <--> b : WEBSOCKET');
  });

  it('renders message-queue edge with dotted arrow', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b', { data: { edgeType: 'message-queue' } })];
    const result = exportToPlantUML(nodes, edges);
    expect(result).toContain('a ..> b : MESSAGE-QUEUE');
  });

  it('renders replication edge with double-line arrow', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b', { data: { edgeType: 'replication' } })];
    const result = exportToPlantUML(nodes, edges);
    expect(result).toContain('a ==> b : REPLICATION');
  });

  it('renders grpc edge with -->> arrow', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b', { data: { edgeType: 'grpc' } })];
    const result = exportToPlantUML(nodes, edges);
    expect(result).toContain('a -->> b : GRPC');
  });

  it('includes latency in edge label when provided', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b', { data: { edgeType: 'http', latency: 50 } })];
    const result = exportToPlantUML(nodes, edges);
    expect(result).toContain('50ms');
  });

  it('sanitizes double quotes in labels', () => {
    const nodes = [makeNode('s1', { label: 'My "Service"' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).not.toContain('"Service"');
    expect(result).toContain("'Service'");
  });

  it('sanitizes special characters in node IDs', () => {
    const nodes = [makeNode('my-node.v2', { label: 'Node' })];
    const result = exportToPlantUML(nodes, []);
    expect(result).toContain('my_node_v2');
  });
});
