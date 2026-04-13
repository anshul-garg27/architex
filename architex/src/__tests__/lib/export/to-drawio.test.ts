import { describe, it, expect } from 'vitest';
import { exportToDrawio } from '@/lib/export/to-drawio';
import { importFromDrawio } from '@/lib/import/from-drawio';
import type { Node, Edge } from '@xyflow/react';

// ── Helpers ──────────────────────────────────────────────────

function makeNode(
  id: string,
  label: string,
  overrides: Record<string, unknown> = {},
): Node {
  return {
    id,
    position: { x: 100, y: 200 },
    data: {
      label,
      category: 'compute',
      componentType: 'web-server',
      icon: 'server',
      config: {},
      state: 'idle',
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

// ── XML validation helpers ───────────────────────────────────

function isValidXml(xml: string): boolean {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  return doc.querySelector('parsererror') === null;
}

function parseXml(xml: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'application/xml');
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('to-drawio export', () => {
  it('produces valid XML', () => {
    const nodes = [makeNode('n1', 'API Gateway')];
    const xml = exportToDrawio(nodes, []);
    expect(isValidXml(xml)).toBe(true);
  });

  it('includes mxGraphModel root element', () => {
    const xml = exportToDrawio([], []);
    const doc = parseXml(xml);
    const model = doc.querySelector('mxGraphModel');
    expect(model).not.toBeNull();
  });

  it('includes the two default cells (id 0 and 1)', () => {
    const xml = exportToDrawio([], []);
    const doc = parseXml(xml);
    const cells = doc.querySelectorAll('mxCell');
    const ids = Array.from(cells).map((c) => c.getAttribute('id'));
    expect(ids).toContain('0');
    expect(ids).toContain('1');
  });

  it('exports nodes as UserObject + vertex mxCell', () => {
    const nodes = [makeNode('svc1', 'Auth Service')];
    const xml = exportToDrawio(nodes, []);
    const doc = parseXml(xml);

    const userObjects = doc.querySelectorAll('UserObject');
    // At least one UserObject for the node
    expect(userObjects.length).toBeGreaterThanOrEqual(1);

    const firstUO = userObjects[0];
    expect(firstUO.getAttribute('label')).toBe('Auth Service');

    const cell = firstUO.querySelector('mxCell');
    expect(cell?.getAttribute('vertex')).toBe('1');
  });

  it('scales positions by 1.5x', () => {
    const nodes = [
      makeNode('n1', 'Server', {}),
    ];
    // Node position is (100, 200)
    const xml = exportToDrawio(nodes, []);
    const doc = parseXml(xml);

    const geo = doc.querySelector('mxGeometry');
    expect(geo?.getAttribute('x')).toBe('150'); // 100 * 1.5
    expect(geo?.getAttribute('y')).toBe('300'); // 200 * 1.5
  });

  it('maps database nodes to cylinder style', () => {
    const nodes = [
      makeNode('db1', 'PostgreSQL', {
        category: 'storage',
        componentType: 'postgres',
      }),
    ];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('shape=cylinder3');
  });

  it('maps cache nodes to hexagon style', () => {
    const nodes = [
      makeNode('c1', 'Redis Cache', {
        componentType: 'redis-cache',
      }),
    ];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('shape=hexagon');
  });

  it('maps queue nodes to parallelogram style', () => {
    const nodes = [
      makeNode('q1', 'Kafka', {
        category: 'messaging',
        componentType: 'kafka',
      }),
    ];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('shape=parallelogram');
  });

  it('maps load-balancer nodes to rhombus style', () => {
    const nodes = [
      makeNode('lb1', 'ALB', {
        category: 'load-balancing',
        componentType: 'load-balancer-l7',
      }),
    ];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('rhombus');
  });

  it('maps CDN nodes to cloud shape', () => {
    const nodes = [
      makeNode('cdn1', 'CloudFront', {
        componentType: 'cdn-cloudfront',
      }),
    ];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('shape=cloud');
  });

  it('maps default service nodes to rounded rectangle', () => {
    const nodes = [makeNode('svc1', 'Auth Service')];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('rounded=1');
  });

  it('exports edges with source and target references', () => {
    const nodes = [
      makeNode('svc1', 'Service A'),
      makeNode('svc2', 'Service B'),
    ];
    const edges = [makeEdge('e1', 'svc1', 'svc2')];
    const xml = exportToDrawio(nodes, edges);
    const doc = parseXml(xml);

    const edgeCells = doc.querySelectorAll('mxCell[edge="1"]');
    expect(edgeCells.length).toBe(1);

    const edgeCell = edgeCells[0];
    // Source and target should reference the node cell ids
    expect(edgeCell.getAttribute('source')).toBeTruthy();
    expect(edgeCell.getAttribute('target')).toBeTruthy();
  });

  it('includes edge labels from data', () => {
    const nodes = [
      makeNode('a', 'A'),
      makeNode('b', 'B'),
    ];
    const edges = [
      makeEdge('e1', 'a', 'b', { edgeType: 'grpc', latency: 15 }),
    ];
    const xml = exportToDrawio(nodes, edges);
    expect(xml).toContain('GRPC');
    expect(xml).toContain('15ms');
  });

  it('preserves Architex metadata as UserObject attributes', () => {
    const nodes = [
      makeNode('svc1', 'Auth', {
        componentType: 'auth-service',
        category: 'compute',
        icon: 'lock',
        state: 'active',
      }),
    ];
    const xml = exportToDrawio(nodes, []);
    expect(xml).toContain('architex_componentType="auth-service"');
    expect(xml).toContain('architex_category="compute"');
    expect(xml).toContain('architex_icon="lock"');
    expect(xml).toContain('architex_state="active"');
  });

  it('escapes XML special characters in labels', () => {
    const nodes = [makeNode('n1', 'A & B <Service>')];
    const xml = exportToDrawio(nodes, []);
    expect(isValidXml(xml)).toBe(true);
    expect(xml).toContain('A &amp; B &lt;Service&gt;');
  });

  it('handles empty diagram', () => {
    const xml = exportToDrawio([], []);
    expect(isValidXml(xml)).toBe(true);
    const doc = parseXml(xml);
    const model = doc.querySelector('mxGraphModel');
    expect(model).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// Import tests
// ─────────────────────────────────────────────────────────────

describe('from-drawio import', () => {
  it('returns error for invalid XML', () => {
    const result = importFromDrawio('<not valid xml>>>');
    expect('error' in result).toBe(true);
  });

  it('returns error for missing mxGraphModel', () => {
    const result = importFromDrawio('<?xml version="1.0"?><root/>');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('mxGraphModel');
    }
  });

  it('returns error for missing root element', () => {
    const result = importFromDrawio(
      '<?xml version="1.0"?><mxGraphModel></mxGraphModel>',
    );
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('root');
    }
  });

  it('imports nodes from UserObject wrappers', () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<mxGraphModel><root>',
      '<mxCell id="0" />',
      '<mxCell id="1" parent="0" />',
      '<UserObject label="My Service" architex_componentType="web-server" architex_category="compute" id="2">',
      '  <mxCell style="rounded=1;" vertex="1" parent="1">',
      '    <mxGeometry x="150" y="300" width="160" height="80" as="geometry" />',
      '  </mxCell>',
      '</UserObject>',
      '</root></mxGraphModel>',
    ].join('\n');

    const result = importFromDrawio(xml);
    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].data.label).toBe('My Service');
      expect(result.nodes[0].data.componentType).toBe('web-server');
      expect(result.nodes[0].data.category).toBe('compute');
      // Position should be inverse-scaled: 150/1.5=100, 300/1.5=200
      expect(result.nodes[0].position.x).toBe(100);
      expect(result.nodes[0].position.y).toBe(200);
    }
  });

  it('imports edges with source and target', () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<mxGraphModel><root>',
      '<mxCell id="0" />',
      '<mxCell id="1" parent="0" />',
      '<UserObject label="A" id="2">',
      '  <mxCell style="rounded=1;" vertex="1" parent="1">',
      '    <mxGeometry x="0" y="0" width="100" height="50" as="geometry" />',
      '  </mxCell>',
      '</UserObject>',
      '<UserObject label="B" id="3">',
      '  <mxCell style="rounded=1;" vertex="1" parent="1">',
      '    <mxGeometry x="200" y="0" width="100" height="50" as="geometry" />',
      '  </mxCell>',
      '</UserObject>',
      '<UserObject label="HTTP" architex_edgeType="http" id="4">',
      '  <mxCell style="edgeStyle=orthogonalEdgeStyle;" edge="1" parent="1" source="2" target="3">',
      '    <mxGeometry relative="1" as="geometry" />',
      '  </mxCell>',
      '</UserObject>',
      '</root></mxGraphModel>',
    ].join('\n');

    const result = importFromDrawio(xml);
    expect('edges' in result).toBe(true);
    if ('edges' in result) {
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('drawio-2');
      expect(result.edges[0].target).toBe('drawio-3');
      expect((result.edges[0].data as Record<string, unknown>).edgeType).toBe('http');
    }
  });

  it('infers database type from cylinder style', () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<mxGraphModel><root>',
      '<mxCell id="0" />',
      '<mxCell id="1" parent="0" />',
      '<UserObject label="PG" id="2">',
      '  <mxCell style="shape=cylinder3;" vertex="1" parent="1">',
      '    <mxGeometry x="0" y="0" width="100" height="100" as="geometry" />',
      '  </mxCell>',
      '</UserObject>',
      '</root></mxGraphModel>',
    ].join('\n');

    const result = importFromDrawio(xml);
    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      expect(result.nodes[0].data.componentType).toBe('database');
      expect(result.nodes[0].data.category).toBe('storage');
    }
  });

  it('handles standalone mxCell elements (not wrapped in UserObject)', () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<mxGraphModel><root>',
      '<mxCell id="0" />',
      '<mxCell id="1" parent="0" />',
      '<mxCell id="2" value="Plain Node" style="rounded=1;" vertex="1" parent="1">',
      '  <mxGeometry x="0" y="0" width="100" height="50" as="geometry" />',
      '</mxCell>',
      '</root></mxGraphModel>',
    ].join('\n');

    const result = importFromDrawio(xml);
    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      expect(result.nodes).toHaveLength(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Round-trip tests
// ─────────────────────────────────────────────────────────────

describe('draw.io round-trip', () => {
  it('export -> import preserves node count', () => {
    const nodes = [
      makeNode('svc1', 'Service A'),
      makeNode('db1', 'PostgreSQL', { category: 'storage', componentType: 'postgres' }),
      makeNode('cache1', 'Redis', { componentType: 'redis-cache' }),
    ];
    const edges = [
      makeEdge('e1', 'svc1', 'db1', { edgeType: 'db-query' }),
      makeEdge('e2', 'svc1', 'cache1', { edgeType: 'cache-lookup' }),
    ];

    const xml = exportToDrawio(nodes, edges);
    const result = importFromDrawio(xml);

    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
    }
  });

  it('export -> import preserves labels', () => {
    const nodes = [
      makeNode('svc1', 'Auth Service'),
      makeNode('svc2', 'Payment Service'),
    ];
    const edges = [makeEdge('e1', 'svc1', 'svc2')];

    const xml = exportToDrawio(nodes, edges);
    const result = importFromDrawio(xml);

    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      const labels = result.nodes.map((n) => n.data.label);
      expect(labels).toContain('Auth Service');
      expect(labels).toContain('Payment Service');
    }
  });

  it('export -> import preserves Architex metadata', () => {
    const nodes = [
      makeNode('svc1', 'Auth', {
        componentType: 'auth-service',
        category: 'compute',
        icon: 'lock',
        state: 'active',
        config: { replicas: 3 },
      }),
    ];

    const xml = exportToDrawio(nodes, []);
    const result = importFromDrawio(xml);

    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      const data = result.nodes[0].data as Record<string, unknown>;
      expect(data.componentType).toBe('auth-service');
      expect(data.category).toBe('compute');
      expect(data.icon).toBe('lock');
      expect(data.state).toBe('active');
      expect(data.config).toEqual({ replicas: 3 });
    }
  });

  it('export -> import preserves edge types', () => {
    const nodes = [
      makeNode('a', 'A'),
      makeNode('b', 'B'),
    ];
    const edges = [
      makeEdge('e1', 'a', 'b', { edgeType: 'grpc', latency: 25 }),
    ];

    const xml = exportToDrawio(nodes, edges);
    const result = importFromDrawio(xml);

    expect('edges' in result).toBe(true);
    if ('edges' in result) {
      const edgeData = result.edges[0].data as Record<string, unknown>;
      expect(edgeData.edgeType).toBe('grpc');
      expect(edgeData.latency).toBe(25);
    }
  });

  it('handles empty diagram round-trip', () => {
    const xml = exportToDrawio([], []);
    const result = importFromDrawio(xml);

    expect('nodes' in result).toBe(true);
    if ('nodes' in result) {
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    }
  });
});
