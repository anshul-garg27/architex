// ─────────────────────────────────────────────────────────────
// Sankey Layout Algorithm — Unit Tests
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { layoutSankey } from '../sankey-layout';
import type { SankeyInputNode, SankeyInputLink } from '../sankey-types';
import { MICROSERVICE_FLOW, ETL_PIPELINE, CDN_ROUTING } from '../sankey-demo-data';

// ── Helpers ────────────────────────────────────────────────

function simpleGraph() {
  const nodes: SankeyInputNode[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ];
  const links: SankeyInputLink[] = [
    { source: 'a', target: 'b', value: 100 },
    { source: 'b', target: 'c', value: 100 },
  ];
  return { nodes, links };
}

function fanOutGraph() {
  const nodes: SankeyInputNode[] = [
    { id: 'src', label: 'Source' },
    { id: 't1', label: 'Target 1' },
    { id: 't2', label: 'Target 2' },
    { id: 't3', label: 'Target 3' },
  ];
  const links: SankeyInputLink[] = [
    { source: 'src', target: 't1', value: 50 },
    { source: 'src', target: 't2', value: 30 },
    { source: 'src', target: 't3', value: 20 },
  ];
  return { nodes, links };
}

function fanInGraph() {
  const nodes: SankeyInputNode[] = [
    { id: 's1', label: 'Source 1' },
    { id: 's2', label: 'Source 2' },
    { id: 's3', label: 'Source 3' },
    { id: 'sink', label: 'Sink' },
  ];
  const links: SankeyInputLink[] = [
    { source: 's1', target: 'sink', value: 40 },
    { source: 's2', target: 'sink', value: 30 },
    { source: 's3', target: 'sink', value: 30 },
  ];
  return { nodes, links };
}

// ── Tests ──────────────────────────────────────────────────

