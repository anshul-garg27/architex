import { describe, it, expect } from 'vitest';
import { TLSHandshake } from '@/lib/networking/tls-handshake';
import type { TLSMessage, TLSMessageType } from '@/lib/networking/tls-handshake';

// ── TLS 1.3 Full Handshake ──────────────────────────────────

describe('TLSHandshake.performHandshake() — TLS 1.3', () => {
  it('produces exactly 8 messages', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    expect(msgs).toHaveLength(8);
  });

  it('first 2 messages are plaintext (ClientHello, ServerHello)', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    expect(msgs[0].type).toBe('ClientHello');
    expect(msgs[0].encrypted).toBe(false);
    expect(msgs[1].type).toBe('ServerHello');
    expect(msgs[1].encrypted).toBe(false);
  });

  it('remaining 6 messages are encrypted', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    for (let i = 2; i < msgs.length; i++) {
      expect(msgs[i].encrypted).toBe(true);
    }
  });

  it('follows correct TLS 1.3 message order', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    const types = msgs.map((m) => m.type);
    expect(types).toEqual([
      'ClientHello',
      'ServerHello',
      'EncryptedExtensions',
      'Certificate',
      'CertificateVerify',
      'Finished',
      'Finished',
      'ApplicationData',
    ]);
  });

  it('ClientHello is from client to server', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    expect(msgs[0].from).toBe('client');
    expect(msgs[0].to).toBe('server');
  });

  it('ServerHello through Server Finished are from server to client', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    for (let i = 1; i <= 5; i++) {
      expect(msgs[i].from).toBe('server');
      expect(msgs[i].to).toBe('client');
    }
  });

  it('Client Finished is from client to server', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    expect(msgs[6].from).toBe('client');
    expect(msgs[6].to).toBe('server');
  });

  it('ticks are monotonically increasing', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    for (let i = 1; i < msgs.length; i++) {
      expect(msgs[i].tick).toBeGreaterThan(msgs[i - 1].tick);
    }
  });

  it('every message has non-empty description and details', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performHandshake();
    for (const m of msgs) {
      expect(m.description.length).toBeGreaterThan(10);
      expect(Object.keys(m.details).length).toBeGreaterThan(0);
    }
  });
});

// ── TLS 1.3 0-RTT Resumption ───────────────────────────────

describe('TLSHandshake.performResumption() — TLS 1.3 0-RTT', () => {
  it('produces exactly 7 messages', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performResumption();
    expect(msgs).toHaveLength(7);
  });

  it('follows correct 0-RTT message order', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performResumption();
    const types = msgs.map((m) => m.type);
    expect(types).toEqual([
      'ClientHello',
      'ApplicationData',
      'ServerHello',
      'EncryptedExtensions',
      'Finished',
      'Finished',
      'ApplicationData',
    ]);
  });

  it('ClientHello is plaintext and mentions PSK', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performResumption();
    expect(msgs[0].encrypted).toBe(false);
    expect(msgs[0].details['pskIdentity']).toBeTruthy();
  });

  it('early ApplicationData (0-RTT) is encrypted', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performResumption();
    expect(msgs[1].type).toBe('ApplicationData');
    expect(msgs[1].encrypted).toBe(true);
  });

  it('ServerHello is plaintext', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performResumption();
    expect(msgs[2].type).toBe('ServerHello');
    expect(msgs[2].encrypted).toBe(false);
  });

  it('does not include Certificate or CertificateVerify (PSK auth)', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performResumption();
    const types = msgs.map((m) => m.type);
    expect(types).not.toContain('Certificate');
    expect(types).not.toContain('CertificateVerify');
  });
});

// ── TLS 1.2 Handshake ──────────────────────────────────────

