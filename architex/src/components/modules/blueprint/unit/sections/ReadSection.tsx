"use client";

import { BlueprintMDXRenderer } from "../MDXRenderer";
import type { ReadSectionParams } from "@/lib/blueprint/section-types";

/**
 * Renders a read-type section. Content is compiled MDX. Auto-completion
 * is handled by the parent Unit page via IntersectionObserver, not by
 * this component — a read section just renders text.
 */
export function ReadSection({
  title,
  params,
}: {
  title: string;
  params: ReadSectionParams;
}) {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <header className="mb-4">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-foreground-muted">
          ~{Math.round(params.estimatedSeconds / 60) || 1} min read
        </p>
      </header>
      <div className="prose prose-sm max-w-none leading-relaxed text-foreground dark:prose-invert [&_p]:my-3 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:my-3 [&_ol]:my-3 [&_code]:font-mono [&_code]:text-[0.92em]">
        <BlueprintMDXRenderer compiled={params.compiled} />
      </div>
    </div>
  );
}
