import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import { PRICING_TIERS, formatPrice, formatPeriod, type PricingTier } from '@/lib/constants/pricing';

describe('PricingContent -- displays correct pricing', () => {
  it('has exactly 4 pricing tiers', () => {
    expect(PRICING_TIERS).toHaveLength(4);
  });

  it('Free tier: $0 price, correct features', () => {
    const free = PRICING_TIERS.find((t) => t.id === 'free')!;
    expect(free.monthlyPrice).toBe(0);
    expect(free.name).toBe('Free');
    expect(free.features).toContain('5 simulations per day');
    expect(free.features).toContain('Community support');
  });

  it('Student tier: $0 price, .edu verification required', () => {
    const student = PRICING_TIERS.find((t) => t.id === 'student')!;
    expect(student.monthlyPrice).toBe(0);
    expect(student.name).toBe('Student');
    expect(student.features).toContain('All Pro features at $0');
    expect(student.features).toContain('Requires .edu email verification');
  });

  it('Pro tier: $12/month, marked popular', () => {
    const pro = PRICING_TIERS.find((t) => t.id === 'pro')!;
    expect(pro.monthlyPrice).toBe(12);
    expect(pro.popular).toBe(true);
    expect(pro.features).toContain('Unlimited simulations');
    expect(pro.features).toContain('AI-powered hints & evaluation');
  });

  it('Team tier: $29/seat/month, per-seat billing', () => {
    const team = PRICING_TIERS.find((t) => t.id === 'team')!;
    expect(team.monthlyPrice).toBe(29);
    expect(team.perSeat).toBe(true);
    expect(team.features).toContain('Real-time collaboration');
  });

  it('formatPrice returns correct strings', () => {
    const free = PRICING_TIERS.find((t) => t.id === 'free')!;
    const student = PRICING_TIERS.find((t) => t.id === 'student')!;
    const pro = PRICING_TIERS.find((t) => t.id === 'pro')!;
    const team = PRICING_TIERS.find((t) => t.id === 'team')!;
    expect(formatPrice(free)).toBe('Free');
    expect(formatPrice(student)).toBe('Free');
    expect(formatPrice(pro)).toBe('$12');
    expect(formatPrice(team)).toBe('$29');
  });

  it('formatPeriod returns correct strings', () => {
    const free = PRICING_TIERS.find((t) => t.id === 'free')!;
    const student = PRICING_TIERS.find((t) => t.id === 'student')!;
    const pro = PRICING_TIERS.find((t) => t.id === 'pro')!;
    const team = PRICING_TIERS.find((t) => t.id === 'team')!;
    expect(formatPeriod(free)).toBe('forever');
    expect(formatPeriod(student)).toBe('forever');
    expect(formatPeriod(pro)).toBe('/month');
    expect(formatPeriod(team)).toBe('/seat/month');
  });

  it('all tiers have CTA text and href', () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.cta).toBeTruthy();
      expect(tier.ctaHref).toBeTruthy();
    }
  });
});
