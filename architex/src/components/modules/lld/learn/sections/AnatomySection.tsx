"use client";

import type { AnatomySectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface AnatomySectionProps {
  payload: AnatomySectionPayload;
}

export function AnatomySection({ payload }: AnatomySectionProps) {
  return (
    <section
      data-lesson-section="anatomy"
      aria-labelledby="lesson-section-anatomy"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
          Section 4 · Anatomy
        </p>
        <h2
          id="lesson-section-anatomy"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          Anatomy
        </h2>
      </header>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
      {payload.classes && payload.classes.length > 0 ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          {payload.classes.map((c) => (
            <div
              key={c.classId}
              className="rounded-md border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-800 dark:bg-purple-950/30"
            >
              <dt className="font-mono text-sm font-medium text-purple-900 dark:text-purple-200">
                {c.role}
              </dt>
              <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {c.responsibility}
              </dd>
              {c.keyMethod ? (
                <p className="mt-2 font-mono text-xs text-purple-700 dark:text-purple-300">
                  {c.keyMethod}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
