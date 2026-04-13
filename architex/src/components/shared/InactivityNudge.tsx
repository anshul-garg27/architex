"use client";

import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { duration } from "@/lib/constants/motion";

interface InactivityNudgeProps {
  show: boolean;
  onDismiss: () => void;
  /** The suggestion text, e.g. "Not sure where to start? Try inserting 42" */
  message?: string;
}

/**
 * A gentle fade-in prompt shown after inactivity on an empty canvas.
 * Dismisses on click or any interaction (handled by the parent hook).
 */
const InactivityNudge = memo(function InactivityNudge({
  show,
  onDismiss,
  message = "Not sure where to start? Try inserting 42",
}: InactivityNudgeProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: duration.normal }}
          className="pointer-events-auto absolute bottom-6 left-1/2 z-30 -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <button
            onClick={onDismiss}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-primary shadow-lg backdrop-blur-sm transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span>{message}</span>
            <ArrowRight className="h-4 w-4 animate-pulse" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default InactivityNudge;
