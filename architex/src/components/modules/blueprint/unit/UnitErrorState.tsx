"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shown when a unit exists in the DB but has no recipe sections yet
 * (publishedAt is null or recipeJson.sections is empty).
 */
export function UnitErrorState({
  kind,
}: {
  kind: "not-found" | "empty-recipe";
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
        {kind === "not-found" ? "Unit not found" : "Unit not yet authored"}
      </p>
      <h2 className="font-serif text-2xl italic text-foreground">
        {kind === "not-found"
          ? "That unit doesn't exist."
          : "This unit is still being authored."}
      </h2>
      <p className="max-w-md text-sm text-foreground-muted">
        {kind === "not-found"
          ? "Check the URL or browse the curriculum map."
          : "Its content is scheduled for a later authoring wave — check back soon, or pick another unit from the map."}
      </p>
      <Link
        href="/modules/blueprint"
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-4 py-2 text-xs font-semibold text-foreground hover:border-indigo-400/60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to the curriculum
      </Link>
    </div>
  );
}
