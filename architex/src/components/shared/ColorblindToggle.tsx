"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyColorblindPalette,
  removeColorblindPalette,
  getColorblindPreference,
  setColorblindPreference,
} from "@/lib/a11y/colorblind-palette";

/**
 * Toggle button that switches between the default palette and an
 * IBM Design colorblind-safe palette. Preference is persisted in
 * localStorage under `architex-colorblind-mode`.
 */
export const ColorblindToggle = memo(function ColorblindToggle() {
  const [enabled, setEnabled] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getColorblindPreference();
    setEnabled(stored);
    if (stored) {
      applyColorblindPalette();
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      setColorblindPreference(next);
      if (next) {
        applyColorblindPalette();
      } else {
        removeColorblindPalette();
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={enabled}
      aria-label={
        enabled
          ? "Disable colorblind-safe palette"
          : "Enable colorblind-safe palette"
      }
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
        enabled
          ? "bg-primary/15 text-primary"
          : "text-foreground-muted hover:bg-accent hover:text-foreground",
      )}
    >
      <Eye className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">
        {enabled ? "CVD palette on" : "CVD palette"}
      </span>
    </button>
  );
});
