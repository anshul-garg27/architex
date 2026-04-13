import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

// Import the sub-components indirectly -- the exported ActivityBar picks
// desktop vs. mobile automatically.  For Storybook we want to control
// this explicitly so we import the file and render with store overrides.
import { ActivityBar } from './activity-bar';

const meta: Meta<typeof ActivityBar> = {
  title: 'Shared/ActivityBar',
  component: ActivityBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Force desktop width so the desktop variant renders by default
      <div className="flex h-screen w-full bg-[var(--background)]">
        <Story />
        <div className="flex-1" />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActivityBar>;

// ── Default (System Design selected) ─────────────────────────

export const Default: Story = {
  render: () => {
    useEffect(() => {
      useUIStore.setState({ activeModule: 'system-design' });
    }, []);
    return <ActivityBar />;
  },
};

// ── Algorithms selected ──────────────────────────────────────

export const AlgorithmsActive: Story = {
  render: () => {
    useEffect(() => {
      useUIStore.setState({ activeModule: 'algorithms' });
    }, []);
    return <ActivityBar />;
  },
};

// ── Database selected ────────────────────────────────────────

export const DatabaseActive: Story = {
  render: () => {
    useEffect(() => {
      useUIStore.setState({ activeModule: 'database' });
    }, []);
    return <ActivityBar />;
  },
};

// ── Interview selected ───────────────────────────────────────

export const InterviewActive: Story = {
  render: () => {
    useEffect(() => {
      useUIStore.setState({ activeModule: 'interview' });
    }, []);
    return <ActivityBar />;
  },
};

// ── Distributed Systems selected ─────────────────────────────

export const DistributedActive: Story = {
  render: () => {
    useEffect(() => {
      useUIStore.setState({ activeModule: 'distributed' });
    }, []);
    return <ActivityBar />;
  },
};
