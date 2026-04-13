import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { ToastContainer, useToastStore } from './toast';

const meta: Meta<typeof ToastContainer> = {
  title: 'UI/Toast',
  component: ToastContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      // Reset toast store before each story renders
      useEffect(() => {
        useToastStore.setState({ toasts: [] });
      }, []);
      return (
        <div className="relative min-h-[300px] w-full bg-[var(--background)]">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

// Helper: inject toasts via the store directly so they render immediately
function withToasts(
  toasts: Array<{ type: 'success' | 'error' | 'warning' | 'info'; message: string }>,
) {
  return function ToastStory() {
    useEffect(() => {
      useToastStore.setState({ toasts: [] });
      toasts.forEach(({ type, message }, i) => {
        useToastStore.setState((s) => ({
          toasts: [
            ...s.toasts,
            { id: `story-${i}`, type, message, duration: 999_999 },
          ],
        }));
      });
    }, []);
    return <ToastContainer />;
  };
}

// ── Individual types ──────────────────────────────────────────

export const SuccessToast: Story = {
  render: withToasts([{ type: 'success', message: 'Design saved successfully.' }]),
};

export const ErrorToast: Story = {
  render: withToasts([{ type: 'error', message: 'Failed to connect to database node.' }]),
};

export const WarningToast: Story = {
  render: withToasts([{ type: 'warning', message: 'Latency budget exceeded on /api/users.' }]),
};

export const InfoToast: Story = {
  render: withToasts([{ type: 'info', message: 'Auto-layout applied to 12 nodes.' }]),
};

// ── All four together ─────────────────────────────────────────

export const AllTypes: Story = {
  render: withToasts([
    { type: 'success', message: 'Design saved successfully.' },
    { type: 'error', message: 'Failed to connect to database node.' },
    { type: 'warning', message: 'Latency budget exceeded on /api/users.' },
    { type: 'info', message: 'Auto-layout applied to 12 nodes.' },
  ]),
};
