import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CHALLENGES,
  getChallengeById,
  type ChallengeDefinition,
} from "@/lib/interview/challenges";
import { problemMetaDescription } from "@/lib/seo/meta-templates";
import { getRelatedConceptsForProblem } from "@/lib/seo/internal-links";

// ---------------------------------------------------------------------------
// Static generation for all 51 challenge slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ slug: c.id }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const challenge = getChallengeById(slug);
  if (!challenge) return { title: "Problem Not Found — Architex" };

  const title = `${challenge.title} — System Design Practice | Architex`;
  const description = problemMetaDescription(challenge.title, challenge.companies);

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(challenge.title)}&type=problem&difficulty=${encodeURIComponent(String(challenge.difficulty))}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/problems/${challenge.id}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: challenge.title }],
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
function DifficultyStars({ level }: { level: ChallengeDefinition["difficulty"] }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Difficulty ${level} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < level ? "text-amber-400" : "text-[var(--foreground-subtle)]/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </span>
  );
}

const CATEGORY_LABELS: Record<ChallengeDefinition["category"], string> = {
  classic: "Classic",
  modern: "Modern",
  infrastructure: "Infrastructure",
  advanced: "Advanced",
  lld: "Low-Level Design",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  const challenge = getChallengeById(slug);
  if (!challenge) notFound();

  const relatedConcepts = getRelatedConceptsForProblem(slug);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/problems"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All Problems
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[var(--primary)]/15 px-3 py-0.5 text-xs font-medium text-[var(--primary)]">
              {CATEGORY_LABELS[challenge.category]}
            </span>
            <DifficultyStars level={challenge.difficulty} />
            <span className="text-xs text-[var(--foreground-muted)]">
              {challenge.timeMinutes} min
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {challenge.title}
          </h1>
        </header>

        {/* Description */}
        <section className="mb-8">
          <p className="leading-relaxed text-[var(--foreground-muted)]">
            {challenge.description}
          </p>
        </section>

        {/* Companies */}
        {challenge.companies.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Asked at
            </h2>
            <div className="flex flex-wrap gap-2">
              {challenge.companies.map((company) => (
                <span
                  key={company}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground-muted)]"
                >
                  {company}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Requirements */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Requirements
          </h2>
          <ul className="space-y-2">
            {challenge.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* Key Concepts */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Key Concepts
          </h2>
          <div className="flex flex-wrap gap-2">
            {challenge.concepts.map((concept) => (
              <span
                key={concept}
                className="rounded-full bg-[var(--elevated)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
              >
                {concept}
              </span>
            ))}
          </div>
        </section>

        {/* Related Concepts */}
        {relatedConcepts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related Concepts
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedConcepts.map((concept) => (
                <Link
                  key={concept.slug}
                  href={`/concepts/${concept.slug}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                      {concept.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        concept.difficulty === "beginner"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                          : concept.difficulty === "intermediate"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                            : "bg-red-500/15 text-red-400 border-red-500/25"
                      }`}
                    >
                      {concept.difficulty.charAt(0).toUpperCase() + concept.difficulty.slice(1)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
                    {concept.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">Ready to solve this?</h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Open the interactive canvas and design your architecture in real time.
          </p>
          <Link
            href={`/?challenge=${challenge.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Practice This Challenge
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
