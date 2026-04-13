import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// @ts-expect-error -- Clerk v7 conditional exports resolve at runtime but not in static analysis with moduleResolution: "bundler"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { buildCSP, generateNonce } from "@/lib/security/csp";
import { applyCorsHeaders, ALLOWED_ORIGINS } from "@/lib/security/cors";
import { getApiRateLimiter } from "@/lib/security/rate-limiter";

// ── Public routes (no auth required) ────────────────────────
const isPublicRoute = createRouteMatcher([
  "/",
  "/landing(.*)",
  "/problems(.*)",
  "/blog(.*)",
  "/modules",
  "/algorithms(.*)",
  "/database(.*)",
  "/ds(.*)",
  "/os(.*)",
  "/lld-problems(.*)",
  "/patterns(.*)",
  "/concepts(.*)",
  "/interviews(.*)",
  "/gallery(.*)",
  "/pricing(.*)",
  "/offline",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/templates",
  "/api/challenges",
  "/api/content(.*)",
  "/api/csp-report",
  "/api/oembed(.*)",
  "/api/og(.*)",
]);

// ── Helpers ──────────────────────────────────────────────────

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/trpc/");
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ── Middleware ────────────────────────────────────────────────

export default clerkMiddleware(async (auth: { protect: () => Promise<void> }, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const isApi = isApiRoute(pathname);

  // ── CORS preflight for API routes ──────────────────────────
  if (isApi && req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      const preflightResponse = new NextResponse(null, { status: 204 });
      applyCorsHeaders(preflightResponse, origin);
      return preflightResponse;
    }
    return new NextResponse(null, { status: 204 });
  }

  // ── Rate limiting for API routes ───────────────────────────
  let rateLimitResult: {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } | null = null;

  if (isApi) {
    const ip = getClientIP(req);
    const limiter = getApiRateLimiter();
    rateLimitResult = limiter.checkLimit(ip);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000,
      );
      return NextResponse.json(
        { error: "Too many requests", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(
              Math.floor(rateLimitResult.resetAt / 1000),
            ),
          },
        },
      );
    }
  }

  // ── Clerk auth: protect non-public routes ──────────────────
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // ── Build response ─────────────────────────────────────────
  const response = NextResponse.next();

  // ── CSP header ─────────────────────────────────────────────
  const nonce = generateNonce();
  const { headerName, headerValue } = buildCSP({ nonce });
  response.headers.set(headerName, headerValue);

  // ── Security headers ───────────────────────────────────────
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // ── Rate limit headers on successful API responses ─────────
  if (isApi && rateLimitResult) {
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set(
      "X-RateLimit-Remaining",
      String(rateLimitResult.remaining),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.floor(rateLimitResult.resetAt / 1000)),
    );
  }

  // ── Cache headers for static/rarely-changing API endpoints ─
  if (isApi) {
    const staticApiPaths = [
      "/api/templates",
      "/api/challenges",
      "/api/health",
      "/api/content",
    ];
    if (
      staticApiPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
      )
    ) {
      response.headers.set(
        "Cache-Control",
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
      );
    }
  }

  // ── CSP report-only header (production only) ───────────────
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      `${headerValue}; report-uri /api/csp-report`,
    );
  }

  // ── CORS for API routes ────────────────────────────────────
  if (isApi) {
    applyCorsHeaders(response, req.headers.get("origin"));
  }

  return response;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
