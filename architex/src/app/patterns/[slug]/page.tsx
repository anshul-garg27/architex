import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  DESIGN_PATTERNS,
  getDesignPatternBySlug,
  getRelatedDesignPatterns,
  type PatternCategory,
} from "@/lib/seo/design-patterns-data";
import {
  generateLearningResourceJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { patternMetaDescription } from "@/lib/seo/meta-templates";
import { getRelatedLLDProblemsForPattern } from "@/lib/seo/internal-links";
import { JsonLd } from "@/components/seo/JsonLd";

// ---------------------------------------------------------------------------
// Static generation for all 26 design pattern slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return DESIGN_PATTERNS.map((p) => ({ slug: p.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pattern = getDesignPatternBySlug(slug);
  if (!pattern) return { title: "Pattern Not Found — Architex" };

  const title = `${pattern.title} Pattern — Design Patterns Guide | Architex`;
  const description = patternMetaDescription(pattern.title, pattern.category);

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(pattern.title + " Pattern")}&type=pattern`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/patterns/${pattern.slug}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: pattern.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CATEGORY_CONFIG: Record<
  PatternCategory,
  { label: string; className: string }
> = {
  creational: {
    label: "Creational",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  structural: {
    label: "Structural",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  behavioral: {
    label: "Behavioral",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
  modern: {
    label: "Modern",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function DesignPatternPage({ params }: Props) {
  const { slug } = await params;
  const pattern = getDesignPatternBySlug(slug);
  if (!pattern) notFound();

  const related = getRelatedDesignPatterns(slug);
  const relatedLLDProblems = getRelatedLLDProblemsForPattern(pattern.title);
  const categoryInfo = CATEGORY_CONFIG[pattern.category];

  // -- JSON-LD structured data -------------------------------------------
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "Design Patterns", url: "https://architex.dev/patterns" },
    {
      name: pattern.title,
      url: `https://architex.dev/patterns/${pattern.slug}`,
    },
  ]);

  const learningResourceJsonLd = generateLearningResourceJsonLd({
    name: `${pattern.title} Design Pattern`,
    description: pattern.intent,
    url: `https://architex.dev/patterns/${pattern.slug}`,
    educationalLevel: "Intermediate",
    keywords: [
      pattern.title,
      "design pattern",
      pattern.category,
      "object-oriented design",
      "software engineering",
      "interview preparation",
    ],
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd data={[breadcrumbJsonLd, learningResourceJsonLd]} />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
            <li>
              <Link
                href="/landing"
                className="transition-colors hover:text-[var(--primary)]"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </li>
            <li>
              <Link
                href="/patterns"
                className="transition-colors hover:text-[var(--primary)]"
              >
                Patterns
              </Link>
            </li>
            <li aria-hidden="true">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </li>
            <li aria-current="page" className="text-[var(--foreground)]">
              {pattern.title}
            </li>
          </ol>
        </nav>

        {/* -- Hero -------------------------------------------------------- */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-medium ${categoryInfo.className}`}
            >
              {categoryInfo.label}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {pattern.title} Pattern
          </h1>
        </header>

        {/* -- Intent ------------------------------------------------------ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Intent
          </h2>
          <p className="leading-relaxed text-[var(--foreground-muted)]">
            {pattern.intent}
          </p>
        </section>

        {/* -- Motivation -------------------------------------------------- */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Motivation
          </h2>
          <p className="leading-relaxed text-[var(--foreground-muted)]">
            {pattern.motivation}
          </p>
        </section>

        {/* -- Structure --------------------------------------------------- */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Structure
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
              {pattern.structure}
            </p>
          </div>
        </section>

        {/* -- Participants ------------------------------------------------ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Participants
          </h2>
          <ul className="space-y-2">
            {pattern.participants.map((participant, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground-muted)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                {participant}
              </li>
            ))}
          </ul>
        </section>

        {/* -- When to Use ------------------------------------------------- */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            When to Use
          </h2>
          <ul className="space-y-2">
            {pattern.applicability.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* -- Code Example ------------------------------------------------ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            TypeScript Example
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <pre className="p-5 text-sm leading-relaxed">
              <code className="text-[var(--foreground-muted)]">
                {pattern.codeExample}
              </code>
            </pre>
          </div>
        </section>

        {/* -- Consequences ------------------------------------------------ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Consequences
          </h2>
          <ul className="space-y-2">
            {pattern.consequences.map((consequence, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground-muted)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                {consequence}
              </li>
            ))}
          </ul>
        </section>

        {/* -- Related Patterns -------------------------------------------- */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related Patterns
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((rel) => {
                const relCat = CATEGORY_CONFIG[rel.category];
                return (
                  <Link
                    key={rel.slug}
                    href={`/patterns/${rel.slug}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                        {rel.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${relCat.className}`}
                      >
                        {relCat.label}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
                      {rel.intent}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* -- Related LLD Problems ---------------------------------------- */}
        {relatedLLDProblems.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              LLD Problems Using This Pattern
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedLLDProblems.map((problem) => (
                <Link
                  key={problem.slug}
                  href={`/lld-problems/${problem.slug}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {problem.name}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        problem.seoDifficulty === "easy"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                          : problem.seoDifficulty === "medium"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                            : "bg-red-500/15 text-red-400 border-red-500/25"
                      }`}
                    >
                      {problem.seoDifficulty.charAt(0).toUpperCase() + problem.seoDifficulty.slice(1)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
                    {problem.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* -- CTA --------------------------------------------------------- */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">
            Practice the {pattern.title} Pattern
          </h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Open the interactive canvas and implement the {pattern.title}{" "}
            pattern in a real system design scenario.
          </p>
          <Link
            href={`/?pattern=${pattern.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Open in Canvas
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
