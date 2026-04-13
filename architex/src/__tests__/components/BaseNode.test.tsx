import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position, id }: { type: string; position: string; id: string }) => (
    <div data-testid={`handle-${type}-${id}`} data-position={position} />
  ),
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}));

vi.mock('@/stores/viewport-store', () => ({
  useViewportStore: () => 0.8, // zoom > 0.6 = full LOD
}));

vi.mock('@/components/canvas/overlays/NodeContextMenu', () => ({
  NodeContextMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'layout', 'onAnimationComplete'].includes(key)
          ),
        );
        return React.createElement(prop, { ...filteredProps, ref }, children);
      });
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('@/lib/constants/motion', () => ({
  animations: {
    simulation: {
      chaosShake: { animate: {}, transition: {} },
      errorFlash: { animate: {}, transition: {} },
    },
    canvas: { nodeDelete: { exit: {} } },
  },
  reducedMotion: { instantTransition: { duration: 0 } },
}));

import BaseNode, { CATEGORY_SHAPE, type NodeShape } from '@/components/canvas/nodes/system-design/BaseNode';
import type { SystemDesignNodeData } from '@/lib/types';

function makeNodeData(overrides?: Partial<SystemDesignNodeData>): SystemDesignNodeData {
  return {
    label: 'Test Node',
    category: 'compute',
    componentType: 'web-server',
    icon: 'Server',
    config: {},
    state: 'idle',
    ...overrides,
  };
}

describe('BaseNode', () => {
  it('renders the node label', () => {
    render(<BaseNode data={makeNodeData()} selected={false} icon={<span>IC</span>} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders with rectangle shape for compute category', () => {
    expect(CATEGORY_SHAPE.compute).toBe('rectangle');
    render(<BaseNode data={makeNodeData({ category: 'compute' })} selected={false} icon={<span>IC</span>} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders with cylinder shape for storage category', () => {
    expect(CATEGORY_SHAPE.storage).toBe('cylinder');
    render(<BaseNode data={makeNodeData({ category: 'storage', label: 'Database' })} selected={false} icon={<span>IC</span>} />);
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  it('renders with hexagon shape for load-balancing category', () => {
    expect(CATEGORY_SHAPE['load-balancing']).toBe('hexagon');
  });

  it('renders with parallelogram shape for messaging', () => {
    expect(CATEGORY_SHAPE.messaging).toBe('parallelogram');
  });

  it('renders with octagon shape for security', () => {
    expect(CATEGORY_SHAPE.security).toBe('octagon');
  });

  it('accepts a shape prop override', () => {
    render(
      <BaseNode data={makeNodeData()} selected={false} icon={<span>IC</span>} shape="diamond" />,
    );
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('shows state indicator', () => {
    render(<BaseNode data={makeNodeData({ state: 'error' })} selected={false} icon={<span>IC</span>} />);
    expect(screen.getByLabelText(/State: error/i)).toBeInTheDocument();
  });

  it('shows metrics badge when throughput is set', () => {
    render(
      <BaseNode
        data={makeNodeData({ metrics: { throughput: 5000 } })}
        selected={false}
        icon={<span>IC</span>}
      />,
    );
    expect(screen.getByText(/5\.0K rps/)).toBeInTheDocument();
  });

  it('does not show metrics badge when throughput is zero', () => {
    render(
      <BaseNode
        data={makeNodeData({ metrics: { throughput: 0 } })}
        selected={false}
        icon={<span>IC</span>}
      />,
    );
    expect(screen.queryByText(/rps/)).not.toBeInTheDocument();
  });
});
