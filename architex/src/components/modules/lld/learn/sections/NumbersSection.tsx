"use client";

import type { NumbersSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface NumbersSectionProps {
  payload: NumbersSectionPayload;
}

export function NumbersSection({ payload }: NumbersSectionProps) {
  return (
    <section
      data-lesson-section="numbers"
      aria-labelledby="lesson-section-numbers"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
          Section 5 · Numbers
        </p>
        <h2
          id="lesson-section-numbers"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          Numbers
        </h2>
      </header>
      {payload.headline && payload.headline.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {payload.headline.map((h) => (
            <div
              key={h.label}
              className="rounded-md border border-rose-200 bg-rose-50/40 p-4 text-center dark:border-rose-800 dark:bg-rose-950/30"
            >
              <p className="text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
                {h.label}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                {h.value}
                {h.unit ? (
                  <span className="ml-1 text-sm text-neutral-500">
                    {h.unit}
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
    </section>
  );
}
