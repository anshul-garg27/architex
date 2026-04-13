import type { Metadata } from "next";
import Link from "next/link";
import {
  CHALLENGES,
  ALL_CATEGORIES,
  type ChallengeDefinition,
} from "@/lib/interview/challenges";
import { ProblemsListClient } from "./problems-list-client";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "System Design Problems — Practice 51 Interview Challenges | Architex",
  description:
    "Browse 51 system design interview problems across classic, modern, infrastructure, and advanced categories. Filter by difficulty and practice on an interactive canvas.",
  openGraph: {
    title: "System Design Problems — Practice 51 Interview Challenges | Architex",
    description:
      "Browse 51 system design interview problems across classic, modern, infrastructure, and advanced categories.",
    url: "https://architex.dev/problems",
    siteName: "Architex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "System Design Problems | Architex",
    description:
      "Browse 51 system design interview problems. Filter by difficulty and category.",
  },
};

// ---------------------------------------------------------------------------
// Page (server component — passes data to client for interactivity)
// ---------------------------------------------------------------------------
export default function ProblemsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/landing"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            System Design Problems
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            {CHALLENGES.length} interview challenges across {ALL_CATEGORIES.length} categories.
            Filter by difficulty or category, then practice on the interactive canvas.
          </p>
        </header>

        {/* Client-side interactive list with search/filter */}
        <ProblemsListClient challenges={CHALLENGES} />
      </div>
    </div>
  );
}
