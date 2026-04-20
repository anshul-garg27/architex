"use client";

import type { ItchSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface ItchSectionProps {
  payload: ItchSectionPayload;
}

export function ItchSection({ payload }: ItchSectionProps) {
  return (
    <section
      data-lesson-section="itch"
      aria-labelledby="lesson-section-itch"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          Section 1 · The Itch
        </p>
        <h2
          id="lesson-section-itch"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          {payload.scenario ?? "The problem that makes this pattern necessary"}
        </h2>
      </header>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
      {payload.keywords && payload.keywords.length > 0 ? (
        <p className="mt-6 text-xs text-neutral-500">
          Keywords:{" "}
          {payload.keywords.map((k, i) => (
            <span key={k}>
              {i > 0 ? ", " : ""}
              <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 dark:border-neutral-800 dark:bg-neutral-900">
                {k}
              </span>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}
