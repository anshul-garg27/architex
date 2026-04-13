import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ── Mock @xyflow/react before any imports that use it ──────
vi.mock('@xyflow/react', () => ({
  Handle: ({ id, type, position }: { id: string; type: string; position: string }) =>
    React.createElement('div', { 'data-testid': `handle-${type}-${id}`, 'data-position': position }),
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}));

// ── Mock viewport store to control LOD ──────────────────────
let mockZoom = 1;
vi.mock('@/stores/viewport-store', () => ({
  useViewportStore: (selector: (state: { zoom: number }) => number) =>
    selector({ zoom: mockZoom }),
}));

// ── Mock NodeContextMenu ────────────────────────────────────
vi.mock('@/components/canvas/overlays/NodeContextMenu', () => ({
  NodeContextMenu: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'context-menu' }, children),
}));

import { render, screen } from '@testing-library/react';
import EventBusNode from '../EventBusNode';
import RateLimiterNode from '../RateLimiterNode';
import SecretManagerNode from '../SecretManagerNode';
import type { SystemDesignNodeData } from '@/lib/types';

// ── Helpers ────────────────────────────────────────────────

type MockNodeProps = {
  id: string;
  data: SystemDesignNodeData;
  selected: boolean;
  type: string;
  dragging: boolean;
  zIndex: number;
  isConnectable: boolean;
  positionAbsoluteX: number;
  positionAbsoluteY: number;
  deletable: boolean;
  selectable: boolean;
  draggable: boolean;
  parentId?: string;
  sourcePosition?: undefined;
  targetPosition?: undefined;
};

function makeBaseData(overrides: Partial<SystemDesignNodeData> = {}): SystemDesignNodeData {
  return {
    label: 'Test Node',
    category: 'messaging',
    componentType: 'event-bus',
    icon: 'Route',
    config: {},
    state: 'idle',
    ...overrides,
  };
}

function makeProps(data: SystemDesignNodeData, nodeType: string): MockNodeProps {
  return {
    id: 'test-node-1',
    data,
    selected: false,
    type: nodeType,
    dragging: false,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    deletable: true,
    selectable: true,
    draggable: true,
  };
}

// ── Tests ──────────────────────────────────────────────────

describe('EventBusNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZoom = 1;
  });

  it('renders with the event bus wrapper', () => {
    const data = makeBaseData({
      label: 'Event Bus',
      category: 'messaging',
      componentType: 'event-bus',
      config: { rules: 10, deliveryGuarantee: 'at-least-once', topics: 'orders,payments' },
    });
    const props = makeProps(data, 'event-bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EventBusNode {...(props as any)} />);
    expect(screen.getByTestId('event-bus-node')).toBeDefined();
  });

  it('renders delivery guarantee label', () => {
    const data = makeBaseData({
      label: 'Event Bus',
      componentType: 'event-bus',
      config: { deliveryGuarantee: 'exactly-once', topics: 'orders', rules: 5 },
    });
    const props = makeProps(data, 'event-bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EventBusNode {...(props as any)} />);
    expect(screen.getByText('exactly-once')).toBeDefined();
  });

  it('renders topic badges', () => {
    const data = makeBaseData({
      label: 'Event Bus',
      componentType: 'event-bus',
      config: { topics: 'orders,payments,notifications' },
    });
    const props = makeProps(data, 'event-bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EventBusNode {...(props as any)} />);
    expect(screen.getByText('orders')).toBeDefined();
    expect(screen.getByText('payments')).toBeDefined();
    expect(screen.getByText('notifications')).toBeDefined();
  });

  it('shows +N overflow when more than 4 topics', () => {
    const data = makeBaseData({
      label: 'Event Bus',
      componentType: 'event-bus',
      config: { topics: 'a,b,c,d,e,f' },
    });
    const props = makeProps(data, 'event-bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EventBusNode {...(props as any)} />);
    expect(screen.getByText('+2')).toBeDefined();
  });

  it('hides detail panel at low zoom', () => {
    mockZoom = 0.2;
    const data = makeBaseData({
      label: 'Event Bus',
      componentType: 'event-bus',
      config: { topics: 'orders', deliveryGuarantee: 'at-least-once' },
    });
    const props = makeProps(data, 'event-bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EventBusNode {...(props as any)} />);
    expect(screen.queryByText('at-least-once')).toBeNull();
  });

  it('displays rules count', () => {
    const data = makeBaseData({
      label: 'Event Bus',
      componentType: 'event-bus',
      config: { rules: 25, topics: '' },
    });
    const props = makeProps(data, 'event-bus');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EventBusNode {...(props as any)} />);
    expect(screen.getByText('25 rules')).toBeDefined();
  });
});

describe('RateLimiterNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZoom = 1;
  });

  it('renders with the rate limiter wrapper', () => {
    const data = makeBaseData({
      label: 'Rate Limiter',
      category: 'security',
      componentType: 'rate-limiter',
      config: { algorithm: 'token-bucket', limitRps: 1000, burstSize: 100, windowSeconds: 60 },
    });
    const props = makeProps(data, 'rate-limiter');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RateLimiterNode {...(props as any)} />);
    expect(screen.getByTestId('rate-limiter-node')).toBeDefined();
  });

  it('displays the algorithm label', () => {
    const data = makeBaseData({
      label: 'Rate Limiter',
      category: 'security',
      componentType: 'rate-limiter',
      config: { algorithm: 'sliding-window', limitRps: 500 },
    });
    const props = makeProps(data, 'rate-limiter');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RateLimiterNode {...(props as any)} />);
    expect(screen.getByText('Sliding Window')).toBeDefined();
  });

  it('displays rate limit values', () => {
    const data = makeBaseData({
      label: 'Rate Limiter',
      category: 'security',
      componentType: 'rate-limiter',
      config: { algorithm: 'token-bucket', limitRps: 2000, burstSize: 200, windowSeconds: 30 },
    });
    const props = makeProps(data, 'rate-limiter');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RateLimiterNode {...(props as any)} />);
    expect(screen.getByText('/ 2000 rps')).toBeDefined();
    expect(screen.getByText('Burst: 200')).toBeDefined();
    expect(screen.getByText('30s window')).toBeDefined();
  });

  it('shows current throughput in the gauge', () => {
    const data = makeBaseData({
      label: 'Rate Limiter',
      category: 'security',
      componentType: 'rate-limiter',
      config: { limitRps: 1000 },
      metrics: { throughput: 750 },
    });
    const props = makeProps(data, 'rate-limiter');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RateLimiterNode {...(props as any)} />);
    // Throughput appears in both the BaseNode metrics badge and the detail gauge
    const matches = screen.getAllByText('750 rps');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('hides detail panel at low zoom', () => {
    mockZoom = 0.2;
    const data = makeBaseData({
      label: 'Rate Limiter',
      category: 'security',
      componentType: 'rate-limiter',
      config: { algorithm: 'leaky-bucket', limitRps: 500 },
    });
    const props = makeProps(data, 'rate-limiter');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<RateLimiterNode {...(props as any)} />);
    expect(screen.queryByText('Leaky Bucket')).toBeNull();
  });
});

