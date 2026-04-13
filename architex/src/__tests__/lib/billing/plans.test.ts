import { describe, it, expect } from 'vitest';
import {
  FREE_PLAN,
  STUDENT_PLAN,
  PRO_PLAN,
  TEAM_PLAN,
  PLANS,
  PLAN_LIST,
  getPlan,
} from '@/lib/billing/plans';
import type { PlanId } from '@/lib/billing/types';

describe('plans', () => {
  // -- Plan definitions --

  it('free plan has correct limits', () => {
    expect(FREE_PLAN.limits).toEqual({
      simulations: 5,
      templates: 10,
      aiHints: 0,
      exports: 3,
      collaborators: 0,
    });
  });

  it('free plan has zero cost', () => {
    expect(FREE_PLAN.monthlyPrice).toBe(0);
    expect(FREE_PLAN.yearlyPrice).toBe(0);
  });

  it('student plan has same limits as pro', () => {
    expect(STUDENT_PLAN.limits.simulations).toBe(Infinity);
    expect(STUDENT_PLAN.limits.templates).toBe(Infinity);
    expect(STUDENT_PLAN.limits.aiHints).toBe(50);
    expect(STUDENT_PLAN.limits.exports).toBe(Infinity);
  });

  it('student plan has zero cost', () => {
    expect(STUDENT_PLAN.monthlyPrice).toBe(0);
    expect(STUDENT_PLAN.yearlyPrice).toBe(0);
  });

  it('pro plan has unlimited simulations and exports', () => {
    expect(PRO_PLAN.limits.simulations).toBe(Infinity);
    expect(PRO_PLAN.limits.exports).toBe(Infinity);
  });

  it('pro plan has 50 AI hints', () => {
    expect(PRO_PLAN.limits.aiHints).toBe(50);
  });

  it('team plan has everything unlimited plus 10 collaborators', () => {
    expect(TEAM_PLAN.limits.simulations).toBe(Infinity);
    expect(TEAM_PLAN.limits.templates).toBe(Infinity);
    expect(TEAM_PLAN.limits.aiHints).toBe(Infinity);
    expect(TEAM_PLAN.limits.exports).toBe(Infinity);
    expect(TEAM_PLAN.limits.collaborators).toBe(10);
  });

  // -- PLANS record --

  it('PLANS contains all four plan ids', () => {
    const ids: PlanId[] = ['free', 'student', 'pro', 'team'];
    for (const id of ids) {
      expect(PLANS[id]).toBeDefined();
      expect(PLANS[id].id).toBe(id);
    }
  });

  // -- PLAN_LIST --

  it('PLAN_LIST is ordered cheapest first', () => {
    expect(PLAN_LIST[0].id).toBe('free');
    expect(PLAN_LIST[1].id).toBe('student');
    expect(PLAN_LIST[2].id).toBe('pro');
    expect(PLAN_LIST[3].id).toBe('team');
  });

  // -- getPlan --

  it('getPlan retrieves the correct plan by id', () => {
    expect(getPlan('free')).toBe(FREE_PLAN);
    expect(getPlan('student')).toBe(STUDENT_PLAN);
    expect(getPlan('pro')).toBe(PRO_PLAN);
    expect(getPlan('team')).toBe(TEAM_PLAN);
  });

  // -- Pricing sanity --

  it('yearly pricing offers a discount over 12x monthly', () => {
    expect(PRO_PLAN.yearlyPrice).toBeLessThan(PRO_PLAN.monthlyPrice * 12);
    expect(TEAM_PLAN.yearlyPrice).toBeLessThan(TEAM_PLAN.monthlyPrice * 12);
  });

  // -- Feature strings --

  it('each plan has at least one feature string', () => {
    for (const plan of PLAN_LIST) {
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});
