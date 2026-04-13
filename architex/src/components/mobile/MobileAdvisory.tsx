"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";
import { springs } from "@/lib/constants/motion";

const STORAGE_KEY = "architex_mobile_advisory_dismissed";

/**
 * A small dismissible banner shown once on mobile viewports,
 * advising the user that complex diagram editing works better on desktop.
 */
export const MobileAdvisory = memo(function MobileAdvisory() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  // Check localStorage on mount (client-only)
  useEffect(() => {
    if (!isMobile) return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, [isMobile]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Never render on desktop
  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed top-2 inset-x-2 z-40 flex items-center gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur-sm"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={springs.snappy}
        >
          <Monitor className="h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-xs text-foreground-muted">
            For the best experience, try desktop for complex diagrams
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss advisory"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
