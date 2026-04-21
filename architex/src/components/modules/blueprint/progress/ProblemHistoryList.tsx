"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Problem drill history. V1 placeholder — the real data source is
 * the `lld_drill_attempts` table (LLD Phase 1) which we'll query once
 * the Problems Workspace (SP5) is wired to write Blueprint-scoped
 * attempt rows. For SP2 we render an empty-state that reads as
 * "you haven't drilled anything yet" and links into the toolkit.
 */
export function ProblemHistoryList() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">
          Problem history
        </h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Your drill attempts and grades across the 33 problems.
        </p>
      </header>

      <div className="rounded-xl border border-border/40 bg-background/60 p-8 text-center">
        <p className="text-sm text-foreground-muted">
          You haven&apos;t drilled anything yet.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-foreground-subtle">
          Pick a problem from the workspace and spend 10 minutes on it.
          Scored attempts show up here automatically.
        </p>
        <Link
          href="/modules/blueprint/toolkit/problems"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600"
        >
          Open the problems workspace
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
