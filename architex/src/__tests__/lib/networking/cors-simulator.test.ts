import { describe, it, expect } from 'vitest';
import { simulateCORS } from '@/lib/networking/cors-simulator';
import type { CORSConfig, CORSStep } from '@/lib/networking/cors-simulator';

// ── Helpers ─────────────────────────────────────────────────

/** Default server config that allows common cross-origin requests. */
const defaultServerConfig = {
  allowedOrigins: ['https://app.example.com'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: true,
  maxAge: 86400,
};

function makeConfig(overrides: Partial<CORSConfig> = {}): CORSConfig {
  return {
    origin: 'https://app.example.com',
    targetOrigin: 'https://api.example.com',
    method: 'GET',
    headers: [],
    credentials: false,
    ...overrides,
  };
}

// ── Same-origin request ─────────────────────────────────────

describe('simulateCORS — same-origin', () => {
  it('bypasses CORS entirely for same-origin request', () => {
    const steps = simulateCORS(
      makeConfig({
        origin: 'https://api.example.com',
        targetOrigin: 'https://api.example.com',
      }),
      defaultServerConfig,
    );

    // Should have: check-same-origin, actual-request, actual-response
    expect(steps).toHaveLength(3);
    expect(steps[0].type).toBe('check-same-origin');
    expect(steps[0].description).toContain('Same-origin');
    expect(steps[1].type).toBe('actual-request');
    expect(steps[2].type).toBe('actual-response');
    // No preflight
    expect(steps.find((s) => s.type === 'preflight-options')).toBeUndefined();
    // All successful
    for (const s of steps) {
      expect(s.success).toBe(true);
    }
  });
});

// ── Simple requests (no preflight) ──────────────────────────

describe('simulateCORS — simple requests', () => {
  it('simple GET request does not trigger preflight', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: [] }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeUndefined();

    // Should have: check-same-origin, check-simple-request, actual-request, actual-response
    expect(steps).toHaveLength(4);
    expect(steps[1].type).toBe('check-simple-request');
    expect(steps[1].description).toContain('Simple request');
  });

  it('simple POST with Content-Type header (name only, no value) does not trigger preflight', () => {
    // Content-Type is a CORS-safelisted header name. When provided as
    // just the name (no ": value" suffix), it is treated as simple.
    const steps = simulateCORS(
      makeConfig({
        method: 'POST',
        headers: ['Content-Type'],
      }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeUndefined();
    expect(steps[1].type).toBe('check-simple-request');
    expect(steps[1].description).toContain('Simple request');
  });

  it('POST with only simple safelisted headers does not trigger preflight', () => {
    const steps = simulateCORS(
      makeConfig({
        method: 'POST',
        headers: ['Accept', 'Accept-Language', 'Content-Language'],
      }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeUndefined();
    expect(steps[1].description).toContain('Simple request');
  });
});

// ── Preflight triggers ──────────────────────────────────────

describe('simulateCORS — preflight triggers', () => {
  it('POST with Content-Type: application/json triggers preflight', () => {
    // When Content-Type is provided with a value (e.g., "Content-Type: application/json"),
    // the full string is treated as a non-simple header name, triggering preflight.
    const steps = simulateCORS(
      makeConfig({
        method: 'POST',
        headers: ['Content-Type: application/json'],
      }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeDefined();
    expect(steps[1].type).toBe('check-simple-request');
    expect(steps[1].description).toContain('Preflight required');
    expect(steps[1].description).toContain('Content-Type');
  });

  it('PUT method triggers preflight', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'PUT', headers: [] }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeDefined();
    expect(steps[1].description).toContain('Preflight required');
    expect(steps[1].description).toContain('PUT');
  });

  it('custom header triggers preflight', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: ['Authorization'] }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeDefined();
    expect(steps[1].description).toContain('Authorization');
  });
});

// ── Credentialed request (NEW: no preflight) ────────────────

describe('simulateCORS — credentialed requests', () => {
  it('credentialed simple GET does NOT trigger preflight (NEW behavior)', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: [], credentials: true }),
      defaultServerConfig,
    );

    const preflight = steps.find((s) => s.type === 'preflight-options');
    expect(preflight).toBeUndefined();
    expect(steps[1].type).toBe('check-simple-request');
    expect(steps[1].description).toContain('Simple request');
  });

  it('credentialed request includes Cookie header in actual request', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: [], credentials: true }),
      defaultServerConfig,
    );

    const actualRequest = steps.find((s) => s.type === 'actual-request');
    expect(actualRequest).toBeDefined();
    expect(actualRequest!.headers).toBeDefined();
    expect(actualRequest!.headers!['Cookie']).toBeTruthy();
  });
});

// ── Preflight pass ──────────────────────────────────────────

