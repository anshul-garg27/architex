"use client";

import { memo, useState, useMemo, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "B"], description: "Toggle sidebar" },
      { keys: ["⌘", "J"], description: "Toggle bottom panel" },
      { keys: ["⌘", "⇧", "B"], description: "Toggle properties panel" },
      { keys: ["⌘", "E"], description: "Export diagram" },
      { keys: ["⌘", "T"], description: "Browse templates" },
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "⇧", "C"], description: "Capacity Calculator" },
    ],
  },
  {
    name: "Canvas",
    shortcuts: [
      { keys: ["⌘", "A"], description: "Select all nodes" },
      { keys: ["⌫"], description: "Delete selected" },
      { keys: ["Space"], description: "Play/pause simulation" },
    ],
  },
  {
    name: "Modules",
    shortcuts: [
      { keys: ["⌘", "1"], description: "System Design" },
      { keys: ["⌘", "2"], description: "Algorithms" },
      { keys: ["⌘", "3"], description: "Data Structures" },
      { keys: ["⌘", "4"], description: "Low-Level Design" },
      { keys: ["⌘", "5"], description: "Database" },
      { keys: ["⌘", "6"], description: "Distributed Systems" },
      { keys: ["⌘", "7"], description: "Networking" },
      { keys: ["⌘", "8"], description: "OS Concepts" },
      { keys: ["⌘", "9"], description: "Concurrency" },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md",
        "border border-border bg-sidebar px-1.5",
        "text-[11px] font-medium text-foreground-muted",
        "shadow-[0_1px_0_1px_rgba(0,0,0,0.15)]",
      )}
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <div className="flex shrink-0 items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <KeyBadge key={i}>{key}</KeyBadge>
        ))}
      </div>
    </div>
  );
}

export const KeyboardShortcutsDialog = memo(function KeyboardShortcutsDialog() {
  const open = useUIStore((s) => s.shortcutsDialogOpen);
  const setOpen = useUIStore((s) => s.setShortcutsDialogOpen);
  const [search, setSearch] = useState("");

  const { containerRef, handleKeyDown: trapKeyDown } = useFocusTrap({
    active: open,
    onEscape: () => setOpen(false),
  });

  // Reset search when dialog opens
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const handleBackdropClick = useCallback(() => setOpen(false), [setOpen]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return SHORTCUT_CATEGORIES;

    const query = search.toLowerCase();
    return SHORTCUT_CATEGORIES.map((cat) => ({
      ...cat,
      shortcuts: cat.shortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(query) ||
          s.keys.join(" ").toLowerCase().includes(query),
      ),
    })).filter((cat) => cat.shortcuts.length > 0);
  }, [search]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      ref={containerRef}
      onKeyDown={trapKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Dialog */}
      <div className="absolute left-1/2 top-[15%] w-full max-w-2xl -translate-x-1/2">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-foreground-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter shortcuts..."
                aria-label="Filter keyboard shortcuts"
                className="h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
                autoFocus
              />
            </div>
          </div>

          {/* Shortcut categories - two column grid */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {filteredCategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground-muted">
                No shortcuts found.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredCategories.map((category) => (
                  <div key={category.name}>
                    <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      {category.name}
                    </h3>
                    <div className="space-y-0.5">
                      {category.shortcuts.map((shortcut, i) => (
                        <ShortcutRow key={i} shortcut={shortcut} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2">
            <p className="text-center text-xs text-foreground-subtle">
              Press <KeyBadge>?</KeyBadge> to toggle this dialog
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
