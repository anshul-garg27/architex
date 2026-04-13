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

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
        const filteredProps = Object.fromEntries(
          Object.entries(props).filter(([key]) =>
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileInView', 'whileTap', 'layout', 'layoutId', 'onAnimationComplete'].includes(key)
          ),
        );
        return React.createElement(prop, { ...filteredProps, ref }, children);
      });
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useInView: () => true,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 0,
  useReducedMotion: () => false,
}));

// Mock constants
vi.mock('@/lib/constants/motion', () => ({
  duration: { fast: 0.15, normal: 0.3, slow: 0.5, quick: 0.1 },
  easing: { out: [0, 0, 0.2, 1], in: [0.4, 0, 1, 1] },
  animations: { toast: { enter: { initial: {}, animate: {} }, exit: { exit: {} } } },
  springs: {},
  getStaggerDelay: () => 0,
  slideUp: {},
}));

vi.mock('@/lib/constants/pricing', () => ({
  PRICING_TIERS: [
    { id: 'free', name: 'Free', description: 'Get started.', monthlyPrice: 0, cta: 'Get Started', ctaHref: '/dashboard', features: ['5 sims/day'] },
    { id: 'pro', name: 'Pro', description: 'Full experience.', monthlyPrice: 12, popular: true, cta: 'Upgrade', ctaHref: '/dashboard?upgrade=pro', features: ['Unlimited'] },
  ],
  formatPrice: (t: { monthlyPrice: number }) => (t.monthlyPrice === 0 ? 'Free' : `$${t.monthlyPrice}`),
  formatPeriod: (t: { monthlyPrice: number }) => (t.monthlyPrice === 0 ? 'forever' : '/month'),
}));

// Mock sub-components
vi.mock('@/components/landing/GradientMeshBackground', () => ({
  GradientMeshBackground: () => <div data-testid="gradient-bg" />,
}));

vi.mock('@/components/landing/AnimatedText', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TypewriterText: ({ text }: { text: string }) => <span>{text}</span>,
  FadeUpText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CountUpNumber: ({ end }: { end: number }) => <span>{end}</span>,
}));

vi.mock('@/components/landing/MiniSimulator', () => ({
  MiniSimulator: () => <div data-testid="mini-simulator" />,
}));

import { LandingPage } from '@/components/landing/LandingPage';

describe('E2E: Landing page loads and CTAs work', () => {
  it('renders the landing page without crashing', () => {
    render(<LandingPage />);
    expect(document.body).toBeTruthy();
  });

  it('displays the app name', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Architex/i).length).toBeGreaterThan(0);
  });

  it('renders primary CTA links', () => {
    render(<LandingPage />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));
    // Should have at least a dashboard or start link
    expect(hrefs.some((h) => h?.includes('/dashboard') || h?.includes('/landing'))).toBe(true);
  });

  it('renders module cards section', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/System Design/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Algorithms/i).length).toBeGreaterThan(0);
  });

  it('renders pricing section', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pro/i).length).toBeGreaterThan(0);
  });
});
