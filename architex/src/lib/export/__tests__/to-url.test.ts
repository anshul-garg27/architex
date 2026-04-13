import { describe, it, expect } from 'vitest';
import { encodeToURL, decodeFromURL, generateShareableURL } from '../to-url';
import type { Node, Edge } from '@xyflow/react';

function makeNode(id: string, x = 0, y = 0, type = 'default'): Node {
  return {
    id,
    type,
    position: { x, y },
    data: { label: id },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  type = 'default',
): Edge {
  return { id, source, target, type };
}

describe('encodeToURL / decodeFromURL round-trip', () => {
  it('round-trips a single node', () => {
    const nodes = [makeNode('n1', 100, 200, 'server')];
    const encoded = encodeToURL(nodes, []);
    const decoded = decodeFromURL(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.nodes).toHaveLength(1);
    expect(decoded!.nodes[0].id).toBe('n1');
    expect(decoded!.nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(decoded!.nodes[0].type).toBe('server');
  });

  it('round-trips multiple nodes', () => {
    const nodes = [makeNode('a', 10, 20), makeNode('b', 30, 40)];
    const encoded = encodeToURL(nodes, []);
    const decoded = decodeFromURL(encoded);
    expect(decoded!.nodes).toHaveLength(2);
    expect(decoded!.nodes[0].id).toBe('a');
    expect(decoded!.nodes[1].id).toBe('b');
  });

  it('round-trips edges', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges = [makeEdge('e1', 'a', 'b', 'http')];
    const encoded = encodeToURL(nodes, edges);
    const decoded = decodeFromURL(encoded);
    expect(decoded!.edges).toHaveLength(1);
    expect(decoded!.edges[0].source).toBe('a');
    expect(decoded!.edges[0].target).toBe('b');
    expect(decoded!.edges[0].type).toBe('http');
  });

  it('preserves edge sourceHandle and targetHandle', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges: Edge[] = [{
      id: 'e1',
      source: 'a',
      target: 'b',
      type: 'default',
      sourceHandle: 'right',
      targetHandle: 'left',
    }];
    const encoded = encodeToURL(nodes, edges);
    const decoded = decodeFromURL(encoded);
    expect(decoded!.edges[0].sourceHandle).toBe('right');
    expect(decoded!.edges[0].targetHandle).toBe('left');
  });

  it('preserves edge data', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const edges: Edge[] = [{
      id: 'e1',
      source: 'a',
      target: 'b',
      type: 'default',
      data: { edgeType: 'grpc', latency: 15 },
    }];
    const encoded = encodeToURL(nodes, edges);
    const decoded = decodeFromURL(encoded);
    expect(decoded!.edges[0].data).toEqual({ edgeType: 'grpc', latency: 15 });
  });

  it('preserves node data', () => {
    const nodes: Node[] = [{
      id: 'n1',
      type: 'default',
      position: { x: 0, y: 0 },
      data: { label: 'Cache', componentType: 'redis' },
    }];
    const encoded = encodeToURL(nodes, []);
    const decoded = decodeFromURL(encoded);
    expect(decoded!.nodes[0].data).toEqual({ label: 'Cache', componentType: 'redis' });
  });

  it('rounds positions to integers', () => {
    const nodes = [makeNode('n1', 10.7, 20.3)];
    const encoded = encodeToURL(nodes, []);
    const decoded = decodeFromURL(encoded);
    expect(decoded!.nodes[0].position.x).toBe(11);
    expect(decoded!.nodes[0].position.y).toBe(20);
  });

  it('handles empty graph', () => {
    const encoded = encodeToURL([], []);
    const decoded = decodeFromURL(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.nodes).toHaveLength(0);
    expect(decoded!.edges).toHaveLength(0);
  });
});

describe('decodeFromURL error handling', () => {
  it('returns null for invalid encoded string', () => {
    expect(decodeFromURL('not-a-valid-lz-string!!')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodeFromURL('')).toBeNull();
  });
});

describe('generateShareableURL', () => {
  it('generates URL with base and hash fragment', () => {
    const nodes = [makeNode('n1')];
    const url = generateShareableURL(nodes, [], 'https://example.com');
    expect(url).toMatch(/^https:\/\/example\.com\/share#d=.+$/);
  });

  it('uses custom base URL when provided', () => {
    const url = generateShareableURL([], [], 'https://my-app.dev');
    expect(url.startsWith('https://my-app.dev/share#d=')).toBe(true);
  });

  it('encoded hash can be decoded back', () => {
    const nodes = [makeNode('x', 5, 10)];
    const edges = [makeEdge('e1', 'x', 'x')];
    const url = generateShareableURL(nodes, edges, 'https://test.com');
    const hash = url.split('#d=')[1];
    const decoded = decodeFromURL(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.nodes[0].id).toBe('x');
  });

  it('handles large diagram without throwing', () => {
    const nodes = Array.from({ length: 35 }, (_, i) => makeNode(`n${i}`, i * 10, i * 10));
    const edges = Array.from({ length: 34 }, (_, i) => makeEdge(`e${i}`, `n${i}`, `n${i + 1}`));
    expect(() => generateShareableURL(nodes, edges, 'https://test.com')).not.toThrow();
  });
});
