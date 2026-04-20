// ── CSP Violation Report Endpoint ───────────────────────────────────
//
// POST /api/csp-report
// Receives Content-Security-Policy violation reports from browsers.
// Logs them server-side for monitoring and debugging.
//
// Browsers send reports as application/csp-report (or application/json).

import { NextResponse } from 'next/server';

interface CSPViolationReport {
  'csp-report'?: {
    'document-uri'?: string;
    referrer?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'blocked-uri'?: string;
    'status-code'?: number;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
}

export async function POST(request: Request) {
  try {
    // Browsers may send CSP reports as application/csp-report or
    // application/json. Read the raw text first so we never fail on
    // an unexpected Content-Type header.
    const text = await request.text();

    if (!text || text.trim().length === 0) {
      // Empty body — accept silently (some browsers send empty pings)
      return new NextResponse(null, { status: 204 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // Unparseable payload — accept silently so the browser stops retrying
      return new NextResponse(null, { status: 204 });
    }

    // Browsers send CSP reports in two formats:
    // 1. Wrapped: { "csp-report": { ... } }
    // 2. Flat: { "document-uri": ..., "violated-directive": ... }
    const report = (body['csp-report'] as Record<string, unknown> | undefined)
      ?? (body['violated-directive'] ? body : null);

    if (!report) {
      return new NextResponse(null, { status: 204 });
    }

    // Log the violation for server-side monitoring.
    // In production, this would forward to a logging service (e.g. Sentry,
    // Datadog, or a custom analytics pipeline).
     
    console.warn('[csp-violation]', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      statusCode: report['status-code'],
    });

    // 204 No Content — must NOT include a body
    return new NextResponse(null, { status: 204 });
  } catch {
    // Even on unexpected errors, return 204 to prevent the browser from
    // retrying and flooding the network tab with 400 errors.
    return new NextResponse(null, { status: 204 });
  }
}
