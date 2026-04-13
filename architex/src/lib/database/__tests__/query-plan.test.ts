import { describe, it, expect } from 'vitest';
import { generateQueryPlan } from '../query-plan';

// ── Query Plan Visualizer Tests ───────────────────────────────

describe('generateQueryPlan', () => {
  it('simple SELECT produces SeqScan node', () => {
    const plan = generateQueryPlan('SELECT * FROM users');

    expect(plan.type).toBe('SeqScan');
    expect(plan.table).toBe('users');
    expect(plan.description).toContain('Sequential scan');
    expect(plan.children).toHaveLength(0);
    expect(plan.rows).toBeGreaterThan(0);
    expect(plan.cost).toBeGreaterThan(0);
  });

  it('SELECT with WHERE id=1 produces IndexScan node (PK lookup)', () => {
    const plan = generateQueryPlan('SELECT * FROM users WHERE id = 1');

    expect(plan.type).toBe('IndexScan');
    expect(plan.table).toBe('users');
    expect(plan.description).toContain('Index scan');
    expect(plan.description).toContain('pk');
    expect(plan.rows).toBe(1);
  });

  it('JOIN query produces HashJoin node with 2 children', () => {
    const plan = generateQueryPlan(
      'SELECT * FROM orders JOIN users ON orders.user_id = users.id',
    );

    expect(plan.type).toBe('HashJoin');
    expect(plan.children).toHaveLength(2);
    expect(plan.description).toContain('Hash join');
    // Both children should be SeqScans
    expect(plan.children[0].type).toBe('SeqScan');
    expect(plan.children[1].type).toBe('SeqScan');
    expect(plan.children[0].table).toBe('orders');
    expect(plan.children[1].table).toBe('users');
  });

  it('query with ORDER BY produces Sort node', () => {
    const plan = generateQueryPlan('SELECT * FROM users ORDER BY name');

    expect(plan.type).toBe('Sort');
    expect(plan.description).toContain('Sort by name');
    expect(plan.children).toHaveLength(1);
    // Child should be a SeqScan
    expect(plan.children[0].type).toBe('SeqScan');
  });

  it('query with GROUP BY produces Aggregate node', () => {
    const plan = generateQueryPlan(
      'SELECT status, COUNT(*) FROM orders GROUP BY status',
    );

    expect(plan.type).toBe('Aggregate');
    expect(plan.description).toContain('Aggregate');
    expect(plan.children).toHaveLength(1);
  });

  it('query with LIMIT produces Limit wrapper node', () => {
    const plan = generateQueryPlan('SELECT * FROM users LIMIT 10');

    expect(plan.type).toBe('Limit');
    expect(plan.description).toContain('Limit 10');
    expect(plan.rows).toBeLessThanOrEqual(10);
    expect(plan.children).toHaveLength(1);
    // Child should be a SeqScan
    expect(plan.children[0].type).toBe('SeqScan');
  });

  it('query with WHERE (non-PK) produces Filter wrapping SeqScan', () => {
    const plan = generateQueryPlan(
      'SELECT * FROM users WHERE name = \'Alice\'',
    );

    expect(plan.type).toBe('Filter');
    expect(plan.children).toHaveLength(1);
    expect(plan.children[0].type).toBe('SeqScan');
  });
});
