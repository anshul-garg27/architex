export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-md text-muted-foreground">
        Architex works best with an internet connection, but your diagrams are
        saved locally.
      </p>
    </main>
  );
}
