import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import {
  CONCEPTS,
  getConceptBySlug,
  getRelatedConcepts,
  type ConceptDifficulty,
} from "@/lib/seo/concepts-data";
import {
  generateLearningResourceJsonLd,
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
} from "@/lib/seo/json-ld";
import { conceptMetaDescription } from "@/lib/seo/meta-templates";
import { getRelatedProblemsForConcept } from "@/lib/seo/internal-links";
import { JsonLd } from "@/components/seo/JsonLd";
import { ConceptModuleLinks } from "@/components/cross-module/ConceptModuleLinks";

// ---------------------------------------------------------------------------
// Distributed simulation slugs that have matching interactive simulations
// ---------------------------------------------------------------------------
const INTERACTIVE_SIMULATION_SLUGS = new Set([
  'cap-theorem',
  'consistent-hashing',
  'gossip-protocol',
  'raft-consensus',
  'two-phase-commit',
  'saga-pattern',
]);

// ---------------------------------------------------------------------------
// Static generation for all 20 concept slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);
  if (!concept) return { title: "Concept Not Found — Architex" };

  const title = `${concept.title} — System Design Concept | Architex`;
  const description = conceptMetaDescription(concept.title, concept.category, concept.difficulty);

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(concept.title)}&type=concept&difficulty=${encodeURIComponent(concept.difficulty)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/concepts/${concept.slug}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: concept.title }],
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
const DIFFICULTY_CONFIG: Record<
  ConceptDifficulty,
  { label: string; className: string }
> = {
  beginner: {
    label: "Beginner",
    className:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  intermediate: {
    label: "Intermediate",
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  advanced: {
    label: "Advanced",
    className: "bg-red-500/15 text-red-400 border-red-500/25",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: "Infrastructure",
  "data-management": "Data Management",
  "distributed-systems": "Distributed Systems",
  architecture: "Architecture",
  reliability: "Reliability",
  performance: "Performance",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);
  if (!concept) notFound();

  const related = getRelatedConcepts(slug);
  const relatedProblems = getRelatedProblemsForConcept(slug);
  const difficultyInfo = DIFFICULTY_CONFIG[concept.difficulty];

  // ── JSON-LD structured data ─────────────────────────────────────
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "Concepts", url: "https://architex.dev/concepts" },
    {
      name: concept.title,
      url: `https://architex.dev/concepts/${concept.slug}`,
    },
  ]);

  const learningResourceJsonLd = generateLearningResourceJsonLd({
    name: concept.title,
    description: concept.description,
    url: `https://architex.dev/concepts/${concept.slug}`,
    educationalLevel:
      concept.difficulty === "beginner"
        ? "Beginner"
        : concept.difficulty === "intermediate"
          ? "Intermediate"
          : "Advanced",
    keywords: [
      concept.title,
      "system design",
      concept.category,
      "interview preparation",
    ],
  });

  const faqJsonLd = generateFAQJsonLd(
    concept.interviewQuestions.map((q) => ({
      question: q,
      answer: `This is a common interview question about ${concept.title}. Read the full explanation on Architex to learn the answer with interactive visualizations.`,
    })),
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd data={[breadcrumbJsonLd, learningResourceJsonLd, faqJsonLd]} />

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
                href="/concepts"
                className="transition-colors hover:text-[var(--primary)]"
              >
                Concepts
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
              {concept.title}
            </li>
          </ol>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-medium ${difficultyInfo.className}`}
            >
              {difficultyInfo.label}
            </span>
            <span className="rounded-full bg-[var(--primary)]/15 px-3 py-0.5 text-xs font-medium text-[var(--primary)]">
              {CATEGORY_LABELS[concept.category] ?? concept.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {concept.title}
          </h1>
          <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
            {concept.description}
          </p>
        </header>

        {/* ── Distributed Simulation CTA Banner ──────────────────── */}
        {INTERACTIVE_SIMULATION_SLUGS.has(concept.slug) && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3">
            <Play className="h-5 w-5 text-[var(--primary)] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">Try the Interactive Simulation</p>
              <p className="text-xs text-[var(--foreground-muted)]">See {concept.title} animated step-by-step in the Distributed Systems module.</p>
            </div>
            {/* TODO: DIS-111 will add deep-link to specific simulation */}
            <Link href="/" className="shrink-0 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90">
              Open Simulation →
            </Link>
          </div>
        )}

        {/* ── Interactive Visualization Embed ─────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <svg
                  className="h-8 w-8 text-[var(--primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold">
                Interactive Visualization
              </h2>
              <p className="mb-4 text-sm text-[var(--foreground-muted)]">
                Explore {concept.title} with an interactive diagram on the
                Architex canvas.
              </p>
              <Link
                href={`/?concept=${concept.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
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
        </section>

        {/* ── Detailed Explanation ─────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Deep Dive
          </h2>
          <div className="space-y-4">
            {concept.explanation.map((paragraph, i) => (
              <p
                key={i}
                className="leading-relaxed text-[var(--foreground-muted)]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* ── Cross-Module Links ──────────────────────────────────── */}
        <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Explore Across Modules
          </h2>
          <ConceptModuleLinks conceptId={concept.slug} />
        </section>

        {/* ── Interview Questions ──────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Common Interview Questions
          </h2>
          <ul className="space-y-3">
            {concept.interviewQuestions.map((question, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {question}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Related Concepts Grid ───────────────────────────────── */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related Concepts
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((rel) => {
                const relDiff = DIFFICULTY_CONFIG[rel.difficulty];
                return (
                  <Link
                    key={rel.slug}
                    href={`/concepts/${rel.slug}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                        {rel.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${relDiff.className}`}
                      >
                        {relDiff.label}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
                      {rel.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Related Problems ────────────────────────────────────── */}
        {relatedProblems.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Practice Problems
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedProblems.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/problems/${challenge.id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {challenge.title}
                    </h3>
                  </div>
                  <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
                    {challenge.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">
            Practice {concept.title} in Action
          </h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Open the interactive canvas and build a system that uses{" "}
            {concept.title.toLowerCase()} in a real architecture.
          </p>
          <Link
            href={`/?concept=${concept.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Start Building
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
