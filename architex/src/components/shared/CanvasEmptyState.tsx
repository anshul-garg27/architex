"use client";

import { memo, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { LayoutDashboard, Plus, FileStack } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { duration, easing } from "@/lib/constants/motion";

// ── CanvasEmptyState ──────────────────────────────────────────
// Shown when the canvas has zero nodes. Provides quick-start
// actions so the user can begin building immediately.

export const CanvasEmptyState = memo(function CanvasEmptyState() {
  const setTemplateGalleryOpen = useUIStore((s) => s.setTemplateGalleryOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const prefersReducedMotion = useReducedMotion();

  const openTemplateGallery = useCallback(() => {
    setTemplateGalleryOpen(true);
  }, [setTemplateGalleryOpen]);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, [setCommandPaletteOpen]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : duration.moderate,
          ease: easing.out,
        }}
        className="flex flex-col items-center gap-5 text-center"
      >
        {/* Subtle pulse icon — 3 pulses then stops (finite repeat for battery/a11y) */}
        <motion.div
          animate={prefersReducedMotion ? {} : { scale: [1, 1.06, 1] }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 2, repeat: 3, ease: easing.inOut }
          }
        >
          <LayoutDashboard className="h-16 w-16 text-muted-foreground/50" />
        </motion.div>

        <h3 className="text-lg font-medium text-foreground">Start Building</h3>

        <p className="max-w-sm text-sm text-muted-foreground">
          Drag components from the sidebar, load a template, or press{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium">
            Cmd+K
          </kbd>{" "}
          to search.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={openTemplateGallery} className="gap-2">
            <FileStack className="h-4 w-4" />
            Add Template
          </Button>
          <Button onClick={openCommandPalette} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Node
          </Button>
        </div>
      </motion.div>
    </div>
  );
});
