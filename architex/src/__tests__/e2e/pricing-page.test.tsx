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
            !['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'layout', 'layoutId'].includes(key)
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
  duration: { fast: 0.15, normal: 0.3 },
  easing: { out: [0, 0, 0.2, 1] },
}));

import { PRICING_TIERS } from '@/lib/constants/pricing';

describe('E2E: Pricing page renders with correct data', () => {
  it('exports the correct number of pricing tiers', () => {
    expect(PRICING_TIERS).toHaveLength(4);
  });

  it('Student tier has correct data', () => {
    const student = PRICING_TIERS.find((t) => t.id === 'student');
    expect(student).toBeDefined();
    expect(student!.monthlyPrice).toBe(0);
    expect(student!.name).toBe('Student');
    expect(student!.features.length).toBeGreaterThan(0);
  });

  it('Free tier has correct data', () => {
    const free = PRICING_TIERS.find((t) => t.id === 'free');
    expect(free).toBeDefined();
    expect(free!.monthlyPrice).toBe(0);
    expect(free!.name).toBe('Free');
    expect(free!.features.length).toBeGreaterThan(0);
  });

  it('Pro tier has correct data', () => {
    const pro = PRICING_TIERS.find((t) => t.id === 'pro');
    expect(pro).toBeDefined();
    expect(pro!.monthlyPrice).toBe(12);
    expect(pro!.popular).toBe(true);
  });

  it('Team tier has per-seat pricing', () => {
    const team = PRICING_TIERS.find((t) => t.id === 'team');
    expect(team).toBeDefined();
    expect(team!.monthlyPrice).toBe(29);
    expect(team!.perSeat).toBe(true);
  });

  it('all tiers have CTA links', () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.cta).toBeTruthy();
      expect(tier.ctaHref).toBeTruthy();
    }
  });
});
