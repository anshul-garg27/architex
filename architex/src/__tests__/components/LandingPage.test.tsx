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
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileInView', 'whileTap', 'layout', 'layoutId'].includes(key)
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
    { id: 'team', name: 'Team', description: 'Teams.', monthlyPrice: 29, perSeat: true, cta: 'Contact', ctaHref: 'mailto:team@architex.dev', features: ['Everything in Pro'] },
  ],
  formatPrice: (t: { monthlyPrice: number }) => (t.monthlyPrice === 0 ? 'Free' : `$${t.monthlyPrice}`),
  formatPeriod: (t: { monthlyPrice: number }) => (t.monthlyPrice === 0 ? 'forever' : '/month'),
}));

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

describe('LandingPage — renders all sections', () => {
  it('renders without crashing', () => {
    render(<LandingPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders the hero section with Architex branding', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Architex/i).length).toBeGreaterThan(0);
  });

  it('renders the modules section', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/System Design/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Data Structures/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Algorithms/i).length).toBeGreaterThan(0);
  });

  it('renders the pricing section', () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pro/i).length).toBeGreaterThan(0);
  });

  it('renders the mini simulator in hero', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('mini-simulator')).toBeInTheDocument();
  });

  it('renders footer with links', () => {
    render(<LandingPage />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(3);
  });
});
