"use client";

import { memo, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useLLDTemplatesLibrary } from "@/hooks/useLLDTemplatesLibrary";
import { PatternLibraryItem } from "./PatternLibraryItem";
import { cn } from "@/lib/utils";
import type { LLDTemplatesLibraryEntry } from "@/db/schema";

const CATEGORY_TABS = [
  { id: "", label: "All" },
  { id: "creational", label: "Creational" },
  { id: "structural", label: "Structural" },
  { id: "behavioral", label: "Behavioral" },
  { id: "architecture", label: "Architecture" },
  { id: "microservices", label: "Microservices" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
] as const;

export const PatternLibraryDock = memo(function PatternLibraryDock() {
  const [collapsed, setCollapsed] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");

  const { data: templates = [], isLoading } = useLLDTemplatesLibrary({
    category: category || undefined,
    q: q.trim() || undefined,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, LLDTemplatesLibraryEntry[]>();
    for (const t of templates) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [templates]);

  if (collapsed) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r border-border/30 bg-background/60 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Expand pattern library"
          onClick={() => setCollapsed(false)}
          className="mt-3 rounded-md p-1.5 text-foreground-muted hover:bg-foreground/5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Pattern library"
      className="flex h-full w-72 flex-col border-r border-border/30 bg-background/60 backdrop-blur-sm"
    >
      <header className="flex items-center justify-between px-3 py-2 border-b border-border/20">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Pattern Library
        </h2>
        <button
          type="button"
          aria-label="Collapse pattern library"
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="px-3 py-2">
        <label className="flex items-center gap-2 rounded-md border border-border/30 bg-elevated/40 px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-foreground-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patterns..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-foreground-muted"
          />
        </label>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 pb-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setCategory(t.id)}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
              category === t.id
                ? "bg-primary/20 text-primary"
                : "text-foreground-muted hover:bg-foreground/5",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <div className="p-4 text-xs text-foreground-muted">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="p-4 text-xs text-foreground-muted">
            No patterns match your filters.
          </div>
        ) : (
          [...grouped.entries()].map(([cat, items]) => (
            <section key={cat} className="mb-3">
              <h3 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                {cat}
              </h3>
              <ul className="space-y-1">
                {items.map((t) => (
                  <PatternLibraryItem key={t.id} template={t} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </aside>
  );
});
