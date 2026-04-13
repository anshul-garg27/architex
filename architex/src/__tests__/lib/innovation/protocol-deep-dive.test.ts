import { describe, it, expect } from 'vitest';
import {
  PROTOCOLS,
  PROTOCOL_SLUGS,
  getProtocol,
  compareProtocols,
  type ProtocolDefinition,
} from '@/lib/innovation/protocol-deep-dive';

describe('protocol-deep-dive', () => {
  // ── Data completeness ───────────────────────────────────

  it('defines exactly 10 protocols', () => {
    expect(PROTOCOL_SLUGS).toHaveLength(10);
  });

  it('every slug maps to a valid ProtocolDefinition', () => {
    for (const slug of PROTOCOL_SLUGS) {
      expect(PROTOCOLS[slug]).toBeDefined();
    }
  });

  it.each(PROTOCOL_SLUGS)('%s has a non-empty name', (slug) => {
    expect(PROTOCOLS[slug].name.length).toBeGreaterThan(0);
  });

  it.each(PROTOCOL_SLUGS)('%s has at least one OSI layer', (slug) => {
    expect(PROTOCOLS[slug].layers.length).toBeGreaterThan(0);
  });

  it.each(PROTOCOL_SLUGS)('%s has at least 3 header fields', (slug) => {
    expect(PROTOCOLS[slug].headerFields.length).toBeGreaterThanOrEqual(3);
  });

  it.each(PROTOCOL_SLUGS)('%s has at least 2 handshake steps', (slug) => {
    expect(PROTOCOLS[slug].handshakeSteps.length).toBeGreaterThanOrEqual(2);
  });

  it.each(PROTOCOL_SLUGS)('%s has at least 2 use cases', (slug) => {
    expect(PROTOCOLS[slug].useCases.length).toBeGreaterThanOrEqual(2);
  });

  it.each(PROTOCOL_SLUGS)('%s has at least 2 tradeoffs', (slug) => {
    expect(PROTOCOLS[slug].tradeoffs.length).toBeGreaterThanOrEqual(2);
  });

  it.each(PROTOCOL_SLUGS)('%s has non-empty comparisonNotes', (slug) => {
    expect(PROTOCOLS[slug].comparisonNotes.length).toBeGreaterThan(0);
  });

  // ── Header field completeness ──────────────────────────

  it.each(PROTOCOL_SLUGS)(
    '%s header fields have name, purpose, and exampleValue',
    (slug) => {
      for (const field of PROTOCOLS[slug].headerFields) {
        expect(field.name.length).toBeGreaterThan(0);
        expect(field.purpose.length).toBeGreaterThan(0);
        expect(field.exampleValue.length).toBeGreaterThan(0);
        expect(typeof field.sizeBytes).toBe('number');
        expect(field.sizeBytes).toBeGreaterThanOrEqual(0);
      }
    },
  );

  // ── Handshake step completeness ────────────────────────

  it.each(PROTOCOL_SLUGS)(
    '%s handshake steps have correct sequential numbering',
    (slug) => {
      const steps = PROTOCOLS[slug].handshakeSteps;
      steps.forEach((step, i) => {
        expect(step.step).toBe(i + 1);
      });
    },
  );

  it.each(PROTOCOL_SLUGS)(
    '%s handshake steps all have sender, receiver, message, and description',
    (slug) => {
      for (const step of PROTOCOLS[slug].handshakeSteps) {
        expect(step.sender.length).toBeGreaterThan(0);
        expect(step.receiver.length).toBeGreaterThan(0);
        expect(step.message.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      }
    },
  );

  // ── Performance characteristics completeness ───────────

  it.each(PROTOCOL_SLUGS)(
    '%s has all 4 performance characteristic fields populated',
    (slug) => {
      const perf = PROTOCOLS[slug].performanceCharacteristics;
      expect(perf.latencyMs.length).toBeGreaterThan(0);
      expect(perf.throughput.length).toBeGreaterThan(0);
      expect(perf.overhead.length).toBeGreaterThan(0);
      expect(perf.connectionSetupTime.length).toBeGreaterThan(0);
    },
  );

  // ── getProtocol ────────────────────────────────────────

  it('getProtocol returns the correct protocol for a valid slug', () => {
    const tcp = getProtocol('tcp');
    expect(tcp).toBeDefined();
    expect(tcp!.name).toBe('TCP');
  });

  it('getProtocol returns undefined for an invalid slug', () => {
    expect(getProtocol('non-existent')).toBeUndefined();
  });

  // ── compareProtocols ──────────────────────────────────

  it('compareProtocols returns comparison data for two valid slugs', () => {
    const result = compareProtocols('tcp', 'http-2');
    expect(result).not.toBeNull();
    expect(result!.protocolA.name).toBe('TCP');
    expect(result!.protocolB.name).toBe('HTTP/2');
    expect(result!.headerCountA).toBe(PROTOCOLS['tcp'].headerFields.length);
    expect(result!.headerCountB).toBe(PROTOCOLS['http-2'].headerFields.length);
    expect(result!.handshakeStepsA).toBe(PROTOCOLS['tcp'].handshakeSteps.length);
    expect(result!.handshakeStepsB).toBe(PROTOCOLS['http-2'].handshakeSteps.length);
  });

  it('compareProtocols returns null if first slug is invalid', () => {
    expect(compareProtocols('nope', 'tcp')).toBeNull();
  });

  it('compareProtocols returns null if second slug is invalid', () => {
    expect(compareProtocols('tcp', 'nope')).toBeNull();
  });

  it('compareProtocols works for same protocol vs itself', () => {
    const result = compareProtocols('grpc', 'grpc');
    expect(result).not.toBeNull();
    expect(result!.protocolA.name).toBe(result!.protocolB.name);
  });

  // ── Cross-protocol sanity ─────────────────────────────

  it('all 10 protocol names are unique', () => {
    const names = PROTOCOL_SLUGS.map((s) => PROTOCOLS[s].name);
    expect(new Set(names).size).toBe(10);
  });
});
