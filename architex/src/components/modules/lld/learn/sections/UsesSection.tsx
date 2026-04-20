"use client";

import type { UsesSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface UsesSectionProps {
  payload: UsesSectionPayload;
}

export function UsesSection({ payload }: UsesSectionProps) {
  return (
    <section
      data-lesson-section="uses"
      aria-labelledby="lesson-section-uses"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
          Section 6 · Uses
        </p>
        <h2
          id="lesson-section-uses"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          Where it shows up
        </h2>
      </header>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
      {payload.cases && payload.cases.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {payload.cases.map((c, i) => (
            <li
              key={`${c.company}-${i}`}
              className="rounded-md border border-cyan-200 bg-cyan-50/40 p-4 dark:border-cyan-800 dark:bg-cyan-950/30"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                {c.company} · {c.system}
              </p>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                {c.whyThisPattern}
              </p>
              {c.sourceUrl ? (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-cyan-700 underline dark:text-cyan-300"
                >
                  source →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
