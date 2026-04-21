"use client";

import Link from "next/link";
import { SurfaceTabs } from "./SurfaceTabs";
import { SearchInput } from "./SearchInput";

/**
 * Top bar for Blueprint: wordmark + three surface tabs + search.
 * Height is fixed so the main surface below can size with `flex-1`.
 */
export function TopChrome() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border/30 bg-background/60 px-4 backdrop-blur-sm">
      <Link
        href="/modules/blueprint"
        className="flex items-center gap-2"
        aria-label="Blueprint home"
      >
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-sky-400 text-[10px] font-bold text-white shadow-sm"
        >
          B
        </span>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Blueprint
        </span>
      </Link>
      <SurfaceTabs />
      <div className="ml-auto flex items-center gap-3">
        <SearchInput />
      </div>
    </header>
  );
}
