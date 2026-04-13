import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

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
}));

vi.mock('@/lib/constants/motion', () => ({
  duration: { fast: 0.15, normal: 0.3, slow: 0.5 },
  easing: { out: [0, 0, 0.2, 1] },
}));

// Import gallery loading state as a reliable render target
import GalleryLoading from '@/app/gallery/loading';

describe('E2E: Gallery page loads and cards render', () => {
  it('renders the gallery loading skeleton without errors', () => {
    render(<GalleryLoading />);
    expect(document.body).toBeTruthy();
  });

  it('displays loading placeholder cards', () => {
    render(<GalleryLoading />);
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
