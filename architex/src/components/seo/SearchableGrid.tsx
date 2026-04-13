"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface GridItem {
  slug: string;
  title: string;
  description: string;
  href: string;
  badges: { label: string; className: string }[];
}

interface GroupedItems {
  label: string;
  items: GridItem[];
}

interface SearchableGridProps {
  items: GridItem[];
  /** When supplied the grid is grouped by category instead of a flat list. */
  groups?: GroupedItems[];
  placeholder?: string;
}

export function SearchableGrid({ items, groups, placeholder = "Search..." }: SearchableGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return groups ?? [{ label: "", items }];
    const match = (item: GridItem) =>
      item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    if (groups) {
      return groups
        .map((g) => ({ ...g, items: g.items.filter(match) }))
        .filter((g) => g.items.length > 0);
    }
    return [{ label: "", items: items.filter(match) }];
  }, [query, items, groups]);

  const totalVisible = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      {/* Search input */}
      <div className="mb-8">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          {totalVisible} result{totalVisible !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      {filtered.map((group) => (
        <section key={group.label} className="mb-10">
          {group.label && (
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              {group.label}
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
                    {item.title}
                  </h3>
                  {item.badges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
                <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {totalVisible === 0 && (
        <p className="py-12 text-center text-sm text-[var(--foreground-muted)]">
          No results found for &ldquo;{query}&rdquo;.
        </p>
      )}
    </div>
  );
}