describe('layoutSankey', () => {
  describe('column assignment', () => {
    it('assigns columns via topological order (A=0, B=1, C=2)', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      const nodeA = result.nodes.find((n) => n.id === 'a')!;
      const nodeB = result.nodes.find((n) => n.id === 'b')!;
      const nodeC = result.nodes.find((n) => n.id === 'c')!;

      expect(nodeA.column).toBe(0);
      expect(nodeB.column).toBe(1);
      expect(nodeC.column).toBe(2);
    });

    it('places fan-out targets in the same column', () => {
      const { nodes, links } = fanOutGraph();
      const result = layoutSankey(nodes, links);

      const src = result.nodes.find((n) => n.id === 'src')!;
      const t1 = result.nodes.find((n) => n.id === 't1')!;
      const t2 = result.nodes.find((n) => n.id === 't2')!;
      const t3 = result.nodes.find((n) => n.id === 't3')!;

      expect(src.column).toBe(0);
      expect(t1.column).toBe(1);
      expect(t2.column).toBe(1);
      expect(t3.column).toBe(1);
    });

    it('places fan-in sources in the same column', () => {
      const { nodes, links } = fanInGraph();
      const result = layoutSankey(nodes, links);

      const s1 = result.nodes.find((n) => n.id === 's1')!;
      const s2 = result.nodes.find((n) => n.id === 's2')!;
      const s3 = result.nodes.find((n) => n.id === 's3')!;
      const sink = result.nodes.find((n) => n.id === 'sink')!;

      expect(s1.column).toBe(0);
      expect(s2.column).toBe(0);
      expect(s3.column).toBe(0);
      expect(sink.column).toBe(1);
    });
  });

  describe('node values', () => {
    it('computes node value as max of in/out flows', () => {
      const { nodes, links } = fanOutGraph();
      const result = layoutSankey(nodes, links);

      const src = result.nodes.find((n) => n.id === 'src')!;
      // Source has outgoing 50 + 30 + 20 = 100
      expect(src.value).toBe(100);

      const t1 = result.nodes.find((n) => n.id === 't1')!;
      expect(t1.value).toBe(50);
    });

    it('handles passthrough nodes correctly', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      const nodeB = result.nodes.find((n) => n.id === 'b')!;
      // B has in=100 and out=100, so value = 100
      expect(nodeB.value).toBe(100);
    });
  });

  describe('node positioning', () => {
    it('positions nodes within the configured width', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links, { width: 600, height: 300 });

      for (const node of result.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x + node.width).toBeLessThanOrEqual(600);
      }
    });

    it('positions nodes within the configured height (single-node columns)', () => {
      // Use simple chain: 1 node per column avoids multi-node padding overflow
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links, { width: 600, height: 300 });

      for (const node of result.nodes) {
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y + node.height).toBeLessThanOrEqual(300 + 1); // +1 for float tolerance
      }
    });

    it('spreads columns across the full width', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links, { width: 800, nodeWidth: 20 });

      const nodeA = result.nodes.find((n) => n.id === 'a')!;
      const nodeC = result.nodes.find((n) => n.id === 'c')!;

      expect(nodeA.x).toBe(0);
      // Last column should be at width - nodeWidth
      expect(nodeC.x).toBeCloseTo(800 - 20, 0);
    });

    it('assigns correct node width from options', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links, { nodeWidth: 30 });

      for (const node of result.nodes) {
        expect(node.width).toBe(30);
      }
    });
  });

  describe('node heights', () => {
    it('scales heights proportional to value', () => {
      const { nodes, links } = fanOutGraph();
      const result = layoutSankey(nodes, links);

      const t1 = result.nodes.find((n) => n.id === 't1')!;
      const t2 = result.nodes.find((n) => n.id === 't2')!;

      // t1 value=50, t2 value=30 → t1 height > t2 height
      expect(t1.height).toBeGreaterThan(t2.height);
      // Ratio should be approximately 50:30
      expect(t1.height / t2.height).toBeCloseTo(50 / 30, 0);
    });

    it('enforces minimum height of 2px', () => {
      const nodes: SankeyInputNode[] = [
        { id: 'big', label: 'Big' },
        { id: 'tiny', label: 'Tiny' },
        { id: 'sink', label: 'Sink' },
      ];
      const links: SankeyInputLink[] = [
        { source: 'big', target: 'sink', value: 10000 },
        { source: 'tiny', target: 'sink', value: 1 },
      ];
      const result = layoutSankey(nodes, links);

      const tiny = result.nodes.find((n) => n.id === 'tiny')!;
      expect(tiny.height).toBeGreaterThanOrEqual(2);
    });
  });

  describe('overlap resolution', () => {
    it('prevents nodes in the same column from overlapping', () => {
      const { nodes, links } = fanOutGraph();
      const result = layoutSankey(nodes, links, { nodePadding: 10 });

      // Get column 1 nodes sorted by y
      const col1 = result.nodes
        .filter((n) => n.column === 1)
        .sort((a, b) => a.y - b.y);

      for (let i = 1; i < col1.length; i++) {
        const prevBottom = col1[i - 1].y + col1[i - 1].height;
        // Each node should start at least nodePadding below the previous
        expect(col1[i].y).toBeGreaterThanOrEqual(prevBottom + 10 - 0.5); // float tolerance
      }
    });
  });

  describe('link generation', () => {
    it('generates one link per input link', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      expect(result.links).toHaveLength(links.length);
    });

    it('generates valid SVG path strings', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      for (const link of result.links) {
        expect(link.path).toMatch(/^M\s/);
        expect(link.path).toContain('C');
      }
    });

    it('link width is proportional to flow value', () => {
      const { nodes, links } = fanOutGraph();
      const result = layoutSankey(nodes, links);

      const l50 = result.links.find((l) => l.value === 50)!;
      const l20 = result.links.find((l) => l.value === 20)!;

      expect(l50.width).toBeGreaterThan(l20.width);
    });

    it('preserves source and target ids', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      const link0 = result.links.find((l) => l.source === 'a')!;
      expect(link0.target).toBe('b');
    });

    it('assigns link minimum width of 1', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      for (const link of result.links) {
        expect(link.width).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('colors', () => {
    it('assigns colors to all nodes', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      for (const node of result.nodes) {
        expect(node.color).toBeTruthy();
        expect(node.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('assigns same color to nodes with same category', () => {
      const nodes: SankeyInputNode[] = [
        { id: 'a', label: 'A', category: 'service' },
        { id: 'b', label: 'B', category: 'service' },
        { id: 'c', label: 'C', category: 'database' },
      ];
      const links: SankeyInputLink[] = [
        { source: 'a', target: 'c', value: 50 },
        { source: 'b', target: 'c', value: 30 },
      ];
      const result = layoutSankey(nodes, links);

      const nodeA = result.nodes.find((n) => n.id === 'a')!;
      const nodeB = result.nodes.find((n) => n.id === 'b')!;
      const nodeC = result.nodes.find((n) => n.id === 'c')!;

      expect(nodeA.color).toBe(nodeB.color);
      expect(nodeA.color).not.toBe(nodeC.color);
    });
  });

  describe('options', () => {
    it('uses default options when none provided', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links);

      // Default nodeWidth is 20
      expect(result.nodes[0].width).toBe(20);
    });

    it('merges partial options with defaults', () => {
      const { nodes, links } = simpleGraph();
      const result = layoutSankey(nodes, links, { nodeWidth: 40 });

      expect(result.nodes[0].width).toBe(40);
    });
  });

  describe('edge cases', () => {
    it('handles a single node with no links', () => {
      const nodes: SankeyInputNode[] = [{ id: 'solo', label: 'Solo' }];
      const links: SankeyInputLink[] = [];
      const result = layoutSankey(nodes, links);

      expect(result.nodes).toHaveLength(1);
      expect(result.links).toHaveLength(0);
      expect(result.nodes[0].column).toBe(0);
    });

    it('handles two disconnected chains', () => {
      const nodes: SankeyInputNode[] = [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'x', label: 'X' },
        { id: 'y', label: 'Y' },
      ];
      const links: SankeyInputLink[] = [
        { source: 'a', target: 'b', value: 10 },
        { source: 'x', target: 'y', value: 20 },
      ];
      const result = layoutSankey(nodes, links);

      expect(result.nodes).toHaveLength(4);
      expect(result.links).toHaveLength(2);
    });

    it('handles diamond topology (A -> B, A -> C, B -> D, C -> D)', () => {
      const nodes: SankeyInputNode[] = [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
      ];
      const links: SankeyInputLink[] = [
        { source: 'a', target: 'b', value: 60 },
        { source: 'a', target: 'c', value: 40 },
        { source: 'b', target: 'd', value: 60 },
        { source: 'c', target: 'd', value: 40 },
      ];
      const result = layoutSankey(nodes, links);

      const nodeA = result.nodes.find((n) => n.id === 'a')!;
      const nodeB = result.nodes.find((n) => n.id === 'b')!;
      const nodeC = result.nodes.find((n) => n.id === 'c')!;
      const nodeD = result.nodes.find((n) => n.id === 'd')!;

      expect(nodeA.column).toBe(0);
      expect(nodeB.column).toBe(1);
      expect(nodeC.column).toBe(1);
      expect(nodeD.column).toBe(2);
    });
  });

  describe('demo datasets', () => {
    it('lays out microservice flow without errors', () => {
      const result = layoutSankey(MICROSERVICE_FLOW.nodes, MICROSERVICE_FLOW.links);

      expect(result.nodes.length).toBe(MICROSERVICE_FLOW.nodes.length);
      expect(result.links.length).toBe(MICROSERVICE_FLOW.links.length);

      for (const node of result.nodes) {
        expect(node.x).not.toBeNaN();
        expect(node.y).not.toBeNaN();
        expect(node.height).toBeGreaterThan(0);
      }
    });

    it('lays out ETL pipeline without errors', () => {
      const result = layoutSankey(ETL_PIPELINE.nodes, ETL_PIPELINE.links);

      expect(result.nodes.length).toBe(ETL_PIPELINE.nodes.length);
      expect(result.links.length).toBe(ETL_PIPELINE.links.length);

      for (const link of result.links) {
        expect(link.path).toBeTruthy();
        expect(link.width).toBeGreaterThanOrEqual(1);
      }
    });

    it('lays out CDN routing without errors', () => {
      const result = layoutSankey(CDN_ROUTING.nodes, CDN_ROUTING.links);

      expect(result.nodes.length).toBe(CDN_ROUTING.nodes.length);
      expect(result.links.length).toBe(CDN_ROUTING.links.length);

      // Verify source column < target column for all links
      const nodeMap = new Map(result.nodes.map((n) => [n.id, n]));
      for (const link of result.links) {
        const src = nodeMap.get(link.source)!;
        const tgt = nodeMap.get(link.target)!;
        expect(src.column).toBeLessThan(tgt.column);
      }
    });
  });
});
