/**
 * Modules route loading skeleton — header + filters + module card grid
 * matching ModulesPage layout.
 * Server component (no "use client").
 */
export default function ModulesLoading() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Filters row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="h-9 w-full flex-1 animate-pulse rounded-lg bg-muted sm:max-w-xs" />
          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="flex overflow-hidden rounded-lg border border-border bg-surface">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-16 animate-pulse border-l border-border bg-muted first:border-l-0"
                />
              ))}
            </div>
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>

        {/* Module card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4"
            >
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
                </div>
              </div>
              {/* Description */}
              <div className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              </div>
              {/* Progress bar */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-8 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
              </div>
              {/* Footer */}
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
