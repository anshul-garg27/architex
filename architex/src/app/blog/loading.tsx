/**
 * Blog route loading skeleton — card grid matching BlogPage layout.
 * Server component (no "use client").
 */
export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <header className="mb-10">
          <div className="mb-6 h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        </header>

        {/* Card grid skeleton — 6 cards matching sm:grid-cols-2 lg:grid-cols-3 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-border bg-surface p-4"
            >
              {/* Tags */}
              <div className="mb-3 flex gap-1.5">
                <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              {/* Title */}
              <div className="mb-2 h-5 w-full animate-pulse rounded bg-muted" />
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
              {/* Excerpt */}
              <div className="mb-4 flex-1 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
              {/* Meta */}
              <div className="flex items-center gap-3">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-14 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
