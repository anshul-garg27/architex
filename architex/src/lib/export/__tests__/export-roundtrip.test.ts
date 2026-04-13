import { describe, it, expect } from 'vitest';
import { exportToJSON, importFromJSON } from '../to-json';
import { exportToSVG } from '../to-svg';
import { exportToPNG, blobToDataURL } from '../to-png';
import { exportToPDF } from '../to-pdf';
import type { DiagramJSON } from '../to-json';
import type { Node, Edge } from '@xyflow/react';

// ── Test fixtures ────────────────────────────────────────────

function makeNodes(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    type: 'system-design',
    position: { x: i * 100, y: i * 50 },
    data: {
      label: `Component ${i}`,
      category: i === 0 ? 'compute' : 'storage',
      componentType: i === 0 ? 'web-server' : 'database',
    },
  }));
}

function makeEdges(nodeCount: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'default',
      sourceHandle: `out-${i}`,
      targetHandle: `in-${i + 1}`,
      data: { latency: (i + 1) * 10 },
    });
  }
  return edges;
}

// ── JSON Export/Import Round-Trip ─────────────────────────────

describe('Export round-trip: JSON', () => {
  it('export then import preserves all node IDs', () => {
    const nodes = makeNodes(5);
    const edges = makeEdges(5);
    const json = exportToJSON(nodes, edges, 'RT Test');
    const result = importFromJSON(json);

    expect(result.nodes.map((n) => n.id)).toEqual(nodes.map((n) => n.id));
  });

  it('export then import preserves all edge connections', () => {
    const nodes = makeNodes(4);
    const edges = makeEdges(4);
    const json = exportToJSON(nodes, edges);
    const result = importFromJSON(json);

    for (let i = 0; i < edges.length; i++) {
      expect(result.edges[i].source).toBe(edges[i].source);
      expect(result.edges[i].target).toBe(edges[i].target);
    }
  });

  it('export then import preserves node positions', () => {
    const nodes = makeNodes(3);
    const json = exportToJSON(nodes, []);
    const result = importFromJSON(json);

    for (let i = 0; i < nodes.length; i++) {
      expect(result.nodes[i].position).toEqual(nodes[i].position);
    }
  });

  it('export then import preserves node data payload', () => {
    const nodes = makeNodes(2);
    const json = exportToJSON(nodes, []);
    const result = importFromJSON(json);

    expect(result.nodes[0].data).toEqual(nodes[0].data);
    expect(result.nodes[1].data).toEqual(nodes[1].data);
  });

  it('export then import preserves edge handles', () => {
    const nodes = makeNodes(3);
    const edges = makeEdges(3);
    const json = exportToJSON(nodes, edges);
    const result = importFromJSON(json);

    expect(result.edges[0].sourceHandle).toBe('out-0');
    expect(result.edges[0].targetHandle).toBe('in-1');
  });

  it('export then import preserves edge data', () => {
    const nodes = makeNodes(3);
    const edges = makeEdges(3);
    const json = exportToJSON(nodes, edges);
    const result = importFromJSON(json);

    expect(result.edges[0].data).toEqual({ latency: 10 });
    expect(result.edges[1].data).toEqual({ latency: 20 });
  });

  it('round-trip with empty diagram produces empty arrays', () => {
    const json = exportToJSON([], []);
    const result = importFromJSON(json);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('round-trip preserves node types', () => {
    const nodes: Node[] = [
      { id: 'a', type: 'custom-type', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'another-type', position: { x: 1, y: 1 }, data: {} },
    ];
    const json = exportToJSON(nodes, []);
    const result = importFromJSON(json);

    expect(result.nodes[0].type).toBe('custom-type');
    expect(result.nodes[1].type).toBe('another-type');
  });

  it('round-trip with edges missing optional handles', () => {
    const nodes = makeNodes(2);
    const edges: Edge[] = [
      { id: 'e-plain', source: 'node-0', target: 'node-1', type: 'default' },
    ];
    const json = exportToJSON(nodes, edges);
    const result = importFromJSON(json);

    expect(result.edges[0].sourceHandle).toBeUndefined();
    expect(result.edges[0].targetHandle).toBeUndefined();
  });

  it('round-trip with edges missing optional data', () => {
    const nodes = makeNodes(2);
    const edges: Edge[] = [
      { id: 'e-nodata', source: 'node-0', target: 'node-1', type: 'default' },
    ];
    const json = exportToJSON(nodes, edges);
    const result = importFromJSON(json);

    expect(result.edges[0].data).toBeUndefined();
  });

  it('metadata reflects correct counts after export', () => {
    const nodes = makeNodes(7);
    const edges = makeEdges(7);
    const json = exportToJSON(nodes, edges, 'Metadata Test');

    expect(json.metadata?.nodeCount).toBe(7);
    expect(json.metadata?.edgeCount).toBe(6);
    expect(json.metadata?.moduleType).toBe('compute');
  });

  it('DiagramJSON version is always 1.0', () => {
    const json = exportToJSON(makeNodes(1), []);
    expect(json.version).toBe('1.0');
  });
});

// ── PNG Export ────────────────────────────────────────────────

describe('Export: PNG', () => {
  it('exportToPNG is a function', () => {
    expect(typeof exportToPNG).toBe('function');
  });

  it('blobToDataURL is a function that accepts a Blob', () => {
    expect(typeof blobToDataURL).toBe('function');
  });

  it('blobToDataURL converts a text blob to a data URL string', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const dataUrl = await blobToDataURL(blob);
    expect(dataUrl).toContain('data:');
    expect(typeof dataUrl).toBe('string');
  });
});

// ── SVG Export ───────────────────────────────────────────────

describe('Export: SVG', () => {
  it('exportToSVG is a function', () => {
    expect(typeof exportToSVG).toBe('function');
  });

  it('exportToSVG throws when no .react-flow element exists', () => {
    expect(() => exportToSVG()).toThrow('React Flow element');
  });

  it('exportToSVG throws with embedFonts option when no element exists', () => {
    expect(() => exportToSVG({ embedFonts: false })).toThrow(
      'React Flow element',
    );
  });
});

// ── PDF Export ────────────────────────────────────────────────

describe('Export: PDF', () => {
  it('exportToPDF is a function', () => {
    expect(typeof exportToPDF).toBe('function');
  });

  it('exportToPDF accepts an options object', () => {
    // Verify the function signature accepts the expected shape
    expect(exportToPDF.length).toBeLessThanOrEqual(1);
  });
});
