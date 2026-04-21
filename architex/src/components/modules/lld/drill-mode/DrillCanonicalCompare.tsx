"use client";

import type { CanonicalSolution } from "@/lib/lld/drill-canonical";

export function DrillCanonicalCompare({
  userClasses,
  canonical,
}: {
  userClasses: Array<{ name: string }>;
  canonical: CanonicalSolution;
}) {
  const userNames = new Set(userClasses.map((c) => c.name.toLowerCase()));
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          You drew
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-zinc-200">
          {userClasses.length === 0 && (
            <li className="italic text-zinc-500">(no classes)</li>
          )}
          {userClasses.map((c) => (
            <li key={c.name}>- {c.name}</li>
          ))}
        </ul>
      </section>
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Canonical
        </h4>
        <ul className="mt-2 space-y-1 text-sm">
          {canonical.classes.map((c) => {
            const missed = !userNames.has(c.name.toLowerCase());
            return (
              <li
                key={c.name}
                className={missed ? "text-amber-300" : "text-zinc-200"}
              >
                - {c.name}
                {missed && (
                  <span className="ml-2 text-xs text-amber-400">(missed)</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
