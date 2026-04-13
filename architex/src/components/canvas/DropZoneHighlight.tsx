"use client";

import { memo, useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { duration } from "@/lib/constants/motion";

/**
 * DropZoneHighlight -- shows a pulsing dashed border and label when the user
 * drags a component from the palette over the canvas drop zone.
 */
export const DropZoneHighlight = memo(function DropZoneHighlight() {
  const [active, setActive] = useState(false);
  const [nodeLabel, setNodeLabel] = useState("component");
  const counterRef = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!e.dataTransfer?.types.includes("application/architex-node")) return;

    const canvasEl = (e.target as HTMLElement).closest?.(
      "[data-onboarding='canvas']",
    );
    if (!canvasEl) return;

    counterRef.current += 1;
    setActive(true);

    // Try to extract the label from transfer data (available in dragenter)
    const raw = e.dataTransfer.getData("application/architex-node");
    if (raw) {
      try {
        const data = JSON.parse(raw) as { label?: string };
        if (data.label) setNodeLabel(data.label);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer?.types.includes("application/architex-node")) return;

    const canvasEl = (e.target as HTMLElement).closest?.(
      "[data-onboarding='canvas']",
    );
    if (canvasEl) {
      setActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    const canvasEl = (e.target as HTMLElement).closest?.(
      "[data-onboarding='canvas']",
    );
    if (!canvasEl) return;

    counterRef.current -= 1;
    if (counterRef.current <= 0) {
      counterRef.current = 0;
      setActive(false);
    }
  }, []);

  const handleDrop = useCallback(() => {
    counterRef.current = 0;
    setActive(false);
    setNodeLabel("component");
  }, []);

  const handleDragEnd = useCallback(() => {
    counterRef.current = 0;
    setActive(false);
    setNodeLabel("component");
  }, []);

  useEffect(() => {
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("dragend", handleDragEnd);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("dragend", handleDragEnd);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.normal }}
          className="pointer-events-none absolute inset-4 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-primary/40"
          style={{
            animation: "drop-zone-pulse 2s ease-in-out infinite",
          }}
        >
          <div className="rounded-lg bg-surface/80 px-4 py-2 shadow-lg backdrop-blur-sm">
            <span className="text-sm font-medium text-foreground-muted">
              Drop to add{" "}
              <span className="text-primary">{nodeLabel}</span>
            </span>
          </div>

          {/* Inline keyframes via style tag -- no external CSS needed */}
          <style>{`
            @keyframes drop-zone-pulse {
              0%, 100% { border-color: color-mix(in srgb, var(--primary) 30%, transparent); }
              50% { border-color: color-mix(in srgb, var(--primary) 60%, transparent); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
