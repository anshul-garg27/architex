import Link from "next/link";
import { FileQuestion, LayoutDashboard, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/10">
        <FileQuestion className="h-10 w-10 text-violet-400" />
      </div>

      {/* 404 heading */}
      <h1 className="text-7xl font-extrabold tracking-tighter text-foreground sm:text-8xl">
        404
      </h1>

      {/* Message */}
      <p className="mt-4 max-w-md text-base text-foreground-muted">
        This page doesn&apos;t exist or has been moved.
      </p>

      {/* CTA buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <LayoutDashboard className="h-4 w-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/modules"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <BookOpen className="h-4 w-4" />
          Browse Modules
        </Link>
      </div>

      {/* Subtle decorative line */}
      <div className="mt-12 h-px w-16 bg-border" />
      <p className="mt-4 text-xs text-foreground-subtle">
        Architex
      </p>
    </div>
  );
}
