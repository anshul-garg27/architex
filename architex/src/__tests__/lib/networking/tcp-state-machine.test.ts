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

  it('close() produces 4 teardown events', () => {
    const conn = new TCPConnection();
    conn.connect();
    const events = conn.close('client');
    expect(events).toHaveLength(4);
  });

  it('close() transitions both sides to CLOSED', () => {
    const conn = new TCPConnection();
    conn.connect();
    conn.close('client');
    expect(conn.clientState).toBe('CLOSED');
    expect(conn.serverState).toBe('CLOSED');
  });
});
