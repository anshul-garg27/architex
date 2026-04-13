import { describe, it, expect } from 'vitest';
import {
  compareHTTPVersions,
  compareAPIs,
  compareSerializationFormats,
  SAMPLE_USER_DATA,
  DNSResolver,
  dnsToSequenceMessages,
  dnsRowBackground,
  DNS_COLUMN_MAP,
  DNS_SEQUENCE_COLUMNS,
  TLS13_HANDSHAKE_MESSAGES,
  TLS13_0RTT_MESSAGES,
  tls13ToSequenceMessages,
  tls13RowBackground,
  TLS13_RTT_BRACKETS,
  TLS13_0RTT_BRACKETS,
} from '../index';

// ---------------------------------------------------------------------------
// HTTP Version Comparison
// ---------------------------------------------------------------------------

describe('compareHTTPVersions', () => {
  const requests = [
    { method: 'GET', path: '/index.html', sizeKB: 10 },
    { method: 'GET', path: '/style.css', sizeKB: 25 },
    { method: 'GET', path: '/app.js', sizeKB: 150 },
  ];

  it('returns timelines for all three HTTP versions', () => {
    const result = compareHTTPVersions(requests, 50);

    expect(result.http11).toBeDefined();
    expect(result.http2).toBeDefined();
    expect(result.http3).toBeDefined();
    expect(result.http11.length).toBe(requests.length);
    expect(result.http2.length).toBe(requests.length);
    expect(result.http3.length).toBe(requests.length);
  });

  it('HTTP/2 and HTTP/3 are always multiplexed', () => {
    const result = compareHTTPVersions(requests, 50);

    expect(result.http2.every((r) => r.multiplexed)).toBe(true);
    expect(result.http3.every((r) => r.multiplexed)).toBe(true);
  });

  it('HTTP/1.1 requests are never multiplexed', () => {
    const result = compareHTTPVersions(requests, 50);
    expect(result.http11.every((r) => !r.multiplexed)).toBe(true);
  });

  it('HTTP/3 total time is less than or equal to HTTP/2', () => {
    const result = compareHTTPVersions(requests, 50);
    expect(result.totalTime.http3).toBeLessThanOrEqual(result.totalTime.http2);
  });

  it('HTTP/2 uses stream IDs (odd numbers for client-initiated)', () => {
    const result = compareHTTPVersions(requests, 50);
    for (const req of result.http2) {
      expect(req.streamId).toBeDefined();
      expect(req.streamId! % 2).toBe(1);
    }
  });

  it('total times are positive numbers', () => {
    const result = compareHTTPVersions(requests, 50);
    expect(result.totalTime.http11).toBeGreaterThan(0);
    expect(result.totalTime.http2).toBeGreaterThan(0);
    expect(result.totalTime.http3).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// API Protocol Comparison
// ---------------------------------------------------------------------------

describe('compareAPIs', () => {
  it('returns metrics for all three protocols', () => {
    const result = compareAPIs('get-user-by-id');

    expect(result.rest).toBeDefined();
    expect(result.graphql).toBeDefined();
    expect(result.grpc).toBeDefined();
  });

  it('REST requires multiple requests for get-user-by-id', () => {
    const result = compareAPIs('get-user-by-id');
    expect(result.rest.requests).toBe(3);
  });

  it('GraphQL and gRPC require exactly 1 request', () => {
    const result = compareAPIs('get-user-by-id');
    expect(result.graphql.requests).toBe(1);
    expect(result.grpc.requests).toBe(1);
  });

  it('gRPC has smallest payload (totalBytes)', () => {
    const result = compareAPIs('get-user-by-id');
    expect(result.grpc.totalBytes).toBeLessThan(result.graphql.totalBytes);
    expect(result.grpc.totalBytes).toBeLessThan(result.rest.totalBytes);
  });

  it('gRPC has lowest latency', () => {
    const result = compareAPIs('get-user-by-id');
    expect(result.grpc.latencyMs).toBeLessThan(result.rest.latencyMs);
    expect(result.grpc.latencyMs).toBeLessThan(result.graphql.latencyMs);
  });

  it('all operations return valid metrics', () => {
    const operations = ['list-users', 'get-user-by-id', 'create-user'] as const;
    for (const op of operations) {
      const result = compareAPIs(op);
      expect(result.rest.totalBytes).toBeGreaterThan(0);
      expect(result.graphql.totalBytes).toBeGreaterThan(0);
      expect(result.grpc.totalBytes).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Serialization Comparison
// ---------------------------------------------------------------------------

describe('compareSerializationFormats', () => {
  it('returns results for all four formats', () => {
    const results = compareSerializationFormats(SAMPLE_USER_DATA);
    expect(results).toHaveLength(4);

    const formats = results.map((r) => r.format);
    expect(formats).toContain('json');
    expect(formats).toContain('protobuf');
    expect(formats).toContain('msgpack');
    expect(formats).toContain('avro');
  });

  it('JSON result has the largest byte size', () => {
    const results = compareSerializationFormats(SAMPLE_USER_DATA);
    const json = results.find((r) => r.format === 'json')!;
    const others = results.filter((r) => r.format !== 'json');

    for (const other of others) {
      expect(other.sizeBytes).toBeLessThan(json.sizeBytes);
    }
  });

  it('JSON and MessagePack do not require schema', () => {
    const results = compareSerializationFormats(SAMPLE_USER_DATA);
    const json = results.find((r) => r.format === 'json')!;
    const msgpack = results.find((r) => r.format === 'msgpack')!;

    expect(json.schemaRequired).toBe(false);
    expect(msgpack.schemaRequired).toBe(false);
  });

  it('Protobuf and Avro require schema', () => {
    const results = compareSerializationFormats(SAMPLE_USER_DATA);
    const protobuf = results.find((r) => r.format === 'protobuf')!;
    const avro = results.find((r) => r.format === 'avro')!;

    expect(protobuf.schemaRequired).toBe(true);
    expect(avro.schemaRequired).toBe(true);
    expect(protobuf.schemaDefinition).toBeTruthy();
    expect(avro.schemaDefinition).toBeTruthy();
  });

  it('only JSON is human-readable', () => {
    const results = compareSerializationFormats(SAMPLE_USER_DATA);
    const json = results.find((r) => r.format === 'json')!;
    expect(json.humanReadable).toBe(true);

    const binaries = results.filter((r) => r.format !== 'json');
    expect(binaries.every((r) => !r.humanReadable)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DNS Resolution
// ---------------------------------------------------------------------------

describe('DNSResolver', () => {
  it('resolve returns an array of query events', () => {
    const resolver = new DNSResolver();
    const events = resolver.resolve('example.com', 'A');

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].from).toBe('client');
    expect(events[0].to).toBe('recursive-resolver');
  });

  it('caches results on subsequent lookups', () => {
    const resolver = new DNSResolver();
    const first = resolver.resolve('example.com', 'A');
    const second = resolver.resolve('example.com', 'A');

    // Second should be shorter (cache hit)
    expect(second.length).toBeLessThan(first.length);
    expect(second.some((e) => e.cached)).toBe(true);
  });

  it('follows CNAME chains', () => {
    const resolver = new DNSResolver();
    const events = resolver.resolve('www.example.com', 'A');

    const cnameEvent = events.find(
      (e) => e.response?.cname != null,
    );
    expect(cnameEvent).toBeDefined();
  });

  it('clearCache forces full resolution on next query', () => {
    const resolver = new DNSResolver();
    resolver.resolve('example.com', 'A');
    resolver.clearCache();
    const events = resolver.resolve('example.com', 'A');

    // No cached events in the fresh resolution
    expect(events.some((e) => e.cached)).toBe(false);
  });

  it('reset clears cache and query log', () => {
    const resolver = new DNSResolver();
    resolver.resolve('example.com', 'A');
    resolver.reset();

    expect(resolver.getQueryLog()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// DNS Sequence Diagram Helpers
// ---------------------------------------------------------------------------

describe('dnsToSequenceMessages', () => {
  it('converts DNS events to sequence format with mapped column names', () => {
    const resolver = new DNSResolver();
    const events = resolver.resolve('example.com', 'A');
    const messages = dnsToSequenceMessages(events);

    expect(messages.length).toBe(events.length);
    // First message should have display name "Client"
    expect(messages[0].from).toBe('Client');
    expect(messages[0].to).toBe('Recursive');
  });
});

describe('dnsRowBackground', () => {
  it('returns green for cached events', () => {
    const resolver = new DNSResolver();
    resolver.resolve('example.com', 'A');
    const events = resolver.resolve('example.com', 'A');

    const cachedIdx = events.findIndex((e) => e.cached);
    if (cachedIdx >= 0) {
      expect(dnsRowBackground(events, cachedIdx)).toBe('#22c55e');
    }
  });

  it('returns undefined for out-of-range index', () => {
    expect(dnsRowBackground([], 0)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// TLS 1.3 Handshake Data
// ---------------------------------------------------------------------------

describe('TLS 1.3 handshake data', () => {
  it('1-RTT handshake has 8 messages', () => {
    expect(TLS13_HANDSHAKE_MESSAGES).toHaveLength(8);
  });

  it('0-RTT resumption has 7 messages', () => {
    expect(TLS13_0RTT_MESSAGES).toHaveLength(7);
  });

  it('first two 1-RTT messages are plaintext', () => {
    expect(TLS13_HANDSHAKE_MESSAGES[0].encrypted).toBe(false);
    expect(TLS13_HANDSHAKE_MESSAGES[1].encrypted).toBe(false);
  });

  it('all 1-RTT messages after ServerHello are encrypted', () => {
    for (let i = 2; i < TLS13_HANDSHAKE_MESSAGES.length; i++) {
      expect(TLS13_HANDSHAKE_MESSAGES[i].encrypted).toBe(true);
    }
  });

  it('tls13ToSequenceMessages converts to sequence format', () => {
    const messages = tls13ToSequenceMessages(TLS13_HANDSHAKE_MESSAGES);
    expect(messages).toHaveLength(8);
    expect(messages[0].from).toBe('Client');
    expect(messages[0].to).toBe('Server');
    expect(messages[0].label).toContain('ClientHello');
  });

  it('tls13RowBackground returns red for plaintext, green for encrypted', () => {
    expect(tls13RowBackground(TLS13_HANDSHAKE_MESSAGES, 0)).toBe('#ef4444');
    expect(tls13RowBackground(TLS13_HANDSHAKE_MESSAGES, 2)).toBe('#22c55e');
  });

  it('TLS13_RTT_BRACKETS defines 1-RTT bracket', () => {
    expect(TLS13_RTT_BRACKETS).toHaveLength(1);
    expect(TLS13_RTT_BRACKETS[0].label).toContain('1 RTT');
  });

  it('TLS13_0RTT_BRACKETS defines both 0-RTT and 1-RTT brackets', () => {
    expect(TLS13_0RTT_BRACKETS).toHaveLength(2);
    expect(TLS13_0RTT_BRACKETS[0].label).toContain('0-RTT');
    expect(TLS13_0RTT_BRACKETS[1].label).toContain('1 RTT');
  });
});

// ---------------------------------------------------------------------------
// Column / constant completeness
// ---------------------------------------------------------------------------

describe('DNS constants', () => {
  it('DNS_COLUMN_MAP maps all expected components', () => {
    expect(DNS_COLUMN_MAP['client']).toBe('Client');
    expect(DNS_COLUMN_MAP['recursive-resolver']).toBe('Recursive');
    expect(DNS_COLUMN_MAP['root']).toBe('Root NS');
    expect(DNS_COLUMN_MAP['tld']).toBe('TLD NS');
    expect(DNS_COLUMN_MAP['authoritative']).toBe('Auth NS');
  });

  it('DNS_SEQUENCE_COLUMNS has 5 columns in order', () => {
    expect(DNS_SEQUENCE_COLUMNS).toEqual([
      'Client', 'Recursive', 'Root NS', 'TLD NS', 'Auth NS',
    ]);
  });
});
