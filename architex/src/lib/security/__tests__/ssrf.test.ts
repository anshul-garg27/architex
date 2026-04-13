import { describe, it, expect } from 'vitest';
import { validateURL } from '../ssrf';

describe('validateURL', () => {
  // ── Safe URLs ──────────────────────────────────────────

  describe('allows safe URLs', () => {
    it('accepts public https URLs', () => {
      expect(validateURL('https://example.com/avatar.png')).toEqual({ safe: true });
    });

    it('accepts public http URLs', () => {
      expect(validateURL('http://cdn.example.com/img.jpg')).toEqual({ safe: true });
    });

    it('accepts URLs with ports on public hosts', () => {
      expect(validateURL('https://example.com:8080/path')).toEqual({ safe: true });
    });

    it('accepts URLs with query strings', () => {
      expect(validateURL('https://example.com/img?w=200&h=200')).toEqual({ safe: true });
    });
  });

  // ── Private IPv4 ranges ────────────────────────────────

  describe('rejects private IPv4 ranges', () => {
    it('rejects 10.x.x.x (Class A private)', () => {
      const result = validateURL('http://10.0.0.1/admin');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('private');
    });

    it('rejects 172.16-31.x.x (Class B private)', () => {
      expect(validateURL('http://172.16.0.1/').safe).toBe(false);
      expect(validateURL('http://172.31.255.255/').safe).toBe(false);
    });

    it('allows 172.15.x.x (not in private range)', () => {
      expect(validateURL('http://172.15.0.1/').safe).toBe(true);
    });

    it('allows 172.32.x.x (not in private range)', () => {
      expect(validateURL('http://172.32.0.1/').safe).toBe(true);
    });

    it('rejects 192.168.x.x (Class C private)', () => {
      const result = validateURL('http://192.168.1.1/');
      expect(result.safe).toBe(false);
    });

    it('rejects 127.x.x.x (loopback)', () => {
      expect(validateURL('http://127.0.0.1/').safe).toBe(false);
      expect(validateURL('http://127.255.255.255/').safe).toBe(false);
    });

    it('rejects 0.0.0.0', () => {
      expect(validateURL('http://0.0.0.0/').safe).toBe(false);
    });

    it('rejects 169.254.x.x (link-local)', () => {
      expect(validateURL('http://169.254.169.254/latest/meta-data/').safe).toBe(false);
    });
  });

  // ── Blocked hostnames ──────────────────────────────────

  describe('rejects blocked hostnames', () => {
    it('rejects localhost', () => {
      const result = validateURL('http://localhost/admin');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('loopback');
    });

    it('rejects [::1] (IPv6 loopback)', () => {
      expect(validateURL('http://[::1]/').safe).toBe(false);
    });
  });

  // ── Scheme validation ──────────────────────────────────

  describe('rejects non-http(s) schemes', () => {
    it('rejects file:// protocol', () => {
      const result = validateURL('file:///etc/passwd');
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Scheme');
    });

    it('rejects ftp:// protocol', () => {
      expect(validateURL('ftp://evil.com/file').safe).toBe(false);
    });

    it('rejects gopher:// protocol', () => {
      expect(validateURL('gopher://evil.com/').safe).toBe(false);
    });

    it('rejects data: URIs', () => {
      expect(validateURL('data:text/html,<h1>hi</h1>').safe).toBe(false);
    });
  });

  // ── Malformed URLs ─────────────────────────────────────

  describe('rejects malformed URLs', () => {
    it('rejects empty string', () => {
      expect(validateURL('').safe).toBe(false);
    });

    it('rejects garbage input', () => {
      expect(validateURL('not a url at all').safe).toBe(false);
    });
  });

  // ── IPv4-mapped IPv6 ──────────────────────────────────

  describe('rejects IPv4-mapped IPv6 bypass attempts', () => {
    it('rejects ::ffff:127.0.0.1', () => {
      expect(validateURL('http://::ffff:127.0.0.1/').safe).toBe(false);
    });

    it('rejects ::ffff:10.0.0.1', () => {
      expect(validateURL('http://::ffff:10.0.0.1/').safe).toBe(false);
    });
  });
});
