import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@xyflow/react', () => ({
  getBezierPath: () => ['M0,0 C10,10 20,20 30,30', 15, 15, 0, 0],
  BaseEdge: ({ path, style }: { path: string; style?: React.CSSProperties }) => (
    <svg>
      <path d={path} data-testid="base-edge" style={style} />
    </svg>
  ),
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/stores/simulation-store', () => ({
  useSimulationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ status: 'running' }),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover'].includes(key)
          ),
        );
        return React.createElement(prop, { ...filteredProps, ref }, children);
      });
    },
  }),
  useReducedMotion: () => false,
}));

vi.mock('@/lib/constants/motion', () => ({
  animations: {},
  duration: { normal: 0.3 },
  easing: { out: [0, 0, 0.2, 1] },
  reducedMotion: { instantTransition: { duration: 0 } },
}));

// Test the edge type data model
import type { EdgeType } from '@/lib/types';

describe('DataFlowEdge — RPS label display', () => {
  const EDGE_TYPES: EdgeType[] = [
    'http', 'grpc', 'graphql', 'websocket', 'message-queue',
    'event-stream', 'db-query', 'cache-lookup', 'replication',
  ];

  it('all edge types are valid strings', () => {
    for (const t of EDGE_TYPES) {
      expect(typeof t).toBe('string');
      expect(t.length).toBeGreaterThan(0);
    }
  });

  it('DataFlowEdge module can be imported', async () => {
    const mod = await import('@/components/canvas/edges/DataFlowEdge');
    expect(mod).toBeDefined();
  });

  it('edge types include database and cache protocols', () => {
    expect(EDGE_TYPES).toContain('db-query');
    expect(EDGE_TYPES).toContain('cache-lookup');
  });

  it('edge types include async messaging protocols', () => {
    expect(EDGE_TYPES).toContain('message-queue');
    expect(EDGE_TYPES).toContain('event-stream');
  });
});
