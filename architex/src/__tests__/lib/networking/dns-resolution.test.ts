import { describe, it, expect } from 'vitest';
import { DNSResolver } from '@/lib/networking/dns-resolution';

describe('DNSResolver', () => {
  it('resolves a known domain through the full chain', () => {
    const dns = new DNSResolver();
    const events = dns.resolve('example.com', 'A');
    expect(events.length).toBeGreaterThan(0);
    const finalResponse = events.find(
      (e) => e.to === 'client' && e.response?.ip,
    );
    expect(finalResponse).toBeDefined();
    expect(finalResponse!.response!.ip).toBe('93.184.216.34');
  });

  it('serves from cache on second resolve of the same domain', () => {
    const dns = new DNSResolver();
    dns.resolve('example.com', 'A');
    const events2 = dns.resolve('example.com', 'A');
    const cacheHit = events2.find((e) => e.cached === true);
    expect(cacheHit).toBeDefined();
    expect(events2.length).toBeLessThan(dns.getQueryLog().length);
  });

  it('follows CNAME chains to the final A record', () => {
    const dns = new DNSResolver();
    const events = dns.resolve('www.example.com', 'A');
    const finalResponse = events.find(
      (e) => e.to === 'client' && e.response?.ip,
    );
    expect(finalResponse).toBeDefined();
    expect(finalResponse!.response!.ip).toBe('93.184.216.34');
  });
});
