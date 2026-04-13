import type { Metadata } from "next";
import {
  COMPANIES,
  type InterviewDifficulty,
} from "@/lib/seo/company-data";
import { SearchableGrid } from "@/components/seo/SearchableGrid";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Company Interview Prep — All 15 Tech Companies | Architex",
  description:
    "Prepare for system design interviews at 15 top tech companies including Google, Meta, Amazon, and more. Company-specific tips, sample questions, and focus areas.",
  openGraph: {
    title: "Company Interview Prep — All 15 Tech Companies | Architex",
    description:
      "Prepare for system design interviews at 15 top tech companies.",
    url: "https://architex.dev/interviews",
    siteName: "Architex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Company Interview Prep | Architex",
    description:
      "System design interview prep for 15 top tech companies.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DIFFICULTY_BADGE: Record<InterviewDifficulty, { label: string; className: string }> = {
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  hard: { label: "Hard", className: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  "very-hard": { label: "Very Hard", className: "bg-red-500/15 text-red-400 border-red-500/25" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function InterviewsIndexPage() {
  const items = COMPANIES.map((c) => ({
    slug: c.slug,
    title: c.name,
    description: c.description,
    href: `/interviews/${c.slug}`,
    badges: [DIFFICULTY_BADGE[c.difficulty]],
  }));

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: "Home", href: "/landing" },
          { label: "Interview Prep" },
        ]} />
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Company Interview Prep
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            {COMPANIES.length} top tech companies with company-specific tips,
            sample questions, focus areas, and interview round breakdowns.
          </p>
        </header>

        <SearchableGrid items={items} placeholder="Search companies..." />
      </div>
    </div>
  );
}
