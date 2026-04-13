/**
 * Interviews route loading skeleton — header + search + card grid
 * matching InterviewsIndexPage layout.
 * Server component (no "use client").
 */
export default function InterviewsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <header className="mb-10">
          <div className="mb-6 h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-9 w-60 animate-pulse rounded-md bg-muted" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
        </header>

        {/* Search bar skeleton */}
        <div className="mb-8 h-10 w-full max-w-sm animate-pulse rounded-lg bg-muted" />

        {/* Company card grid — flat list, no groups */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
            >
              {/* Badge */}
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              {/* Company name */}
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              {/* Description */}
              <div className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