describe('SecretManagerNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZoom = 1;
  });

  it('renders with the secret manager wrapper', () => {
    const data = makeBaseData({
      label: 'Secret Manager',
      category: 'security',
      componentType: 'secret-manager',
      config: { rotationDays: 90, encryptionType: 'AES-256', secretCount: 50 },
    });
    const props = makeProps(data, 'secret-manager');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<SecretManagerNode {...(props as any)} />);
    expect(screen.getByTestId('secret-manager-node')).toBeDefined();
  });

  it('displays encryption type', () => {
    const data = makeBaseData({
      label: 'Vault',
      category: 'security',
      componentType: 'secret-manager',
      config: { encryptionType: 'RSA-2048', rotationDays: 30, secretCount: 100 },
    });
    const props = makeProps(data, 'secret-manager');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<SecretManagerNode {...(props as any)} />);
    expect(screen.getByText('RSA-2048')).toBeDefined();
  });

  it('displays rotation days and secret count', () => {
    const data = makeBaseData({
      label: 'Vault',
      category: 'security',
      componentType: 'secret-manager',
      config: { rotationDays: 30, secretCount: 75 },
    });
    const props = makeProps(data, 'secret-manager');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<SecretManagerNode {...(props as any)} />);
    expect(screen.getByText('30d rotation')).toBeDefined();
    expect(screen.getByText('75 secrets managed')).toBeDefined();
  });

  it('displays secret categories', () => {
    const data = makeBaseData({
      label: 'Vault',
      category: 'security',
      componentType: 'secret-manager',
      config: { rotationDays: 90 },
    });
    const props = makeProps(data, 'secret-manager');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<SecretManagerNode {...(props as any)} />);
    expect(screen.getByText('API Keys')).toBeDefined();
    expect(screen.getByText('DB Creds')).toBeDefined();
    expect(screen.getByText('Tokens')).toBeDefined();
    expect(screen.getByText('Certs')).toBeDefined();
  });

  it('hides detail panel at low zoom', () => {
    mockZoom = 0.2;
    const data = makeBaseData({
      label: 'Vault',
      category: 'security',
      componentType: 'secret-manager',
      config: { encryptionType: 'AES-256', rotationDays: 90, secretCount: 50 },
    });
    const props = makeProps(data, 'secret-manager');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<SecretManagerNode {...(props as any)} />);
    expect(screen.queryByText('AES-256')).toBeNull();
    expect(screen.queryByText('API Keys')).toBeNull();
  });
});
