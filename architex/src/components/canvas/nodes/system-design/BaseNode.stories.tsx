import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Server } from 'lucide-react';
import BaseNode from './BaseNode';
import type { SystemDesignNodeData } from '@/lib/types';
import { useViewportStore } from '@/stores/viewport-store';
import { useEffect } from 'react';

// ── Helpers ───────────────────────────────────────────────────

function makeData(
  overrides: Partial<SystemDesignNodeData> = {},
): SystemDesignNodeData {
  return {
    label: 'Web Server',
    category: 'compute',
    componentType: 'web-server',
    icon: 'server',
    config: { replicas: 3 },
    metrics: { throughput: 12500 },
    state: 'idle',
    ...overrides,
  };
}

/** Wrapper that sets zoom and provides ReactFlow context */
function StoryWrapper({
  zoom = 1,
  children,
}: {
  zoom?: number;
  children: React.ReactNode;
}) {
  useEffect(() => {
    useViewportStore.setState({ zoom });
  }, [zoom]);

  return (
    <ReactFlowProvider>
      <div className="flex items-center justify-center p-8 bg-[var(--background)]">
        {children}
      </div>
    </ReactFlowProvider>
  );
}

// ── Meta ──────────────────────────────────────────────────────

const meta: Meta<typeof BaseNode> = {
  title: 'Canvas/BaseNode',
  component: BaseNode,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BaseNode>;

const icon = <Server className="h-5 w-5" />;

// ── State variations ──────────────────────────────────────────

export const Idle: Story = {
  args: {
    data: makeData({ state: 'idle' }),
    selected: false,
    icon,
  },
};

export const Active: Story = {
  args: {
    data: makeData({ state: 'active', metrics: { throughput: 45200 } }),
    selected: false,
    icon,
  },
};

export const Error: Story = {
  args: {
    data: makeData({ state: 'error', metrics: { throughput: 0, errorRate: 0.12 } }),
    selected: false,
    icon,
  },
};

export const Warning: Story = {
  args: {
    data: makeData({ state: 'warning', metrics: { throughput: 8700 } }),
    selected: false,
    icon,
  },
};

export const Success: Story = {
  args: {
    data: makeData({ state: 'success', metrics: { throughput: 25000 } }),
    selected: false,
    icon,
  },
};

export const Processing: Story = {
  args: {
    data: makeData({ state: 'processing', metrics: { throughput: 3200 } }),
    selected: false,
    icon,
  },
};

// ── Selected ──────────────────────────────────────────────────

export const Selected: Story = {
  args: {
    data: makeData({ state: 'active', metrics: { throughput: 45200 } }),
    selected: true,
    icon,
  },
};

// ── Different categories ──────────────────────────────────────

export const StorageCategory: Story = {
  args: {
    data: makeData({
      label: 'PostgreSQL',
      category: 'storage',
      componentType: 'postgres',
      state: 'active',
      metrics: { throughput: 9800 },
    }),
    selected: false,
    icon,
  },
};

export const MessagingCategory: Story = {
  args: {
    data: makeData({
      label: 'Kafka',
      category: 'messaging',
      componentType: 'kafka',
      state: 'active',
      metrics: { throughput: 120000 },
    }),
    selected: false,
    icon,
  },
};

// ── LOD: Simplified (zoom 0.3-0.6) ───────────────────────────

export const SimplifiedLOD: Story = {
  decorators: [
    (Story) => (
      <StoryWrapper zoom={0.45}>
        <Story />
      </StoryWrapper>
    ),
  ],
  args: {
    data: makeData({ state: 'active' }),
    selected: false,
    icon,
  },
};

// ── LOD: Dot (zoom < 0.3) ────────────────────────────────────

export const DotLOD: Story = {
  decorators: [
    (Story) => (
      <StoryWrapper zoom={0.2}>
        <Story />
      </StoryWrapper>
    ),
  ],
  args: {
    data: makeData({ state: 'active' }),
    selected: false,
    icon,
  },
};

// ── Gallery: All states ───────────────────────────────────────

export const AllStates: Story = {
  render: () => {
    const states = ['idle', 'active', 'success', 'warning', 'error', 'processing'] as const;
    return (
      <StoryWrapper>
        <div className="flex flex-wrap gap-6">
          {states.map((state) => (
            <div key={state} className="flex flex-col items-center gap-2">
              <BaseNode
                data={makeData({ state, metrics: { throughput: 12500 } })}
                selected={false}
                icon={icon}
              />
              <span className="text-xs text-[var(--foreground-muted)]">{state}</span>
            </div>
          ))}
        </div>
      </StoryWrapper>
    );
  },
};
