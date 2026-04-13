import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'layout'].includes(key)
          ),
        );
        return React.createElement(prop, { ...filteredProps, ref }, children);
      });
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
  useInView: () => true,
}));

vi.mock('@/lib/constants/motion', () => ({
  duration: { fast: 0.15, normal: 0.3, slow: 0.5 },
  easing: { out: [0, 0, 0.2, 1] },
  springs: { bouncy: { type: 'spring' } },
}));

import { MiniSimulator } from '@/components/landing/MiniSimulator';

describe('MiniSimulator — renders in hero', () => {
  it('renders without crashing', () => {
    const { container } = render(<MiniSimulator />);
    expect(container).toBeTruthy();
  });

  it('contains an SVG element', () => {
    const { container } = render(<MiniSimulator />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders node labels in the SVG', () => {
    const { container } = render(<MiniSimulator />);
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);
  });
});
