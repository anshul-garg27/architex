/**
 * Gallery route loading skeleton — header + toolbar + card grid
 * matching GalleryPage layout.
 * Server component (no "use client").
 */
export default function GalleryLoading() {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-px bg-border" />
          <div>
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-3 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-border/50 px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="h-9 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
          {/* Filter + sort pills */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-20 animate-pulse rounded-full bg-muted"
                />
              ))}
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-16 animate-pulse rounded-full bg-muted"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/50 bg-surface"
            >
              {/* Thumbnail */}
              <div className="h-36 animate-pulse bg-muted" />
              {/* Content */}
              <div className="space-y-3 p-4">
                <div>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                </div>
                {/* Tags */}
                <div className="flex gap-1">
                  <div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-10 animate-pulse rounded-full bg-muted" />
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/30 pt-2">
                  <div className="flex gap-3">
                    <div className="h-3.5 w-10 animate-pulse rounded bg-muted" />
                    <div className="h-3.5 w-10 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
