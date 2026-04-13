import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// ── Variants ──────────────────────────────────────────────────

export const Default: Story = {
  args: { children: 'Default', variant: 'default' },
};

export const Success: Story = {
  args: { children: 'Healthy', variant: 'success' },
};

export const Warning: Story = {
  args: { children: 'Degraded', variant: 'warning' },
};

export const Destructive: Story = {
  args: { children: 'Down', variant: 'destructive' },
};

export const Secondary: Story = {
  args: { children: 'Info', variant: 'secondary' },
};

export const Outline: Story = {
  args: { children: 'Outline', variant: 'outline' },
};

// ── Sizes ─────────────────────────────────────────────────────

export const SmallSize: Story = {
  args: { children: 'Small', size: 'sm', variant: 'default' },
};

// ── Gallery ───────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Healthy</Badge>
      <Badge variant="warning">Degraded</Badge>
      <Badge variant="destructive">Down</Badge>
      <Badge variant="secondary">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const AllSizesGallery: Story = {
  name: 'Sizes Comparison',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="success" size="default">Default</Badge>
      <Badge variant="success" size="sm">Small</Badge>
    </div>
  ),
};
