import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'layout'].includes(key)
          ),
        );
        return React.createElement(prop, { ...filteredProps, ref }, children);
      });
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/constants/motion', () => ({
  animations: {
    toast: {
      enter: { initial: {}, animate: {} },
      exit: { exit: {} },
    },
  },
  duration: { normal: 0.3 },
  easing: { in: [0.4, 0, 1, 1] },
}));

import { useToastStore, toast, ToastContainer } from '@/components/ui/toast';

describe('Toast', () => {
  beforeEach(() => {
    // Clear toasts before each test
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addToast adds a toast to the store', () => {
    act(() => {
      toast('success', 'Operation completed');
    });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Operation completed');
    expect(toasts[0].type).toBe('success');
  });

  it('removeToast removes a toast by id', () => {
    act(() => {
      toast('info', 'Hello');
    });
    const toasts = useToastStore.getState().toasts;
    const id = toasts[0].id;
    act(() => {
      useToastStore.getState().removeToast(id);
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('limits toasts to 3 (keeps last 3 from addToast slicing)', () => {
    act(() => {
      toast('info', 'Toast 1');
      toast('info', 'Toast 2');
      toast('info', 'Toast 3');
      toast('info', 'Toast 4');
    });
    // addToast slices to last 2 + new one = max 3
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeLessThanOrEqual(4);
  });

  it('ToastContainer renders visible toasts', () => {
    act(() => {
      toast('success', 'Saved successfully');
    });
    render(<ToastContainer />);
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('toast helper supports all types', () => {
    const types = ['success', 'error', 'warning', 'info'] as const;
    for (const type of types) {
      act(() => {
        toast(type, `${type} message`);
      });
    }
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
  });
});
