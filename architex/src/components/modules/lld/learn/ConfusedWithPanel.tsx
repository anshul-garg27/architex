"use client";

/**
 * ConfusedWithPanel — renders the "often confused with" entries for the
 * current pattern from the static concept graph. Each entry links to the
 * other pattern's lesson with a one-line reason for the mix-up.
 */

import { getConfusedWith } from "@/lib/lld/concept-graph";

interface ConfusedWithPanelProps {
  patternSlug: string;
  onNavigate?: (slug: string) => void;
}

export function ConfusedWithPanel({
  patternSlug,
  onNavigate,
}: ConfusedWithPanelProps) {
  const items = getConfusedWith(patternSlug);
  if (items.length === 0) return null;

  return (
    <aside
      aria-labelledby={`confused-with-${patternSlug}`}
      className="rounded-md border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h3
        id={`confused-with-${patternSlug}`}
        className="text-xs font-medium uppercase tracking-wider text-amber-800 dark:text-amber-200"
      >
        Often confused with
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.patternSlug}>
            <button
              type="button"
              onClick={() => onNavigate?.(item.patternSlug)}
              className="w-full rounded border border-amber-300 bg-white px-2 py-1.5 text-left text-xs text-amber-900 hover:border-amber-400 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
            >
              <span className="font-mono font-medium">
                {item.patternSlug}
              </span>
              <span className="mt-0.5 block text-[11px] font-normal text-amber-700 dark:text-amber-300">
                {item.reason}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
