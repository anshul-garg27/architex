import type { Metadata } from "next";
import Link from "next/link";
import { OS_CONCEPTS, type OSConceptDifficulty } from "@/lib/seo/os-concepts-data";
import { generateBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Operating System Concepts — All 6 Core Topics | Architex",
  description:
    "Browse all 6 operating system concepts covering CPU scheduling, page replacement, deadlock detection, memory management, memory allocation, and thread synchronization with interactive simulations.",
  openGraph: {
    title: "Operating System Concepts — All 6 Core Topics | Architex",
    description:
      "Browse all 6 OS concepts with interactive simulations and interview questions.",
    url: "https://architex.dev/os",
    siteName: "Architex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Operating System Concepts | Architex",
    description:
      "Browse all 6 OS concepts with interactive simulations and interview questions.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DIFFICULTY_BADGE: Record<OSConceptDifficulty, { label: string; className: string }> = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  advanced: {
    label: "Advanced",
    className: "bg-red-500/15 text-red-400 border-red-500/25",
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OSConceptsIndexPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "OS Concepts", url: "https://architex.dev/os" },
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd data={breadcrumbJsonLd} />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/landing" },
            { label: "OS Concepts" },
          ]}
        />

        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Operating System Concepts
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            {OS_CONCEPTS.length} core OS concepts with interactive simulations,
            deep-dive explanations, and interview questions.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OS_CONCEPTS.map((concept) => {
            const badge = DIFFICULTY_BADGE[concept.difficulty];
            return (
              <Link
                key={concept.slug}
                href={`/os/${concept.slug}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                    {concept.name}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {concept.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {concept.algorithms.slice(0, 4).map((algo) => (
                    <span
                      key={algo}
                      className="rounded bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]"
                    >
                      {algo}
                    </span>
                  ))}
                  {concept.algorithms.length > 4 && (
                    <span className="rounded bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                      +{concept.algorithms.length - 4} more
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
