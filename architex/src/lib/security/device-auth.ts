// ─────────────────────────────────────────────────────────────
// Architex — OAuth 2.0 Device Authorization Flow  (SEC-010)
// ─────────────────────────────────────────────────────────────
//
// Simulates the OAuth 2.0 Device Authorization Grant (RFC 8628)
// used by smart TVs, CLI tools, and input-constrained devices.
//
// Actors: Device, Auth Server, User (Browser)
// ─────────────────────────────────────────────────────────────

import type { OAuthStep } from "./oauth-flows";

// ── Helpers ────────────────────────────────────────────────

function randomHex(len: number): string {
  const chars = "abcdef0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ── Device Authorization Flow ─────────────────────────────

/**
 * Simulates the full OAuth 2.0 Device Authorization Grant (RFC 8628).
 *
 * This flow is designed for devices that either lack a browser or have
 * limited input capability (smart TVs, CLI tools, IoT devices).
 *
 * Flow:
 * 1. Device requests device_code + user_code from auth server
 * 2. Device displays verification URI and user code to user
 * 3. User opens browser, navigates to URI, enters code
 * 4. User logs in and grants permission
 * 5. Device polls auth server with device_code
 * 6. Auth server returns access token after user grants
 * 7. Device uses access token to access resources
 */
export function simulateDeviceAuth(): OAuthStep[] {
  const deviceCode = randomHex(32);
  const userCode = "ABCD-1234";
  const verificationUri = "https://example.com/device";
  const verificationUriComplete = `${verificationUri}?user_code=${userCode}`;
  const accessToken = `eyJhbGciOiJSUzI1NiJ9.${randomHex(48)}`;
  const refreshToken = randomHex(32);
  const clientId = "device-tv-client";
  const interval = 5;

  const steps: OAuthStep[] = [
    // Step 1 — Device requests device code
    {
      actor: "Client",
      action: "Request device code from Auth Server",
      httpMethod: "POST",
      url: "https://auth.example.com/device/code",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "auth.example.com",
      },
      body: `client_id=${clientId}&scope=openid profile email`,
      description:
        "The device (Client) sends its client_id and requested scopes to the " +
        "authorization server's device authorization endpoint. Unlike the Authorization Code flow, " +
        "no redirect_uri is needed because there is no browser on the device.",
    },

    // Step 2 — Auth Server returns device code + user code
    {
      actor: "Auth Server",
      action: "Return device_code, user_code, and verification URI",
      httpMethod: "200",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(
        {
          device_code: deviceCode,
          user_code: userCode,
          verification_uri: verificationUri,
          verification_uri_complete: verificationUriComplete,
          expires_in: 1800,
          interval,
        },
        null,
        2,
      ),
      description:
        "The Auth Server generates a unique device_code (secret, kept by device) and a " +
        "user_code (short, displayed to user). The interval field tells the device how often " +
        "to poll (every 5 seconds). The codes expire in 30 minutes.",
    },

    // Step 3 — Device displays user code
    {
      actor: "Client",
      action: `Display: "Go to ${verificationUri} and enter code: ${userCode}"`,
      description:
        "The device displays the verification URI and user code on its screen. " +
        "The user must open this URL in a separate browser (phone, laptop, etc.) " +
        "and enter the code. Some devices also show a QR code for convenience.",
    },

    // Step 4 — User opens browser and enters code
    {
      actor: "User Agent",
      action: "User opens browser, navigates to verification URI",
      httpMethod: "GET",
      url: verificationUriComplete,
      headers: {
        Host: "example.com",
      },
      description:
        "The user opens a browser on another device (phone/laptop), navigates to " +
        "the verification URI, and enters the user_code. The authorization server " +
        "identifies which device authorization request this corresponds to.",
    },

    // Step 5 — User authenticates and grants permission
    {
      actor: "User Agent",
      action: "User authenticates & grants consent",
      description:
        "The authorization server presents a login form. The user provides credentials " +
        "and approves the requested scopes. This happens entirely in the user's browser, " +
        "completely separate from the device.",
    },

    // Step 6 — Device polls auth server (authorization_pending)
    {
      actor: "Client",
      action: "Poll Auth Server with device_code (pending...)",
      httpMethod: "POST",
      url: "https://auth.example.com/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "auth.example.com",
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${deviceCode}&client_id=${clientId}`,
      description:
        "While the user is authenticating, the device polls the token endpoint at the " +
        "specified interval. The server responds with 'authorization_pending' until the user " +
        "completes authorization. If the device polls too fast, it receives 'slow_down'.",
    },

    // Step 7 — Auth Server responds with pending
    {
      actor: "Auth Server",
      action: "Respond: authorization_pending",
      httpMethod: "400",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          error: "authorization_pending",
          error_description:
            "The authorization request is still pending. Continue polling.",
        },
        null,
        2,
      ),
      description:
        "The auth server returns a 400 with 'authorization_pending' because the user " +
        "hasn't completed authorization yet. The device waits for the interval period " +
        "and tries again. This is NOT a failure — it's the expected intermediate state.",
    },

    // Step 8 — Device polls again (success this time)
    {
      actor: "Client",
      action: "Poll Auth Server with device_code (success!)",
      httpMethod: "POST",
      url: "https://auth.example.com/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Host: "auth.example.com",
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${deviceCode}&client_id=${clientId}`,
      description:
        "After the user has granted permission, the next poll succeeds. " +
        "The auth server matches the device_code to the authorized session and issues tokens.",
    },

    // Step 9 — Auth Server returns access token
    {
      actor: "Auth Server",
      action: "Return access token",
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
          scope: "openid profile email",
        },
        null,
        2,
      ),
      description:
        "The auth server verifies the device_code, confirms the user has granted access, " +
        "and returns an access token and refresh token. The device is now authorized " +
        "without the user ever entering credentials on the device itself.",
    },

    // Step 10 — Device uses access token
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
        "The device uses the access token in the Authorization header " +
        "to request data from the Resource Server, just like any other OAuth flow.",
    },

    // Step 11 — Resource Server responds
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
        "The Resource Server validates the access token and returns the protected resource. " +
        "From this point on, the device can make API calls on behalf of the user.",
    },
  ];

  return steps;
}
