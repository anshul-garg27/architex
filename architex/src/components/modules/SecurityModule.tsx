"use client";

import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lock,
  Eye,
  EyeOff,
  Key,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Shield,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  simulateAuthCodePKCE,
  simulateClientCredentials,
} from "@/lib/security/oauth-flows";
import type { OAuthStep } from "@/lib/security/oauth-flows";
import { simulateDeviceAuth } from "@/lib/security/device-auth";
import {
  simulateTokenBucket,
  simulateSlidingWindow,
  simulateLeakyBucket,
  generateBurstSteadyBurstPattern,
} from "@/lib/security/rate-limiting-demo";
import type { RateLimitStep } from "@/lib/security/rate-limiting-demo";
import {
  encodeJWT,
  decodeJWT,
  validateJWT,
  toBase64Url,
} from "@/lib/security/jwt-engine";
import { simulateDH, PAINT_ANALOGY } from "@/lib/security/diffie-hellman";
import type { DHResult } from "@/lib/security/diffie-hellman";
import { aesEncrypt, parseHex, toHex } from "@/lib/security/aes-engine";
import type { AESState, AESSubStep } from "@/lib/security/aes-engine";
import {
  simulateNoneAlgorithm,
  simulateTokenReplay,
  simulateJWTConfusion,
} from "@/lib/security/jwt-attacks";
import type { JWTAttackStep } from "@/lib/security/jwt-attacks";
import {
  simulateHTTPSFlow,
  HTTPS_PHASE_LABELS,
  HTTPS_PHASE_COLORS,
} from "@/lib/security/https-flow";
import type { HTTPSStep } from "@/lib/security/https-flow";
import { simulateCertificateChain } from "@/lib/security/cert-chain";
import type { CertChainStep } from "@/lib/security/cert-chain";
import { demonstrateBcrypt, demonstrateRainbowTable } from "@/lib/security/password-hashing";
import type { HashingStep } from "@/lib/security/password-hashing";
import { simulateCORS } from "@/lib/networking/cors-simulator";
import type { CORSConfig, CORSStep } from "@/lib/networking/cors-simulator";
import {
  getWebAttackSteps,
  WEB_ATTACK_COLUMNS,
  WEB_ATTACK_META,
  actorToColumn,
} from "@/lib/security/web-attacks";
import type { AttackStep as WebAttackStep, WebAttackType } from "@/lib/security/web-attacks";
import {
  simulateSymmetricEncryption,
  simulateAsymmetricEncryption,
  simulateHybridEncryption,
  ENCRYPTION_COLORS,
} from "@/lib/security/encryption-comparison";
import type { EncryptionStep, EncryptionMode } from "@/lib/security/encryption-comparison";
import DDoSSimulationVisualizer from "@/components/modules/security/DDoSSimulationVisualizer";

// ── Topic Definitions ──────────────────────────────────────

type SecurityTopic = "oauth" | "jwt" | "diffie-hellman" | "aes" | "https-flow" | "cors" | "cert-chain" | "password-hashing" | "rate-limiting" | "web-attacks" | "encryption";

interface TopicDef {
  id: SecurityTopic;
  name: string;
  description: string;
}

const TOPICS: TopicDef[] = [
  {
    id: "oauth",
    name: "OAuth 2.0 / OIDC",
    description: "Authorization Code + PKCE and Client Credentials flows.",
  },
  {
    id: "jwt",
    name: "JWT Lifecycle",
    description: "Encode, decode, and validate JSON Web Tokens.",
  },
  {
    id: "diffie-hellman",
    name: "Diffie-Hellman Key Exchange",
    description: "Visualize how two parties agree on a shared secret.",
  },
  {
    id: "aes",
    name: "AES Encryption",
    description: "Step-by-step AES-128 round visualization with S-box, ShiftRows, MixColumns.",
  },
  {
    id: "https-flow",
    name: "HTTPS Flow",
    description: "End-to-end HTTPS request lifecycle: DNS, TCP, TLS, HTTP, Close.",
  },
  {
    id: "cors",
    name: "CORS",
    description: "Cross-Origin Resource Sharing decision flow with pass/fail at each step.",
  },
  {
    id: "cert-chain",
    name: "Certificate Chain",
    description: "X.509 certificate chain verification: Server → Intermediate CA → Root CA.",
  },
  {
    id: "password-hashing",
    name: "Password Hashing",
    description: "Bcrypt hashing pipeline with salt, cost factor, and rainbow table defense.",
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    description: "Token Bucket, Sliding Window, and Leaky Bucket algorithms compared side-by-side.",
  },
  {
    id: "web-attacks",
    name: "Web Attacks",
    description: "XSS, CSRF, and SQL Injection — attack flow with and without defenses.",
  },
  {
    id: "encryption",
    name: "Encryption Comparison",
    description: "Symmetric, Asymmetric, and Hybrid encryption side-by-side with animated key/data flow.",
  },
];

// ── JWT sub-view (lifecycle vs attacks) ───────────────────────
type JWTSubView = "lifecycle" | "attacks";
type JWTAttackType = "none-algorithm" | "token-replay" | "algorithm-confusion";

// ── OAuth Flow Type ────────────────────────────────────────

type OAuthFlowType = "auth-code-pkce" | "client-credentials" | "device-auth";

// ── OAuth Sequence Diagram ─────────────────────────────────

const OAUTH_COLUMNS = ["User Agent", "Client", "Auth Server", "Resource Server"];

function oauthActorToColumn(actor: string): string {
  if (actor === "User Agent") return "User Agent";
  if (actor === "Auth Server") return "Auth Server";
  if (actor === "Resource Server") return "Resource Server";
  return "Client";
}

/**
 * Determine the "to" column for an OAuth step.
 * This maps typical flow patterns to the correct target actor.
 */
function oauthStepTarget(step: OAuthStep, idx: number, total: number): string {
  const a = step.actor;
  if (a === "Client" && step.action.includes("Generate PKCE")) return "Client";
  if (a === "Client" && step.action.includes("Redirect User")) return "Auth Server";
  if (a === "User Agent") return "Auth Server";
  if (a === "Auth Server" && step.action.includes("Redirect back")) return "Client";
  if (a === "Client" && step.action.includes("Validate state")) return "Client";
  if (a === "Client" && step.action.includes("Exchange")) return "Auth Server";
  if (a === "Auth Server" && step.action.includes("Verify PKCE")) return "Client";
  if (a === "Client" && step.action.includes("Request protected")) return "Resource Server";
  if (a === "Resource Server") return "Client";
  // Client credentials defaults
  if (a === "Client" && step.action.includes("Request token")) return "Auth Server";
  if (a === "Auth Server" && step.action.includes("Validate credentials")) return "Client";
  if (a === "Auth Server" && step.action.includes("Validate token")) return "Client";
  // Device auth flow
  if (a === "Client" && step.action.includes("Request device code")) return "Auth Server";
  if (a === "Auth Server" && step.action.includes("Return device_code")) return "Client";
  if (a === "Client" && step.action.includes("Display")) return "Client";
  if (a === "User Agent" && step.action.includes("navigates")) return "Auth Server";
  if (a === "Client" && step.action.includes("Poll")) return "Auth Server";
  if (a === "Auth Server" && step.action.includes("authorization_pending")) return "Client";
  if (a === "Auth Server" && step.action.includes("Return access token")) return "Client";
  // Fallback
  if (idx < total / 2) return "Auth Server";
  return "Client";
}

