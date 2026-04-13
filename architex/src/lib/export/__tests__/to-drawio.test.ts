import { describe, it, expect } from 'vitest';
import { exportToDrawio } from '../to-drawio';
import type { Node, Edge } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  label: string,
  data: Record<string, unknown> = {},
  position: { x: number; y: number } = { x: 0, y: 0 },
): Node {
  return {
    id,
    type: 'system-design',
    position,
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

describe('exportToDrawio', () => {
  // ── XML structure ────────────────────────────────────────────

  it('starts with XML declaration', () => {
    const xml = exportToDrawio([], []);
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
  });

  it('contains mxGraphModel root element', () => {
    const xml = exportToDrawio([], []);
    expect(xml).toContain('<mxGraphModel');
    expect(xml).toContain('</mxGraphModel>');
  });

  it('contains required default cells (id 0 and 1)', () => {
    const xml = exportToDrawio([], []);
    expect(xml).toContain('<mxCell id="0"');
    expect(xml).toContain('<mxCell id="1" parent="0"');
  });

  it('contains root element', () => {
    const xml = exportToDrawio([], []);
    expect(xml).toContain('<root>');
    expect(xml).toContain('</root>');
  });

  // ── Node output ──────────────────────────────────────────────

  it('renders node as UserObject with label', () => {
    const nodes = [makeNode('n1', 'API Server')];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('label="API Server"');
    expect(xml).toContain('vertex="1"');
  });

  it('includes mxGeometry with position', () => {
    const nodes = [makeNode('n1', 'Test', {}, { x: 100, y: 200 })];
    const xml = exportToDrawio(nodes, []);

    // Position is scaled by 1.5
    expect(xml).toContain('x="150"');
    expect(xml).toContain('y="300"');
    expect(xml).toContain('as="geometry"');
  });

  // ── Node shape styles ────────────────────────────────────────

  it('uses cylinder style for database nodes', () => {
    const nodes = [makeNode('db', 'PostgreSQL', { componentType: 'database' })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('shape=cylinder3');
  });

  it('uses hexagon style for cache nodes', () => {
    const nodes = [makeNode('c', 'Redis', { componentType: 'redis-cache' })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('shape=hexagon');
  });

  it('uses parallelogram style for queue nodes', () => {
    const nodes = [makeNode('q', 'Kafka', { componentType: 'kafka-queue' })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('shape=parallelogram');
  });

  it('uses rhombus style for load-balancer nodes', () => {
    const nodes = [makeNode('lb', 'LB', { componentType: 'load-balancer' })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('rhombus');
  });

  it('uses cloud style for CDN nodes', () => {
    const nodes = [makeNode('cdn', 'CDN', { componentType: 'cdn' })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('shape=cloud');
  });

  it('uses rounded rectangle for default service nodes', () => {
    const nodes = [makeNode('svc', 'API', { componentType: 'api-server' })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('rounded=1');
  });

  // ── Edge output ──────────────────────────────────────────────

  it('renders edge as UserObject with source and target', () => {
    const nodes = [
      makeNode('a', 'A'),
      makeNode('b', 'B'),
    ];
    const edges = [makeEdge('e1', 'a', 'b')];
    const xml = exportToDrawio(nodes, edges);

    expect(xml).toContain('edge="1"');
    expect(xml).toContain('source="2"');
    expect(xml).toContain('target="3"');
  });

  it('skips edges with missing source or target nodes', () => {
    const nodes = [makeNode('a', 'A')];
    const edges = [makeEdge('e1', 'a', 'missing')];
    const xml = exportToDrawio(nodes, edges);

    expect(xml).not.toContain('edge="1"');
  });

  // ── XML escaping ─────────────────────────────────────────────

  it('escapes special XML characters in labels', () => {
    const nodes = [makeNode('n1', 'A & B <C>')];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('A &amp; B &lt;C&gt;');
  });

  // ── Metadata attributes ──────────────────────────────────────

  it('includes architex metadata as UserObject attributes', () => {
    const nodes = [makeNode('n1', 'DB', {
      componentType: 'postgres',
      category: 'storage',
    })];
    const xml = exportToDrawio(nodes, []);

    expect(xml).toContain('architex_componentType="postgres"');
    expect(xml).toContain('architex_category="storage"');
  });
});
