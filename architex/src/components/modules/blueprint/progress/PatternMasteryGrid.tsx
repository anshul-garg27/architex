"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Pattern catalog from the shared LLD data. SP2 can't import the full
 * pattern objects (they include large data arrays) — only the slugs
 * + display metadata needed for the grid. When SP4 lands we swap this
 * for a live fetch from the Patterns Library API, but for V1 we hard-
 * code the 12 V1-covered patterns plus a dim "in the library" tile
 * for the rest.
 *
 * In SP2 every cell is "introduced" by default — FSRS mastery state
 * wires up in SP6. The grid is still worth shipping because it
 * provides the map of where we are.
 */
interface PatternEntry {
  slug: string;
  name: string;
  category: "creational" | "structural" | "behavioral";
  inCurriculum: boolean;
}

const CATALOG: PatternEntry[] = [
  { slug: "singleton", name: "Singleton", category: "creational", inCurriculum: true },
  { slug: "factory-method", name: "Factory Method", category: "creational", inCurriculum: true },
  { slug: "abstract-factory", name: "Abstract Factory", category: "creational", inCurriculum: true },
  { slug: "builder", name: "Builder", category: "creational", inCurriculum: true },
  { slug: "prototype", name: "Prototype", category: "creational", inCurriculum: true },

  { slug: "adapter", name: "Adapter", category: "structural", inCurriculum: true },
  { slug: "bridge", name: "Bridge", category: "structural", inCurriculum: true },
  { slug: "composite", name: "Composite", category: "structural", inCurriculum: true },
  { slug: "decorator", name: "Decorator", category: "structural", inCurriculum: true },
  { slug: "facade", name: "Facade", category: "structural", inCurriculum: true },
  { slug: "flyweight", name: "Flyweight", category: "structural", inCurriculum: true },
  { slug: "proxy", name: "Proxy", category: "structural", inCurriculum: true },

  { slug: "chain-of-responsibility", name: "Chain of Responsibility", category: "behavioral", inCurriculum: true },
  { slug: "command", name: "Command", category: "behavioral", inCurriculum: true },
  { slug: "iterator", name: "Iterator", category: "behavioral", inCurriculum: true },
  { slug: "mediator", name: "Mediator", category: "behavioral", inCurriculum: true },
  { slug: "memento", name: "Memento", category: "behavioral", inCurriculum: true },
  { slug: "observer", name: "Observer", category: "behavioral", inCurriculum: true },
  { slug: "state", name: "State", category: "behavioral", inCurriculum: true },
  { slug: "strategy", name: "Strategy", category: "behavioral", inCurriculum: true },
  { slug: "template-method", name: "Template Method", category: "behavioral", inCurriculum: true },
  { slug: "visitor", name: "Visitor", category: "behavioral", inCurriculum: true },
];

type CategoryFilter = "all" | "creational" | "structural" | "behavioral";

const CATEGORY_LABEL: Record<Exclude<CategoryFilter, "all">, string> = {
  creational: "Creational",
  structural: "Structural",
  behavioral: "Behavioral",
};

export function PatternMasteryGrid() {
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? CATALOG
        : CATALOG.filter((p) => p.category === filter),
    [filter],
  );

  const filterChips: Array<{ id: CategoryFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "creational", label: "Creational" },
    { id: "structural", label: "Structural" },
    { id: "behavioral", label: "Behavioral" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Pattern mastery
          </h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Curriculum-covered patterns · {CATALOG.length} total
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filterChips.map((c) => {
          const active = c.id === filter;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-indigo-400 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                  : "border-border bg-background/60 text-foreground-muted hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((p) => (
          <Link
            key={p.slug}
            href={`/modules/blueprint/toolkit/patterns/${p.slug}`}
            className="group relative flex flex-col gap-2 rounded-xl border border-border/40 bg-background/60 p-3 transition-colors hover:border-indigo-400/60"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                {CATEGORY_LABEL[p.category]}
              </span>
              <span
                aria-label="Mastery · introduced"
                className="inline-block h-2 w-2 rounded-full bg-foreground/20"
              />
            </div>
            <p className="text-sm font-medium leading-tight text-foreground">
              {p.name}
            </p>
            <p className="text-[10px] text-foreground-muted">
              Introduced
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-foreground-muted">
        Mastery level fills in as you review. In SP6 each cell will show
        four bands (introduced / completed / mastered / lapsed) driven
        by your FSRS review history.
      </p>
    </div>
  );
}
