"use client";

import type { PostmortemOutput } from "@/lib/ai/postmortem-generator";

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h4>
      <ul className="mt-1 space-y-1 text-sm text-zinc-200">
        {items.map((it, i) => (
          <li key={i}>- {it}</li>
        ))}
      </ul>
    </div>
  );
}

export function DrillPostmortem({ pm }: { pm: PostmortemOutput }) {
  return (
    <article className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <p className="text-base text-zinc-100">{pm.tldr}</p>
      <Section title="Strengths" items={pm.strengths} />
      <Section title="Gaps" items={pm.gaps} />
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Pattern commentary
        </h4>
        <p className="mt-1 text-sm text-zinc-200">{pm.patternCommentary}</p>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Tradeoff analysis
        </h4>
        <p className="mt-1 text-sm text-zinc-200">{pm.tradeoffAnalysis}</p>
      </div>
      <Section title="Vs canonical" items={pm.canonicalDiff} />
      <Section title="Follow-ups" items={pm.followUps} />
    </article>
  );
}
