// ─────────────────────────────────────────────────────────────
// Architex — OAuth 2.0 Flow Simulators  (SEC-004)
// ─────────────────────────────────────────────────────────────
//
// Generates realistic HTTP request / response step sequences
// for OAuth 2.0 Authorization Code + PKCE and Client
// Credentials grant types.
//
// Every step is a self-contained object suitable for
// sequential playback in a multi-party sequence diagram.
// ─────────────────────────────────────────────────────────────

/** A single step in an OAuth flow visualization. */
export interface OAuthStep {
  /** Which actor initiates the step (User Agent, Client, Auth Server, Resource Server). */
  actor: string;
  /** Human-readable action description. */
  action: string;
  /** HTTP method if applicable. */
  httpMethod?: string;
  /** Request / redirect URL. */
  url?: string;
  /** Key HTTP headers. */
  headers?: Record<string, string>;
  /** Request / response body (string for display). */
  body?: string;
  /** Detailed description of what happens in this step. */
  description: string;
}

// ── Helpers ────────────────────────────────────────────────

function randomHex(len: number): string {
  const chars = "abcdef0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Simple base64url encode (browser-safe, educational).
 * Works on ASCII strings only — good enough for PKCE verifier.
 */
function base64url(input: string): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < input.length; i += 3) {
    const a = input.charCodeAt(i);
    const b = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    const c = i + 2 < input.length ? input.charCodeAt(i + 2) : 0;
    result += chars[(a >> 2) & 0x3f];
    result += chars[((a << 4) | (b >> 4)) & 0x3f];
    if (i + 1 < input.length) result += chars[((b << 2) | (c >> 6)) & 0x3f];
    if (i + 2 < input.length) result += chars[c & 0x3f];
  }
  return result;
}

/** Fake SHA-256 for PKCE code_challenge (educational). */
function fakeSha256(input: string): string {
  // Deterministic hash-like string from the input
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = Math.abs(h).toString(16).padStart(8, "0");
  return hex.repeat(8).slice(0, 43);
}

// ── Authorization Code + PKCE ──────────────────────────────

/**
 * Simulates the full OAuth 2.0 Authorization Code + PKCE flow.
 *
 * Actors: User Agent, Client, Auth Server, Resource Server
 *
 * @param clientId     - OAuth client identifier
 * @param redirectUri  - Registered redirect URI
 * @param scopes       - Requested OAuth scopes
 */
