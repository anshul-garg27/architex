import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold text-foreground">Sign In</h1>
        <p className="mb-6 text-sm text-foreground-muted">
          Authentication will be available once Clerk is configured.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Continue to App
        </Link>
      </div>
    </div>
  );
}
