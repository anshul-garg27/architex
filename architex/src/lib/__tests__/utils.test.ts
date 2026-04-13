import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cn() utility', () => {
  // ── Basic class merging ──────────────────────────────────────

  it('merges simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles empty arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles single class string', () => {
    expect(cn('text-sm')).toBe('text-sm');
  });

  // ── Tailwind conflict resolution ─────────────────────────────

  it('resolves conflicting Tailwind padding classes', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('resolves conflicting Tailwind text-size classes', () => {
    const result = cn('text-lg', 'text-sm');
    expect(result).toBe('text-sm');
  });

  it('resolves conflicting bg-color classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });

  // ── Conditional classes (clsx behavior) ──────────────────────

  it('filters out falsy values', () => {
    const result = cn('base', false && 'hidden', null, undefined, 'visible');
    expect(result).toBe('base visible');
  });

  it('handles conditional object syntax', () => {
    const result = cn('base', { 'text-red-500': true, 'text-blue-500': false });
    expect(result).toBe('base text-red-500');
  });

  it('handles array arguments', () => {
    const result = cn(['flex', 'items-center'], 'gap-2');
    expect(result).toBe('flex items-center gap-2');
  });

  // ── Complex merging ──────────────────────────────────────────

  it('merges complex Tailwind utilities with overrides', () => {
    const result = cn(
      'rounded-md bg-white p-4 text-sm',
      'p-2 bg-gray-100',
    );
    expect(result).toContain('rounded-md');
    expect(result).toContain('text-sm');
    expect(result).toContain('p-2');
    expect(result).toContain('bg-gray-100');
    expect(result).not.toContain('p-4');
    expect(result).not.toContain('bg-white');
  });

  it('preserves non-conflicting classes from multiple inputs', () => {
    const result = cn('flex', 'items-center', 'justify-between', 'gap-4');
    expect(result).toBe('flex items-center justify-between gap-4');
  });
});