export function simulateAuthCodePKCE(
  clientId: string,
  redirectUri: string,
  scopes: string[],
): OAuthStep[] {
  const state = randomHex(16);
  const codeVerifier = base64url(randomHex(32));
  const codeChallenge = fakeSha256(codeVerifier);
  const authCode = randomHex(24);
  const accessToken = `eyJhbGciOiJSUzI1NiJ9.${randomHex(48)}`;
  const refreshToken = randomHex(32);
  const idToken = `eyJhbGciOiJSUzI1NiJ9.${randomHex(32)}.${randomHex(16)}`;
  const scopeStr = scopes.join(" ");

  const steps: OAuthStep[] = [
    // Step 1 — Client generates PKCE pair
    {
      actor: "Client",
      action: "Generate PKCE code verifier & challenge",
      description:
        "The Client generates a random code_verifier and derives a code_challenge using SHA-256. " +
        "This prevents authorization code interception attacks.",
      body: JSON.stringify(
        {
          code_verifier: codeVerifier,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        },
        null,
        2,
      ),
    },

    // Step 2 — Redirect to Auth Server
    {
      actor: "Client",
      action: "Redirect User Agent to Auth Server",
      httpMethod: "GET",
      url:
        `https://auth.example.com/authorize?` +
        `response_type=code&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopeStr)}` +
        `&state=${state}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`,
      headers: {
        Host: "auth.example.com",
      },
      description:
        "The Client constructs the authorization URL with PKCE parameters " +
        "and redirects the User Agent to the Authorization Server's /authorize endpoint.",
    },

    // Step 3 — User authenticates
    {
      actor: "User Agent",
      action: "User authenticates & grants consent",
      description:
        "The Authorization Server presents a login form. The user provides credentials " +
        "and approves the requested scopes. This step happens entirely between the User Agent and Auth Server.",
    },

    // Step 4 — Auth Server redirects back with code
    {
      actor: "Auth Server",
      action: "Redirect back to Client with authorization code",
      httpMethod: "302",
      url: `${redirectUri}?code=${authCode}&state=${state}`,
      headers: {
        Location: `${redirectUri}?code=${authCode}&state=${state}`,
      },
      description:
        "After successful authentication, the Auth Server redirects back to " +
        "the Client's redirect_uri with a short-lived authorization code and the state parameter for CSRF protection.",
    },

    // Step 5 — Client validates state
    {
      actor: "Client",
      action: "Validate state parameter",
      description:
        "The Client verifies that the returned state parameter matches the one it sent. " +
        "This prevents CSRF attacks on the redirect.",
      body: JSON.stringify(
        { received_state: state, expected_state: state, valid: true },
        null,
        2,
      ),
    },

    // Step 6 — Exchange code for tokens
    {
      actor: "Client",
      action: "Exchange authorization code for tokens",
      httpMethod: "POST",
      url: "https://auth.example.com/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "auth.example.com",
      },
      body: [
        `grant_type=authorization_code`,
        `code=${authCode}`,
        `redirect_uri=${encodeURIComponent(redirectUri)}`,
        `client_id=${clientId}`,
        `code_verifier=${codeVerifier}`,
      ].join("&"),
      description:
        "The Client sends the authorization code along with the PKCE code_verifier " +
        "to the token endpoint. The Auth Server hashes the verifier and compares with the stored challenge.",
    },

    // Step 7 — Auth Server verifies PKCE & issues tokens
    {
      actor: "Auth Server",
      action: "Verify PKCE & issue tokens",
      httpMethod: "200",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
      body: JSON.stringify(
        {
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: refreshToken,
          id_token: idToken,
          scope: scopeStr,
        },
        null,
        2,
      ),
      description:
        "The Auth Server verifies SHA256(code_verifier) == code_challenge, validates the authorization code, " +
        "and responds with an access token, refresh token, and (if OIDC) an ID token.",
    },

    // Step 8 — Access protected resource
    {
      actor: "Client",
      action: "Request protected resource",
      httpMethod: "GET",
      url: "https://api.example.com/userinfo",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Host: "api.example.com",
      },
      description:
        "The Client uses the access token in the Authorization header " +
        "to request data from the Resource Server.",
    },

    // Step 9 — Resource Server validates & responds
    {
      actor: "Resource Server",
      action: "Validate token & return resource",
      httpMethod: "200",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          sub: "user-12345",
          name: "Jane Developer",
          email: "jane@example.com",
          email_verified: true,
        },
        null,
        2,
      ),
      description:
        "The Resource Server validates the access token (via introspection or JWT verification) " +
        "and returns the protected resource.",
    },
  ];

  return steps;
}

// ── Client Credentials ─────────────────────────────────────

/**
 * Simulates the OAuth 2.0 Client Credentials flow.
 * Used for machine-to-machine (M2M) authentication.
 */
export function simulateClientCredentials(): OAuthStep[] {
  const clientId = "service-api-client";
  const clientSecret = randomHex(32);
  const accessToken = `eyJhbGciOiJSUzI1NiJ9.${randomHex(48)}`;

  const steps: OAuthStep[] = [
    // Step 1 — Client authenticates directly
    {
      actor: "Client",
      action: "Request token with client credentials",
      httpMethod: "POST",
      url: "https://auth.example.com/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64url(`${clientId}:${clientSecret}`)}`,
        Host: "auth.example.com",
      },
      body: `grant_type=client_credentials&scope=read:data write:data`,
      description:
        "The Client authenticates directly with the Authorization Server using its client_id " +
        "and client_secret. No user interaction is involved — this is machine-to-machine auth.",
    },

    // Step 2 — Auth Server validates & issues token
    {
      actor: "Auth Server",
      action: "Validate credentials & issue access token",
      httpMethod: "200",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(
        {
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          scope: "read:data write:data",
        },
        null,
        2,
      ),
      description:
        "The Auth Server verifies the client credentials and issues an access token. " +
        "No refresh token is issued because the client can always re-authenticate.",
    },

    // Step 3 — Access protected resource
    {
      actor: "Client",
      action: "Request protected resource",
      httpMethod: "GET",
      url: "https://api.example.com/data",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Host: "api.example.com",
      },
      description:
        "The Client uses the access token to call the Resource Server API. " +
        "The token is sent in the Authorization header as a Bearer token.",
    },

    // Step 4 — Resource Server responds
    {
      actor: "Resource Server",
      action: "Validate token & return data",
      httpMethod: "200",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          data: [
            { id: 1, value: "service-record-1" },
            { id: 2, value: "service-record-2" },
          ],
        },
        null,
        2,
      ),
      description:
        "The Resource Server validates the token and returns the requested data.",
    },
  ];

  return steps;
}
