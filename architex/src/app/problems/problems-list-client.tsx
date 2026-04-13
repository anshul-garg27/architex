"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ChallengeDefinition } from "@/lib/interview/challenges";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<ChallengeDefinition["category"], string> = {
  classic: "Classic",
  modern: "Modern",
  infrastructure: "Infrastructure",
  advanced: "Advanced",
  lld: "Low-Level Design",
};

const DIFFICULTIES = [1, 2, 3, 4, 5] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProblemsListClient({
  challenges,
}: {
  challenges: ChallengeDefinition[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ChallengeDefinition["category"] | "all"
  >("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let results = challenges;

    if (selectedCategory !== "all") {
      results = results.filter((c) => c.category === selectedCategory);
    }

    if (selectedDifficulty !== null) {
      results = results.filter((c) => c.difficulty === selectedDifficulty);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.concepts.some((concept) => concept.toLowerCase().includes(q)) ||
          c.companies.some((company) => company.toLowerCase().includes(q)),
      );
    }

    return results;
  }, [challenges, search, selectedCategory, selectedDifficulty]);

  return (
    <>
      {/* Filters bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search problems, concepts, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search problems"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--elevated)]"
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as ChallengeDefinition["category"][]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? "all" : cat)
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--elevated)]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ),
          )}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-1.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() =>
                setSelectedDifficulty(selectedDifficulty === d ? null : d)
              }
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                selectedDifficulty === d
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--elevated)]"
              }`}
              aria-label={`Difficulty ${d}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-[var(--foreground-subtle)]">
        {filtered.length} {filtered.length === 1 ? "problem" : "problems"}
      </p>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-[var(--foreground-muted)]">
            No problems match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
function ChallengeCard({ challenge }: { challenge: ChallengeDefinition }) {
  return (
    <Link
      href={`/problems/${challenge.id}`}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
    >
      {/* Top row: category + difficulty */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-[var(--primary)]/15 px-2.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
          {CATEGORY_LABELS[challenge.category]}
        </span>
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={`h-3 w-3 ${i < challenge.difficulty ? "text-amber-400" : "text-[var(--foreground-subtle)]/20"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
          ))}
        </span>
      </div>

      {/* Title */}
      <h2 className="mb-2 text-base font-semibold leading-tight group-hover:text-[var(--primary)]">
        {challenge.title}
      </h2>

      {/* Description (truncated) */}
      <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
        {challenge.description}
      </p>

      {/* Footer: time + concepts */}
      <div className="flex items-center justify-between text-[10px] text-[var(--foreground-subtle)]">
        <span>{challenge.timeMinutes} min</span>
        <span className="truncate max-w-[60%] text-right">
          {challenge.concepts.slice(0, 2).join(", ")}
        </span>
      </div>
    </Link>
  );
}