describe('simulateCORS — preflight pass', () => {
  it('preflight passes with correct server config', () => {
    const steps = simulateCORS(
      makeConfig({
        method: 'PUT',
        headers: ['Authorization'],
        credentials: true,
      }),
      defaultServerConfig,
    );

    const preflightResponse = steps.find(
      (s) => s.type === 'preflight-response',
    );
    expect(preflightResponse).toBeDefined();
    expect(preflightResponse!.success).toBe(true);
    expect(preflightResponse!.description).toContain('Preflight OK');

    // Should also have actual-request and actual-response
    const actualRequest = steps.find((s) => s.type === 'actual-request');
    const actualResponse = steps.find((s) => s.type === 'actual-response');
    expect(actualRequest).toBeDefined();
    expect(actualResponse).toBeDefined();
    expect(actualResponse!.success).toBe(true);
  });

  it('preflight response includes CORS headers', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'PUT', headers: ['Authorization'] }),
      defaultServerConfig,
    );

    const preflightResponse = steps.find(
      (s) => s.type === 'preflight-response',
    );
    expect(preflightResponse!.headers).toBeDefined();
    expect(preflightResponse!.headers!['Access-Control-Allow-Origin']).toBe(
      'https://app.example.com',
    );
    expect(preflightResponse!.headers!['Access-Control-Allow-Methods']).toBeTruthy();
    expect(preflightResponse!.headers!['Access-Control-Max-Age']).toBe('86400');
  });
});

// ── Preflight failures ──────────────────────────────────────

describe('simulateCORS — preflight failures', () => {
  it('fails when origin is not allowed', () => {
    const steps = simulateCORS(
      makeConfig({
        origin: 'https://evil.com',
        method: 'PUT',
        headers: [],
      }),
      defaultServerConfig,
    );

    const preflightResponse = steps.find(
      (s) => s.type === 'preflight-response',
    );
    expect(preflightResponse).toBeDefined();
    expect(preflightResponse!.success).toBe(false);
    expect(preflightResponse!.description).toContain('Origin');

    const error = steps.find((s) => s.type === 'error');
    expect(error).toBeDefined();
    expect(error!.success).toBe(false);

    // Actual request should NOT be sent
    const actualRequest = steps.find((s) => s.type === 'actual-request');
    expect(actualRequest).toBeUndefined();
  });

  it('fails when method is not allowed', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'PATCH', headers: [] }),
      {
        ...defaultServerConfig,
        allowedMethods: ['GET', 'POST'],
      },
    );

    const preflightResponse = steps.find(
      (s) => s.type === 'preflight-response',
    );
    expect(preflightResponse!.success).toBe(false);
    expect(preflightResponse!.description).toContain('Method');
    expect(preflightResponse!.description).toContain('PATCH');
  });
});

// ── Wildcard origin with credentials ────────────────────────

describe('simulateCORS — wildcard + credentials', () => {
  it('fails when using wildcard origin with credentials', () => {
    const steps = simulateCORS(
      makeConfig({
        method: 'PUT',
        headers: [],
        credentials: true,
      }),
      {
        ...defaultServerConfig,
        allowedOrigins: ['*'],
        allowCredentials: true,
      },
    );

    const preflightResponse = steps.find(
      (s) => s.type === 'preflight-response',
    );
    expect(preflightResponse).toBeDefined();
    expect(preflightResponse!.success).toBe(false);
    expect(preflightResponse!.description).toContain('wildcard');

    const error = steps.find((s) => s.type === 'error');
    expect(error).toBeDefined();
  });
});

// ── Server response validation on actual request ────────────

describe('simulateCORS — actual response validation', () => {
  it('successful cross-origin response includes valid CORS headers', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: [] }),
      defaultServerConfig,
    );

    const actualResponse = steps.find((s) => s.type === 'actual-response');
    expect(actualResponse).toBeDefined();
    expect(actualResponse!.success).toBe(true);
    expect(actualResponse!.headers).toBeDefined();
    expect(actualResponse!.headers!['Access-Control-Allow-Origin']).toBe(
      'https://app.example.com',
    );
  });

  it('includes Vary: Origin when specific origin is allowed', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: [] }),
      defaultServerConfig,
    );

    const actualResponse = steps.find((s) => s.type === 'actual-response');
    expect(actualResponse!.headers!['Vary']).toBe('Origin');
  });

  it('includes Access-Control-Allow-Credentials when server allows it', () => {
    const steps = simulateCORS(
      makeConfig({ method: 'GET', headers: [], credentials: true }),
      defaultServerConfig,
    );

    const actualResponse = steps.find((s) => s.type === 'actual-response');
    expect(actualResponse!.headers!['Access-Control-Allow-Credentials']).toBe(
      'true',
    );
  });
});

// ── Step field completeness ─────────────────────────────────

describe('all CORS steps have required fields', () => {
  it('every step has type, description, and success', () => {
    const configs: CORSConfig[] = [
      makeConfig({ method: 'GET' }),
      makeConfig({ method: 'PUT', headers: ['Authorization'] }),
      makeConfig({
        origin: 'https://api.example.com',
        targetOrigin: 'https://api.example.com',
      }),
    ];

    for (const config of configs) {
      const steps = simulateCORS(config, defaultServerConfig);
      for (const step of steps) {
        expect(typeof step.type).toBe('string');
        expect(typeof step.description).toBe('string');
        expect(step.description.length).toBeGreaterThan(5);
        expect(typeof step.success).toBe('boolean');
      }
    }
  });
});
