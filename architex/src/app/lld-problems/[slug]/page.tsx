import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  LLD_PROBLEMS,
  getLLDProblemBySlug,
  getRelatedLLDProblems,
  type LLDDifficulty,
  type LLDCategory,
  type InterviewFrequency,
} from "@/lib/seo/lld-problems-data";
import {
  generateLearningResourceJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { lldProblemMetaDescription } from "@/lib/seo/meta-templates";
import { JsonLd } from "@/components/seo/JsonLd";

// ---------------------------------------------------------------------------
// Static generation for all 33 LLD problem slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return LLD_PROBLEMS.map((p) => ({ slug: p.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const problem = getLLDProblemBySlug(slug);
  if (!problem) return { title: "LLD Problem Not Found — Architex" };

  const title = `${problem.name} — Low-Level Design Problem | Architex`;
  const description = lldProblemMetaDescription(problem.name, problem.keyPatterns);

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(problem.name)}&type=problem&difficulty=${encodeURIComponent(problem.seoDifficulty)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/lld-problems/${problem.slug}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: problem.name }],
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
  LLDDifficulty,
  { label: string; className: string }
> = {
  easy: {
    label: "Easy",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  hard: {
    label: "Hard",
    className: "bg-red-500/15 text-red-400 border-red-500/25",
  },
};

const CATEGORY_LABELS: Record<LLDCategory, string> = {
  "object-modeling": "Object Modeling",
  concurrency: "Concurrency",
  "game-design": "Game Design",
  "booking-system": "Booking System",
  infrastructure: "Infrastructure",
  "real-time": "Real-Time",
};

const FREQUENCY_CONFIG: Record<
  InterviewFrequency,
  { label: string; className: string }
> = {
  high: {
    label: "High Frequency",
    className: "bg-red-500/15 text-red-400",
  },
  medium: {
    label: "Medium Frequency",
    className: "bg-amber-500/15 text-amber-400",
  },
  low: {
    label: "Low Frequency",
    className: "bg-blue-500/15 text-blue-400",
  },
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function LLDProblemPage({ params }: Props) {
  const { slug } = await params;
  const problem = getLLDProblemBySlug(slug);
  if (!problem) notFound();

  const related = getRelatedLLDProblems(slug);
  const difficultyInfo = DIFFICULTY_CONFIG[problem.seoDifficulty];
  const frequencyInfo = FREQUENCY_CONFIG[problem.interviewFrequency];

  // -- JSON-LD structured data -------------------------------------------
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "LLD Problems", url: "https://architex.dev/lld-problems" },
    {
      name: problem.name,
      url: `https://architex.dev/lld-problems/${problem.slug}`,
    },
  ]);

  const learningResourceJsonLd = generateLearningResourceJsonLd({
    name: problem.name,
    description: problem.description,
    url: `https://architex.dev/lld-problems/${problem.slug}`,
    educationalLevel:
      problem.seoDifficulty === "easy"
        ? "Beginner"
        : problem.seoDifficulty === "medium"
          ? "Intermediate"
          : "Advanced",
    keywords: [
      problem.name,
      "low-level design",
      "LLD",
      "object-oriented design",
      "interview preparation",
      ...problem.keyPatterns,
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
            <li aria-current="page" className="text-[var(--foreground)]">
              {problem.name}
            </li>
          </ol>
        </nav>

        {/* -- Hero -------------------------------------------------------- */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-medium ${difficultyInfo.className}`}
            >
              {difficultyInfo.label}
            </span>
            <span className="rounded-full bg-[var(--primary)]/15 px-3 py-0.5 text-xs font-medium text-[var(--primary)]">
              {CATEGORY_LABELS[problem.category]}
            </span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${frequencyInfo.className}`}
            >
              {frequencyInfo.label}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {problem.name}
          </h1>
          <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
            {problem.description}
          </p>
        </header>

        {/* -- Requirements ------------------------------------------------ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Requirements
          </h2>
          <ul className="space-y-2">
            {problem.requirements.map((req, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground-muted)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* -- Key Patterns ------------------------------------------------ */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Key Design Patterns
          </h2>
          <div className="flex flex-wrap gap-2">
            {problem.keyPatterns.map((pattern) => (
              <Link
                key={pattern}
                href={`/patterns/${pattern.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full bg-[var(--elevated)] px-3 py-1 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--primary)]/15 hover:text-[var(--primary)]"
              >
                {pattern}
              </Link>
            ))}
          </div>
        </section>

        {/* -- Estimated Complexity ---------------------------------------- */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Estimated Complexity
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">
                ~{problem.classCount}
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                Classes / Interfaces
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">
                {problem.keyPatterns.length}
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                Design Patterns Used
              </div>
            </div>
          </div>
        </section>

        {/* -- Approach Hints ---------------------------------------------- */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Approach Hints
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                1
              </span>
              <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Start by identifying the core entities and their relationships.
                List the nouns in the requirements to find candidate classes.
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                2
              </span>
              <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Define interfaces before implementations. Use the key design
                patterns listed above to guide your abstractions.
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                3
              </span>
              <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Consider extensibility: how would you add a new{" "}
                {problem.category === "game-design"
                  ? "game mode"
                  : problem.category === "booking-system"
                    ? "booking channel"
                    : "feature"}{" "}
                without modifying existing code? Apply the Open/Closed
                Principle.
              </span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                4
              </span>
              <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Write the class diagram first, then implement the most critical
                use case end-to-end before expanding to edge cases.
              </span>
            </div>
          </div>
        </section>

        {/* -- Related Problems -------------------------------------------- */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related Problems
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((rel) => {
                const relDiff = DIFFICULTY_CONFIG[rel.seoDifficulty];
                return (
                  <Link
                    key={rel.slug}
                    href={`/lld-problems/${rel.slug}`}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                        {rel.name}
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

        {/* -- CTA --------------------------------------------------------- */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">
            Design {problem.name} in the LLD Studio
          </h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Open the interactive LLD Studio to model classes, define
            relationships, and validate your design against the requirements.
          </p>
          <Link
            href={`/?lld=${problem.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Open LLD Studio
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
