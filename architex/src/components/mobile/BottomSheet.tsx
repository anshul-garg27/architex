"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { duration, springs } from "@/lib/constants/motion";

// ── Snap Points ────────────────────────────────────────────────────
// Expressed as a fraction of viewport height that the sheet *covers*.

type SnapPoint = "collapsed" | "half" | "full";

const SNAP_FRACTIONS: Record<SnapPoint, number> = {
  collapsed: 0.08, // handle + ~48px peek
  half: 0.5,
  full: 0.92,
};

const SNAP_ORDER: SnapPoint[] = ["collapsed", "half", "full"];

function closestSnap(coverFraction: number): SnapPoint {
  let best: SnapPoint = "collapsed";
  let bestDist = Infinity;
  for (const snap of SNAP_ORDER) {
    const dist = Math.abs(SNAP_FRACTIONS[snap] - coverFraction);
    if (dist < bestDist) {
      bestDist = dist;
      best = snap;
    }
  }
  return best;
}

// ── Props ──────────────────────────────────────────────────────────

export interface BottomSheetProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  /** Starting snap point when the sheet opens. @default "half" */
  defaultSnap?: SnapPoint;
}

// ── Component ──────────────────────────────────────────────────────

export function BottomSheet({
  children,
  open,
  onClose,
  defaultSnap = "half",
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(defaultSnap);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset snap when opening
  useEffect(() => {
    if (open) setCurrentSnap(defaultSnap);
  }, [open, defaultSnap]);

  // Visible height in px, computed from snap fraction and window height
  const getSheetY = useCallback(
    (snap: SnapPoint): number => {
      if (typeof window === "undefined") return 0;
      // y offset from top: viewport height minus the covered portion
      return window.innerHeight * (1 - SNAP_FRACTIONS[snap]);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (typeof window === "undefined") return;

      const currentY = getSheetY(currentSnap) + info.offset.y;
      const coverFraction = 1 - currentY / window.innerHeight;

      // If dragged below collapsed threshold, dismiss
      if (coverFraction < SNAP_FRACTIONS.collapsed * 0.5) {
        onClose();
        return;
      }

      // Flick velocity: if swiping fast downward, dismiss
      if (info.velocity.y > 500 && currentSnap === "collapsed") {
        onClose();
        return;
      }

      setCurrentSnap(closestSnap(coverFraction));
    },
    [currentSnap, getSheetY, onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Bottom sheet">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.normal }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={containerRef}
            className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-border bg-surface shadow-2xl"
            style={{ touchAction: "none" }}
            initial={{ y: "100%" }}
            animate={{ y: getSheetY(currentSnap) }}
            exit={{ y: "100%" }}
            transition={springs.snappy}
            drag="y"
            dragConstraints={{ top: getSheetY("full"), bottom: getSheetY("collapsed") + 80 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex shrink-0 items-center justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-foreground-muted/40" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