describe('TLSHandshake.performTLS12Handshake() — TLS 1.2', () => {
  it('produces exactly 11 messages (NEW count after NET-017 fix)', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    expect(msgs).toHaveLength(11);
  });

  it('follows correct TLS 1.2 message order', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const types = msgs.map((m) => m.type);
    expect(types).toEqual([
      'ClientHello',
      'ServerHello',
      'Certificate',
      'ServerKeyExchange',
      'ServerHelloDone',
      'ClientKeyExchange',
      'ChangeCipherSpec',
      'Finished',
      'ChangeCipherSpec',
      'Finished',
      'ApplicationData',
    ]);
  });

  it('includes ServerKeyExchange message type', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const ske = msgs.find((m) => m.type === 'ServerKeyExchange');
    expect(ske).toBeDefined();
    expect(ske!.from).toBe('server');
    expect(ske!.to).toBe('client');
    expect(ske!.details['keyExchangeAlgorithm']).toBe('ECDHE');
  });

  it('includes ServerHelloDone message type', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const shd = msgs.find((m) => m.type === 'ServerHelloDone');
    expect(shd).toBeDefined();
    expect(shd!.from).toBe('server');
    expect(shd!.to).toBe('client');
  });

  it('includes ClientKeyExchange message type', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const cke = msgs.find((m) => m.type === 'ClientKeyExchange');
    expect(cke).toBeDefined();
    expect(cke!.from).toBe('client');
    expect(cke!.to).toBe('server');
  });

  it('includes 2 ChangeCipherSpec messages (client and server)', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const ccs = msgs.filter((m) => m.type === 'ChangeCipherSpec');
    expect(ccs).toHaveLength(2);
    expect(ccs[0].from).toBe('client');
    expect(ccs[1].from).toBe('server');
  });

  it('Certificate is NOT encrypted in TLS 1.2 (unlike TLS 1.3)', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const cert = msgs.find((m) => m.type === 'Certificate');
    expect(cert!.encrypted).toBe(false);
  });

  it('only Finished and ApplicationData messages are encrypted', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    for (const m of msgs) {
      if (m.type === 'Finished' || m.type === 'ApplicationData') {
        expect(m.encrypted).toBe(true);
      } else {
        expect(m.encrypted).toBe(false);
      }
    }
  });

  it('details reference TLS 1.2 version', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    expect(msgs[0].details['maxVersion']).toBe('TLS 1.2');
    expect(msgs[1].details['selectedVersion']).toBe('TLS 1.2');
  });

  it('last message is ApplicationData with 2 total round trips', () => {
    const tls = new TLSHandshake();
    const msgs = tls.performTLS12Handshake();
    const last = msgs[msgs.length - 1];
    expect(last.type).toBe('ApplicationData');
    expect(last.details['totalRoundTrips']).toBe('2');
  });
});

// ── reset() ─────────────────────────────────────────────────

describe('TLSHandshake.reset()', () => {
  it('clears all messages', () => {
    const tls = new TLSHandshake();
    tls.performHandshake();
    expect(tls.getMessages().length).toBeGreaterThan(0);
    tls.reset();
    expect(tls.getMessages()).toHaveLength(0);
  });

  it('ticks restart after reset', () => {
    const tls = new TLSHandshake();
    tls.performHandshake();
    tls.reset();
    const msgs = tls.performHandshake();
    expect(msgs[0].tick).toBe(1);
  });
});

// ── getMessages() ───────────────────────────────────────────

describe('TLSHandshake.getMessages()', () => {
  it('returns a copy of the message array', () => {
    const tls = new TLSHandshake();
    tls.performHandshake();
    const msgs1 = tls.getMessages();
    const msgs2 = tls.getMessages();
    expect(msgs1).not.toBe(msgs2);
    expect(msgs1).toEqual(msgs2);
  });

  it('returns empty array before any handshake', () => {
    const tls = new TLSHandshake();
    expect(tls.getMessages()).toHaveLength(0);
  });

  it('reflects messages from the most recent handshake after reset', () => {
    const tls = new TLSHandshake();
    tls.performHandshake();
    expect(tls.getMessages()).toHaveLength(8);
    tls.performResumption(); // calls reset internally
    expect(tls.getMessages()).toHaveLength(7);
  });
});

// ── Message field completeness ──────────────────────────────

describe('all TLS messages have required fields', () => {
  it('every message across all handshake types has all fields', () => {
    const tls = new TLSHandshake();
    const allMessages: TLSMessage[] = [];

    allMessages.push(...tls.performHandshake());
    allMessages.push(...tls.performResumption());
    allMessages.push(...tls.performTLS12Handshake());

    for (const m of allMessages) {
      expect(typeof m.tick).toBe('number');
      expect(m.tick).toBeGreaterThan(0);
      expect(typeof m.from).toBe('string');
      expect(typeof m.to).toBe('string');
      expect(typeof m.type).toBe('string');
      expect(typeof m.description).toBe('string');
      expect(m.description.length).toBeGreaterThan(10);
      expect(typeof m.details).toBe('object');
      expect(typeof m.encrypted).toBe('boolean');
    }
  });
});
