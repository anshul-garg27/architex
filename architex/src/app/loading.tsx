export default function Loading() {
  return (
    <div className="flex h-screen bg-background">
      {/* Left sidebar — activity bar (narrow icon column) */}
      <div className="flex w-12 flex-col items-center gap-4 border-r border-border bg-sidebar py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-6 w-6 animate-pulse rounded bg-muted"
          />
        ))}
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1">
          {/* Center — canvas area with subtle grid */}
          <div className="relative flex-1 bg-canvas-bg">
            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Placeholder "nodes" */}
            <div className="absolute left-[15%] top-[20%] h-16 w-36 animate-pulse rounded-lg bg-muted" />
            <div className="absolute left-[45%] top-[35%] h-16 w-36 animate-pulse rounded-lg bg-muted" />
            <div className="absolute left-[30%] top-[60%] h-16 w-36 animate-pulse rounded-lg bg-muted" />
          </div>

          {/* Right panel — properties placeholder */}
          <div className="hidden w-64 flex-col border-l border-border bg-sidebar p-3 lg:flex">
            {/* Panel header */}
            <div className="mb-4 h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />

            {/* Form field placeholders */}
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-7 w-full animate-pulse rounded-md bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom panel — tab bar + content */}
        <div className="border-t border-border bg-sidebar">
          {/* Tab bar */}
          <div className="flex gap-4 border-b border-border px-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-3 w-16 animate-pulse rounded bg-muted"
              />
            ))}
          </div>
          {/* Content area */}
          <div className="h-28 p-3">
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex h-6 items-center border-t border-border bg-statusbar px-3">
          <div className="h-2 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
