import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  COMPANIES,
  getCompanyBySlug,
  type InterviewDifficulty,
} from "@/lib/seo/company-data";
import {
  generateLearningResourceJsonLd,
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
} from "@/lib/seo/json-ld";
import { companyMetaDescription } from "@/lib/seo/meta-templates";
import { JsonLd } from "@/components/seo/JsonLd";

// ---------------------------------------------------------------------------
// Static generation for all 15 company slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return COMPANIES.map((c) => ({ company: c.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ company: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await params;
  const data = getCompanyBySlug(company);
  if (!data) return { title: "Company Not Found — Architex" };

  const title = `${data.name} System Design Interview Prep | Architex`;
  const description = companyMetaDescription(data.name, data.focusAreas);

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(`${data.name} Interview Prep`)}&type=interview&difficulty=${encodeURIComponent(data.difficulty)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/interviews/${data.slug}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${data.name} System Design Interview` }],
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
  InterviewDifficulty,
  { label: string; className: string }
> = {
  medium: {
    label: "Medium",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
  hard: {
    label: "Hard",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
  "very-hard": {
    label: "Very Hard",
    className: "bg-red-500/15 text-red-400 border-red-500/25",
  },
};

// Chevron separator reused in breadcrumbs
function ChevronSeparator() {
  return (
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
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function CompanyInterviewPage({ params }: Props) {
  const { company } = await params;
  const data = getCompanyBySlug(company);
  if (!data) notFound();

  const difficultyInfo = DIFFICULTY_CONFIG[data.difficulty];

  // ── JSON-LD structured data ─────────────────────────────────────
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "https://architex.dev" },
    { name: "Interviews", url: "https://architex.dev/interviews" },
    {
      name: data.name,
      url: `https://architex.dev/interviews/${data.slug}`,
    },
  ]);

  const learningResourceJsonLd = generateLearningResourceJsonLd({
    name: `${data.name} System Design Interview Preparation`,
    description: data.description,
    url: `https://architex.dev/interviews/${data.slug}`,
    educationalLevel:
      data.difficulty === "medium"
        ? "Intermediate"
        : "Advanced",
    keywords: [
      data.name,
      "system design interview",
      "interview preparation",
      ...data.focusAreas,
    ],
  });

  const faqJsonLd = generateFAQJsonLd(
    data.sampleQuestions.map((q) => ({
      question: q.question,
      answer: `This is a common ${data.name} system design interview question. ${q.hint}`,
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
              <ChevronSeparator />
            </li>
            <li>
              <Link
                href="/interviews"
                className="transition-colors hover:text-[var(--primary)]"
              >
                Interviews
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronSeparator />
            </li>
            <li aria-current="page" className="text-[var(--foreground)]">
              {data.name}
            </li>
          </ol>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-2xl font-bold text-[var(--primary)]">
              {data.logo}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {data.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-medium ${difficultyInfo.className}`}
                >
                  {difficultyInfo.label}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {data.averageDuration}
                </span>
              </div>
            </div>
          </div>
          <p className="leading-relaxed text-[var(--foreground-muted)]">
            {data.description}
          </p>
        </header>

        {/* ── Interview Style ─────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Interview Style
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="leading-relaxed text-[var(--foreground-muted)]">
              {data.interviewStyle}
            </p>
          </div>
        </section>

        {/* ── Interview Rounds ────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Interview Rounds
          </h2>
          <ol className="space-y-3">
            {data.interviewRounds.map((round, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {round}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Focus Areas ─────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Key Focus Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--primary)]"
              >
                {area}
              </span>
            ))}
          </div>
        </section>

        {/* ── Common Topics Grid ──────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Common Topics
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.commonTopics.map((topic) => (
              <div
                key={topic}
                className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                <span className="text-sm text-[var(--foreground-muted)]">
                  {topic}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample Questions ────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Sample Interview Questions
          </h2>
          <div className="space-y-4">
            {data.sampleQuestions.map((sq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <summary className="flex cursor-pointer items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium leading-relaxed text-[var(--foreground)]">
                    {sq.question}
                  </span>
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <div className="border-t border-[var(--border)] px-4 py-3">
                  <p className="pl-9 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {sq.hint}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Tips and Tricks ─────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Tips & Tricks
          </h2>
          <ul className="space-y-3">
            {data.tipsAndTricks.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
                <span className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Related Concepts Grid ───────────────────────────────── */}
        {data.relatedConcepts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related Concepts
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.relatedConcepts.map((concept) => (
                <Link
                  key={concept}
                  href={`/concepts/${concept}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
                >
                  {concept
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">
            Practice {data.name} Interview Questions
          </h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Open the interactive canvas and solve system design challenges
            commonly asked at {data.name}.
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Start Practicing
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
