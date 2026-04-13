/**
 * LLD Problems route loading skeleton — header + search + grouped card grid
 * matching LLDProblemsIndexPage layout.
 * Server component (no "use client").
 */
export default function LLDProblemsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <header className="mb-10">
          <div className="mb-6 h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-9 w-72 animate-pulse rounded-md bg-muted" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
        </header>

        {/* Search bar skeleton */}
        <div className="mb-8 h-10 w-full max-w-sm animate-pulse rounded-lg bg-muted" />

        {/* Category groups */}
        {Array.from({ length: 3 }).map((_, gi) => (
          <div key={gi} className="mb-8">
            {/* Group label */}
            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
            {/* Problem list items — table-like rows */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, ri) => (
                <div
                  key={ri}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
                >
                  {/* Difficulty badge */}
                  <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
                  {/* Title + description */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                  {/* Arrow placeholder */}
                  <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
