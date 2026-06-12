// ── OG Image Route ──────────────────────────────────────────────────
//
// GET /api/og?title=Your+Title&type=concept&difficulty=intermediate
//
// Generates a 1200x630 Open Graph image for social sharing cards.
// Supports: concept | problem | pattern | blog | incident | scorecard
// (plus landing/pricing/interview/data-structure) content types.

import { ImageResponse } from "next/og";
import { validateURL } from "@/lib/security/ssrf";

export const runtime = "edge";

// ── Type & difficulty config ────────────────────────────────────────

type ContentType =
  | "concept"
  | "problem"
  | "pattern"
  | "blog"
  | "landing"
  | "pricing"
  | "interview"
  | "data-structure"
  | "incident"
  | "scorecard";

const TYPE_CONFIG: Record<ContentType, { label: string; color: string }> = {
  concept: { label: "CONCEPT", color: "#6ee7b7" },
  problem: { label: "PROBLEM", color: "#fbbf24" },
  pattern: { label: "PATTERN", color: "#a78bfa" },
  blog: { label: "BLOG", color: "#60a5fa" },
  landing: { label: "LANDING", color: "#f472b6" },
  pricing: { label: "PRICING", color: "#34d399" },
  interview: { label: "INTERVIEW", color: "#fb923c" },
  "data-structure": { label: "DATA STRUCTURE", color: "#22d3ee" },
  incident: { label: "INCIDENT REPLAY", color: "#f87171" },
  scorecard: { label: "SIMULATION SCORECARD", color: "#a78bfa" },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "#34d399" },
  easy: { label: "Easy", color: "#34d399" },
  intermediate: { label: "Intermediate", color: "#fbbf24" },
  medium: { label: "Medium", color: "#fbbf24" },
  advanced: { label: "Advanced", color: "#f87171" },
  hard: { label: "Hard", color: "#f87171" },
};

function isContentType(value: string): value is ContentType {
  return value === "concept" || value === "problem" || value === "pattern" || value === "blog" || value === "landing" || value === "pricing" || value === "interview" || value === "data-structure" || value === "incident" || value === "scorecard";
}

// ── DS category colors for OG badges ──────────────────────────
const DS_CATEGORY_COLORS: Record<string, string> = {
  linear: "#6ee7b7",
  tree: "#a78bfa",
  hash: "#fbbf24",
  heap: "#f87171",
  probabilistic: "#60a5fa",
  system: "#f472b6",
};

// ── Param sanitization (public edge route — never trust input) ─────

/** Strips control characters and caps length with an ellipsis. */
function clampText(raw: string | null, maxLength: number): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

/** Restricts a slug to [a-z0-9-] and caps its length. */
function sanitizeSlug(raw: string | null): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

/** Parses a finite number from a query param, clamped to [min, max]. */
function parseClampedNumber(raw: string | null, min: number, max: number): number | null {
  if (!raw) return null;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

/** Parses a boolean-ish query param ("true"/"1"/"yes" → true). */
function parseBooleanParam(raw: string | null): boolean | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1" || value === "yes") return true;
  if (value === "false" || value === "0" || value === "no") return false;
  return null;
}

// ── Scorecard formatting & band colors ──────────────────────────────

const MUTED_VALUE_COLOR = "#71717a";

const STAT_BAND_COLORS = {
  good: "#34d399",
  warn: "#fbbf24",
  bad: "#f87171",
  neutral: "#a78bfa",
} as const;

type StatBand = keyof typeof STAT_BAND_COLORS;

const P99_WARN_THRESHOLD_MS = 250;
const P99_BAD_THRESHOLD_MS = 800;
const ERR_WARN_THRESHOLD_PCT = 1;
const ERR_BAD_THRESHOLD_PCT = 5;

function p99Band(ms: number): StatBand {
  return ms <= P99_WARN_THRESHOLD_MS ? "good" : ms <= P99_BAD_THRESHOLD_MS ? "warn" : "bad";
}

function errBand(pct: number): StatBand {
  return pct <= ERR_WARN_THRESHOLD_PCT ? "good" : pct <= ERR_BAD_THRESHOLD_PCT ? "warn" : "bad";
}

