// ── Database OG Image Route ─────────────────────────────────────────
//
// GET /api/og/database?mode=btree-index
//
// Generates a 1200x630 Open Graph image for each database mode.
// Uses the same visual language as the main /api/og route but adds
// a mode-specific icon and pulls metadata from database-meta.ts.

import { ImageResponse } from "next/og";
import { getDatabaseModeBySlug } from "@/lib/seo/database-meta";

export const runtime = "edge";

// ── Mode icon mapping ──────────────────────────────────────────────

function getIconForMode(mode: string): string {
  const icons: Record<string, string> = {
    "er-diagram": "\u{1F5C2}\uFE0F",       // file cabinet
    "normalization": "\u{1F4CA}",           // bar chart
    "transaction-isolation": "\u{1F512}",   // lock
    "btree-index": "\u{1F333}",            // deciduous tree
    "hash-index": "#\uFE0F\u20E3",         // hash key
    "query-plans": "\u{1F4CB}",            // clipboard
    "lsm-tree": "\u{1F4D1}",              // bookmark tabs
  };
  return icons[mode] ?? "\u{1F4BE}";        // floppy disk fallback
}

// ── Mode accent colors ─────────────────────────────────────────────

function getAccentForMode(mode: string): string {
  const accents: Record<string, string> = {
    "er-diagram": "#6ee7b7",
    "normalization": "#a78bfa",
    "transaction-isolation": "#fbbf24",
    "btree-index": "#34d399",
    "hash-index": "#60a5fa",
    "query-plans": "#f472b6",
    "lsm-tree": "#fb923c",
  };
  return accents[mode] ?? "#6E56CF";
}

// ── Route handler ───────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "er-diagram";
  const meta = getDatabaseModeBySlug(mode);
  const accent = getAccentForMode(mode);

  const title = meta?.heading ?? "Database Design";
  const description = meta?.description?.slice(0, 100) ?? "Interactive database visualization";

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
        {/* Gradient background — matches main OG route */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(135deg, #1e1033 0%, #0f1729 40%, #0c1220 100%)",
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

        {/* Accent glow top-right — tinted to mode color */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            display: "flex",
            background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)`,
          }}
        />

        {/* Accent glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 350,
            height: 350,
            borderRadius: "50%",
            display: "flex",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
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
          {/* Top row: logo + DATABASE badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Architex wordmark */}
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

            {/* DATABASE badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 20,
                padding: "6px 16px",
                border: `1px solid ${accent}33`,
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
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: accent,
                  letterSpacing: "0.08em",
                }}
              >
                DATABASE
              </span>
            </div>
          </div>

          {/* Center: icon + title + description */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {/* Mode icon */}
            <div style={{ fontSize: 64, display: "flex" }}>
              {getIconForMode(mode)}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: title.length > 40 ? 42 : 52,
                fontWeight: 700,
                color: "#f4f4f5",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                maxWidth: 900,
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 22,
                color: "#94a3b8",
                lineHeight: 1.4,
                maxWidth: 800,
              }}
            >
              {description}
            </div>
          </div>

          {/* Bottom row: tagline + URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: "#6E56CF",
                fontWeight: 500,
              }}
            >
              Interactive Engineering Laboratory
            </span>
            <span
              style={{
                fontSize: 15,
                color: "#71717a",
              }}
            >
              architex.dev/database/{mode}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      emoji: "twemoji",
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
