import { describe, it, expect } from 'vitest';
import { kmpSearch, KMP_CONFIG } from '../kmp';
import { rabinKarpSearch, RABIN_KARP_CONFIG } from '../rabin-karp';

// ── KMP String Search ─────────────────────────────────────────

describe('kmpSearch', () => {
  it('finds a single occurrence', () => {
    const result = kmpSearch('ABCXABCDABXABCDABCDABDE', 'ABCDABD');
    expect(result.matches).toContain(15);
  });

  it('finds multiple occurrences', () => {
    const result = kmpSearch('AAAA', 'AA');
    expect(result.matches).toEqual([0, 1, 2]);
  });

  it('returns empty matches when pattern is not found', () => {
    const result = kmpSearch('ABCDEF', 'XYZ');
    expect(result.matches).toEqual([]);
  });

  it('builds correct failure function for ABAB', () => {
    const result = kmpSearch('XABABX', 'ABAB');
    expect(result.failureFunction).toEqual([0, 0, 1, 2]);
  });

  it('builds correct failure function for AAAA', () => {
    const result = kmpSearch('XAAAA', 'AAAA');
    expect(result.failureFunction).toEqual([0, 1, 2, 3]);
  });

  it('handles empty pattern gracefully', () => {
    const result = kmpSearch('ABC', '');
    expect(result.matches).toEqual([]);
    expect(result.steps).toHaveLength(0);
  });

  it('handles empty text gracefully', () => {
    const result = kmpSearch('', 'ABC');
    expect(result.matches).toEqual([]);
  });

  it('handles pattern longer than text', () => {
    const result = kmpSearch('AB', 'ABCDEF');
    expect(result.matches).toEqual([]);
  });

  it('finds pattern at the start of text', () => {
    const result = kmpSearch('ABCDEF', 'ABC');
    expect(result.matches).toContain(0);
  });

  it('finds pattern at the end of text', () => {
    const result = kmpSearch('XYZABC', 'ABC');
    expect(result.matches).toContain(3);
  });

  it('returns correct config', () => {
    const result = kmpSearch('test', 'te');
    expect(result.config).toBe(KMP_CONFIG);
    expect(result.config.id).toBe('kmp');
  });

  it('generates animation steps for valid search', () => {
    const result = kmpSearch('ABABAB', 'ABA');
    expect(result.steps.length).toBeGreaterThan(0);
  });
});

// ── Rabin-Karp Search ─────────────────────────────────────────

describe('rabinKarpSearch', () => {
  it('finds a single occurrence', () => {
    const result = rabinKarpSearch('HELLO WORLD', 'WORLD');
    expect(result.matches).toContain(6);
  });

  it('finds multiple occurrences', () => {
    const result = rabinKarpSearch('ABCABCABC', 'ABC');
    expect(result.matches).toEqual([0, 3, 6]);
  });

  it('returns empty matches when pattern is not found', () => {
    const result = rabinKarpSearch('ABCDEF', 'XYZ');
    expect(result.matches).toEqual([]);
  });

  it('handles empty pattern gracefully', () => {
    const result = rabinKarpSearch('ABC', '');
    expect(result.matches).toEqual([]);
    expect(result.steps).toHaveLength(0);
  });

  it('handles pattern longer than text', () => {
    const result = rabinKarpSearch('AB', 'ABCDEF');
    expect(result.matches).toEqual([]);
  });

  it('records hash values for each window position', () => {
    const result = rabinKarpSearch('ABCDE', 'AB');
    // hashValues should have entries for each window
    expect(result.hashValues.length).toBeGreaterThan(0);
  });

  it('returns correct config', () => {
    const result = rabinKarpSearch('test', 'te');
    expect(result.config).toBe(RABIN_KARP_CONFIG);
    expect(result.config.id).toBe('rabin-karp');
  });

  it('generates animation steps for valid search', () => {
    const result = rabinKarpSearch('ABCABC', 'ABC');
    expect(result.steps.length).toBeGreaterThan(0);
  });
});
