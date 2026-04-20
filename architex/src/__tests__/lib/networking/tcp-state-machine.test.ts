import { describe, it, expect } from 'vitest';
import { TCPConnection } from '@/lib/networking/tcp-state-machine';

describe('TCPConnection', () => {
  it('connect() produces 3 handshake events', () => {
    const conn = new TCPConnection();
    const events = conn.connect();
    expect(events).toHaveLength(3);
  });

  it('connect() transitions both sides to ESTABLISHED', () => {
    const conn = new TCPConnection();
    const events = conn.connect();
    expect(events[0].clientState).toBe('SYN_SENT');
    expect(events[1].serverState).toBe('SYN_RECEIVED');
    expect(events[2].clientState).toBe('ESTABLISHED');
    expect(events[2].serverState).toBe('ESTABLISHED');
  });

  it('close() produces 5 teardown events (4 segments + TIME_WAIT timer expiry)', () => {
    const conn = new TCPConnection();
    conn.connect();
    const events = conn.close('client');
    // 4 segment events (FIN / ACK / FIN / ACK) + 1 TIME_WAIT -> CLOSED
    // pedagogical timer-expiry event explaining 2*MSL.
    expect(events).toHaveLength(5);
  });

  it('close() transitions both sides to CLOSED', () => {
    const conn = new TCPConnection();
    conn.connect();
    conn.close('client');
    expect(conn.clientState).toBe('CLOSED');
    expect(conn.serverState).toBe('CLOSED');
  });
});
