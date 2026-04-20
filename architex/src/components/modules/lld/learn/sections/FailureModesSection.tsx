"use client";

import type { FailureModesSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface FailureModesSectionProps {
  payload: FailureModesSectionPayload;
}

const severityStyles = {
  low: "border-amber-200 bg-amber-50/40 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  medium:
    "border-orange-300 bg-orange-50/60 text-orange-900 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-100",
  high: "border-red-400 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950/50 dark:text-red-100",
};

export function FailureModesSection({ payload }: FailureModesSectionProps) {
  return (
    <section
      data-lesson-section="failure_modes"
      aria-labelledby="lesson-section-failure_modes"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
          Section 7 · Failure Modes
        </p>
        <h2
          id="lesson-section-failure_modes"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          How this breaks
        </h2>
      </header>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
      {payload.modes && payload.modes.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {payload.modes.map((m, i) => (
            <li
              key={`${m.title}-${i}`}
              className={`rounded-md border p-4 ${severityStyles[m.severity]}`}
            >
              <p className="text-sm font-medium">{m.title}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">What goes wrong: </span>
                {m.whatGoesWrong}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">How to avoid: </span>
                {m.howToAvoid}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
