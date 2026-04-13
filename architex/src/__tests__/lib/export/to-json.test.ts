import { describe, it, expect } from 'vitest';
import { exportToJSON, importFromJSON } from '@/lib/export/to-json';
import type { Node, Edge } from '@xyflow/react';

function sampleNodes(): Node[] {
  return [
    {
      id: 'n1',
      type: 'system-design',
      position: { x: 100, y: 200 },
      data: { label: 'Web Server', category: 'compute', componentType: 'web-server' },
    },
    {
      id: 'n2',
      type: 'system-design',
      position: { x: 300, y: 400 },
      data: { label: 'Database', category: 'storage', componentType: 'postgres' },
    },
  ];
}

function sampleEdges(): Edge[] {
  return [
    {
      id: 'e1',
      source: 'n1',
      target: 'n2',
      type: 'default',
      sourceHandle: 'out-0',
      targetHandle: 'in-0',
      data: { edgeType: 'db-query', latency: 5 },
    },
  ];
}

describe('to-json export/import', () => {
  // ── exportToJSON ──────────────────────────────────────────

  it('exports nodes and edges into DiagramJSON format', () => {
    const json = exportToJSON(sampleNodes(), sampleEdges(), 'Test Diagram');

    expect(json.version).toBe('1.0');
    expect(json.name).toBe('Test Diagram');
    expect(json.nodes).toHaveLength(2);
    expect(json.edges).toHaveLength(1);
    expect(json.metadata?.nodeCount).toBe(2);
    expect(json.metadata?.edgeCount).toBe(1);
  });

  it('uses "Untitled Diagram" as the default name', () => {
    const json = exportToJSON([], []);
    expect(json.name).toBe('Untitled Diagram');
  });

  it('includes a valid ISO createdAt timestamp', () => {
    const json = exportToJSON(sampleNodes(), sampleEdges());
    const parsed = new Date(json.createdAt);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it('preserves node positions exactly', () => {
    const json = exportToJSON(sampleNodes(), sampleEdges());
    expect(json.nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(json.nodes[1].position).toEqual({ x: 300, y: 400 });
  });

  it('preserves edge sourceHandle and targetHandle', () => {
    const json = exportToJSON(sampleNodes(), sampleEdges());
    expect(json.edges[0].sourceHandle).toBe('out-0');
    expect(json.edges[0].targetHandle).toBe('in-0');
  });

  // ── importFromJSON ────────────────────────────────────────

  it('importFromJSON reconstructs nodes and edges', () => {
    const json = exportToJSON(sampleNodes(), sampleEdges(), 'Roundtrip');
    const { nodes, edges } = importFromJSON(json);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
    expect(edges[0].source).toBe('n1');
    expect(edges[0].target).toBe('n2');
  });

  // ── Roundtrip ─────────────────────────────────────────────

  it('export -> import roundtrip preserves node data', () => {
    const originalNodes = sampleNodes();
    const originalEdges = sampleEdges();

    const json = exportToJSON(originalNodes, originalEdges, 'Roundtrip Test');
    const { nodes, edges } = importFromJSON(json);

    // Verify IDs
    expect(nodes.map((n) => n.id)).toEqual(originalNodes.map((n) => n.id));
    expect(edges.map((e) => e.id)).toEqual(originalEdges.map((e) => e.id));

    // Verify positions
    expect(nodes[0].position).toEqual(originalNodes[0].position);
    expect(nodes[1].position).toEqual(originalNodes[1].position);

    // Verify data payloads
    expect(nodes[0].data).toEqual(originalNodes[0].data);

    // Verify edge connections
    expect(edges[0].source).toBe('n1');
    expect(edges[0].target).toBe('n2');
    expect(edges[0].sourceHandle).toBe('out-0');
    expect(edges[0].targetHandle).toBe('in-0');
  });

  it('roundtrip handles an empty diagram', () => {
    const json = exportToJSON([], []);
    const { nodes, edges } = importFromJSON(json);
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });
});
