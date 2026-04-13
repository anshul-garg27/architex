import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  OS_CONCEPTS,
  getOSConceptBySlug,
  getRelatedOSConcepts,
  type OSConceptDifficulty,
} from "@/lib/seo/os-concepts-data";
import {
  generateLearningResourceJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// ---------------------------------------------------------------------------
// Static generation for all 6 OS concept slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return OS_CONCEPTS.map((c) => ({ concept: c.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ concept: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { concept } = await params;
  const data = getOSConceptBySlug(concept);
  if (!data) return { title: "OS Concept Not Found — Architex" };

  const title = `${data.name} — Operating System Concept | Architex`;
  const description = data.description;

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(data.name)}&type=os-concept&difficulty=${encodeURIComponent(data.difficulty)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/os/${data.slug}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: data.name }],
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
  OSConceptDifficulty,
  { label: string; className: string }
> = {
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
// Page component
// ---------------------------------------------------------------------------
export default async function OSConceptPage({ params }: Props) {
  const { concept } = await params;
  const data = getOSConceptBySlug(concept);
  if (!data) notFound();

  const related = getRelatedOSConcepts(concept);
  const difficultyInfo = DIFFICULTY_CONFIG[data.difficulty];

  // ── JSON-LD structured data ─────────────────────────────────────
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "OS Concepts", url: "https://architex.dev/os" },
    {
      name: data.name,
      url: `https://architex.dev/os/${data.slug}`,
    },
  ]);

  const learningResourceJsonLd = generateLearningResourceJsonLd({
    name: data.name,
    description: data.description,
    url: `https://architex.dev/os/${data.slug}`,
    educationalLevel:
      data.difficulty === "beginner"
        ? "Beginner"
        : data.difficulty === "intermediate"
          ? "Intermediate"
          : "Advanced",
    keywords: [data.name, "operating systems", ...data.keywords],
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <JsonLd data={[breadcrumbJsonLd, learningResourceJsonLd]} />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/landing" },
            { label: "OS Concepts", href: "/os" },
            { label: data.name },
          ]}
        />

        {/* ── Hero ────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-medium ${difficultyInfo.className}`}
            >
              {difficultyInfo.label}
            </span>
            <span className="rounded-full bg-[var(--primary)]/15 px-3 py-0.5 text-xs font-medium text-[var(--primary)]">
              Operating Systems
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {data.name}
          </h1>
          <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
            {data.description}
          </p>
        </header>

        {/* ── Algorithms Covered ──────────────────────────────────── */}
        {data.algorithms.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Algorithms Covered
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.algorithms.map((algo) => (
                <span
                  key={algo}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground-muted)]"
                >
                  {algo}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Interactive Visualization Placeholder ──────────────── */}
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
                    d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold">
                Interactive Simulation
              </h2>
              <p className="mb-4 text-sm text-[var(--foreground-muted)]">
                Explore {data.name} with an interactive visualization on the
                Architex canvas.
              </p>
              <Link
                href={`/?os-concept=${data.slug}`}
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

        {/* ── Detailed Explanation (server-rendered for crawlers) ── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Deep Dive
          </h2>
          <div className="space-y-4">
            {data.explanation.map((paragraph, i) => (
              <p
                key={i}
                className="leading-relaxed text-[var(--foreground-muted)]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* ── Interview Questions ──────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Common Interview Questions
          </h2>
          <ul className="space-y-3">
            {data.interviewQuestions.map((question, i) => (
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

        {/* ── Related OS Concepts Grid ─────────────────────────────── */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related OS Concepts
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((rel) => {
                const relDiff = DIFFICULTY_CONFIG[rel.difficulty];
                return (
                  <Link
                    key={rel.slug}
                    href={`/os/${rel.slug}`}
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

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">
            Practice {data.name} in Action
          </h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Open the interactive simulation and explore how{" "}
            {data.name.toLowerCase()} works step by step.
          </p>
          <Link
            href={`/?os-concept=${data.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Start Simulation
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
