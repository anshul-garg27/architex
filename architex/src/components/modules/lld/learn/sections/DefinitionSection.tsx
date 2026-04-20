"use client";

import type { DefinitionSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";

interface DefinitionSectionProps {
  payload: DefinitionSectionPayload;
}

export function DefinitionSection({ payload }: DefinitionSectionProps) {
  return (
    <section
      data-lesson-section="definition"
      aria-labelledby="lesson-section-definition"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          Section 2 · Definition
        </p>
        <h2
          id="lesson-section-definition"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          Definition
        </h2>
      </header>
      {payload.oneLiner ? (
        <blockquote className="mb-6 border-l-4 border-blue-400 bg-blue-50/40 px-4 py-3 font-serif text-lg italic leading-snug text-neutral-800 dark:border-blue-600 dark:bg-blue-950/30 dark:text-neutral-100">
          {payload.oneLiner}
        </blockquote>
      ) : null}
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <MDXRenderer compiled={payload} />
      </div>
      {payload.canonicalSource ? (
        <p className="mt-6 text-xs italic text-neutral-500">
          — {payload.canonicalSource}
        </p>
      ) : null}
    </section>
  );
}
