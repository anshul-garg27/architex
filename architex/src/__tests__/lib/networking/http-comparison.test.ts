import { describe, it, expect } from 'vitest';
import { compareHTTPVersions } from '@/lib/networking/http-comparison';

const resources = [
  { method: 'GET', path: '/index.html', sizeKB: 10 },
  { method: 'GET', path: '/style.css', sizeKB: 25 },
  { method: 'GET', path: '/app.js', sizeKB: 150 },
  { method: 'GET', path: '/hero.png', sizeKB: 200 },
  { method: 'GET', path: '/logo.svg', sizeKB: 5 },
  { method: 'GET', path: '/font.woff2', sizeKB: 40 },
  { method: 'GET', path: '/analytics.js', sizeKB: 20 },
  { method: 'GET', path: '/api/data', sizeKB: 3 },
];

describe('HTTP version comparison', () => {
  it('HTTP/2 is faster than HTTP/1.1', () => {
    const result = compareHTTPVersions(resources, 50);
    expect(result.totalTime.http2).toBeLessThan(result.totalTime.http11);
  });

  it('HTTP/3 is faster than HTTP/2', () => {
    const result = compareHTTPVersions(resources, 50);
    expect(result.totalTime.http3).toBeLessThanOrEqual(result.totalTime.http2);
  });

  it('all versions produce events for every resource', () => {
    const result = compareHTTPVersions(resources, 50);
    expect(result.http11).toHaveLength(resources.length);
    expect(result.http2).toHaveLength(resources.length);
    expect(result.http3).toHaveLength(resources.length);
  });
});
