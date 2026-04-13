import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SystemDesignNodeData, NodeCategory } from '@/lib/types';

// Mock the viewport store to control zoom levels for LOD tests
const mockZoom = vi.fn(() => 1);
vi.mock('@/stores/viewport-store', () => ({
  useViewportStore: (selector: (s: { zoom: number }) => number) =>
    selector({ zoom: mockZoom() }),
}));

// Mock NodeContextMenu to render children directly
vi.mock('@/components/canvas/overlays/NodeContextMenu', () => ({
  NodeContextMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @xyflow/react Handle component
vi.mock('@xyflow/react', () => ({
  Handle: ({ id }: { id: string }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}));

// Must import after mocks
import BaseNode from '../BaseNode';

function makeData(overrides: Partial<SystemDesignNodeData> = {}): SystemDesignNodeData {
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
  beforeEach(() => {
    mockZoom.mockReturnValue(1);
  });

  // -- LOD: full view --

  it('renders label in full view (zoom > 0.6)', () => {
    mockZoom.mockReturnValue(0.8);
    render(
      <BaseNode data={makeData({ label: 'Web Server' })} selected={false} icon={<span>IC</span>} />,
    );
    expect(screen.getByText('Web Server')).toBeInTheDocument();
  });

  it('renders icon element in full view', () => {
    mockZoom.mockReturnValue(1);
    render(
      <BaseNode data={makeData()} selected={false} icon={<span data-testid="icon">IC</span>} />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('shows throughput badge when metrics have throughput', () => {
    mockZoom.mockReturnValue(1);
    render(
      <BaseNode
        data={makeData({ metrics: { throughput: 5000 } })}
        selected={false}
        icon={<span>IC</span>}
      />,
    );
    expect(screen.getByText('5.0K rps')).toBeInTheDocument();
  });

  it('formats throughput in millions', () => {
    mockZoom.mockReturnValue(1);
    render(
      <BaseNode
        data={makeData({ metrics: { throughput: 2_500_000 } })}
        selected={false}
        icon={<span>IC</span>}
      />,
    );
    expect(screen.getByText('2.5M rps')).toBeInTheDocument();
  });

  it('does not show throughput badge when throughput is zero', () => {
    mockZoom.mockReturnValue(1);
    const { container } = render(
      <BaseNode data={makeData({ metrics: { throughput: 0 } })} selected={false} icon={<span>IC</span>} />,
    );
    expect(container.textContent).not.toContain('rps');
  });

  // -- LOD: simplified view --

  it('renders only label in simplified view (zoom 0.3-0.6)', () => {
    mockZoom.mockReturnValue(0.45);
    render(
      <BaseNode data={makeData({ label: 'Simplified Label' })} selected={false} icon={<span>IC</span>} />,
    );
    expect(screen.getByText('Simplified Label')).toBeInTheDocument();
    // No handles should be rendered in simplified view
    expect(screen.queryByTestId('handle-top')).not.toBeInTheDocument();
  });

  // -- LOD: dot view --

  it('renders dot view at very low zoom (zoom < 0.3)', () => {
    mockZoom.mockReturnValue(0.15);
    const { container } = render(
      <BaseNode data={makeData({ label: 'Should not show' })} selected={false} icon={<span>IC</span>} />,
    );
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    // Dot view should render a small rounded div
    const dot = container.querySelector('.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  // -- Selection ring --

  it('applies ring class when selected in full view', () => {
    mockZoom.mockReturnValue(1);
    const { container } = render(
      <BaseNode data={makeData()} selected={true} icon={<span>IC</span>} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('ring-2');
  });

  // -- Category colors --

  it('applies category color via CSS variable for different categories', () => {
    const categories: NodeCategory[] = ['compute', 'storage', 'messaging', 'networking', 'client'];
    for (const category of categories) {
      mockZoom.mockReturnValue(1);
      const { unmount, container } = render(
        <BaseNode data={makeData({ category })} selected={false} icon={<span>IC</span>} />,
      );
      // The node border color should use a CSS variable
      const outerDiv = container.firstElementChild as HTMLElement;
      expect(outerDiv.style.borderColor).toContain('var(--node-');
      unmount();
    }
  });

  // -- State dot --

  it('renders state dot with correct CSS variable for each state', () => {
    const states = ['idle', 'active', 'success', 'warning', 'error', 'processing'] as const;
    for (const state of states) {
      mockZoom.mockReturnValue(1);
      const { container, unmount } = render(
        <BaseNode data={makeData({ state })} selected={false} icon={<span>IC</span>} />,
      );
      // The state dot is a rounded-full span in the header
      const stateDots = container.querySelectorAll('.rounded-full');
      const stateDot = Array.from(stateDots).find(
        (el) => (el as HTMLElement).style.backgroundColor?.includes('--state-'),
      );
      expect(stateDot).toBeTruthy();
      unmount();
    }
  });
});
