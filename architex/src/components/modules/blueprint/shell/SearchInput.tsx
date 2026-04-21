"use client";

import { Search } from "lucide-react";

/**
 * Search input stub — disabled in SP1. Real search (unit + pattern +
 * problem + lesson-body) lands in SP10 polish pass.
 */
export function SearchInput() {
  return (
    <div className="relative w-64">
      <Search
        className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle"
        aria-hidden
      />
      <input
        type="search"
        placeholder="Search · coming in SP10"
        aria-label="Search Blueprint"
        disabled
        className="w-full rounded-full border border-border/30 bg-background py-1.5 pl-8 pr-3 text-xs text-foreground-muted placeholder:text-foreground-subtle disabled:cursor-not-allowed"
      />
    </div>
  );
}
