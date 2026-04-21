export default function BlueprintLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
        Loading Blueprint…
      </div>
    </div>
  );
}
