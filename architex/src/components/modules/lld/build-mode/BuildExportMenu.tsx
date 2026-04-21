"use client";

import { memo, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { BUILD_EXPORT_MENU_ITEMS } from "@/lib/export/build-export-menu-items";
import { useCanvasStore } from "@/stores/canvas-store";

export const BuildExportMenu = memo(function BuildExportMenu() {
  const [open, setOpen] = useState(false);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-60 rounded-lg border border-border/30 bg-elevated/95 p-1 shadow-lg backdrop-blur-sm"
        >
          {BUILD_EXPORT_MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={async () => {
                await item.run({ nodes, edges, filename: "lld-design" });
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-foreground/5"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">
                  {item.label}
                </div>
                <div className="text-[10px] text-foreground-muted">
                  {item.description}
                </div>
              </div>
              {item.hotkey && (
                <span className="shrink-0 text-[10px] text-foreground-muted">
                  {item.hotkey}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
