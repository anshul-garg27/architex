import type { Metadata } from "next";
import {
  CONCEPTS,
  type ConceptDifficulty,
  type ConceptCategory,
} from "@/lib/seo/concepts-data";
import { SearchableGrid } from "@/components/seo/SearchableGrid";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "System Design Concepts — All 40 Core Topics | Architex",
  description:
    "Browse all 40 system design concepts covering infrastructure, data management, distributed systems, architecture, reliability, and performance. Interactive explanations and interview questions.",
  openGraph: {
    title: "System Design Concepts — All 40 Core Topics | Architex",
    description:
      "Browse all 40 system design concepts with interactive explanations and interview questions.",
    url: "https://architex.dev/concepts",
    siteName: "Architex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "System Design Concepts | Architex",
    description:
      "Browse all 40 system design concepts with interactive explanations.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DIFFICULTY_BADGE: Record<ConceptDifficulty, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  intermediate: { label: "Intermediate", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  advanced: { label: "Advanced", className: "bg-red-500/15 text-red-400 border-red-500/25" },
};

const CATEGORY_LABELS: Record<ConceptCategory, string> = {
  infrastructure: "Infrastructure",
  "data-management": "Data Management",
  "distributed-systems": "Distributed Systems",
  architecture: "Architecture",
  reliability: "Reliability",
  performance: "Performance",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ConceptsIndexPage() {
  const categories = Array.from(new Set(CONCEPTS.map((c) => c.category)));
  const groups = categories.map((cat) => ({
    label: CATEGORY_LABELS[cat] ?? cat,
    items: CONCEPTS.filter((c) => c.category === cat).map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      href: `/concepts/${c.slug}`,
      badges: [DIFFICULTY_BADGE[c.difficulty]],
    })),
  }));

  const allItems = groups.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: "Home", href: "/landing" },
          { label: "Concepts" },
        ]} />
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            System Design Concepts
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            {CONCEPTS.length} core concepts across {categories.length} categories.
            Search and explore interactive explanations with interview questions.
          </p>
        </header>

        <SearchableGrid items={allItems} groups={groups} placeholder="Search concepts..." />
      </div>
    </div>
  );
}
