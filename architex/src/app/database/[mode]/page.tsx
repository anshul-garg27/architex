import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DATABASE_MODES,
  getDatabaseModeBySlug,
  type DatabaseModeSlug,
} from "@/lib/seo/database-meta";
import {
  generateLearningResourceJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { DatabaseModeApp } from "./database-mode-app";

// ---------------------------------------------------------------------------
// Static generation for all 7 database mode slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return DATABASE_MODES.map((m) => ({ mode: m.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG, canonical)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ mode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params;
  const meta = getDatabaseModeBySlug(mode);
  if (!meta) return { title: "Database Mode Not Found — Architex" };

  const ogImage = `https://architex.dev/api/og/database?mode=${encodeURIComponent(meta.slug)}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://architex.dev/database/${meta.slug}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://architex.dev/database/${meta.slug}`,
      siteName: "Architex",
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: meta.heading,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
    keywords: meta.keywords,
  };
}

// ---------------------------------------------------------------------------
// Page component — renders the full app with database module + mode active
// ---------------------------------------------------------------------------
export default async function DatabaseModePage({ params }: Props) {
  const { mode } = await params;
  const meta = getDatabaseModeBySlug(mode);
  if (!meta) notFound();

  // JSON-LD structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "Database", url: "https://architex.dev/database" },
    {
      name: meta.heading,
      url: `https://architex.dev/database/${meta.slug}`,
    },
  ]);

  const learningResourceJsonLd = generateLearningResourceJsonLd({
    name: meta.heading,
    description: meta.description,
    url: `https://architex.dev/database/${meta.slug}`,
    educationalLevel: "Intermediate",
    keywords: meta.keywords,
  });

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd, learningResourceJsonLd]} />
      <DatabaseModeApp mode={meta.slug as DatabaseModeSlug} />
    </>
  );
}