/** Verdict band name → accent color. Unknown bands fall back to violet. */
const VERDICT_BAND_COLORS: Record<string, string> = {
  resilient: "#34d399",
  stable: "#6ee7b7",
  degraded: "#fbbf24",
  fragile: "#fb923c",
  meltdown: "#f87171",
};

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function formatPercent(pct: number): string {
  if (pct < 1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

function formatMonthlyCost(dollars: number): string {
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M/mo`;
  if (dollars >= 10_000) return `$${Math.round(dollars / 1000)}k/mo`;
  return `$${Math.round(dollars).toLocaleString("en-US")}/mo`;
}

// ── Shared OG building blocks ───────────────────────────────────────

const OG_IMAGE_OPTS = {
  width: 1200,
  height: 630,
  headers: {
    "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  },
} as const;

const ROOT_STYLE = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  position: "relative",
  overflow: "hidden",
  fontFamily: "system-ui, -apple-system, sans-serif",
} as const;

const CONTENT_STYLE = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  width: "100%",
  height: "100%",
  padding: "56px 64px",
} as const;

/** Dark gradient backdrop: violet→blue wash, grid pattern, twin glows. */
// NOTE: explicit top/left + width/height — the bundled satori does not
// reliably expand the `inset` shorthand, which collapses layers to 0x0.
function OgBackdrop() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1e1033 0%, #0f1729 40%, #0c1220 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundImage:
            "linear-gradient(rgba(110, 86, 207, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(110, 86, 207, 0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          display: "flex",
          background: "radial-gradient(circle, rgba(110, 86, 207, 0.25) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: "50%",
          display: "flex",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/** Architex logo tile + wordmark. */
function OgWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "linear-gradient(135deg, #6E56CF, #3b82f6)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            fill="white"
          />
        </svg>
      </div>
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#f4f4f5",
          letterSpacing: "-0.02em",
        }}
      >
        Architex
      </span>
    </div>
  );
}

/** Pill badge with status dot — matches existing type badges. */
function OgBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRadius: 20,
        padding: "6px 16px",
        border: `1px solid ${color}33`,
        backgroundColor: `${color}15`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          display: "flex",
        }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Letterspaced caps eyebrow with a short accent rule. */
function OgEyebrow({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 28,
          height: 3,
          borderRadius: 2,
          backgroundColor: color,
          display: "flex",
        }}
      />
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          color,
          letterSpacing: "0.22em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Incident replay card (type=incident) ────────────────────────────
//
// Params: slug, title, duration, errPeak
// Used by /incidents/{slug} pages.

function incidentOgResponse(searchParams: URLSearchParams): ImageResponse {
  const accent = TYPE_CONFIG.incident.color;
  const title = clampText(searchParams.get("title"), 70) || "Incident Replay";
  const slug = sanitizeSlug(searchParams.get("slug"));
  const duration = clampText(searchParams.get("duration"), 48);
  const errPeak = parseClampedNumber(searchParams.get("errPeak"), 0, 100);
  const incidentPath = slug ? `architex.dev/incidents/${slug}` : "architex.dev/incidents";

  return new ImageResponse(
    (
      <div style={ROOT_STYLE}>
        <OgBackdrop />
        <div style={CONTENT_STYLE}>
          {/* Top row: wordmark + replay badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <OgWordmark />
            <OgBadge label="REPLAY" color={accent} />
          </div>

          {/* Center: eyebrow + title + outage chips */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              flex: 1,
              justifyContent: "center",
            }}
          >
            <OgEyebrow label="INCIDENT REPLAY" color={accent} />
            <div
              style={{
                fontSize: title.length > 28 ? 54 : 68,
                fontWeight: 700,
                color: "#f4f4f5",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                maxWidth: 980,
                wordBreak: "break-word",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 6,
              }}
            >
              {duration && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 18,
                    padding: "8px 18px",
                    border: `1px solid ${accent}44`,
                    backgroundColor: `${accent}15`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: accent,
                      display: "flex",
                    }}
                  />
                  <span style={{ fontSize: 18, fontWeight: 600, color: accent }}>
                    {duration}
                  </span>
                </div>
              )}
              {errPeak !== null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 18,
                    padding: "8px 18px",
                    border: "1px solid #fbbf2444",
                    backgroundColor: "#fbbf2415",
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fbbf24",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatPercent(errPeak)}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#fbbf24" }}>
                    error peak
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer: ride-the-outage CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 17, color: "#a1a1aa" }}>Ride the outage at</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: "#a78bfa" }}>
                {incidentPath}
              </span>
            </div>
            <span style={{ fontSize: 15, color: "#6E56CF", fontWeight: 500 }}>
              Interactive Engineering Laboratory
            </span>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_OPTS,
  );
}

// ── Simulation scorecard card (type=scorecard) ──────────────────────
//
// Params: p99 (ms), err (%), cost ($/mo), survived (bool), verdict (band)
// For future share buttons after a simulation run.

function scorecardOgResponse(searchParams: URLSearchParams): ImageResponse {
  const accent = TYPE_CONFIG.scorecard.color;
  const p99 = parseClampedNumber(searchParams.get("p99"), 0, 3_600_000);
  const err = parseClampedNumber(searchParams.get("err"), 0, 100);
  const cost = parseClampedNumber(searchParams.get("cost"), 0, 10_000_000);
  const survived = parseBooleanParam(searchParams.get("survived"));
  const verdict = clampText(searchParams.get("verdict"), 24);
  const verdictColor = VERDICT_BAND_COLORS[verdict.toLowerCase()] ?? accent;

  const stats: ReadonlyArray<{ label: string; value: string; color: string }> = [
    {
      label: "P99 Latency",
      value: p99 === null ? "—" : formatMs(p99),
      color: p99 === null ? MUTED_VALUE_COLOR : STAT_BAND_COLORS[p99Band(p99)],
    },
    {
      label: "Error Rate",
      value: err === null ? "—" : formatPercent(err),
      color: err === null ? MUTED_VALUE_COLOR : STAT_BAND_COLORS[errBand(err)],
    },
    {
      label: "Est. Cost",
      value: cost === null ? "—" : formatMonthlyCost(cost),
      color: cost === null ? MUTED_VALUE_COLOR : STAT_BAND_COLORS.neutral,
    },
    {
      label: "Survived",
      value: survived === null ? "—" : survived ? "YES" : "NO",
      color:
        survived === null
          ? MUTED_VALUE_COLOR
          : survived
            ? STAT_BAND_COLORS.good
            : STAT_BAND_COLORS.bad,
    },
  ];

  return new ImageResponse(
    (
      <div style={ROOT_STYLE}>
        <OgBackdrop />
        <div style={CONTENT_STYLE}>
          {/* Top row: wordmark + scorecard badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <OgWordmark />
            <OgBadge label="SCORECARD" color={accent} />
          </div>

          {/* Center: eyebrow + stat blocks + verdict line */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              flex: 1,
              justifyContent: "center",
            }}
          >
            <OgEyebrow label="SIMULATION SCORECARD" color={accent} />
            <div style={{ display: "flex", gap: 16 }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: 1,
                    borderRadius: 14,
                    border: "1px solid rgba(110, 86, 207, 0.2)",
                    backgroundColor: "rgba(110, 86, 207, 0.06)",
                    padding: "22px 26px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#a1a1aa",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      color: stat.color,
                      fontFamily: "monospace",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            {verdict && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: verdictColor,
                    display: "flex",
                  }}
                />
                <span style={{ fontSize: 24, fontWeight: 500, color: "#a1a1aa" }}>
                  Verdict
                </span>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: verdictColor,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {verdict}
                </span>
              </div>
            )}
          </div>

          {/* Footer: tagline + domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 16, color: "#6E56CF", fontWeight: 500 }}>
              Interactive Engineering Laboratory
            </span>
            <span style={{ fontSize: 15, color: "#71717a" }}>architex.dev</span>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_OPTS,
  );
}

// ── Route handler ───────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawType = searchParams.get("type") ?? "";

  // ── Dedicated share-card layouts ────────────────────────────
  if (rawType === "incident") return incidentOgResponse(searchParams);
  if (rawType === "scorecard") return scorecardOgResponse(searchParams);

  const title = searchParams.get("title") ?? "Architex";
  const difficulty = searchParams.get("difficulty") ?? "";

  const type: ContentType | null = isContentType(rawType) ? rawType : null;
  const typeInfo = type ? TYPE_CONFIG[type] : null;
  const difficultyInfo = DIFFICULTY_CONFIG[difficulty] ?? null;

  // ── SSRF: validate optional avatar URL before fetching ───
  const avatarParam = searchParams.get("avatar");
  let avatarUrl: string | null = null;
  if (avatarParam) {
    const ssrfCheck = validateURL(avatarParam);
    if (ssrfCheck.safe) {
      avatarUrl = avatarParam;
    }
    // Silently ignore unsafe URLs — do not render avatar
  }

  // ── DS-specific params ──────────────────────────────────────
  const dsCategory = searchParams.get("category") ?? "";
  const dsCategoryColor = DS_CATEGORY_COLORS[dsCategory] ?? "#6ee7b7";
  // complexity: "Access:O(1),Search:O(n),Insert:O(n),Delete:O(n)"
  const dsComplexityRaw = searchParams.get("complexity") ?? "";
  const dsComplexityEntries = dsComplexityRaw
    .split(",")
    .map((pair) => {
      const [op, val] = pair.split(":");
      return op && val ? { op: op.trim(), val: val.trim() } : null;
    })
    .filter(Boolean)
    .slice(0, 4) as { op: string; val: string }[];

  // Truncate long titles to prevent overflow
  const displayTitle = title.length > 80 ? `${title.slice(0, 77)}...` : title;

  return new ImageResponse(
    (
      <div style={ROOT_STYLE}>
        <OgBackdrop />

        {/* Content layer */}
        <div style={CONTENT_STYLE}>
          {/* Top row: logo/wordmark + type badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <OgWordmark />
            {typeInfo && <OgBadge label={typeInfo.label} color={typeInfo.color} />}
          </div>

          {/* Center: title + badges + optional complexity table */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: displayTitle.length > 50 ? 42 : 52,
                fontWeight: 700,
                color: "#f4f4f5",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                maxWidth: 900,
              }}
            >
              {displayTitle}
            </div>

            {/* DS type: category + difficulty badges side by side */}
            {type === "data-structure" ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 4,
                }}
              >
                {dsCategory && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 16,
                      padding: "4px 14px",
                      border: `1px solid ${dsCategoryColor}44`,
                      backgroundColor: `${dsCategoryColor}18`,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: dsCategoryColor,
                        display: "flex",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: dsCategoryColor,
                        textTransform: "capitalize",
                      }}
                    >
                      {dsCategory}
                    </span>
                  </div>
                )}
                {difficultyInfo && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 16,
                      padding: "4px 14px",
                      border: `1px solid ${difficultyInfo.color}44`,
                      backgroundColor: `${difficultyInfo.color}18`,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: difficultyInfo.color,
                        display: "flex",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: difficultyInfo.color,
                      }}
                    >
                      {difficultyInfo.label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Non-DS: standard difficulty indicator */
              difficultyInfo && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: difficultyInfo.color,
                      display: "flex",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      color: difficultyInfo.color,
                    }}
                  >
                    {difficultyInfo.label}
                  </span>
                </div>
              )
            )}

            {/* DS type: complexity table */}
            {type === "data-structure" && dsComplexityEntries.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginTop: 8,
                }}
              >
                {dsComplexityEntries.map((entry) => (
                  <div
                    key={entry.op}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      borderRadius: 12,
                      border: "1px solid rgba(110, 86, 207, 0.2)",
                      backgroundColor: "rgba(110, 86, 207, 0.06)",
                      padding: "10px 20px",
                      minWidth: 100,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#a1a1aa",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {entry.op}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#22d3ee",
                        fontFamily: "monospace",
                      }}
                    >
                      {entry.val}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom row: tagline + avatar + URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  style={{ borderRadius: "50%" }}
                />
              )}
              <span
                style={{
                  fontSize: 16,
                  color: "#6E56CF",
                  fontWeight: 500,
                }}
              >
                {type === "data-structure"
                  ? "Architex \u2014 Interactive Data Structure Visualization"
                  : "Interactive Engineering Laboratory"}
              </span>
            </div>
            <span
              style={{
                fontSize: 15,
                color: "#71717a",
              }}
            >
              architex.dev
            </span>
          </div>
        </div>
      </div>
    ),
    OG_IMAGE_OPTS,
  );
}
