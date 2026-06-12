"use client";

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  SearchX,
  ChevronDown,
  LayoutTemplate,
  Download,
  Upload,
} from "lucide-react";
import {
  PALETTE_ITEMS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  groupByCategory,
  type PaletteItem,
  type NodeCategory,
} from "@/lib/palette-items";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { PaletteItemCard, PaletteRecentStrip } from "./PaletteItemCard";

const COLLAPSED_STORAGE_KEY = "architex-palette-collapsed";
const RECENT_STORAGE_KEY = "architex-palette-recent";
const RECENT_LIMIT = 5;

function readStoredStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStoredJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode / quota) — non-fatal
  }
}

function isNodeCategory(value: string): value is NodeCategory {
  return value in CATEGORY_LABELS;
}

export const ComponentPalette = memo(function ComponentPalette() {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [collapsed, setCollapsed] = useState<ReadonlySet<NodeCategory>>(new Set());
  const [recentTypes, setRecentTypes] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const announcerRef = useRef<HTMLDivElement>(null);

  // Hydrate persisted palette state after mount (SSR-safe)
  useEffect(() => {
    setCollapsed(new Set(readStoredStringArray(COLLAPSED_STORAGE_KEY).filter(isNodeCategory)));
    setRecentTypes(readStoredStringArray(RECENT_STORAGE_KEY).slice(0, RECENT_LIMIT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStoredJSON(COLLAPSED_STORAGE_KEY, Array.from(collapsed));
  }, [hydrated, collapsed]);

  useEffect(() => {
    if (hydrated) writeStoredJSON(RECENT_STORAGE_KEY, recentTypes);
  }, [hydrated, recentTypes]);

  const trackRecent = useCallback((item: PaletteItem) => {
    // Deferred: re-rendering synchronously inside a dragstart handler can
    // shift/cancel the native drag in Chromium.
    window.setTimeout(() => {
      setRecentTypes((prev) =>
        [item.type, ...prev.filter((t) => t !== item.type)].slice(0, RECENT_LIMIT),
      );
    }, 0);
  }, []);

  const toggleCategory = useCallback((category: NodeCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
    setSelectedIndex(-1);
  }, []);

  const query = search.toLowerCase();
  const filtered = search
    ? PALETTE_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
    : PALETTE_ITEMS;

  const grouped = groupByCategory(filtered);
  const isSearching = search.length > 0;

  // Build a flat ordered list that mirrors render order for keyboard nav
  // (collapsed categories render no items, so they are skipped here too)
  const flatItems: PaletteItem[] = [];
  for (const [category, items] of Object.entries(grouped)) {
    if (!isSearching && collapsed.has(category as NodeCategory)) continue;
    flatItems.push(...items);
  }

  const recentItems = recentTypes
    .map((type) => PALETTE_ITEMS.find((item) => item.type === type))
    .filter((item): item is PaletteItem => item !== undefined);

  const addNodeAtCenter = useCallback(
    (item: PaletteItem) => {
      const { addNode } = useCanvasStore.getState();
      addNode({
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: item.type,
        position: { x: 500, y: 350 },
        data: {
          label: item.label,
          category: item.category,
          componentType: item.type,
          icon: item.icon,
          config: { ...item.defaultConfig },
          metrics: {},
          state: "idle",
        },
      });
      if (announcerRef.current) {
        announcerRef.current.textContent = `${item.label} added to canvas`;
      }
    },
    [],
  );

  const handlePaletteKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = flatItems.length;
      if (count === 0) return;

      let nextIndex = selectedIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = selectedIndex > 0 ? selectedIndex - 1 : count - 1;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = count - 1;
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < count) {
            addNodeAtCenter(flatItems[selectedIndex]);
          }
          return;
        default:
          return;
      }

      setSelectedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
      if (announcerRef.current) {
        announcerRef.current.textContent = `${flatItems[nextIndex].label}, ${flatItems[nextIndex].description}`;
      }
    },
    [selectedIndex, flatItems, addNodeAtCenter],
  );

  // Reset selection when search changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSelectedIndex(-1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
    setSelectedIndex(-1);
  }, []);

  // Announce match count while searching
  useEffect(() => {
    if (!isSearching || !announcerRef.current) return;
    announcerRef.current.textContent =
      filtered.length === 0
        ? "No components match"
        : `${filtered.length} component${filtered.length === 1 ? "" : "s"} match`;
  }, [isSearching, filtered.length]);

  // Track flat index across grouped render
  let flatIndex = -1;

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* SR announcer */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Components
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search components"
            className={cn(
              "h-8 w-full rounded-md border border-border bg-background pl-8 text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary",
              isSearching ? "pr-11" : "pr-3",
            )}
          />
          {isSearching && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-foreground-muted"
            >
              {filtered.length}
            </span>
          )}
        </div>
      </div>

      {/* Recently used */}
      <PaletteRecentStrip items={recentItems} onDragged={trackRecent} onActivate={addNodeAtCenter} />

      {/* Component list */}
      <div
        role="listbox"
        aria-label="Component palette"
        className="flex-1 overflow-y-auto px-2 pb-2"
        onKeyDown={handlePaletteKeyDown}
      >
        {Object.entries(grouped).map(([category, items]) => {
          const nodeCategory = category as NodeCategory;
          const isCollapsed = !isSearching && collapsed.has(nodeCategory);
          return (
            <div key={category} className="mb-1">
              <div className="sticky top-0 z-10 bg-sidebar pb-0.5 pt-1">
                <button
                  type="button"
                  onClick={() => toggleCategory(nodeCategory)}
                  disabled={isSearching}
                  aria-expanded={!isCollapsed}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    !isSearching && "hover:bg-elevated",
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 shrink-0 text-foreground-subtle transition-transform duration-150",
                      isCollapsed && "-rotate-90",
                      isSearching && "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[nodeCategory] }}
                  />
                  <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    {CATEGORY_LABELS[nodeCategory]}
                  </span>
                  <span className="ml-auto shrink-0 rounded bg-elevated px-1 text-[10px] font-medium tabular-nums text-foreground-subtle">
                    {items.length}
                  </span>
                </button>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col gap-px">
                  {items.map((item) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <PaletteItemCard
                        key={item.type}
                        item={item}
                        isSelected={selectedIndex === idx}
                        onSelect={() => setSelectedIndex(idx)}
                        itemRef={(el) => { itemRefs.current[idx] = el; }}
                        onDragged={trackRecent}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated">
              <SearchX className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
            </div>
            <p className="text-[13px] font-medium text-foreground">No components found</p>
            <p className="mt-1 max-w-[200px] text-[11px] leading-relaxed text-foreground-muted">
              Nothing matches <span className="text-foreground">&ldquo;{search}&rdquo;</span>.
              Try a component, category, or capability name.
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="mt-3 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground-muted transition-colors hover:border-primary/40 hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => useUIStore.getState().setTemplateGalleryOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            "text-foreground-muted hover:bg-accent hover:text-foreground",
          )}
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Templates
        </button>
        <button
          onClick={() => useUIStore.getState().setExportDialogOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            "text-foreground-muted hover:bg-accent hover:text-foreground",
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          onClick={() => useUIStore.getState().setImportDialogOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            "text-foreground-muted hover:bg-accent hover:text-foreground",
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
      </div>
    </div>
  );
});
