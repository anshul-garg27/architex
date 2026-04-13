// ── OG Image Route ──────────────────────────────────────────────────
//
// GET /api/og?title=Your+Title&type=concept&difficulty=intermediate
//
// Generates a 1200x630 Open Graph image for social sharing cards.
// Supports: concept | problem | pattern | blog content types.

import { ImageResponse } from "next/og";
import { validateURL } from "@/lib/security/ssrf";

export const runtime = "edge";

// ── Type & difficulty config ────────────────────────────────────────

type ContentType = "concept" | "problem" | "pattern" | "blog" | "landing" | "pricing" | "interview" | "data-structure";

const TYPE_CONFIG: Record<ContentType, { label: string; color: string }> = {
  concept: { label: "CONCEPT", color: "#6ee7b7" },
  problem: { label: "PROBLEM", color: "#fbbf24" },
  pattern: { label: "PATTERN", color: "#a78bfa" },
  blog: { label: "BLOG", color: "#60a5fa" },
  landing: { label: "LANDING", color: "#f472b6" },
  pricing: { label: "PRICING", color: "#34d399" },
  interview: { label: "INTERVIEW", color: "#fb923c" },
  "data-structure": { label: "DATA STRUCTURE", color: "#22d3ee" },
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
  return value === "concept" || value === "problem" || value === "pattern" || value === "blog" || value === "landing" || value === "pricing" || value === "interview" || value === "data-structure";
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

// ── Route handler ───────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Architex";
  const rawType = searchParams.get("type") ?? "";
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Gradient background: violet to blue */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(135deg, #1e1033 0%, #0f1729 40%, #0c1220 100%)",
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(110, 86, 207, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(110, 86, 207, 0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Gradient glow accent top-right */}
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

        {/* Gradient glow accent bottom-left */}
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

        {/* Content layer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
          }}
        >
          {/* Top row: logo/wordmark + type badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Architex wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Logo icon */}
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
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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

            {/* Type badge */}
            {typeInfo && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 20,
                  padding: "6px 16px",
                  border: `1px solid ${typeInfo.color}33`,
                  backgroundColor: `${typeInfo.color}15`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: typeInfo.color,
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: typeInfo.color,
                    letterSpacing: "0.08em",
                  }}
                >
                  {typeInfo.label}
                </span>
              </div>
            )}
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
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
