import type { Metadata } from "next";
import {
  LLD_PROBLEMS,
  type LLDDifficulty,
  type LLDCategory,
} from "@/lib/seo/lld-problems-data";
import { SearchableGrid } from "@/components/seo/SearchableGrid";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Low-Level Design Problems — All 33 LLD Challenges | Architex",
  description:
    "Browse all 33 low-level design problems covering object modeling, concurrency, game design, booking systems, infrastructure, and real-time systems. Practice with interactive diagrams.",
  openGraph: {
    title: "Low-Level Design Problems — All 33 LLD Challenges | Architex",
    description:
      "Browse all 33 LLD problems with key design patterns and interactive diagrams.",
    url: "https://architex.dev/lld-problems",
    siteName: "Architex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Low-Level Design Problems | Architex",
    description:
      "Browse all 33 LLD problems. Filter by difficulty and category.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DIFFICULTY_BADGE: Record<LLDDifficulty, { label: string; className: string }> = {
  easy: { label: "Easy", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  hard: { label: "Hard", className: "bg-red-500/15 text-red-400 border-red-500/25" },
};

const CATEGORY_LABELS: Record<LLDCategory, string> = {
  "object-modeling": "Object Modeling",
  concurrency: "Concurrency",
  "game-design": "Game Design",
  "booking-system": "Booking System",
  infrastructure: "Infrastructure",
  "real-time": "Real-Time",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LLDProblemsIndexPage() {
  const categories = Array.from(new Set(LLD_PROBLEMS.map((p) => p.category)));
  const groups = categories.map((cat) => ({
    label: CATEGORY_LABELS[cat] ?? cat,
    items: LLD_PROBLEMS.filter((p) => p.category === cat).map((p) => ({
      slug: p.slug,
      title: p.name,
      description: p.description,
      href: `/lld-problems/${p.slug}`,
      badges: [DIFFICULTY_BADGE[p.seoDifficulty]],
    })),
  }));

  const allItems = groups.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: "Home", href: "/landing" },
          { label: "LLD Problems" },
        ]} />
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Low-Level Design Problems
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            {LLD_PROBLEMS.length} LLD challenges across {categories.length} categories.
            Practice object-oriented design with key patterns and interactive diagrams.
          </p>
        </header>

        <SearchableGrid items={allItems} groups={groups} placeholder="Search LLD problems..." />
      </div>
    </div>
  );
}