const OAuthSequenceDiagram = memo(function OAuthSequenceDiagram({
  steps,
  currentIndex,
  columns,
}: {
  steps: OAuthStep[];
  currentIndex: number;
  columns: string[];
}) {
  const colWidth = 180;
  const headerHeight = 50;
  const rowHeight = 50;
  const totalWidth = columns.length * colWidth;
  const totalHeight = headerHeight + steps.length * rowHeight + 40;

  const colPositions = columns.map((_, i) => (i + 0.5) * colWidth);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="mx-auto h-full w-full"
      style={{ maxHeight: Math.min(totalHeight, 650) }}
    >
      {/* Column headers */}
      {columns.map((col, i) => (
        <g key={col}>
          <rect
            x={colPositions[i] - 60}
            y={8}
            width={120}
            height={30}
            rx={6}
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <text
            x={colPositions[i]}
            y={28}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="11"
            fontWeight="600"
          >
            {col}
          </text>
          {/* Lifeline */}
          <line
            x1={colPositions[i]}
            y1={headerHeight}
            x2={colPositions[i]}
            y2={totalHeight - 10}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </g>
      ))}

      {/* Messages */}
      {steps.map((step, i) => {
        const fromCol = oauthActorToColumn(step.actor);
        const toCol = oauthStepTarget(step, i, steps.length);
        const fromIdx = columns.indexOf(fromCol);
        const toIdx = columns.indexOf(toCol);
        if (fromIdx === -1 || toIdx === -1) return null;

        const y = headerHeight + i * rowHeight + 25;
        const x1 = colPositions[fromIdx];
        const x2 = colPositions[toIdx];
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;

        // Self-message
        if (fromIdx === toIdx) {
          return (
            <g key={`sec-${i}`} opacity={isActive ? 1 : 0.25}>
              <path
                d={`M ${x1 + 8} ${y - 4} Q ${x1 + 50} ${y - 4} ${x1 + 50} ${y + 8} Q ${x1 + 50} ${y + 16} ${x1 + 8} ${y + 16}`}
                fill="none"
                stroke={isCurrent ? "#3b82f6" : "#6b7280"}
                strokeWidth={isCurrent ? 2 : 1}
              />
              <polygon
                points={`${x1 + 12},${y + 12} ${x1 + 8},${y + 16} ${x1 + 12},${y + 20}`}
                fill={isCurrent ? "#3b82f6" : "#6b7280"}
              />
              <text
                x={x1 + 56}
                y={y + 8}
                textAnchor="start"
                fill={isCurrent ? "#60a5fa" : "#9ca3af"}
                fontSize="9"
                fontWeight={isCurrent ? "600" : "400"}
              >
                {step.action.slice(0, 40)}
              </text>
            </g>
          );
        }

        const isLeftToRight = x2 > x1;

        return (
          <g key={`sec-${i}`} opacity={isActive ? 1 : 0.25}>
            {/* Arrow line */}
            <line
              x1={x1 + (isLeftToRight ? 8 : -8)}
              y1={y}
              x2={x2 + (isLeftToRight ? -12 : 12)}
              y2={y}
              stroke={isCurrent ? "#3b82f6" : "#6b7280"}
              strokeWidth={isCurrent ? 2 : 1}
            />
            {/* Arrowhead */}
            <polygon
              points={
                isLeftToRight
                  ? `${x2 - 12},${y - 4} ${x2 - 4},${y} ${x2 - 12},${y + 4}`
                  : `${x2 + 12},${y - 4} ${x2 + 4},${y} ${x2 + 12},${y + 4}`
              }
              fill={isCurrent ? "#3b82f6" : "#6b7280"}
            />
            {/* Label */}
            <text
              x={(x1 + x2) / 2}
              y={y - 8}
              textAnchor="middle"
              fill={isCurrent ? "#60a5fa" : "#9ca3af"}
              fontSize="9"
              fontWeight={isCurrent ? "600" : "400"}
            >
              {step.action.slice(0, 45)}
            </text>
            {/* HTTP method badge */}
            {step.httpMethod && (
              <text
                x={(x1 + x2) / 2}
                y={y + 12}
                textAnchor="middle"
                fill={isCurrent ? "#a78bfa" : "#6b7280"}
                fontSize="8"
                fontWeight="600"
              >
                {step.httpMethod}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});

// ── OAuth Canvas ───────────────────────────────────────────

const OAuthCanvas = memo(function OAuthCanvas({
  steps,
  stepIndex,
  flowType,
}: {
  steps: OAuthStep[];
  stepIndex: number;
  flowType: OAuthFlowType;
}) {
  const columns = flowType === "client-credentials"
    ? ["Client", "Auth Server", "Resource Server"]
    : OAUTH_COLUMNS; // device-auth uses all 4 columns too (User Agent = user's browser)

  return (
    <div className="flex h-full flex-col">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          {flowType === "auth-code-pkce"
            ? "Authorization Code + PKCE"
            : flowType === "device-auth"
              ? "Device Authorization (RFC 8628)"
              : "Client Credentials"}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-blue-500/20 ring-1 ring-blue-500/40" />
          <span className="text-[10px] text-foreground-muted">Current Step</span>
        </div>
        {flowType === "auth-code-pkce" && (
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-green-400" />
            <span className="text-[10px] text-foreground-muted">PKCE Protected</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2">
        <OAuthSequenceDiagram
          steps={steps}
          currentIndex={stepIndex}
          columns={columns}
        />
      </div>
    </div>
  );
});

// ── JWT Canvas ─────────────────────────────────────────────

const JWTCanvas = memo(function JWTCanvas({
  headerJson,
  payloadJson,
  secret,
}: {
  headerJson: string;
  payloadJson: string;
  secret: string;
}) {
  const { token, headerB64, payloadB64, sigB64, parseError } = useMemo(() => {
    try {
      const h = JSON.parse(headerJson);
      const p = JSON.parse(payloadJson);
      const tok = encodeJWT(h, p, secret);
      const parts = tok.split(".");
      return {
        token: tok,
        headerB64: parts[0],
        payloadB64: parts[1],
        sigB64: parts[2],
        parseError: null,
      };
    } catch (e) {
      return {
        token: "",
        headerB64: "",
        payloadB64: "",
        sigB64: "",
        parseError: e instanceof Error ? e.message : "Invalid JSON",
      };
    }
  }, [headerJson, payloadJson, secret]);

  const validation = useMemo(() => {
    if (!token) return { valid: false, errors: ["Cannot generate token from invalid input"] };
    return validateJWT(token, secret);
  }, [token, secret]);

  if (parseError) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <p className="text-sm text-red-400">{parseError}</p>
          <p className="mt-1 text-xs text-foreground-muted">Fix the JSON in the properties panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Token display */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Encoded JWT
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border bg-elevated p-3 font-mono text-xs leading-relaxed">
          <span className="text-rose-400">{headerB64}</span>
          <span className="text-foreground-subtle">.</span>
          <span className="text-purple-400">{payloadB64}</span>
          <span className="text-foreground-subtle">.</span>
          <span className="text-cyan-400">{sigB64}</span>
        </div>
      </div>

      {/* Decoded parts */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Header */}
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Header
              </span>
            </div>
            <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs text-rose-300">
              {headerJson}
            </pre>
          </div>

          {/* Payload */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Payload
              </span>
            </div>
            <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs text-purple-300">
              {payloadJson}
            </pre>
          </div>

          {/* Signature */}
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Signature
              </span>
            </div>
            <p className="mb-2 font-mono text-xs text-cyan-300 break-all">
              {sigB64}
            </p>
            <p className="text-[10px] text-cyan-500/70">
              HMAC-SHA256(base64url(header) + &quot;.&quot; + base64url(payload), secret)
            </p>
          </div>
        </div>

        {/* Validation checklist */}
        <div className="mt-4 rounded-lg border border-border bg-elevated p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Validation Checklist
          </h4>
          <div className="space-y-1.5">
            <ValidationItem
              label="Signature valid"
              valid={!validation.errors.some((e) => e.includes("Signature"))}
            />
            <ValidationItem
              label="Token not expired"
              valid={!validation.errors.some((e) => e.includes("expired"))}
            />
            <ValidationItem
              label="Token format correct"
              valid={!validation.errors.some((e) => e.includes("format") || e.includes("base64url"))}
            />
            <ValidationItem
              label="Algorithm supported (HS256)"
              valid={!validation.errors.some((e) => e.includes("algorithm") || e.includes("Unsupported"))}
            />
          </div>
          {validation.errors.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-border pt-2">
              {validation.errors.map((err, i) => (
                <p key={`sec-${i}`} className="text-[10px] text-red-400">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function ValidationItem({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {valid ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-red-400" />
      )}
      <span
        className={cn(
          "text-xs",
          valid ? "text-green-400" : "text-red-400",
        )}
      >
        {label}
      </span>
    </div>
  );
}

// ── Diffie-Hellman Canvas ──────────────────────────────────

/** Assign a colour to each "paint" concept. */
const PAINT_COLORS = {
  common: "#facc15",   // yellow — the base colour everyone knows
  alice: "#f472b6",    // pink — Alice's secret
  bob: "#60a5fa",      // blue — Bob's secret
  aliceMix: "#fb923c", // orange — Alice's public (common + alice secret)
  bobMix: "#a78bfa",   // violet — Bob's public (common + bob secret)
  shared: "#4ade80",   // green — the final shared secret
  eve: "#6b7280",      // gray — Eve's limited view
} as const;

const DiffieHellmanCanvas = memo(function DiffieHellmanCanvas({
  dhResult,
  stepIndex,
  p,
  g,
  a,
  b,
}: {
  dhResult: DHResult;
  stepIndex: number;
  p: number;
  g: number;
  a: number;
  b: number;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Diffie-Hellman Key Exchange
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: PAINT_COLORS.common }} />
          <span className="text-[10px] text-foreground-muted">Public (p, g)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: PAINT_COLORS.alice }} />
          <span className="text-[10px] text-foreground-muted">Alice</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: PAINT_COLORS.bob }} />
          <span className="text-[10px] text-foreground-muted">Bob</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: PAINT_COLORS.shared }} />
          <span className="text-[10px] text-foreground-muted">Shared Secret</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Alice and Bob panels */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          {/* Alice */}
          <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ background: PAINT_COLORS.alice }}
              />
              <span className="text-sm font-semibold text-pink-300">Alice</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Private key (a):</span>
                <span className={cn("transition-opacity", stepIndex >= 1 ? "opacity-100" : "opacity-20")}>
                  {stepIndex >= 1 ? (
                    <span className="flex items-center gap-1 text-pink-400">
                      <EyeOff className="h-3 w-3" /> {a}
                    </span>
                  ) : (
                    "?"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Public key (A):</span>
                <span className={cn("transition-opacity", stepIndex >= 3 ? "opacity-100" : "opacity-20")}>
                  {stepIndex >= 3 ? (
                    <span className="text-orange-400">{dhResult.alicePublic}</span>
                  ) : (
                    "?"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Shared secret:</span>
                <span className={cn("transition-opacity", stepIndex >= 5 ? "opacity-100" : "opacity-20")}>
                  {stepIndex >= 5 ? (
                    <span className="font-bold text-green-400">{dhResult.sharedSecret}</span>
                  ) : (
                    "?"
                  )}
                </span>
              </div>
            </div>
            {/* Paint analogy swatch */}
            <div className="mt-3 flex items-center gap-1">
              <div
                className={cn("h-6 w-6 rounded transition-opacity", stepIndex >= 0 ? "opacity-100" : "opacity-20")}
                style={{ background: PAINT_COLORS.common }}
                title="Common colour"
              />
              <span className="text-foreground-subtle">+</span>
              <div
                className={cn("h-6 w-6 rounded transition-opacity", stepIndex >= 1 ? "opacity-100" : "opacity-20")}
                style={{ background: PAINT_COLORS.alice }}
                title="Alice's secret colour"
              />
              <span className="text-foreground-subtle">=</span>
              <div
                className={cn("h-6 w-6 rounded transition-opacity", stepIndex >= 3 ? "opacity-100" : "opacity-20")}
                style={{ background: PAINT_COLORS.aliceMix }}
                title="Alice's public mix"
              />
              {stepIndex >= 5 && (
                <>
                  <span className="text-foreground-subtle">+</span>
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: PAINT_COLORS.bob }}
                    title="Bob's secret"
                  />
                  <span className="text-foreground-subtle">=</span>
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: PAINT_COLORS.shared }}
                    title="Shared secret"
                  />
                </>
              )}
            </div>
          </div>

          {/* Bob */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ background: PAINT_COLORS.bob }}
              />
              <span className="text-sm font-semibold text-blue-300">Bob</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Private key (b):</span>
                <span className={cn("transition-opacity", stepIndex >= 2 ? "opacity-100" : "opacity-20")}>
                  {stepIndex >= 2 ? (
                    <span className="flex items-center gap-1 text-blue-400">
                      <EyeOff className="h-3 w-3" /> {b}
                    </span>
                  ) : (
                    "?"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Public key (B):</span>
                <span className={cn("transition-opacity", stepIndex >= 4 ? "opacity-100" : "opacity-20")}>
                  {stepIndex >= 4 ? (
                    <span className="text-violet-400">{dhResult.bobPublic}</span>
                  ) : (
                    "?"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Shared secret:</span>
                <span className={cn("transition-opacity", stepIndex >= 6 ? "opacity-100" : "opacity-20")}>
                  {stepIndex >= 6 ? (
                    <span className="font-bold text-green-400">{dhResult.sharedSecret}</span>
                  ) : (
                    "?"
                  )}
                </span>
              </div>
            </div>
            {/* Paint analogy swatch */}
            <div className="mt-3 flex items-center gap-1">
              <div
                className={cn("h-6 w-6 rounded transition-opacity", stepIndex >= 0 ? "opacity-100" : "opacity-20")}
                style={{ background: PAINT_COLORS.common }}
                title="Common colour"
              />
              <span className="text-foreground-subtle">+</span>
              <div
                className={cn("h-6 w-6 rounded transition-opacity", stepIndex >= 2 ? "opacity-100" : "opacity-20")}
                style={{ background: PAINT_COLORS.bob }}
                title="Bob's secret colour"
              />
              <span className="text-foreground-subtle">=</span>
              <div
                className={cn("h-6 w-6 rounded transition-opacity", stepIndex >= 4 ? "opacity-100" : "opacity-20")}
                style={{ background: PAINT_COLORS.bobMix }}
                title="Bob's public mix"
              />
              {stepIndex >= 6 && (
                <>
                  <span className="text-foreground-subtle">+</span>
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: PAINT_COLORS.alice }}
                    title="Alice's secret"
                  />
                  <span className="text-foreground-subtle">=</span>
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: PAINT_COLORS.shared }}
                    title="Shared secret"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Eve's view */}
        <div className="mb-4 rounded-lg border border-gray-500/30 bg-gray-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-300">
              Eve (Eavesdropper)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                Can See
              </h5>
              <ul className="space-y-1 text-foreground-muted">
                <li className={cn("transition-opacity", stepIndex >= 0 ? "opacity-100" : "opacity-20")}>
                  p = {p}, g = {g} (public parameters)
                </li>
                <li className={cn("transition-opacity", stepIndex >= 3 ? "opacity-100" : "opacity-20")}>
                  A = {stepIndex >= 3 ? dhResult.alicePublic : "?"} (Alice&apos;s public key)
                </li>
                <li className={cn("transition-opacity", stepIndex >= 4 ? "opacity-100" : "opacity-20")}>
                  B = {stepIndex >= 4 ? dhResult.bobPublic : "?"} (Bob&apos;s public key)
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Cannot Compute
              </h5>
              <ul className="space-y-1 text-foreground-muted">
                <li className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-red-400" /> a = ? (Alice&apos;s private key)
                </li>
                <li className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-red-400" /> b = ? (Bob&apos;s private key)
                </li>
                <li className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-red-400" /> s = ? (shared secret)
                </li>
              </ul>
              <p className="mt-2 text-[10px] text-foreground-subtle">
                Eve would need to solve the discrete logarithm problem:
                find a such that g^a = A mod p. This is computationally
                infeasible for large primes.
              </p>
            </div>
          </div>
        </div>

        {/* Current step detail */}
        {stepIndex < dhResult.steps.length && (
          <div className="rounded-lg border border-border bg-elevated p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Step {stepIndex + 1}/{dhResult.steps.length}
              </span>
              <span className="text-xs font-medium text-foreground">
                {dhResult.steps[stepIndex].actor}
              </span>
            </div>
            <p className="mb-1 font-mono text-xs text-foreground-muted">
              {dhResult.steps[stepIndex].computation}
            </p>
            <p className="text-xs text-foreground-subtle">
              {dhResult.steps[stepIndex].description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// ── AES Canvas ────────────────────────────────────────────────

/** Colour for each AES sub-step. */
const AES_STEP_COLORS: Record<AESSubStep, string> = {
  initial: "#94a3b8",   // slate
  SubBytes: "#facc15",  // yellow
  ShiftRows: "#fb923c", // orange
  MixColumns: "#60a5fa", // blue
  AddRoundKey: "#4ade80", // green
};

const AES_STEP_BG: Record<AESSubStep, string> = {
  initial: "rgba(148,163,184,0.10)",
  SubBytes: "rgba(250,204,21,0.10)",
  ShiftRows: "rgba(251,146,60,0.10)",
  MixColumns: "rgba(96,165,250,0.10)",
  AddRoundKey: "rgba(74,222,128,0.10)",
};

const AES_SUB_STEPS: AESSubStep[] = ["SubBytes", "ShiftRows", "MixColumns", "AddRoundKey"];

const AESCanvas = memo(function AESCanvas({
  states,
  stateIndex,
  onPrev,
  onNext,
}: {
  states: AESState[];
  stateIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const current = states[stateIndex];
  if (!current) return null;

  const color = AES_STEP_COLORS[current.subStep];
  const bg = AES_STEP_BG[current.subStep];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          AES-128 Encryption
        </span>
        {AES_SUB_STEPS.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: AES_STEP_COLORS[s], opacity: current.subStep === s ? 1 : 0.3 }}
            />
            <span
              className="text-[10px]"
              style={{ color: current.subStep === s ? AES_STEP_COLORS[s] : "#64748b" }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Round navigator */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <button
          onClick={onPrev}
          disabled={stateIndex <= 0}
          className="flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" /> Prev
        </button>
        <div className="text-center">
          <span className="text-xs font-semibold text-foreground">
            Round {current.round} of 10
          </span>
          <span className="mx-2 text-foreground-subtle">|</span>
          <span className="text-xs font-medium" style={{ color }}>
            {current.subStep}
          </span>
        </div>
        <button
          onClick={onNext}
          disabled={stateIndex >= states.length - 1}
          className="flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Sub-step progress indicator */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-1.5">
        {(["SubBytes", "ShiftRows", "MixColumns", "AddRoundKey"] as AESSubStep[]).map((s, i) => {
          const isActive = current.subStep === s;
          const isPast =
            current.subStep !== "initial" &&
            AES_SUB_STEPS.indexOf(current.subStep) > i;
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <span className="text-[10px] text-foreground-subtle">&rarr;</span>
              )}
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-medium transition-all",
                  isPast && !isActive
                    ? "opacity-60"
                    : !isActive
                      ? "opacity-30"
                      : "",
                )}
                style={{
                  background: isActive ? bg : "transparent",
                  color: isActive || isPast ? AES_STEP_COLORS[s] : "#475569",
                  boxShadow: isActive ? `0 0 0 1px ${AES_STEP_COLORS[s]}` : "none",
                }}
              >
                {s}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {/* 4x4 Matrix display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-lg">
          {/* State Matrix */}
          <div className="mb-4">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              State Matrix
            </h4>
            <div className="inline-grid grid-cols-4 gap-1">
              {current.matrix.map((row, r) =>
                row.map((byte, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="flex h-12 w-12 items-center justify-center rounded-md border font-mono text-sm font-bold transition-all duration-300"
                    style={{
                      borderColor: color,
                      background: bg,
                      color,
                    }}
                  >
                    {toHex(byte)}
                  </div>
                )),
              )}
            </div>
          </div>

          {/* Round Key Matrix */}
          <div className="mb-4">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Round Key {current.round}
            </h4>
            <div className="inline-grid grid-cols-4 gap-1">
              {current.roundKey.map((row, r) =>
                row.map((byte, c) => (
                  <div
                    key={`rk-${r}-${c}`}
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/5 font-mono text-sm font-medium text-emerald-400 transition-all duration-300"
                  >
                    {toHex(byte)}
                  </div>
                )),
              )}
            </div>
          </div>

          {/* Description */}
          <div
            className="rounded-lg border p-3 text-xs text-foreground-muted"
            style={{ borderColor: `${color}33`, background: bg }}
          >
            {current.description}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── HTTPS Flow Canvas ─────────────────────────────────────────

const HTTPSFlowCanvas = memo(function HTTPSFlowCanvas({
  steps,
  stepIndex,
  expandedPhase,
  onTogglePhase,
}: {
  steps: HTTPSStep[];
  stepIndex: number;
  expandedPhase: string | null;
  onTogglePhase: (phase: string) => void;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          HTTPS Full Flow
        </span>
        {(Object.keys(HTTPS_PHASE_LABELS) as HTTPSStep["phase"][]).map((phase) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: HTTPS_PHASE_COLORS[phase] }}
            />
            <span className="text-[10px] text-foreground-muted">
              {HTTPS_PHASE_LABELS[phase]}
            </span>
          </div>
        ))}
      </div>

      {/* Vertical timeline */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-2">
          {steps.map((step, i) => {
            const isActive = i <= stepIndex;
            const isCurrent = i === stepIndex;
            const color = HTTPS_PHASE_COLORS[step.phase];
            const isExpanded = expandedPhase === `${step.phase}-${i}`;

            return (
              <div key={`sec-${i}`} className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-30")}>
                {/* Phase block */}
                <button
                  onClick={() => onTogglePhase(`${step.phase}-${i}`)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all",
                    isCurrent ? "ring-1" : "",
                  )}
                  style={{
                    borderColor: `${color}40`,
                    background: isCurrent ? `${color}10` : `${color}05`,
                    boxShadow: isCurrent ? `0 0 0 1px ${color}60` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: `${color}20`, color }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <span className="text-xs font-semibold" style={{ color }}>
                          {HTTPS_PHASE_LABELS[step.phase]}
                        </span>
                        <p className="text-xs text-foreground-muted">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-foreground-subtle">
                        {step.timing < 1
                          ? `${(step.timing * 1000).toFixed(0)} us`
                          : `${step.timing.toFixed(1)} ms`}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-foreground-subtle transition-transform",
                          isExpanded ? "rotate-180" : "",
                        )}
                      />
                    </div>
                  </div>

                  {/* Key-value details row */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(step.details).slice(0, 4).map(([k, v]) => (
                      <span key={k} className="font-mono text-[10px] text-foreground-subtle">
                        <span className="text-foreground-muted">{k}:</span> {v}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Expanded sub-steps */}
                {isExpanded && step.subSteps && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 pl-4" style={{ borderColor: `${color}40` }}>
                    {step.subSteps.map((sub, j) => (
                      <div
                        key={j}
                        className="rounded-md border border-border bg-elevated p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ background: color }}
                          />
                          <span className="text-xs font-medium text-foreground">{sub.label}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-foreground-muted">{sub.description}</p>
                        {sub.details && (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {Object.entries(sub.details).map(([k, v]) => (
                              <span key={k} className="font-mono text-[10px] text-foreground-subtle">
                                <span className="text-foreground-muted">{k}:</span> {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Connector line between phases */}
                {i < steps.length - 1 && (
                  <div className="ml-[19px] h-3 w-px" style={{ background: `${color}30` }} />
                )}
              </div>
            );
          })}

          {/* Total time summary */}
          {stepIndex >= steps.length - 1 && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-center">
              <span className="text-xs font-semibold text-green-400">
                Total elapsed: {steps[steps.length - 1].timing.toFixed(1)} ms
              </span>
              <p className="mt-1 text-[10px] text-green-500/70">
                DNS dominates latency. Subsequent requests to the same host skip DNS + TCP + TLS (connection reuse).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ── CORS Canvas ──────────────────────────────────────────────

const CORS_STEP_COLORS: Record<CORSStep["type"], string> = {
  "check-same-origin": "#60a5fa",
  "check-simple-request": "#a78bfa",
  "preflight-options": "#facc15",
  "preflight-response": "#fb923c",
  "actual-request": "#4ade80",
  "actual-response": "#4ade80",
  error: "#ef4444",
};

const CORSCanvas = memo(function CORSCanvas({
  corsSteps,
  corsConfig,
}: {
  corsSteps: CORSStep[];
  corsConfig: CORSConfig;
}) {
  const allPass = corsSteps.every((s) => s.success);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          CORS Decision Flow
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-green-500/30 ring-1 ring-green-500/40" />
          <span className="text-[10px] text-foreground-muted">Pass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500/30 ring-1 ring-red-500/40" />
          <span className="text-[10px] text-foreground-muted">Fail</span>
        </div>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            allPass
              ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
              : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
          )}
        >
          {allPass ? "CORS PASS" : "CORS BLOCKED"}
        </span>
      </div>

      {/* Request summary */}
      <div className="border-b border-border px-4 py-2">
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px]">
          <span className="text-foreground-muted">
            <span className="text-foreground-subtle">Origin:</span> {corsConfig.origin}
          </span>
          <span className="text-foreground-muted">
            <span className="text-foreground-subtle">Target:</span> {corsConfig.targetOrigin}
          </span>
          <span className="text-foreground-muted">
            <span className="text-foreground-subtle">Method:</span>{" "}
            <span className="text-purple-400">{corsConfig.method}</span>
          </span>
          {corsConfig.credentials && (
            <span className="text-yellow-400">+ Credentials</span>
          )}
        </div>
      </div>

      {/* Decision flow steps */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-2">
          {corsSteps.map((step, i) => {
            const color = CORS_STEP_COLORS[step.type];
            const isError = step.type === "error";

            return (
              <div key={`sec-${i}`}>
                <div
                  className={cn(
                    "rounded-lg border p-3 transition-all",
                    isError ? "border-red-500/40 bg-red-500/5" : "",
                  )}
                  style={
                    !isError
                      ? {
                          borderColor: step.success ? `${color}40` : "#ef444440",
                          background: step.success ? `${color}08` : "#ef444408",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-3">
                    {/* Pass/Fail indicator */}
                    <div className="mt-0.5">
                      {step.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                          style={{ color, background: `${color}15` }}
                        >
                          {step.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {step.description}
                      </p>

                      {/* Headers display */}
                      {step.headers && Object.keys(step.headers).length > 0 && (
                        <div className="mt-2 space-y-0.5 rounded border border-border bg-elevated px-2 py-1.5">
                          {Object.entries(step.headers).map(([k, v]) => (
                            <div key={k} className="font-mono text-[10px]">
                              <span className="text-cyan-400">{k}</span>
                              <span className="text-foreground-subtle">: </span>
                              <span className="text-foreground-muted">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector */}
                {i < corsSteps.length - 1 && (
                  <div className="ml-[11px] h-2 w-px bg-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Certificate Chain Canvas ─────────────────────────────────

type CertScenario = "valid" | "expired" | "revoked";

const CERT_SCENARIO_LABELS: Record<CertScenario, string> = {
  valid: "Valid Chain",
  expired: "Expired Cert",
  revoked: "Revoked Cert",
};

const CERT_CHAIN_COLORS = {
  server: "#60a5fa",       // blue
  intermediate: "#a78bfa", // violet
  root: "#facc15",         // yellow
  valid: "#4ade80",        // green
  invalid: "#ef4444",      // red
} as const;

function certLevel(step: CertChainStep): "server" | "intermediate" | "root" {
  if (step.cert.subject === step.cert.issuer) return "root";
  if (step.cert.subject.includes("Authority") || step.cert.subject.includes("CA")) return "intermediate";
  return "server";
}

const CertChainCanvas = memo(function CertChainCanvas({
  certSteps,
  scenario,
  onScenarioChange,
}: {
  certSteps: CertChainStep[];
  scenario: CertScenario;
  onScenarioChange: (s: CertScenario) => void;
}) {
  const allValid = certSteps.every((s) => s.valid);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Certificate Chain Verification
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: CERT_CHAIN_COLORS.server }} />
          <span className="text-[10px] text-foreground-muted">Server Cert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: CERT_CHAIN_COLORS.intermediate }} />
          <span className="text-[10px] text-foreground-muted">Intermediate CA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: CERT_CHAIN_COLORS.root }} />
          <span className="text-[10px] text-foreground-muted">Root CA</span>
        </div>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            allValid
              ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
              : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
          )}
        >
          {allValid ? "CHAIN VALID" : "CHAIN INVALID"}
        </span>
      </div>

      {/* Scenario selector */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Scenario:
        </span>
        {(["valid", "expired", "revoked"] as CertScenario[]).map((s) => (
          <button
            key={s}
            onClick={() => onScenarioChange(s)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors",
              scenario === s
                ? s === "valid"
                  ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
                  : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                : "text-foreground-muted hover:bg-elevated",
            )}
          >
            {CERT_SCENARIO_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Vertical chain */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-xl space-y-0">
          {certSteps.map((step, i) => {
            const level = certLevel(step);
            const color = CERT_CHAIN_COLORS[level];
            const borderColor = step.valid ? `${color}60` : "#ef444460";
            const bgColor = step.valid ? `${color}08` : "#ef444408";

            return (
              <div key={`sec-${i}`}>
                {/* Certificate box */}
                <div
                  className="rounded-lg border p-3"
                  style={{ borderColor, background: bgColor }}
                >
                  <div className="flex items-start gap-3">
                    {/* Valid/Invalid indicator */}
                    <div className="mt-0.5 shrink-0">
                      {step.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color }}
                        >
                          {level === "root"
                            ? "Root CA"
                            : level === "intermediate"
                              ? "Intermediate CA"
                              : "Server Certificate"}
                        </span>
                      </div>

                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {step.cert.subject}
                      </h4>

                      <p className="text-xs text-foreground-muted mb-2">{step.step}</p>

                      {/* Cert details */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
                        <div>
                          <span className="text-foreground-subtle">Issuer: </span>
                          <span className="text-foreground-muted">{step.cert.issuer}</span>
                        </div>
                        <div>
                          <span className="text-foreground-subtle">Valid: </span>
                          <span className="text-foreground-muted">
                            {step.cert.validFrom} to {step.cert.validTo}
                          </span>
                        </div>
                        <div>
                          <span className="text-foreground-subtle">PubKey: </span>
                          <span className="text-foreground-muted">{step.cert.publicKey.slice(0, 20)}...</span>
                        </div>
                        <div>
                          <span className="text-foreground-subtle">Sig: </span>
                          <span className="text-foreground-muted">{step.cert.signature.slice(0, 20)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* "signed by" arrow connector */}
                {i < certSteps.length - 1 && certSteps[i + 1].valid && (
                  <div className="flex flex-col items-center py-1">
                    <div className="h-4 w-px bg-foreground-subtle/30" />
                    <span className="text-[9px] font-medium text-foreground-subtle">
                      signed by
                    </span>
                    <div className="h-1 w-px bg-foreground-subtle/30" />
                    <ChevronDown className="h-3 w-3 text-foreground-subtle/50" />
                  </div>
                )}
                {i < certSteps.length - 1 && !certSteps[i + 1].valid && (
                  <div className="flex flex-col items-center py-1">
                    <div className="h-4 w-px bg-red-500/30" />
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <div className="h-1 w-px bg-red-500/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Password Hashing Canvas ────────────────────────────────

const HASH_STEP_COLORS: Record<string, string> = {
  "Plaintext Input": "#ef4444",     // red — danger, plaintext
  "Salt Generation": "#facc15",     // yellow
  "Combine Password + Salt": "#fb923c", // orange
  "Final Bcrypt Hash": "#4ade80",   // green — safe
};

function getHashStepColor(step: string): string {
  if (step in HASH_STEP_COLORS) return HASH_STEP_COLORS[step];
  if (step.startsWith("Cost Factor")) return "#a78bfa"; // violet
  if (step.startsWith("Round")) return "#60a5fa"; // blue
  return "#94a3b8"; // slate
}

const PasswordHashingCanvas = memo(function PasswordHashingCanvas({
  hashSteps,
  password,
  costFactor,
  onPasswordChange,
  onCostFactorChange,
  showRainbow,
  onToggleRainbow,
}: {
  hashSteps: HashingStep[];
  password: string;
  costFactor: number;
  onPasswordChange: (v: string) => void;
  onCostFactorChange: (v: number) => void;
  showRainbow: boolean;
  onToggleRainbow: () => void;
}) {
  const rainbowData = useMemo(
    () => demonstrateRainbowTable(password),
    [password],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Bcrypt Password Hashing
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} />
          <span className="text-[10px] text-foreground-muted">Plaintext</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm" style={{ background: "#facc15" }} />
          <span className="text-[10px] text-foreground-muted">Salt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm" style={{ background: "#60a5fa" }} />
          <span className="text-[10px] text-foreground-muted">Rounds</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm" style={{ background: "#4ade80" }} />
          <span className="text-[10px] text-foreground-muted">Hash</span>
        </div>
        <button
          onClick={onToggleRainbow}
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
            showRainbow
              ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
              : "bg-foreground-subtle/10 text-foreground-muted ring-1 ring-foreground-subtle/20 hover:bg-foreground-subtle/20",
          )}
        >
          {showRainbow ? "Hide" : "Show"} Rainbow Table
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Main hashing pipeline */}
        {!showRainbow && (
          <div className="mx-auto max-w-2xl space-y-0">
            {hashSteps.map((step, i) => {
              const color = getHashStepColor(step.step);
              return (
                <div key={`sec-${i}`}>
                  <div
                    className="rounded-lg border p-3"
                    style={{
                      borderColor: `${color}40`,
                      background: `${color}08`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step number */}
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ background: `${color}20`, color }}
                      >
                        {i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-xs font-semibold uppercase tracking-wider mb-1"
                          style={{ color }}
                        >
                          {step.step}
                        </h4>
                        <p className="text-xs text-foreground-muted mb-2">
                          {step.description}
                        </p>
                        <div
                          className="rounded border px-2 py-1 font-mono text-[11px] break-all"
                          style={{
                            borderColor: `${color}30`,
                            background: `${color}05`,
                            color: `${color}`,
                          }}
                        >
                          {step.data}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  {i < hashSteps.length - 1 && (
                    <div className="flex flex-col items-center py-0.5">
                      <div className="h-3 w-px bg-foreground-subtle/30" />
                      <ChevronDown className="h-3 w-3 text-foreground-subtle/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rainbow table comparison */}
        {showRainbow && (
          <div className="mx-auto max-w-3xl space-y-4">
            <p className="text-xs text-foreground-muted leading-relaxed">
              {rainbowData.explanation}
            </p>

            {/* Unsalted table */}
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Unsalted Hashes (Vulnerable)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-red-500/20">
                      <th className="pb-1 pr-4 text-foreground-subtle">Password</th>
                      <th className="pb-1 pr-4 text-foreground-subtle">MD5 Hash</th>
                      <th className="pb-1 text-foreground-subtle">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rainbowData.unsalted.map((entry, i) => (
                      <tr key={`sec-${i}`} className="border-b border-red-500/10 last:border-0">
                        <td className="py-1 pr-4 text-red-300">{entry.password}</td>
                        <td className="py-1 pr-4 text-red-400/70">{entry.md5.slice(0, 24)}...</td>
                        <td className="py-1">
                          <span className="inline-flex items-center gap-1 text-red-400">
                            <XCircle className="h-3 w-3" /> Cracked
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Salted table */}
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                Salted Hashes (Protected)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-green-500/20">
                      <th className="pb-1 pr-4 text-foreground-subtle">Password</th>
                      <th className="pb-1 pr-4 text-foreground-subtle">Salt</th>
                      <th className="pb-1 pr-4 text-foreground-subtle">Hash</th>
                      <th className="pb-1 text-foreground-subtle">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rainbowData.salted.map((entry, i) => (
                      <tr key={`sec-${i}`} className="border-b border-green-500/10 last:border-0">
                        <td className="py-1 pr-4 text-green-300">{entry.password}</td>
                        <td className="py-1 pr-4 text-yellow-400/70">{entry.salt.slice(0, 12)}...</td>
                        <td className="py-1 pr-4 text-green-400/70">{entry.hash.slice(0, 16)}...</td>
                        <td className="py-1">
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="h-3 w-3" /> Safe
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ── JWT Attacks Canvas ────────────────────────────────────────

const ATTACK_TABS: { id: JWTAttackType; name: string; icon: string }[] = [
  { id: "none-algorithm", name: "\"none\" Algorithm", icon: "N" },
  { id: "token-replay", name: "Token Replay", icon: "R" },
  { id: "algorithm-confusion", name: "Key Confusion", icon: "C" },
];

function getAttackSteps(attack: JWTAttackType): JWTAttackStep[] {
  switch (attack) {
    case "none-algorithm":
      return simulateNoneAlgorithm();
    case "token-replay":
      return simulateTokenReplay();
    case "algorithm-confusion":
      return simulateJWTConfusion();
  }
}

const JWTAttacksCanvas = memo(function JWTAttacksCanvas({
  attackType,
  onAttackChange,
  attackStepIndex,
  onAttackPrev,
  onAttackNext,
}: {
  attackType: JWTAttackType;
  onAttackChange: (t: JWTAttackType) => void;
  attackStepIndex: number;
  onAttackPrev: () => void;
  onAttackNext: () => void;
}) {
  const steps = useMemo(() => getAttackSteps(attackType), [attackType]);
  const step = steps[attackStepIndex];
  if (!step) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Attack tabs */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-2">
        {ATTACK_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onAttackChange(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              attackType === tab.id
                ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Step navigator */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <button
          onClick={onAttackPrev}
          disabled={attackStepIndex <= 0}
          className="flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" /> Prev
        </button>
        <span className="text-xs font-semibold text-foreground">
          Step {attackStepIndex + 1} of {steps.length}
        </span>
        <button
          onClick={onAttackNext}
          disabled={attackStepIndex >= steps.length - 1}
          className="flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Description */}
          <div className="rounded-lg border border-border bg-elevated p-4">
            <p className="text-sm leading-relaxed text-foreground">{step.description}</p>
          </div>

          {/* Token display */}
          {step.token && (
            <div className="rounded-lg border border-border bg-elevated p-3">
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Token
              </h4>
              <div className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground-muted break-all">
                {step.token}
              </div>
            </div>
          )}

          {/* Header / Payload side by side */}
          {(step.header || step.payload) && (
            <div className="grid gap-3 md:grid-cols-2">
              {step.header && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                    Header
                  </h4>
                  <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs text-rose-300">
                    {JSON.stringify(step.header, null, 2)}
                  </pre>
                </div>
              )}
              {step.payload && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                    Payload
                  </h4>
                  <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs text-purple-300">
                    {JSON.stringify(step.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Vulnerability (red) */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Vulnerability
              </span>
            </div>
            <p className="text-xs leading-relaxed text-red-300">{step.vulnerability}</p>
          </div>

          {/* Defense (green) */}
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
                Defense
              </span>
            </div>
            <p className="text-xs leading-relaxed text-green-300">{step.defense}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Rate Limiting Canvas ──────────────────────────────────

const RATE_LIMIT_COLORS: Record<string, string> = {
  "Token Bucket": "#3b82f6",     // blue
  "Sliding Window": "#a855f7",   // purple
  "Leaky Bucket": "#f59e0b",     // amber
};

const RateLimitingCanvas = memo(function RateLimitingCanvas({
  tokenBucketSteps,
  slidingWindowSteps,
  leakyBucketSteps,
  requestPattern,
}: {
  tokenBucketSteps: RateLimitStep[];
  slidingWindowSteps: RateLimitStep[];
  leakyBucketSteps: RateLimitStep[];
  requestPattern: number[];
}) {
  const algorithms = [
    { name: "Token Bucket", steps: tokenBucketSteps, color: RATE_LIMIT_COLORS["Token Bucket"] },
    { name: "Sliding Window", steps: slidingWindowSteps, color: RATE_LIMIT_COLORS["Sliding Window"] },
    { name: "Leaky Bucket", steps: leakyBucketSteps, color: RATE_LIMIT_COLORS["Leaky Bucket"] },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Rate Limiting Comparison
        </span>
        {algorithms.map((algo) => (
          <div key={algo.name} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: algo.color }} />
            <span className="text-[10px] text-foreground-muted">{algo.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-foreground-subtle italic">
            Pattern: burst(5) - steady(5) - burst(5)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Timeline visualization */}
        <div className="mb-6">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Request Timeline
          </h4>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 800 80" className="w-full" style={{ minWidth: 600 }}>
              {/* Timeline axis */}
              <line x1={40} y1={50} x2={760} y2={50} stroke="#334155" strokeWidth={1} />
              {/* Tick marks and labels */}
              {requestPattern.map((tick, i) => {
                const x = 40 + (tick / Math.max(...requestPattern)) * 700;
                return (
                  <g key={`sec-${i}`}>
                    <line x1={x} y1={46} x2={x} y2={54} stroke="#64748b" strokeWidth={1} />
                    <text x={x} y={68} textAnchor="middle" fill="#94a3b8" fontSize="8">
                      t={tick}
                    </text>
                    <circle cx={x} cy={36} r={4} fill={
                      i < 5 ? "#ef4444" : i < 10 ? "#22c55e" : "#ef4444"
                    } />
                    <text x={x} y={26} textAnchor="middle" fill="#cbd5e1" fontSize="7">
                      #{i + 1}
                    </text>
                  </g>
                );
              })}
              {/* Burst/Steady labels */}
              <text x={40 + (2 / Math.max(...requestPattern)) * 700} y={12} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">
                Burst
              </text>
              <text x={40 + (20 / Math.max(...requestPattern)) * 700} y={12} textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="600">
                Steady
              </text>
              <text x={40 + (33 / Math.max(...requestPattern)) * 700} y={12} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">
                Burst
              </text>
            </svg>
          </div>
        </div>

        {/* Algorithm comparison grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {algorithms.map((algo) => {
            const allowed = algo.steps.filter((s) => s.allowed).length;
            const denied = algo.steps.filter((s) => !s.allowed).length;
            return (
              <div
                key={algo.name}
                className="rounded-lg border p-4"
                style={{ borderColor: `${algo.color}30`, background: `${algo.color}05` }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ background: algo.color }} />
                  <span className="text-sm font-semibold" style={{ color: algo.color }}>
                    {algo.name}
                  </span>
                </div>

                {/* Stats */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-green-400">{allowed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-400">{denied}</span>
                  </div>
                  <span className="text-[10px] text-foreground-subtle">
                    {((allowed / algo.steps.length) * 100).toFixed(0)}% pass rate
                  </span>
                </div>

                {/* Per-request results */}
                <div className="space-y-1">
                  {algo.steps.map((step, i) => (
                    <div
                      key={`sec-${i}`}
                      className="flex items-center gap-1.5 rounded px-1.5 py-0.5"
                      style={{
                        background: step.allowed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                      }}
                    >
                      <span className="w-5 shrink-0 text-right font-mono text-[9px] text-foreground-subtle">
                        #{step.request}
                      </span>
                      <span className="font-mono text-[9px] text-foreground-subtle">
                        t={step.tick}
                      </span>
                      {step.allowed ? (
                        <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-400" />
                      ) : (
                        <XCircle className="h-2.5 w-2.5 shrink-0 text-red-400" />
                      )}
                      <span className="truncate text-[9px] text-foreground-muted">
                        {step.tokens !== undefined ? `tokens=${step.tokens}` : ""}
                        {step.windowCount !== undefined ? `count=${step.windowCount}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Web Attacks Canvas ────────────────────────────────────

const WEB_ATTACK_TABS: { id: WebAttackType; name: string }[] = [
  { id: "xss", name: "XSS" },
  { id: "csrf", name: "CSRF" },
  { id: "sql-injection", name: "SQL Injection" },
];

const WebAttacksCanvas = memo(function WebAttacksCanvas({
  webAttackType,
  onWebAttackChange,
  webAttackDefenseMode,
  onToggleDefenseMode,
}: {
  webAttackType: WebAttackType;
  onWebAttackChange: (t: WebAttackType) => void;
  webAttackDefenseMode: boolean;
  onToggleDefenseMode: () => void;
}) {
  const allSteps = useMemo(() => getWebAttackSteps(webAttackType), [webAttackType]);
  const steps = useMemo(() => {
    if (webAttackDefenseMode) return allSteps;
    // Without defense mode: only show attack steps (isAttack === true)
    return allSteps.filter((s) => s.isAttack);
  }, [allSteps, webAttackDefenseMode]);

  const meta = WEB_ATTACK_META[webAttackType];
  const columns = WEB_ATTACK_COLUMNS;
  const colWidth = 220;
  const headerHeight = 50;
  const rowHeight = 80;
  const totalWidth = columns.length * colWidth;
  const totalHeight = headerHeight + steps.length * rowHeight + 40;
  const colPositions = columns.map((_, i) => (i + 0.5) * colWidth);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Attack type tabs + defense toggle */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        {WEB_ATTACK_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onWebAttackChange(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              webAttackType === tab.id
                ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            {tab.name}
          </button>
        ))}

        <button
          onClick={onToggleDefenseMode}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold transition-colors",
            webAttackDefenseMode
              ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
              : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
          )}
        >
          <Shield className="h-3 w-3" />
          {webAttackDefenseMode ? "With Defense" : "Without Defense"}
        </button>
      </div>

      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        <span className="text-xs font-semibold text-foreground">
          {meta.name}
        </span>
        <span className="text-[10px] text-foreground-subtle">
          — {steps.length} steps
        </span>
      </div>

      {/* Sequence diagram */}
      <div className="flex-1 overflow-auto p-4">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="mx-auto w-full"
          style={{ maxHeight: Math.min(totalHeight, 750) }}
        >
          {/* Column headers */}
          {columns.map((col, i) => (
            <g key={col}>
              <rect
                x={colPositions[i] - 70}
                y={8}
                width={140}
                height={30}
                rx={6}
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={colPositions[i]}
                y={28}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="11"
                fontWeight="600"
              >
                {col}
              </text>
              {/* Lifeline */}
              <line
                x1={colPositions[i]}
                y1={headerHeight}
                x2={colPositions[i]}
                y2={totalHeight - 10}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          ))}

          {/* Steps as messages */}
          {steps.map((step, i) => {
            const fromCol = actorToColumn(step.actor);
            const fromIdx = columns.indexOf(fromCol);
            // Determine target column based on step context
            let toCol = fromCol;
            if (step.actor === "Attacker" || step.actor === "Malicious Site") {
              toCol = step.action.toLowerCase().includes("server") || step.action.toLowerCase().includes("forge")
                ? "Server"
                : "Victim / Browser";
            } else if (step.actor === "Browser" || step.actor === "Victim") {
              toCol = "Server";
            } else if (step.actor === "Server") {
              toCol = "Victim / Browser";
            }
            const toIdx = columns.indexOf(toCol);

            const y = headerHeight + i * rowHeight + 40;
            const x1 = colPositions[fromIdx];
            const x2 = colPositions[toIdx];
            const stepColor = step.isAttack ? "#ef4444" : "#22c55e";
            const stepColorMuted = step.isAttack ? "#fca5a5" : "#86efac";

            // Self-message
            if (fromIdx === toIdx) {
              return (
                <g key={`sec-${i}`}>
                  <path
                    d={`M ${x1 + 8} ${y - 4} Q ${x1 + 60} ${y - 4} ${x1 + 60} ${y + 10} Q ${x1 + 60} ${y + 20} ${x1 + 8} ${y + 20}`}
                    fill="none"
                    stroke={stepColor}
                    strokeWidth={1.5}
                  />
                  <polygon
                    points={`${x1 + 12},${y + 16} ${x1 + 8},${y + 20} ${x1 + 12},${y + 24}`}
                    fill={stepColor}
                  />
                  {/* Label */}
                  <text
                    x={x1 + 66}
                    y={y + 4}
                    textAnchor="start"
                    fill={stepColorMuted}
                    fontSize="9"
                    fontWeight="600"
                  >
                    {step.action.slice(0, 42)}
                  </text>
                  {/* Payload snippet */}
                  {step.payload && (
                    <text
                      x={x1 + 66}
                      y={y + 16}
                      textAnchor="start"
                      fill="#94a3b8"
                      fontSize="7.5"
                      fontFamily="monospace"
                    >
                      {step.payload.split("\n")[0].slice(0, 50)}
                    </text>
                  )}
                  {/* Step number */}
                  <circle cx={x1 - 16} cy={y + 8} r={9} fill={step.isAttack ? "#7f1d1d" : "#14532d"} />
                  <text
                    x={x1 - 16}
                    y={y + 12}
                    textAnchor="middle"
                    fill={stepColorMuted}
                    fontSize="8"
                    fontWeight="700"
                  >
                    {step.tick}
                  </text>
                </g>
              );
            }

            const isLeftToRight = x2 > x1;

            return (
              <g key={`sec-${i}`}>
                {/* Arrow line */}
                <line
                  x1={x1 + (isLeftToRight ? 8 : -8)}
                  y1={y}
                  x2={x2 + (isLeftToRight ? -12 : 12)}
                  y2={y}
                  stroke={stepColor}
                  strokeWidth={1.5}
                />
                {/* Arrowhead */}
                <polygon
                  points={
                    isLeftToRight
                      ? `${x2 - 12},${y - 4} ${x2 - 4},${y} ${x2 - 12},${y + 4}`
                      : `${x2 + 12},${y - 4} ${x2 + 4},${y} ${x2 + 12},${y + 4}`
                  }
                  fill={stepColor}
                />
                {/* Action label */}
                <text
                  x={(x1 + x2) / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fill={stepColorMuted}
                  fontSize="9"
                  fontWeight="600"
                >
                  {step.action.slice(0, 50)}
                </text>
                {/* Payload snippet */}
                {step.payload && (
                  <text
                    x={(x1 + x2) / 2}
                    y={y + 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    {step.payload.split("\n")[0].slice(0, 55)}
                  </text>
                )}
                {/* Defense badge */}
                {step.defense && (
                  <text
                    x={(x1 + x2) / 2}
                    y={y + 26}
                    textAnchor="middle"
                    fill="#4ade80"
                    fontSize="7"
                    fontWeight="600"
                  >
                    {step.defense.slice(0, 50)}
                  </text>
                )}
                {/* Step number */}
                <circle cx={x1 + (isLeftToRight ? -16 : 16)} cy={y} r={9} fill={step.isAttack ? "#7f1d1d" : "#14532d"} />
                <text
                  x={x1 + (isLeftToRight ? -16 : 16)}
                  y={y + 4}
                  textAnchor="middle"
                  fill={stepColorMuted}
                  fontSize="8"
                  fontWeight="700"
                >
                  {step.tick}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Step detail cards below the diagram */}
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {steps.map((step, i) => (
            <div
              key={`sec-${i}`}
              className={cn(
                "rounded-lg border p-3",
                step.isAttack
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-green-500/30 bg-green-500/5",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    step.isAttack
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400",
                  )}
                >
                  {step.tick}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        step.isAttack ? "text-red-400" : "text-green-400",
                      )}
                    >
                      {step.actor}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {step.action}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted leading-relaxed mb-2">
                    {step.description}
                  </p>
                  {step.payload && (
                    <pre className="overflow-auto whitespace-pre-wrap rounded border border-border/50 bg-background/50 px-2 py-1 font-mono text-[10px] text-foreground-subtle">
                      {step.payload}
                    </pre>
                  )}
                  {step.defense && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400">
                      <Shield className="h-3 w-3" />
                      <span className="font-semibold">{step.defense}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Encryption Comparison Canvas ─────────────────────────

const ENCRYPTION_MODE_LABELS: Record<EncryptionMode, string> = {
  symmetric: "Symmetric (AES)",
  asymmetric: "Asymmetric (RSA)",
  hybrid: "Hybrid (TLS)",
};

const ENCRYPTION_ACTOR_COLORS: Record<string, string> = {
  Alice: "#3b82f6",
  Bob: "#22c55e",
  Network: "#f59e0b",
  Both: "#a855f7",
};

const EncryptionCanvas = memo(function EncryptionCanvas({
  symmetricSteps,
  asymmetricSteps,
  hybridSteps,
  encryptionStepIndex,
  onEncryptionPrev,
  onEncryptionNext,
}: {
  symmetricSteps: EncryptionStep[];
  asymmetricSteps: EncryptionStep[];
  hybridSteps: EncryptionStep[];
  encryptionStepIndex: number;
  onEncryptionPrev: () => void;
  onEncryptionNext: () => void;
}) {
  const modes: {
    mode: EncryptionMode;
    label: string;
    steps: EncryptionStep[];
    color: string;
    tagline: string;
  }[] = [
    {
      mode: "symmetric",
      label: "Symmetric (AES)",
      steps: symmetricSteps,
      color: ENCRYPTION_COLORS.symmetric,
      tagline: "Same key encrypts & decrypts. Fast. Key distribution problem.",
    },
    {
      mode: "asymmetric",
      label: "Asymmetric (RSA)",
      steps: asymmetricSteps,
      color: ENCRYPTION_COLORS.asymmetric,
      tagline: "Public encrypts, private decrypts. Slow. No key distribution problem.",
    },
    {
      mode: "hybrid",
      label: "Hybrid (TLS)",
      steps: hybridSteps,
      color: ENCRYPTION_COLORS.hybrid,
      tagline: "RSA handshake then AES for data. Best of both worlds.",
    },
  ];

  const maxSteps = Math.max(
    symmetricSteps.length,
    asymmetricSteps.length,
    hybridSteps.length,
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Legend + controls */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Encryption Comparison
        </span>
        {modes.map((m) => (
          <div key={m.mode} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: m.color }} />
            <span className="text-[10px] text-foreground-muted">{m.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onEncryptionPrev}
            disabled={encryptionStepIndex <= 0}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-foreground-muted transition-colors hover:bg-elevated disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[10px] text-foreground-subtle">
            {encryptionStepIndex + 1}/{maxSteps}
          </span>
          <button
            onClick={onEncryptionNext}
            disabled={encryptionStepIndex >= maxSteps - 1}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-foreground-muted transition-colors hover:bg-elevated disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Three-column grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((m) => {
            const visibleSteps = m.steps.filter((s) => s.tick <= encryptionStepIndex);
            const currentStep = m.steps.find((s) => s.tick === encryptionStepIndex);
            const isDone = encryptionStepIndex >= m.steps.length;

            return (
              <div
                key={m.mode}
                className="flex flex-col rounded-lg border p-4"
                style={{
                  borderColor: `${m.color}30`,
                  background: `${m.color}05`,
                }}
              >
                {/* Mode header */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ background: m.color }} />
                  <span className="text-sm font-semibold" style={{ color: m.color }}>
                    {m.label}
                  </span>
                </div>
                <p className="mb-3 text-[10px] text-foreground-subtle italic">
                  {m.tagline}
                </p>

                {/* Alice / Bob diagram */}
                <div className="mb-3">
                  <svg viewBox="0 0 280 90" className="w-full" style={{ maxHeight: 90 }}>
                    {/* Alice */}
                    <rect x={10} y={10} width={70} height={30} rx={6} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                    <text x={45} y={30} textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="600">
                      Alice
                    </text>
                    {/* Bob */}
                    <rect x={200} y={10} width={70} height={30} rx={6} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                    <text x={235} y={30} textAnchor="middle" fill="#86efac" fontSize="11" fontWeight="600">
                      Bob
                    </text>
                    {/* Network line */}
                    <line x1={80} y1={25} x2={200} y2={25} stroke="#334155" strokeWidth={1} strokeDasharray="4 4" />

                    {/* Animated data packet */}
                    {currentStep && currentStep.actor === "Network" && (
                      <g>
                        <rect
                          x={110}
                          y={12}
                          width={60}
                          height={26}
                          rx={4}
                          fill={currentStep.encrypted ? "#dc262620" : `${m.color}20`}
                          stroke={currentStep.encrypted ? "#dc2626" : m.color}
                          strokeWidth={1}
                        >
                          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
                        </rect>
                        <text x={140} y={29} textAnchor="middle" fill={currentStep.encrypted ? "#fca5a5" : "#e2e8f0"} fontSize="8">
                          {currentStep.encrypted ? "ENCRYPTED" : "PLAINTEXT"}
                        </text>
                      </g>
                    )}

                    {/* Key icons */}
                    {currentStep && (currentStep.phase.toLowerCase().includes("key") || currentStep.phase.toLowerCase().includes("encrypt") || currentStep.phase.toLowerCase().includes("decrypt")) && (
                      <g>
                        {currentStep.actor === "Alice" && (
                          <text x={45} y={58} textAnchor="middle" fill={m.color} fontSize="10" fontWeight="600">
                            {currentStep.phase.includes("Encrypt") ? "Encrypting..." : currentStep.phase.includes("Decrypt") ? "Decrypting..." : "Key"}
                          </text>
                        )}
                        {currentStep.actor === "Bob" && (
                          <text x={235} y={58} textAnchor="middle" fill={m.color} fontSize="10" fontWeight="600">
                            {currentStep.phase.includes("Decrypt") ? "Decrypting..." : currentStep.phase.includes("Encrypt") ? "Encrypting..." : "Key"}
                          </text>
                        )}
                      </g>
                    )}

                    {/* Phase label */}
                    {currentStep && (
                      <text x={140} y={80} textAnchor="middle" fill="#94a3b8" fontSize="9">
                        {currentStep.phase}
                      </text>
                    )}
                    {isDone && !currentStep && (
                      <text x={140} y={80} textAnchor="middle" fill="#6b7280" fontSize="9">
                        Complete
                      </text>
                    )}
                  </svg>
                </div>

                {/* Step-by-step log */}
                <div className="flex-1 space-y-1">
                  {visibleSteps.map((step) => {
                    const isCurrent = step.tick === encryptionStepIndex;
                    const actorColor = ENCRYPTION_ACTOR_COLORS[step.actor] ?? "#94a3b8";
                    return (
                      <div
                        key={step.tick}
                        className={cn(
                          "rounded px-2 py-1.5 transition-colors",
                          !isCurrent && "opacity-60",
                        )}
                        style={{
                          background: isCurrent ? `${m.color}10` : "transparent",
                          boxShadow: isCurrent ? `0 0 0 1px ${m.color}40` : "none",
                        }}
                      >
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-[9px] text-foreground-subtle">
                            [{step.tick + 1}]
                          </span>
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: actorColor }}
                          >
                            {step.actor}
                          </span>
                          <span className="text-[10px] font-medium text-foreground-muted">
                            {step.phase}
                          </span>
                          {step.encrypted && (
                            <Lock className="h-2.5 w-2.5 text-red-400" />
                          )}
                        </div>
                        <div className="rounded bg-background/50 px-1.5 py-0.5 font-mono text-[9px] text-foreground-subtle">
                          {step.data}
                        </div>
                        {isCurrent && (
                          <p className="mt-1 text-[10px] leading-snug text-foreground-muted">
                            {step.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {visibleSteps.length === 0 && (
                    <p className="text-center text-[10px] text-foreground-subtle italic py-4">
                      Step through to see {m.label} in action
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── Sidebar ────────────────────────────────────────────────

const SecuritySidebar = memo(function SecuritySidebar({
  active,
  onSelect,
  stepIndex,
  totalSteps,
  onStep,
  onPlay,
  onReset,
  oauthFlow,
  onFlowChange,
  jwtSubView,
  onJwtSubViewChange,
  webAttackType,
  onWebAttackChange,
  webAttackDefenseMode,
  onToggleDefenseMode,
}: {
  active: SecurityTopic;
  onSelect: (t: SecurityTopic) => void;
  stepIndex: number;
  totalSteps: number;
  onStep: () => void;
  onPlay: () => void;
  onReset: () => void;
  oauthFlow: OAuthFlowType;
  onFlowChange: (f: OAuthFlowType) => void;
  jwtSubView: JWTSubView;
  onJwtSubViewChange: (v: JWTSubView) => void;
  webAttackType: WebAttackType;
  onWebAttackChange: (t: WebAttackType) => void;
  webAttackDefenseMode: boolean;
  onToggleDefenseMode: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Security & Cryptography
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors",
              active === t.id
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:bg-elevated hover:text-foreground",
            )}
          >
            <span className="block text-sm font-medium">{t.name}</span>
            <span className="block text-[11px] text-foreground-subtle">
              {t.description}
            </span>
          </button>
        ))}

        {/* OAuth flow selector */}
        {active === "oauth" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              OAuth Flow
            </span>
            <button
              onClick={() => onFlowChange("auth-code-pkce")}
              className={cn(
                "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors",
                oauthFlow === "auth-code-pkce"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              Auth Code + PKCE
            </button>
            <button
              onClick={() => onFlowChange("client-credentials")}
              className={cn(
                "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors",
                oauthFlow === "client-credentials"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              Client Credentials
            </button>
            <button
              onClick={() => onFlowChange("device-auth")}
              className={cn(
                "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors",
                oauthFlow === "device-auth"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              Device Auth (TV/CLI)
            </button>
          </div>
        )}

        {/* JWT sub-view selector */}
        {active === "jwt" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              JWT View
            </span>
            <button
              onClick={() => onJwtSubViewChange("lifecycle")}
              className={cn(
                "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors",
                jwtSubView === "lifecycle"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              Lifecycle (Encode/Decode)
            </button>
            <button
              onClick={() => onJwtSubViewChange("attacks")}
              className={cn(
                "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors flex items-center gap-1.5",
                jwtSubView === "attacks"
                  ? "bg-red-500/10 text-red-400"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              <AlertTriangle className="h-3 w-3" /> JWT Attacks
            </button>
          </div>
        )}

        {/* Web Attacks sub-selector */}
        {active === "web-attacks" && (
          <div className="mt-3 border-t border-sidebar-border pt-3">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Attack Type
            </span>
            {WEB_ATTACK_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onWebAttackChange(tab.id)}
                className={cn(
                  "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors flex items-center gap-1.5",
                  webAttackType === tab.id
                    ? "bg-red-500/10 text-red-400"
                    : "text-foreground-muted hover:bg-elevated",
                )}
              >
                <AlertTriangle className="h-3 w-3" /> {tab.name}
              </button>
            ))}
            <div className="mt-2">
              <button
                onClick={onToggleDefenseMode}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-xs transition-colors flex items-center gap-1.5",
                  webAttackDefenseMode
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400",
                )}
              >
                <Shield className="h-3 w-3" />
                {webAttackDefenseMode ? "With Defense" : "Without Defense"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step controls (for OAuth, DH, HTTPS Flow) */}
      {(active === "oauth" || active === "diffie-hellman" || active === "https-flow") && (
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-2">
          <button
            onClick={onStep}
            disabled={stepIndex >= totalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" /> Step
          </button>
          <button
            onClick={onPlay}
            disabled={stepIndex >= totalSteps - 1}
            className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Play className="h-3 w-3" /> Play
          </button>
          <button
            onClick={onReset}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <span className="ml-auto font-mono text-[10px] text-foreground-subtle">
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>
      )}
    </div>
  );
});

// ── SecurityContext — eliminates 63-prop drilling ──────────

interface SecurityPropertiesContextValue {
  active: SecurityTopic;
  oauthSteps: OAuthStep[];
  stepIndex: number;
  oauthFlow: OAuthFlowType;
  headerJson: string;
  payloadJson: string;
  secret: string;
  onHeaderChange: (v: string) => void;
  onPayloadChange: (v: string) => void;
  onSecretChange: (v: string) => void;
  jwtSubView: JWTSubView;
  attackType: JWTAttackType;
  attackSteps: JWTAttackStep[];
  attackStepIndex: number;
  dhResult: DHResult;
  dhP: number;
  dhG: number;
  dhA: number;
  dhB: number;
  onDhPChange: (v: number) => void;
  onDhGChange: (v: number) => void;
  onDhAChange: (v: number) => void;
  onDhBChange: (v: number) => void;
  aesPlaintextHex: string;
  aesKeyHex: string;
  onAesPlaintextChange: (v: string) => void;
  onAesKeyChange: (v: string) => void;
  aesStates: AESState[];
  aesStateIndex: number;
  httpsSteps: HTTPSStep[];
  httpsStepIndex: number;
  httpsDomain: string;
  onHttpsDomainChange: (v: string) => void;
  corsConfig: CORSConfig;
  corsSteps: CORSStep[];
  onCorsOriginChange: (v: string) => void;
  onCorsTargetChange: (v: string) => void;
  onCorsMethodChange: (v: string) => void;
  onCorsHeadersChange: (v: string[]) => void;
  onCorsCredentialsChange: (v: boolean) => void;
  certSteps: CertChainStep[];
  certScenario: CertScenario;
  hashSteps: HashingStep[];
  hashPassword: string;
  hashCostFactor: number;
  onHashPasswordChange: (v: string) => void;
  onHashCostFactorChange: (v: number) => void;
  rlTokenBucketSteps: RateLimitStep[];
  rlSlidingWindowSteps: RateLimitStep[];
  rlLeakyBucketSteps: RateLimitStep[];
  rlCapacity: number;
  rlRefillRate: number;
  rlWindowSize: number;
  rlMaxRequests: number;
  rlLeakRate: number;
  onRlCapacityChange: (v: number) => void;
  onRlRefillRateChange: (v: number) => void;
  onRlWindowSizeChange: (v: number) => void;
  onRlMaxRequestsChange: (v: number) => void;
  onRlLeakRateChange: (v: number) => void;
  webAttackType: WebAttackType;
  webAttackSteps: WebAttackStep[];
  webAttackDefenseMode: boolean;
  encSymmetricSteps: EncryptionStep[];
  encAsymmetricSteps: EncryptionStep[];
  encHybridSteps: EncryptionStep[];
  encryptionStepIndex: number;
}

const SecurityPropertiesContext = React.createContext<SecurityPropertiesContextValue | null>(null);

function useSecurityPropertiesContext(): SecurityPropertiesContextValue {
  const ctx = React.useContext(SecurityPropertiesContext);
  if (!ctx) throw new Error("SecurityProperties must be rendered inside SecurityPropertiesContext.Provider");
  return ctx;
}

// ── Properties Panel ───────────────────────────────────────

const SecurityProperties = memo(function SecurityProperties() {
  const {
    active,
    oauthSteps,
    stepIndex,
    oauthFlow,
    headerJson,
    payloadJson,
    secret,
    onHeaderChange,
    onPayloadChange,
    onSecretChange,
    jwtSubView,
    attackType,
    attackSteps,
    attackStepIndex,
    dhResult,
    dhP,
    dhG,
    dhA,
    dhB,
    onDhPChange,
    onDhGChange,
    onDhAChange,
    onDhBChange,
    aesPlaintextHex,
    aesKeyHex,
    onAesPlaintextChange,
    onAesKeyChange,
    aesStates,
    aesStateIndex,
    httpsSteps,
    httpsStepIndex,
    httpsDomain,
    onHttpsDomainChange,
    corsConfig,
    corsSteps,
    onCorsOriginChange,
    onCorsTargetChange,
    onCorsMethodChange,
    onCorsHeadersChange,
    onCorsCredentialsChange,
    certSteps,
    certScenario,
    hashSteps,
    hashPassword,
    hashCostFactor,
    onHashPasswordChange,
    onHashCostFactorChange,
    rlTokenBucketSteps,
    rlSlidingWindowSteps,
    rlLeakyBucketSteps,
    rlCapacity,
    rlRefillRate,
    rlWindowSize,
    rlMaxRequests,
    rlLeakRate,
    onRlCapacityChange,
    onRlRefillRateChange,
    onRlWindowSizeChange,
    onRlMaxRequestsChange,
    onRlLeakRateChange,
    webAttackType,
    webAttackSteps,
    webAttackDefenseMode,
    encSymmetricSteps,
    encAsymmetricSteps,
    encHybridSteps,
    encryptionStepIndex,
  } = useSecurityPropertiesContext();

  if (active === "oauth") {
    const step = oauthSteps[stepIndex];
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Step Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {step ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Step {stepIndex + 1}/{oauthSteps.length}
                </span>
              </div>
              <h3 className="mb-1 text-sm font-medium text-foreground">
                {step.action}
              </h3>
              <p className="mb-3 text-xs text-foreground-muted">
                {step.description}
              </p>

              {step.httpMethod && (
                <div className="mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    HTTP
                  </span>
                  <div className="mt-1 rounded border border-border bg-elevated px-2 py-1">
                    <span className="font-mono text-xs font-bold text-purple-400">
                      {step.httpMethod}
                    </span>
                    {step.url && (
                      <span className="ml-2 font-mono text-xs text-foreground-muted break-all">
                        {step.url}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {step.headers && Object.keys(step.headers).length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Headers
                  </span>
                  <div className="mt-1 space-y-0.5 rounded border border-border bg-elevated px-2 py-1">
                    {Object.entries(step.headers).map(([k, v]) => (
                      <div key={k} className="font-mono text-[11px]">
                        <span className="text-cyan-400">{k}</span>
                        <span className="text-foreground-subtle">: </span>
                        <span className="text-foreground-muted break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.body && (
                <div className="mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Body
                  </span>
                  <pre className="mt-1 overflow-auto whitespace-pre-wrap rounded border border-border bg-elevated px-2 py-1 font-mono text-[11px] text-foreground-muted">
                    {step.body}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-foreground-subtle">
              Step through the flow to see HTTP details.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (active === "jwt") {
    if (jwtSubView === "attacks") {
      const step = attackSteps[attackStepIndex];
      return (
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border px-3 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400">
              JWT Attack Details
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {step && (
              <>
                <div className="rounded-lg border border-border bg-elevated p-3">
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Attack Type
                  </h4>
                  <p className="text-xs font-medium text-foreground">
                    {attackType === "none-algorithm"
                      ? "\"none\" Algorithm Attack"
                      : attackType === "token-replay"
                        ? "Token Replay Attack"
                        : "Algorithm Confusion (RS256 to HS256)"}
                  </p>
                </div>

                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    How to Prevent
                  </h4>
                  <p className="text-xs leading-relaxed text-red-300">{step.defense}</p>
                </div>

                {step.header && (
                  <div className="rounded-lg border border-border bg-elevated p-3">
                    <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                      Current Header
                    </h4>
                    <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px] text-foreground-muted">
                      {JSON.stringify(step.header, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            JWT Editor
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Header */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-rose-400">
              Header (JSON)
            </label>
            <textarea
              value={headerJson}
              onChange={(e) => onHeaderChange(e.target.value)}
              className="w-full resize-none rounded-md border border-rose-500/30 bg-rose-500/5 p-2 font-mono text-xs text-rose-300 outline-none focus:ring-1 focus:ring-rose-500/50"
              rows={3}
              spellCheck={false}
            />
          </div>

          {/* Payload */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-purple-400">
              Payload (JSON)
            </label>
            <textarea
              value={payloadJson}
              onChange={(e) => onPayloadChange(e.target.value)}
              className="w-full resize-none rounded-md border border-purple-500/30 bg-purple-500/5 p-2 font-mono text-xs text-purple-300 outline-none focus:ring-1 focus:ring-purple-500/50"
              rows={8}
              spellCheck={false}
            />
          </div>

          {/* Secret */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Secret
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => onSecretChange(e.target.value)}
              className="w-full rounded-md border border-cyan-500/30 bg-cyan-500/5 p-2 font-mono text-xs text-cyan-300 outline-none focus:ring-1 focus:ring-cyan-500/50"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    );
  }

  if (active === "aes") {
    const currentState = aesStates[aesStateIndex];
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            AES-128 Input
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
              Plaintext (16 bytes hex)
            </label>
            <input
              type="text"
              value={aesPlaintextHex}
              onChange={(e) => onAesPlaintextChange(e.target.value)}
              className="w-full rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 font-mono text-xs text-yellow-300 outline-none focus:ring-1 focus:ring-yellow-500/50"
              placeholder="00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Key (16 bytes hex)
            </label>
            <input
              type="text"
              value={aesKeyHex}
              onChange={(e) => onAesKeyChange(e.target.value)}
              className="w-full rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 font-mono text-xs text-emerald-300 outline-none focus:ring-1 focus:ring-emerald-500/50"
              placeholder="2b 7e 15 16 28 ae d2 a6 ab f7 15 88 09 cf 4f 3c"
              spellCheck={false}
            />
          </div>

          {/* AES algorithm reference */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              AES-128 Structure
            </h4>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p>10 rounds, each consisting of:</p>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#facc15" }} />
                <span><strong>SubBytes</strong> — S-box substitution (confusion)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#fb923c" }} />
                <span><strong>ShiftRows</strong> — row rotation (diffusion)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#60a5fa" }} />
                <span><strong>MixColumns</strong> — column mixing (diffusion)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "#4ade80" }} />
                <span><strong>AddRoundKey</strong> — XOR with round key</span>
              </div>
              <p className="mt-1 text-[10px] text-foreground-subtle">
                Round 10 omits MixColumns.
              </p>
            </div>
          </div>

          {currentState && (
            <div className="rounded-lg border border-border bg-elevated p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Current State
              </h4>
              <p className="text-[11px] text-foreground-muted">
                Round {currentState.round}, {currentState.subStep}
              </p>
              <p className="mt-1 text-[10px] text-foreground-subtle">
                State {aesStateIndex + 1} of {aesStates.length}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (active === "https-flow") {
    const currentStep = httpsSteps[httpsStepIndex];
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            HTTPS Flow Config
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
              Domain
            </label>
            <input
              type="text"
              value={httpsDomain}
              onChange={(e) => onHttpsDomainChange(e.target.value)}
              className="w-full rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 font-mono text-xs text-yellow-300 outline-none focus:ring-1 focus:ring-yellow-500/50"
              placeholder="api.example.com"
              spellCheck={false}
            />
          </div>

          {currentStep && (
            <div className="rounded-lg border border-border bg-elevated p-3">
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Current Phase
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ background: HTTPS_PHASE_COLORS[currentStep.phase] }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: HTTPS_PHASE_COLORS[currentStep.phase] }}
                >
                  {HTTPS_PHASE_LABELS[currentStep.phase]}
                </span>
              </div>
              <p className="text-[11px] text-foreground-muted">{currentStep.description}</p>
              <div className="mt-2 space-y-0.5">
                {Object.entries(currentStep.details).map(([k, v]) => (
                  <div key={k} className="font-mono text-[10px]">
                    <span className="text-cyan-400">{k}</span>
                    <span className="text-foreground-subtle">: </span>
                    <span className="text-foreground-muted">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-foreground-subtle">
                Step {httpsStepIndex + 1} of {httpsSteps.length}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              HTTPS Lifecycle
            </h4>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p>A full HTTPS request involves:</p>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: HTTPS_PHASE_COLORS.dns }} />
                <span><strong>DNS</strong> — resolve domain to IP (~50ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: HTTPS_PHASE_COLORS.tcp }} />
                <span><strong>TCP</strong> — 3-way handshake (~0.5ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: HTTPS_PHASE_COLORS.tls }} />
                <span><strong>TLS</strong> — 1.3 handshake, 1-RTT (~1ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: HTTPS_PHASE_COLORS["http-request"] }} />
                <span><strong>HTTP Request</strong> — encrypted payload</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: HTTPS_PHASE_COLORS["http-response"] }} />
                <span><strong>HTTP Response</strong> — server processing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: HTTPS_PHASE_COLORS.close }} />
                <span><strong>Close</strong> — 4-way FIN teardown</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (active === "cors") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            CORS Configuration
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Request Origin
            </label>
            <input
              type="text"
              value={corsConfig.origin}
              onChange={(e) => onCorsOriginChange(e.target.value)}
              className="w-full rounded-md border border-blue-500/30 bg-blue-500/5 p-2 font-mono text-xs text-blue-300 outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="https://app.example.com"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-purple-400">
              Target Origin
            </label>
            <input
              type="text"
              value={corsConfig.targetOrigin}
              onChange={(e) => onCorsTargetChange(e.target.value)}
              className="w-full rounded-md border border-purple-500/30 bg-purple-500/5 p-2 font-mono text-xs text-purple-300 outline-none focus:ring-1 focus:ring-purple-500/50"
              placeholder="https://api.example.com"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              HTTP Method
            </label>
            <select
              value={corsConfig.method}
              onChange={(e) => onCorsMethodChange(e.target.value)}
              className="w-full rounded-md border border-orange-500/30 bg-orange-500/5 p-2 font-mono text-xs text-orange-300 outline-none focus:ring-1 focus:ring-orange-500/50"
            >
              {["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].map((m) => (
                <option key={m} value={m} className="bg-background text-foreground">
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Custom Headers
            </label>
            <div className="space-y-1">
              {["Authorization", "Content-Type", "X-Custom-Header", "X-Request-ID"].map((h) => (
                <label key={h} className="flex items-center gap-2 text-xs text-foreground-muted">
                  <input
                    type="checkbox"
                    checked={corsConfig.headers.includes(h)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onCorsHeadersChange([...corsConfig.headers, h]);
                      } else {
                        onCorsHeadersChange(corsConfig.headers.filter((x) => x !== h));
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="font-mono text-[11px]">{h}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-foreground-muted">
              <input
                type="checkbox"
                checked={corsConfig.credentials}
                onChange={(e) => onCorsCredentialsChange(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
                Include Credentials
              </span>
            </label>
            <p className="mt-1 text-[10px] text-foreground-subtle">
              Send cookies and Authorization headers with the request.
            </p>
          </div>

          {/* Result summary */}
          <div className={cn(
            "rounded-lg border p-3",
            corsSteps.every((s) => s.success)
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5",
          )}>
            <h4 className={cn(
              "mb-1 text-[10px] font-semibold uppercase tracking-wider",
              corsSteps.every((s) => s.success) ? "text-green-400" : "text-red-400",
            )}>
              Result
            </h4>
            <p className={cn(
              "text-xs",
              corsSteps.every((s) => s.success) ? "text-green-300" : "text-red-300",
            )}>
              {corsSteps.every((s) => s.success)
                ? "Request allowed. All CORS checks passed."
                : "Request blocked. CORS policy violation detected."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Certificate Chain
  if (active === "cert-chain") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Chain Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Scenario: {CERT_SCENARIO_LABELS[certScenario]}
            </h4>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {certScenario === "valid"
                ? "A valid certificate chain where all certificates are current and properly signed. The browser follows the chain from server cert up to a trusted root CA."
                : certScenario === "expired"
                  ? "The server certificate has expired. Browsers reject expired certificates because the CA can no longer vouch for the domain's identity."
                  : "The server certificate has been revoked by its issuing CA. This typically happens after a key compromise or domain ownership change."}
            </p>
          </div>

          {/* Chain summary */}
          <div className="rounded-lg border border-border bg-elevated p-3 space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Certificates in Chain
            </h4>
            {certSteps.map((step, i) => {
              const level = certLevel(step);
              const color = CERT_CHAIN_COLORS[level];
              return (
                <div key={`sec-${i}`} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[11px] font-mono text-foreground-muted truncate">
                    {step.cert.subject}
                  </span>
                  {step.valid ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-green-400" />
                  ) : (
                    <XCircle className="h-3 w-3 shrink-0 text-red-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Key concepts */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Key Concepts
            </h4>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p><strong className="text-foreground">Trust Store:</strong> The OS/browser ships with a list of ~150 trusted root CAs.</p>
              <p><strong className="text-foreground">Chain of Trust:</strong> Each cert is signed by the one above it. If any link breaks, the whole chain is invalid.</p>
              <p><strong className="text-foreground">CRL/OCSP:</strong> Mechanisms to check if a certificate has been revoked before it expires.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password Hashing
  if (active === "password-hashing") {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Hashing Config
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-red-400">
              Password
            </label>
            <input
              type="text"
              value={hashPassword}
              onChange={(e) => onHashPasswordChange(e.target.value || "password123")}
              className="w-full rounded-md border border-red-500/30 bg-red-500/5 p-2 font-mono text-xs text-red-300 outline-none focus:ring-1 focus:ring-red-500/50"
              placeholder="Enter a password..."
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-violet-400">
              Cost Factor (2^n rounds)
            </label>
            <input
              type="range"
              min={4}
              max={12}
              value={hashCostFactor}
              onChange={(e) => onHashCostFactorChange(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-foreground-subtle">
              <span>4 (fast)</span>
              <span className="font-semibold text-violet-400">{hashCostFactor}</span>
              <span>12 (slow)</span>
            </div>
            <p className="mt-1 text-[10px] text-foreground-subtle">
              2^{hashCostFactor} = {Math.pow(2, hashCostFactor).toLocaleString()} rounds
            </p>
          </div>

          {/* Timing estimates */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Estimated Hash Time
            </h4>
            <div className="space-y-1 text-[11px]">
              {[
                { cost: 4, time: "~1 ms" },
                { cost: 8, time: "~15 ms" },
                { cost: 10, time: "~100 ms" },
                { cost: 12, time: "~400 ms" },
              ].map((row) => (
                <div
                  key={row.cost}
                  className={cn(
                    "flex justify-between font-mono",
                    row.cost === hashCostFactor
                      ? "font-semibold text-violet-400"
                      : "text-foreground-subtle",
                  )}
                >
                  <span>Cost {row.cost}</span>
                  <span>{row.time}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-foreground-subtle">
              Each +1 cost DOUBLES the time. OWASP recommends cost 10+ for production.
            </p>
          </div>

          {/* Steps summary */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Pipeline Steps
            </h4>
            <div className="space-y-1">
              {hashSteps.map((step, i) => {
                const color = getHashStepColor(step.step);
                return (
                  <div key={`sec-${i}`} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[11px] text-foreground-muted truncate">
                      {step.step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rate Limiting
  if (active === "rate-limiting") {
    const tbAllowed = rlTokenBucketSteps.filter((s) => s.allowed).length;
    const swAllowed = rlSlidingWindowSteps.filter((s) => s.allowed).length;
    const lbAllowed = rlLeakyBucketSteps.filter((s) => s.allowed).length;
    const total = rlTokenBucketSteps.length;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Rate Limiter Config
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Token Bucket params */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Token Bucket
            </h4>
            <div className="space-y-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-foreground-muted">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rlCapacity}
                  onChange={(e) => onRlCapacityChange(Number(e.target.value) || 5)}
                  className="w-full rounded border border-blue-500/30 bg-blue-500/5 px-2 py-1 font-mono text-xs text-blue-300 outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-foreground-muted">Refill Rate (/tick)</label>
                <input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={rlRefillRate}
                  onChange={(e) => onRlRefillRateChange(Number(e.target.value) || 0.5)}
                  className="w-full rounded border border-blue-500/30 bg-blue-500/5 px-2 py-1 font-mono text-xs text-blue-300 outline-none"
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-foreground-subtle">
              Passed: {tbAllowed}/{total}
            </p>
          </div>

          {/* Sliding Window params */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-purple-400">
              Sliding Window
            </h4>
            <div className="space-y-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-foreground-muted">Window Size (ticks)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={rlWindowSize}
                  onChange={(e) => onRlWindowSizeChange(Number(e.target.value) || 10)}
                  className="w-full rounded border border-purple-500/30 bg-purple-500/5 px-2 py-1 font-mono text-xs text-purple-300 outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-foreground-muted">Max Requests / Window</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rlMaxRequests}
                  onChange={(e) => onRlMaxRequestsChange(Number(e.target.value) || 5)}
                  className="w-full rounded border border-purple-500/30 bg-purple-500/5 px-2 py-1 font-mono text-xs text-purple-300 outline-none"
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-foreground-subtle">
              Passed: {swAllowed}/{total}
            </p>
          </div>

          {/* Leaky Bucket params */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Leaky Bucket
            </h4>
            <div className="space-y-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-foreground-muted">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rlCapacity}
                  onChange={(e) => onRlCapacityChange(Number(e.target.value) || 5)}
                  className="w-full rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 font-mono text-xs text-amber-300 outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-foreground-muted">Leak Rate (/tick)</label>
                <input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={rlLeakRate}
                  onChange={(e) => onRlLeakRateChange(Number(e.target.value) || 0.5)}
                  className="w-full rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1 font-mono text-xs text-amber-300 outline-none"
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-foreground-subtle">
              Passed: {lbAllowed}/{total}
            </p>
          </div>

          {/* Algorithm comparison */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Key Differences
            </h4>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p><strong className="text-blue-400">Token Bucket:</strong> Allows bursts up to capacity, then refills over time. Best for APIs that tolerate short bursts.</p>
              <p><strong className="text-purple-400">Sliding Window:</strong> Strict count within a time window. Prevents any burst beyond the limit. Best for strict rate enforcement.</p>
              <p><strong className="text-amber-400">Leaky Bucket:</strong> Smooths traffic to a constant rate. Queues requests and processes them steadily. Best for consistent throughput.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Web Attacks
  if (active === "web-attacks") {
    const meta = WEB_ATTACK_META[webAttackType];
    const attackOnlySteps = webAttackSteps.filter((s) => s.isAttack);
    const defenseSteps = webAttackSteps.filter((s) => !s.isAttack);
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Attack Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Current attack info */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
              {meta.short}: {meta.name}
            </h4>
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              {webAttackType === "xss" &&
                "Attackers inject malicious scripts into web pages viewed by other users. The script executes in the victim's browser with access to cookies, DOM, and session data."}
              {webAttackType === "csrf" &&
                "Attackers trick authenticated users into submitting requests they didn't intend. The browser automatically attaches cookies to cross-site requests."}
              {webAttackType === "sql-injection" &&
                "Attackers manipulate SQL queries by injecting code through user input fields, potentially bypassing authentication or exfiltrating data."}
            </p>
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Step Breakdown
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-red-400">Attack steps</span>
                <span className="font-mono text-red-400">{attackOnlySteps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Defense steps</span>
                <span className="font-mono text-green-400">{defenseSteps.length}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className="text-foreground-muted">Mode</span>
                <span className={cn(
                  "font-mono font-semibold",
                  webAttackDefenseMode ? "text-green-400" : "text-red-400",
                )}>
                  {webAttackDefenseMode ? "WITH defense" : "WITHOUT defense"}
                </span>
              </div>
            </div>
          </div>

          {/* Defense techniques */}
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-green-400">
              Defenses
            </h4>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              {webAttackType === "xss" && (
                <>
                  <p><strong className="text-green-400">Output Encoding:</strong> HTML-encode user input before rendering (&lt; &gt; &amp; &quot;).</p>
                  <p><strong className="text-green-400">DOMPurify:</strong> Sanitise HTML to remove dangerous tags and attributes.</p>
                  <p><strong className="text-green-400">CSP:</strong> Content-Security-Policy header blocks inline scripts.</p>
                </>
              )}
              {webAttackType === "csrf" && (
                <>
                  <p><strong className="text-green-400">CSRF Token:</strong> Include a unique, unpredictable token in every state-changing form.</p>
                  <p><strong className="text-green-400">SameSite Cookie:</strong> Set SameSite=Strict or Lax to prevent cross-origin cookie sending.</p>
                  <p><strong className="text-green-400">Origin Check:</strong> Validate Referer/Origin headers on the server.</p>
                </>
              )}
              {webAttackType === "sql-injection" && (
                <>
                  <p><strong className="text-green-400">Prepared Statements:</strong> Use parameterised queries ($1, $2) instead of string concatenation.</p>
                  <p><strong className="text-green-400">Input Validation:</strong> Whitelist allowed characters and reject unexpected input.</p>
                  <p><strong className="text-green-400">Least Privilege:</strong> DB connections should use accounts with minimal permissions.</p>
                </>
              )}
            </div>
          </div>

          {/* Payloads */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Key Payloads
            </h4>
            <div className="space-y-2">
              {webAttackSteps.filter((s) => s.payload).slice(0, 3).map((step, i) => (
                <div key={`sec-${i}`}>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase",
                    step.isAttack ? "text-red-400" : "text-green-400",
                  )}>
                    {step.actor}: {step.action}
                  </span>
                  <pre className="mt-0.5 overflow-auto whitespace-pre-wrap rounded border border-border/50 bg-background/50 px-1.5 py-1 font-mono text-[9px] text-foreground-subtle">
                    {step.payload!.slice(0, 120)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Encryption Comparison
  if (active === "encryption") {
    const allModes: { mode: EncryptionMode; label: string; steps: EncryptionStep[]; color: string; pros: string; cons: string; useCase: string }[] = [
      {
        mode: "symmetric",
        label: "Symmetric (AES)",
        steps: encSymmetricSteps,
        color: ENCRYPTION_COLORS.symmetric,
        pros: "Extremely fast encryption/decryption. Low computational overhead.",
        cons: "Key distribution problem: both parties need the same key, shared securely.",
        useCase: "Bulk data encryption, disk encryption, VPN tunnels.",
      },
      {
        mode: "asymmetric",
        label: "Asymmetric (RSA)",
        steps: encAsymmetricSteps,
        color: ENCRYPTION_COLORS.asymmetric,
        pros: "No key distribution problem. Public key can be freely shared.",
        cons: "~1000x slower than AES. Not suitable for large data.",
        useCase: "Digital signatures, key exchange, email encryption (PGP).",
      },
      {
        mode: "hybrid",
        label: "Hybrid (TLS)",
        steps: encHybridSteps,
        color: ENCRYPTION_COLORS.hybrid,
        pros: "Combines the security of RSA with the speed of AES.",
        cons: "More complex protocol. Requires proper implementation.",
        useCase: "HTTPS/TLS, SSH, most real-world secure protocols.",
      },
    ];

    const currentSteps = [encSymmetricSteps, encAsymmetricSteps, encHybridSteps];
    const currentStep = currentSteps.map((s) => s.find((st) => st.tick === encryptionStepIndex));

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Encryption Details
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Current step detail */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Step {encryptionStepIndex + 1}
            </h4>
            {currentStep.map((step, i) => {
              if (!step) return null;
              const m = allModes[i];
              return (
                <div key={m.mode} className="mb-2 rounded border px-2 py-1.5" style={{ borderColor: `${m.color}30` }}>
                  <span className="text-[10px] font-semibold" style={{ color: m.color }}>
                    {m.label}
                  </span>
                  <span className="ml-2 text-[10px] text-foreground-subtle">
                    {step.phase} ({step.actor})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mode comparison */}
          {allModes.map((m) => (
            <div
              key={m.mode}
              className="rounded-lg border p-3"
              style={{ borderColor: `${m.color}30`, background: `${m.color}05` }}
            >
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: m.color }}>
                {m.label}
              </h4>
              <div className="space-y-1 text-[11px] text-foreground-muted">
                <p><strong className="text-green-400">Pros:</strong> {m.pros}</p>
                <p><strong className="text-red-400">Cons:</strong> {m.cons}</p>
                <p><strong className="text-foreground-subtle">Use case:</strong> {m.useCase}</p>
              </div>
              <p className="mt-1 text-[10px] text-foreground-subtle">
                Steps: {m.steps.length}
              </p>
            </div>
          ))}

          {/* Why hybrid wins */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Why TLS Uses Hybrid Encryption
            </h4>
            <div className="space-y-1.5 text-[11px] text-foreground-muted">
              <p><strong className="text-emerald-400">1.</strong> RSA provides the trust bootstrap: public key solves key distribution.</p>
              <p><strong className="text-emerald-400">2.</strong> RSA only encrypts the tiny session key (~32 bytes), so slowness is negligible.</p>
              <p><strong className="text-emerald-400">3.</strong> AES handles all bulk data at hardware-accelerated speed.</p>
              <p><strong className="text-emerald-400">4.</strong> Session keys are ephemeral: compromising one does not compromise past sessions (forward secrecy).</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Diffie-Hellman
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          DH Parameters
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
            Prime (p)
          </label>
          <input
            type="number"
            value={dhP}
            onChange={(e) => onDhPChange(Number(e.target.value) || 23)}
            className="w-full rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 font-mono text-xs text-yellow-300 outline-none focus:ring-1 focus:ring-yellow-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
            Generator (g)
          </label>
          <input
            type="number"
            value={dhG}
            onChange={(e) => onDhGChange(Number(e.target.value) || 5)}
            className="w-full rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 font-mono text-xs text-yellow-300 outline-none focus:ring-1 focus:ring-yellow-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-pink-400">
            Alice&apos;s private key (a)
          </label>
          <input
            type="number"
            value={dhA}
            onChange={(e) => onDhAChange(Number(e.target.value) || 4)}
            className="w-full rounded-md border border-pink-500/30 bg-pink-500/5 p-2 font-mono text-xs text-pink-300 outline-none focus:ring-1 focus:ring-pink-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            Bob&apos;s private key (b)
          </label>
          <input
            type="number"
            value={dhB}
            onChange={(e) => onDhBChange(Number(e.target.value) || 3)}
            className="w-full rounded-md border border-blue-500/30 bg-blue-500/5 p-2 font-mono text-xs text-blue-300 outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Paint analogy legend */}
        <div className="rounded-lg border border-border bg-elevated p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Paint Mixing Analogy
          </h4>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-3 w-3 shrink-0 rounded" style={{ background: PAINT_COLORS.common }} />
              <span className="text-foreground-muted">{PAINT_ANALOGY.publicParams}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-3 w-3 shrink-0 rounded" style={{ background: PAINT_COLORS.alice }} />
              <span className="text-foreground-muted">{PAINT_ANALOGY.alicePrivate}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-3 w-3 shrink-0 rounded" style={{ background: PAINT_COLORS.bob }} />
              <span className="text-foreground-muted">{PAINT_ANALOGY.bobPrivate}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-3 w-3 shrink-0 rounded" style={{ background: PAINT_COLORS.shared }} />
              <span className="text-foreground-muted">{PAINT_ANALOGY.sharedSecret}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Bottom Panel ───────────────────────────────────────────

const SecurityBottomPanel = memo(function SecurityBottomPanel({
  active,
  oauthSteps,
  oauthStepIndex,
  dhResult,
  dhStepIndex,
  jwtSubView,
  attackSteps,
  attackStepIndex,
  aesStates,
  aesStateIndex,
  httpsSteps,
  httpsStepIndex,
  corsSteps,
  certSteps,
  hashSteps,
  rlTokenBucketSteps,
  rlSlidingWindowSteps,
  rlLeakyBucketSteps,
  webAttackSteps,
  webAttackDefenseMode,
  encSymmetricSteps,
  encAsymmetricSteps,
  encHybridSteps,
  encryptionStepIndex,
}: {
  active: SecurityTopic;
  oauthSteps: OAuthStep[];
  oauthStepIndex: number;
  dhResult: DHResult;
  dhStepIndex: number;
  jwtSubView: JWTSubView;
  attackSteps: JWTAttackStep[];
  attackStepIndex: number;
  aesStates: AESState[];
  aesStateIndex: number;
  httpsSteps: HTTPSStep[];
  httpsStepIndex: number;
  corsSteps: CORSStep[];
  certSteps: CertChainStep[];
  hashSteps: HashingStep[];
  rlTokenBucketSteps: RateLimitStep[];
  rlSlidingWindowSteps: RateLimitStep[];
  rlLeakyBucketSteps: RateLimitStep[];
  webAttackSteps: WebAttackStep[];
  webAttackDefenseMode: boolean;
  encSymmetricSteps: EncryptionStep[];
  encAsymmetricSteps: EncryptionStep[];
  encHybridSteps: EncryptionStep[];
  encryptionStepIndex: number;
}) {
  if (active === "oauth") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            OAuth Flow Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 font-mono text-xs">
          {oauthSteps.slice(0, oauthStepIndex + 1).map((step, i) => (
            <div
              key={`sec-${i}`}
              className={cn(
                "flex items-start gap-2 py-0.5",
                i === oauthStepIndex ? "text-primary" : "text-foreground-muted",
              )}
            >
              <span className="shrink-0 text-foreground-subtle">[{i + 1}]</span>
              <span className="font-semibold">{step.actor}:</span>
              <span>{step.action}</span>
              {step.httpMethod && (
                <span className="text-purple-400">[{step.httpMethod}]</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "jwt") {
    if (jwtSubView === "attacks") {
      return (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Attack Log
            </span>
          </div>
          <div className="flex-1 overflow-auto px-4 py-2 text-xs">
            {attackSteps.slice(0, attackStepIndex + 1).map((step, i) => (
              <div
                key={`sec-${i}`}
                className={cn(
                  "flex items-start gap-2 py-1 border-b border-border/50 last:border-0",
                  i === attackStepIndex ? "text-foreground" : "text-foreground-muted",
                )}
              >
                <span className="shrink-0 text-foreground-subtle">[{i + 1}]</span>
                <span>{step.description}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            JWT Info
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs text-foreground-muted">
          <p className="mb-2">
            <strong className="text-foreground">Structure:</strong> A JWT consists of three
            base64url-encoded parts separated by dots: <span className="text-rose-400">Header</span>.<span className="text-purple-400">Payload</span>.<span className="text-cyan-400">Signature</span>
          </p>
          <p className="mb-2">
            <strong className="text-foreground">Signing:</strong> The signature is computed as HMAC-SHA256(
            base64url(header) + &quot;.&quot; + base64url(payload), secret). This ensures the token has not
            been tampered with.
          </p>
          <p>
            <strong className="text-foreground">Claims:</strong> Standard claims include{" "}
            <code className="text-purple-400">sub</code> (subject),{" "}
            <code className="text-purple-400">exp</code> (expiration),{" "}
            <code className="text-purple-400">iat</code> (issued at),{" "}
            <code className="text-purple-400">iss</code> (issuer),{" "}
            <code className="text-purple-400">aud</code> (audience).
          </p>
        </div>
      </div>
    );
  }

  if (active === "aes") {
    const currentState = aesStates[aesStateIndex];
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            AES Round Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 font-mono text-xs">
          {aesStates.slice(0, aesStateIndex + 1).map((state, i) => (
            <div
              key={`sec-${i}`}
              className={cn(
                "flex items-start gap-2 py-0.5",
                i === aesStateIndex ? "text-primary" : "text-foreground-muted",
              )}
            >
              <span className="shrink-0 text-foreground-subtle">[R{state.round}]</span>
              <span
                className="font-semibold"
                style={{ color: i === aesStateIndex ? AES_STEP_COLORS[state.subStep] : undefined }}
              >
                {state.subStep}
              </span>
              {currentState && i === aesStateIndex && (
                <span className="text-foreground-subtle">
                  — {state.description.split(".")[0]}.
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "https-flow") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Globe className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            HTTPS Flow Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 font-mono text-xs">
          {httpsSteps.slice(0, httpsStepIndex + 1).map((step, i) => (
            <div
              key={`sec-${i}`}
              className={cn(
                "flex items-start gap-2 py-0.5",
                i === httpsStepIndex ? "text-primary" : "text-foreground-muted",
              )}
            >
              <span className="shrink-0 text-foreground-subtle">[{i + 1}]</span>
              <span
                className="font-semibold"
                style={{ color: i === httpsStepIndex ? HTTPS_PHASE_COLORS[step.phase] : undefined }}
              >
                {HTTPS_PHASE_LABELS[step.phase]}
              </span>
              <span>{step.description.split(".")[0]}.</span>
              <span className="text-foreground-subtle">
                ({step.timing.toFixed(1)} ms)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "cors") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Globe className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            CORS Decision Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs">
          {corsSteps.map((step, i) => (
            <div
              key={`sec-${i}`}
              className={cn(
                "flex items-start gap-2 py-1 border-b border-border/50 last:border-0",
              )}
            >
              <span className="shrink-0">
                {step.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
              </span>
              <span
                className={cn(
                  "font-semibold font-mono text-[10px] uppercase",
                )}
                style={{ color: CORS_STEP_COLORS[step.type] }}
              >
                {step.type}
              </span>
              <span className="text-foreground-muted">{step.description.split(".")[0]}.</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "cert-chain") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Shield className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Certificate Chain Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs">
          {certSteps.map((step, i) => (
            <div
              key={`sec-${i}`}
              className="flex items-start gap-2 py-1 border-b border-border/50 last:border-0"
            >
              <span className="shrink-0">
                {step.valid ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
              </span>
              <span className={cn(
                "font-semibold font-mono text-[10px]",
                step.valid ? "text-foreground" : "text-red-400",
              )}>
                {step.cert.subject}
              </span>
              <span className="text-foreground-muted">{step.step.split(".")[0]}.</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "password-hashing") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Key className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Hashing Pipeline Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs">
          {hashSteps.map((step, i) => {
            const color = getHashStepColor(step.step);
            return (
              <div
                key={`sec-${i}`}
                className="flex items-start gap-2 py-1 border-b border-border/50 last:border-0"
              >
                <span className="shrink-0 text-foreground-subtle">[{i + 1}]</span>
                <span
                  className="font-semibold font-mono text-[10px] uppercase shrink-0"
                  style={{ color }}
                >
                  {step.step}
                </span>
                <span className="text-foreground-muted truncate">{step.data}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (active === "rate-limiting") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Shield className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Rate Limiting Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs">
          {[rlTokenBucketSteps, rlSlidingWindowSteps, rlLeakyBucketSteps].map((steps, algoIdx) => {
            const algoName = ["Token Bucket", "Sliding Window", "Leaky Bucket"][algoIdx];
            const color = RATE_LIMIT_COLORS[algoName];
            return (
              <div key={algoIdx} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                    {algoName}
                  </span>
                  <span className="text-[10px] text-foreground-subtle">
                    ({steps.filter((s) => s.allowed).length}/{steps.length} allowed)
                  </span>
                </div>
                {steps.map((step, i) => (
                  <div
                    key={`sec-${i}`}
                    className="flex items-start gap-2 py-0.5 pl-4"
                  >
                    <span className="shrink-0 text-foreground-subtle">[{step.request}]</span>
                    <span className="shrink-0">
                      {step.allowed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                    </span>
                    <span className="text-foreground-muted truncate">{step.description}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (active === "web-attacks") {
    const visibleSteps = webAttackDefenseMode
      ? webAttackSteps
      : webAttackSteps.filter((s) => s.isAttack);
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Web Attack Log
          </span>
          <span className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold",
            webAttackDefenseMode
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400",
          )}>
            {webAttackDefenseMode ? "DEFENSE ON" : "DEFENSE OFF"}
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs">
          {visibleSteps.map((step, i) => (
            <div
              key={`sec-${i}`}
              className="flex items-start gap-2 py-1 border-b border-border/50 last:border-0"
            >
              <span className="shrink-0 text-foreground-subtle">[{step.tick}]</span>
              <span className="shrink-0">
                {step.isAttack ? (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                )}
              </span>
              <span className={cn(
                "font-semibold text-[10px] uppercase shrink-0",
                step.isAttack ? "text-red-400" : "text-green-400",
              )}>
                {step.actor}
              </span>
              <span className="text-foreground-muted">{step.action}</span>
              {step.defense && (
                <span className="text-green-400/70 text-[10px]">[{step.defense}]</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Encryption Comparison
  if (active === "encryption") {
    const allSets: { label: string; steps: EncryptionStep[]; color: string }[] = [
      { label: "Symmetric (AES)", steps: encSymmetricSteps, color: ENCRYPTION_COLORS.symmetric },
      { label: "Asymmetric (RSA)", steps: encAsymmetricSteps, color: ENCRYPTION_COLORS.asymmetric },
      { label: "Hybrid (TLS)", steps: encHybridSteps, color: ENCRYPTION_COLORS.hybrid },
    ];
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Lock className="h-3.5 w-3.5 text-foreground-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Encryption Flow Log
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-2 text-xs">
          {allSets.map((set) => {
            const visible = set.steps.filter((s) => s.tick <= encryptionStepIndex);
            return (
              <div key={set.label} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: set.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: set.color }}>
                    {set.label}
                  </span>
                  <span className="text-[10px] text-foreground-subtle">
                    ({visible.length}/{set.steps.length} steps shown)
                  </span>
                </div>
                {visible.map((step) => {
                  const isCurrent = step.tick === encryptionStepIndex;
                  const actorColor = ENCRYPTION_ACTOR_COLORS[step.actor] ?? "#94a3b8";
                  return (
                    <div
                      key={step.tick}
                      className={cn(
                        "flex items-start gap-2 py-0.5 pl-4",
                        isCurrent ? "text-foreground" : "text-foreground-muted",
                      )}
                    >
                      <span className="shrink-0 text-foreground-subtle">[{step.tick + 1}]</span>
                      <span className="shrink-0 font-semibold text-[10px]" style={{ color: actorColor }}>
                        {step.actor}
                      </span>
                      <span className="text-foreground-muted">{step.phase}</span>
                      {step.encrypted && (
                        <Lock className="h-3 w-3 shrink-0 text-red-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Diffie-Hellman
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          DH Exchange Log
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-2 font-mono text-xs">
        {dhResult.steps.slice(0, dhStepIndex + 1).map((step, i) => (
          <div
            key={`sec-${i}`}
            className={cn(
              "flex items-start gap-2 py-0.5",
              i === dhStepIndex ? "text-primary" : "text-foreground-muted",
            )}
          >
            <span className="shrink-0 text-foreground-subtle">[{i + 1}]</span>
            <span className="font-semibold">{step.actor}:</span>
            <span>{step.computation}</span>
            {step.result !== 0 && (
              <span className="text-green-400">= {step.result}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Main Hook ──────────────────────────────────────────────

export function useSecurityModule() {
  const [active, setActive] = useState<SecurityTopic>("oauth");
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // OAuth state
  const [oauthFlow, setOauthFlow] = useState<OAuthFlowType>("auth-code-pkce");
  const oauthSteps = useMemo<OAuthStep[]>(() => {
    if (oauthFlow === "auth-code-pkce") {
      return simulateAuthCodePKCE(
        "my-app-client-id",
        "https://myapp.example.com/callback",
        ["openid", "profile", "email"],
      );
    }
    if (oauthFlow === "device-auth") {
      return simulateDeviceAuth();
    }
    return simulateClientCredentials();
  }, [oauthFlow]);

  // JWT state
  const [headerJson, setHeaderJson] = useState(
    JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2),
  );
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify(
      {
        sub: "user-12345",
        iss: "https://auth.example.com",
        aud: "https://api.example.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        name: "Jane Developer",
        role: "admin",
      },
      null,
      2,
    ),
  );
  const [secret, setSecret] = useState("your-256-bit-secret");

  // JWT attack state
  const [jwtSubView, setJwtSubView] = useState<JWTSubView>("lifecycle");
  const [attackType, setAttackType] = useState<JWTAttackType>("none-algorithm");
  const [attackStepIndex, setAttackStepIndex] = useState(0);
  const attackSteps = useMemo(() => getAttackSteps(attackType), [attackType]);

  // DH state
  const [dhP, setDhP] = useState(23);
  const [dhG, setDhG] = useState(5);
  const [dhA, setDhA] = useState(4);
  const [dhB, setDhB] = useState(3);
  const dhResult = useMemo<DHResult>(
    () => simulateDH(dhP, dhG, dhA, dhB),
    [dhP, dhG, dhA, dhB],
  );

  // AES state
  const [aesPlaintextHex, setAesPlaintextHex] = useState(
    "00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff",
  );
  const [aesKeyHex, setAesKeyHex] = useState(
    "2b 7e 15 16 28 ae d2 a6 ab f7 15 88 09 cf 4f 3c",
  );
  const [aesStateIndex, setAesStateIndex] = useState(0);
  const aesStates = useMemo<AESState[]>(() => {
    const pt = parseHex(aesPlaintextHex);
    const k = parseHex(aesKeyHex);
    return aesEncrypt(pt, k);
  }, [aesPlaintextHex, aesKeyHex]);

  // HTTPS Flow state
  const [httpsDomain, setHttpsDomain] = useState("api.example.com");
  const [httpsExpandedPhase, setHttpsExpandedPhase] = useState<string | null>(null);
  const httpsSteps = useMemo<HTTPSStep[]>(
    () => simulateHTTPSFlow(httpsDomain),
    [httpsDomain],
  );

  // CORS state
  const [corsOrigin, setCorsOrigin] = useState("https://app.example.com");
  const [corsTarget, setCorsTarget] = useState("https://api.example.com");
  const [corsMethod, setCorsMethod] = useState("PUT");
  const [corsHeaders, setCorsHeaders] = useState<string[]>(["Content-Type", "Authorization"]);
  const [corsCredentials, setCorsCredentials] = useState(true);

  const corsConfig = useMemo<CORSConfig>(() => ({
    origin: corsOrigin,
    targetOrigin: corsTarget,
    method: corsMethod,
    headers: corsHeaders,
    credentials: corsCredentials,
  }), [corsOrigin, corsTarget, corsMethod, corsHeaders, corsCredentials]);

  const corsSteps = useMemo<CORSStep[]>(() => {
    return simulateCORS(corsConfig, {
      allowedOrigins: ["https://app.example.com"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      allowCredentials: true,
      maxAge: 86400,
    });
  }, [corsConfig]);

  // Certificate Chain state
  const [certScenario, setCertScenario] = useState<CertScenario>("valid");
  const certSteps = useMemo<CertChainStep[]>(
    () => simulateCertificateChain(certScenario),
    [certScenario],
  );

  // Password Hashing state
  const [hashPassword, setHashPassword] = useState("password123");
  const [hashCostFactor, setHashCostFactor] = useState(10);
  const [showRainbow, setShowRainbow] = useState(false);
  const hashSteps = useMemo<HashingStep[]>(
    () => demonstrateBcrypt(hashPassword, hashCostFactor),
    [hashPassword, hashCostFactor],
  );

  // Rate Limiting state
  const [rlCapacity, setRlCapacity] = useState(5);
  const [rlRefillRate, setRlRefillRate] = useState(0.5);
  const [rlWindowSize, setRlWindowSize] = useState(10);
  const [rlMaxRequests, setRlMaxRequests] = useState(5);
  const [rlLeakRate, setRlLeakRate] = useState(0.5);
  const rlRequestPattern = useMemo(() => generateBurstSteadyBurstPattern(), []);
  const rlTokenBucketSteps = useMemo<RateLimitStep[]>(
    () => simulateTokenBucket(rlCapacity, rlRefillRate, rlRequestPattern),
    [rlCapacity, rlRefillRate, rlRequestPattern],
  );
  const rlSlidingWindowSteps = useMemo<RateLimitStep[]>(
    () => simulateSlidingWindow(rlWindowSize, rlMaxRequests, rlRequestPattern),
    [rlWindowSize, rlMaxRequests, rlRequestPattern],
  );
  const rlLeakyBucketSteps = useMemo<RateLimitStep[]>(
    () => simulateLeakyBucket(rlCapacity, rlLeakRate, rlRequestPattern),
    [rlCapacity, rlLeakRate, rlRequestPattern],
  );

  // Web Attacks state
  const [webAttackType, setWebAttackType] = useState<WebAttackType>("xss");
  const [webAttackDefenseMode, setWebAttackDefenseMode] = useState(true);
  const webAttackSteps = useMemo<WebAttackStep[]>(
    () => getWebAttackSteps(webAttackType),
    [webAttackType],
  );

  // Encryption Comparison state
  const [encryptionStepIndex, setEncryptionStepIndex] = useState(0);
  const encSymmetricSteps = useMemo<EncryptionStep[]>(
    () => simulateSymmetricEncryption(),
    [],
  );
  const encAsymmetricSteps = useMemo<EncryptionStep[]>(
    () => simulateAsymmetricEncryption(),
    [],
  );
  const encHybridSteps = useMemo<EncryptionStep[]>(
    () => simulateHybridEncryption(),
    [],
  );
  const encMaxSteps = Math.max(
    encSymmetricSteps.length,
    encAsymmetricSteps.length,
    encHybridSteps.length,
  );

  const handleEncryptionPrev = useCallback(() => {
    setEncryptionStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleEncryptionNext = useCallback(() => {
    setEncryptionStepIndex((prev) => Math.min(prev + 1, encMaxSteps - 1));
  }, [encMaxSteps]);

  const handleWebAttackChange = useCallback((t: WebAttackType) => {
    setWebAttackType(t);
  }, []);

  const handleToggleDefenseMode = useCallback(() => {
    setWebAttackDefenseMode((prev) => !prev);
  }, []);

  const handleToggleRainbow = useCallback(() => {
    setShowRainbow((prev) => !prev);
  }, []);

  const handleCertScenarioChange = useCallback((s: CertScenario) => {
    setCertScenario(s);
  }, []);

  // Total steps for the active topic
  const totalSteps = useMemo(() => {
    if (active === "oauth") return oauthSteps.length;
    if (active === "diffie-hellman") return dhResult.steps.length;
    if (active === "https-flow") return httpsSteps.length;
    return 0;
  }, [active, oauthSteps.length, dhResult.steps.length, httpsSteps.length]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelect = useCallback((t: SecurityTopic) => {
    setActive(t);
    setStepIndex(0);
    setEncryptionStepIndex(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleFlowChange = useCallback((f: OAuthFlowType) => {
    setOauthFlow(f);
    setStepIndex(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleJwtSubViewChange = useCallback((v: JWTSubView) => {
    setJwtSubView(v);
    setAttackStepIndex(0);
  }, []);

  const handleAttackChange = useCallback((t: JWTAttackType) => {
    setAttackType(t);
    setAttackStepIndex(0);
  }, []);

  const handleAttackPrev = useCallback(() => {
    setAttackStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleAttackNext = useCallback(() => {
    setAttackStepIndex((prev) => Math.min(prev + 1, attackSteps.length - 1));
  }, [attackSteps.length]);

  const handleAesPrev = useCallback(() => {
    setAesStateIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleAesNext = useCallback(() => {
    setAesStateIndex((prev) => Math.min(prev + 1, aesStates.length - 1));
  }, [aesStates.length]);

  const handleTogglePhase = useCallback((phase: string) => {
    setHttpsExpandedPhase((prev) => (prev === phase ? null : phase));
  }, []);

  const handleStep = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const handlePlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  }, [totalSteps]);

  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStepIndex(0);
  }, []);

  // Reset AES state index when inputs change
  useEffect(() => {
    setAesStateIndex(0);
  }, [aesPlaintextHex, aesKeyHex]);

  // Build canvas
  const canvas = useMemo(() => {
    switch (active) {
      case "oauth":
        return (
          <OAuthCanvas
            steps={oauthSteps}
            stepIndex={stepIndex}
            flowType={oauthFlow}
          />
        );
      case "jwt":
        if (jwtSubView === "attacks") {
          return (
            <JWTAttacksCanvas
              attackType={attackType}
              onAttackChange={handleAttackChange}
              attackStepIndex={attackStepIndex}
              onAttackPrev={handleAttackPrev}
              onAttackNext={handleAttackNext}
            />
          );
        }
        return (
          <JWTCanvas
            headerJson={headerJson}
            payloadJson={payloadJson}
            secret={secret}
          />
        );
      case "diffie-hellman":
        return (
          <DiffieHellmanCanvas
            dhResult={dhResult}
            stepIndex={stepIndex}
            p={dhP}
            g={dhG}
            a={dhA}
            b={dhB}
          />
        );
      case "aes":
        return (
          <AESCanvas
            states={aesStates}
            stateIndex={aesStateIndex}
            onPrev={handleAesPrev}
            onNext={handleAesNext}
          />
        );
      case "https-flow":
        return (
          <HTTPSFlowCanvas
            steps={httpsSteps}
            stepIndex={stepIndex}
            expandedPhase={httpsExpandedPhase}
            onTogglePhase={handleTogglePhase}
          />
        );
      case "cors":
        return (
          <CORSCanvas
            corsSteps={corsSteps}
            corsConfig={corsConfig}
          />
        );
      case "cert-chain":
        return (
          <CertChainCanvas
            certSteps={certSteps}
            scenario={certScenario}
            onScenarioChange={handleCertScenarioChange}
          />
        );
      case "password-hashing":
        return (
          <PasswordHashingCanvas
            hashSteps={hashSteps}
            password={hashPassword}
            costFactor={hashCostFactor}
            onPasswordChange={setHashPassword}
            onCostFactorChange={setHashCostFactor}
            showRainbow={showRainbow}
            onToggleRainbow={handleToggleRainbow}
          />
        );
      case "rate-limiting":
        return (
          <RateLimitingCanvas
            tokenBucketSteps={rlTokenBucketSteps}
            slidingWindowSteps={rlSlidingWindowSteps}
            leakyBucketSteps={rlLeakyBucketSteps}
            requestPattern={rlRequestPattern}
          />
        );
      case "web-attacks":
        return (
          <WebAttacksCanvas
            webAttackType={webAttackType}
            onWebAttackChange={handleWebAttackChange}
            webAttackDefenseMode={webAttackDefenseMode}
            onToggleDefenseMode={handleToggleDefenseMode}
          />
        );
      case "encryption":
        return (
          <EncryptionCanvas
            symmetricSteps={encSymmetricSteps}
            asymmetricSteps={encAsymmetricSteps}
            hybridSteps={encHybridSteps}
            encryptionStepIndex={encryptionStepIndex}
            onEncryptionPrev={handleEncryptionPrev}
            onEncryptionNext={handleEncryptionNext}
          />
        );
      default:
        return (
          <div className="flex h-full w-full items-center justify-center bg-background p-4">
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-3 h-16 w-16 text-foreground-subtle opacity-30" />
              <p className="text-sm text-foreground-muted">
                Select a security topic to visualize.
              </p>
            </div>
          </div>
        );
    }
  }, [
    active, oauthSteps, stepIndex, oauthFlow, headerJson, payloadJson, secret,
    dhResult, dhP, dhG, dhA, dhB, jwtSubView, attackType, attackStepIndex,
    handleAttackChange, handleAttackPrev, handleAttackNext,
    aesStates, aesStateIndex, handleAesPrev, handleAesNext,
    httpsSteps, httpsExpandedPhase, handleTogglePhase,
    corsSteps, corsConfig,
    certSteps, certScenario, handleCertScenarioChange,
    hashSteps, hashPassword, hashCostFactor, showRainbow, handleToggleRainbow,
    rlTokenBucketSteps, rlSlidingWindowSteps, rlLeakyBucketSteps, rlRequestPattern,
    webAttackType, webAttackDefenseMode, handleWebAttackChange, handleToggleDefenseMode,
    encSymmetricSteps, encAsymmetricSteps, encHybridSteps,
    encryptionStepIndex, handleEncryptionPrev, handleEncryptionNext,
  ]);

  const securityPropsCtx = useMemo<SecurityPropertiesContextValue>(() => ({
    active,
    oauthSteps,
    stepIndex,
    oauthFlow,
    headerJson,
    payloadJson,
    secret,
    onHeaderChange: setHeaderJson,
    onPayloadChange: setPayloadJson,
    onSecretChange: setSecret,
    jwtSubView,
    attackType,
    attackSteps,
    attackStepIndex,
    dhResult,
    dhP,
    dhG,
    dhA,
    dhB,
    onDhPChange: setDhP,
    onDhGChange: setDhG,
    onDhAChange: setDhA,
    onDhBChange: setDhB,
    aesPlaintextHex,
    aesKeyHex,
    onAesPlaintextChange: setAesPlaintextHex,
    onAesKeyChange: setAesKeyHex,
    aesStates,
    aesStateIndex,
    httpsSteps,
    httpsStepIndex: stepIndex,
    httpsDomain,
    onHttpsDomainChange: setHttpsDomain,
    corsConfig,
    corsSteps,
    onCorsOriginChange: setCorsOrigin,
    onCorsTargetChange: setCorsTarget,
    onCorsMethodChange: setCorsMethod,
    onCorsHeadersChange: setCorsHeaders,
    onCorsCredentialsChange: setCorsCredentials,
    certSteps,
    certScenario,
    hashSteps,
    hashPassword,
    hashCostFactor,
    onHashPasswordChange: setHashPassword,
    onHashCostFactorChange: setHashCostFactor,
    rlTokenBucketSteps,
    rlSlidingWindowSteps,
    rlLeakyBucketSteps,
    rlCapacity,
    rlRefillRate,
    rlWindowSize,
    rlMaxRequests,
    rlLeakRate,
    onRlCapacityChange: setRlCapacity,
    onRlRefillRateChange: setRlRefillRate,
    onRlWindowSizeChange: setRlWindowSize,
    onRlMaxRequestsChange: setRlMaxRequests,
    onRlLeakRateChange: setRlLeakRate,
    webAttackType,
    webAttackSteps,
    webAttackDefenseMode,
    encSymmetricSteps,
    encAsymmetricSteps,
    encHybridSteps,
    encryptionStepIndex,
  }), [
    active, oauthSteps, stepIndex, oauthFlow, headerJson, payloadJson, secret,
    jwtSubView, attackType, attackSteps, attackStepIndex,
    dhResult, dhP, dhG, dhA, dhB,
    aesPlaintextHex, aesKeyHex, aesStates, aesStateIndex,
    httpsSteps, httpsDomain, corsConfig, corsSteps,
    certSteps, certScenario, hashSteps, hashPassword, hashCostFactor,
    rlTokenBucketSteps, rlSlidingWindowSteps, rlLeakyBucketSteps,
    rlCapacity, rlRefillRate, rlWindowSize, rlMaxRequests, rlLeakRate,
    webAttackType, webAttackSteps, webAttackDefenseMode,
    encSymmetricSteps, encAsymmetricSteps, encHybridSteps, encryptionStepIndex,
  ]);

  return {
    sidebar: (
      <SecuritySidebar
        active={active}
        onSelect={handleSelect}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onStep={handleStep}
        onPlay={handlePlay}
        onReset={handleReset}
        oauthFlow={oauthFlow}
        onFlowChange={handleFlowChange}
        jwtSubView={jwtSubView}
        onJwtSubViewChange={handleJwtSubViewChange}
        webAttackType={webAttackType}
        onWebAttackChange={handleWebAttackChange}
        webAttackDefenseMode={webAttackDefenseMode}
        onToggleDefenseMode={handleToggleDefenseMode}
      />
    ),
    canvas,
    properties: (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <SecurityPropertiesContext.Provider value={securityPropsCtx}>
            <SecurityProperties />
          </SecurityPropertiesContext.Provider>
        </div>
        {/* LEARN: DDoS Simulation Visualizer */}
        <div className="border-t border-sidebar-border">
          <DDoSSimulationVisualizer />
        </div>
      </div>
    ),
    bottomPanel: (
      <SecurityBottomPanel
        active={active}
        oauthSteps={oauthSteps}
        oauthStepIndex={stepIndex}
        dhResult={dhResult}
        dhStepIndex={stepIndex}
        jwtSubView={jwtSubView}
        attackSteps={attackSteps}
        attackStepIndex={attackStepIndex}
        aesStates={aesStates}
        aesStateIndex={aesStateIndex}
        httpsSteps={httpsSteps}
        httpsStepIndex={stepIndex}
        corsSteps={corsSteps}
        certSteps={certSteps}
        hashSteps={hashSteps}
        rlTokenBucketSteps={rlTokenBucketSteps}
        rlSlidingWindowSteps={rlSlidingWindowSteps}
        rlLeakyBucketSteps={rlLeakyBucketSteps}
        webAttackSteps={webAttackSteps}
        webAttackDefenseMode={webAttackDefenseMode}
        encSymmetricSteps={encSymmetricSteps}
        encAsymmetricSteps={encAsymmetricSteps}
        encHybridSteps={encHybridSteps}
        encryptionStepIndex={encryptionStepIndex}
      />
    ),
  };
}

export const SecurityModule = memo(function SecurityModule() {
  return null;
});
