/**
 * Dashboard route loading skeleton — stats cards + quick actions + activity panel
 * matching DashboardPage layout.
 * Server component (no "use client").
 */
export default function DashboardLoading() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>

        {/* Stats cards — 4 columns */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-12 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions — 3 columns */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section — 2 columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity panel */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <div className="mt-0.5 h-7 w-7 shrink-0 animate-pulse rounded-md bg-muted" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3.5 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Daily Challenge + Recommendations */}
          <div className="flex flex-col gap-6">
            {/* Daily Challenge */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="ml-auto h-4 w-14 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-6 w-52 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-36 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-9 w-32 animate-pulse rounded-lg bg-muted" />
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg p-2"
                  >
                    <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
