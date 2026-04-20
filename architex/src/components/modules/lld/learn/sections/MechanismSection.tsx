"use client";

import type { MechanismSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface MechanismSectionProps {
  payload: MechanismSectionPayload;
}

export function MechanismSection({ payload }: MechanismSectionProps) {
  return (
    <section
      data-lesson-section="mechanism"
      aria-labelledby="lesson-section-mechanism"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Section 3 · Mechanism
        </p>
        <h2
          id="lesson-section-mechanism"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          Mechanism
        </h2>
      </header>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
      {payload.steps && payload.steps.length > 0 ? (
        <ol className="mt-8 space-y-4">
          {payload.steps.map((step) => (
            <li
              key={step.index}
              className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Step {step.index}
              </p>
              <h3 className="mt-1 text-lg font-medium text-neutral-900 dark:text-neutral-50">
                {step.title}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {step.markdown}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
