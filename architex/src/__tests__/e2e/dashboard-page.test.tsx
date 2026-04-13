import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileInView', 'whileTap', 'layout'].includes(key)
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
  getStaggerDelay: () => 0,
  slideUp: {},
}));

vi.mock('@/components/landing/AnimatedText', () => ({
  CountUpNumber: ({ end }: { end: number }) => <span>{end}</span>,
}));

// Dynamically import after mocks
const { default: DashboardPage } = await import('@/app/dashboard/page');

describe('E2E: Dashboard page loads with correct content', () => {
  it('renders the dashboard page without crashing', () => {
    render(<DashboardPage />);
    expect(document.body).toBeTruthy();
  });

  it('displays a welcome heading or dashboard title', () => {
    render(<DashboardPage />);
    // Dashboard should have some heading content
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders navigation links to modules', () => {
    render(<DashboardPage />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
