"use client";

import { memo, useState } from "react";
import { LayoutGrid, ChevronDown } from "lucide-react";
import { AUTO_LAYOUT_PRESETS } from "@/lib/lld/auto-layout-presets";
import { useAutoLayout } from "@/hooks/useAutoLayout";

export const AutoLayoutMenu = memo(function AutoLayoutMenu() {
  const [open, setOpen] = useState(false);
  const applyLayout = useAutoLayout();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Layout
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-64 rounded-lg border border-border/30 bg-elevated/95 p-1 shadow-lg backdrop-blur-sm"
        >
          {AUTO_LAYOUT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              onClick={() => {
                applyLayout(p.id);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-foreground/5"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">
                  {p.label}
                </div>
                <div className="text-[10px] text-foreground-muted">
                  {p.description}
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-foreground-muted">
                {p.hotkey}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
