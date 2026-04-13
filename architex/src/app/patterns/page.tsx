import type { Metadata } from "next";
import {
  DESIGN_PATTERNS,
  type PatternCategory,
} from "@/lib/seo/design-patterns-data";
import { SearchableGrid } from "@/components/seo/SearchableGrid";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Design Patterns — 26 GoF + Modern Patterns Explained | Architex",
  description:
    "Browse 26 design patterns across creational, structural, behavioral, and modern categories. Interactive examples with TypeScript code and interview tips.",
  openGraph: {
    title: "Design Patterns — 26 GoF + Modern Patterns Explained | Architex",
    description:
      "Browse 26 design patterns with interactive TypeScript examples.",
    url: "https://architex.dev/patterns",
    siteName: "Architex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Patterns | Architex",
    description:
      "Browse 26 design patterns with interactive examples.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CATEGORY_CONFIG: Record<PatternCategory, { label: string; className: string }> = {
  creational: { label: "Creational", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  structural: { label: "Structural", className: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  behavioral: { label: "Behavioral", className: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  modern: { label: "Modern", className: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PatternsIndexPage() {
  const categoryOrder: PatternCategory[] = ["creational", "structural", "behavioral", "modern"];
  const groups = categoryOrder.map((cat) => ({
    label: CATEGORY_CONFIG[cat].label,
    items: DESIGN_PATTERNS.filter((p) => p.category === cat).map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.intent,
      href: `/patterns/${p.slug}`,
      badges: [CATEGORY_CONFIG[p.category]],
    })),
  }));

  const allItems = groups.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: "Home", href: "/landing" },
          { label: "Design Patterns" },
        ]} />
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Design Patterns
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            {DESIGN_PATTERNS.length} design patterns across {categoryOrder.length} categories.
            Search and explore with interactive TypeScript examples.
          </p>
        </header>

        <SearchableGrid items={allItems} groups={groups} placeholder="Search patterns..." />
      </div>
    </div>
  );
}
