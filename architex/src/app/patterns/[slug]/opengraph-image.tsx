// ---------------------------------------------------------------------------
// OG Image Auto-Generation for Design Pattern Pages (LLD-148)
// ---------------------------------------------------------------------------
// Generates a professional 1200x630 Open Graph image for each pattern page
// using the Next.js ImageResponse API. Displayed when shared on Twitter,
// LinkedIn, Slack, etc.
// ---------------------------------------------------------------------------

import { ImageResponse } from "next/og";
import {
  DESIGN_PATTERNS,
  getDesignPatternBySlug,
  type PatternCategory,
} from "@/lib/seo/design-patterns-data";

// -- Metadata exports -------------------------------------------------------

export const alt = "Design Pattern — Architex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// -- Static params for build-time generation --------------------------------

export function generateStaticParams() {
  return DESIGN_PATTERNS.map((p) => ({ slug: p.slug }));
}

// -- Category config --------------------------------------------------------

const CATEGORY_COLORS: Record<PatternCategory, { bg: string; text: string; glow: string }> = {
  creational: { bg: "#065f4620", text: "#6ee7b7", glow: "rgba(110, 231, 183, 0.15)" },
  structural: { bg: "#1e3a5f20", text: "#60a5fa", glow: "rgba(96, 165, 250, 0.15)" },
  behavioral: { bg: "#3b1f6e20", text: "#a78bfa", glow: "rgba(167, 139, 250, 0.15)" },
  modern: { bg: "#5c2d0020", text: "#fb923c", glow: "rgba(251, 146, 60, 0.15)" },
};

// -- Image generation -------------------------------------------------------

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pattern = getDesignPatternBySlug(slug);

  const title = pattern?.title ?? "Design Pattern";
  const category = pattern?.category ?? "behavioral";
  const description = pattern?.intent ?? "";
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.behavioral;

  // Truncate description for the OG image
  const shortDesc =
    description.length > 120 ? description.slice(0, 117) + "..." : description;

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
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(135deg, #1e1033 0%, #0f1729 40%, #0c1220 100%)",
          }}
        />

        {/* Subtle grid pattern */}
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

        {/* Category-themed glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -80,
            width: 380,
            height: 380,
            borderRadius: "50%",
            display: "flex",
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          }}
        />

        {/* Secondary glow bottom-left */}
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
              "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
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
          {/* Top row: Architex logo + category badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
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

            {/* Category badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 20,
                padding: "6px 16px",
                border: `1px solid ${colors.text}33`,
                backgroundColor: colors.bg,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: colors.text,
                  display: "flex",
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.text,
                  letterSpacing: "0.08em",
                }}
              >
                {categoryLabel.toUpperCase()} PATTERN
              </span>
            </div>
          </div>

          {/* Center: pattern name + description */}
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
                fontSize: title.length > 20 ? 48 : 56,
                fontWeight: 700,
                color: "#f4f4f5",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                maxWidth: 900,
              }}
            >
              {title} Pattern
            </div>

            {shortDesc && (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  color: "#a1a1aa",
                  lineHeight: 1.5,
                  maxWidth: 800,
                }}
              >
                {shortDesc}
              </div>
            )}
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
              Interactive Design Patterns Guide
            </span>
            <span
              style={{
                fontSize: 15,
                color: "#71717a",
              }}
            >
              architex.dev/patterns/{slug}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
