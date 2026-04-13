"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lightbulb } from "lucide-react";
import { useFirstEncounter } from "@/hooks/useFirstEncounter";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/constants/motion";

// ── Feature definitions ────────────────────────────────────────

export interface TooltipFeature {
  id: string;
  title: string;
  description: string;
  /** CSS selector or data-onboarding attribute to anchor the tooltip near */
  targetSelector: string;
  /** Preferred position relative to target */
  position: "top" | "bottom" | "left" | "right";
}

export const CONTEXTUAL_FEATURES: TooltipFeature[] = [
  {
    id: "canvas-first-drag",
    title: "Drag to build",
    description:
      "Drag components from the palette onto the canvas to start building your architecture.",
    targetSelector: "[data-onboarding='canvas']",
    position: "left",
  },
  {
    id: "palette-first-open",
    title: "Component palette",
    description:
      "Browse and search all available infrastructure components here. Drag or click to add.",
    targetSelector: "[data-onboarding='component-palette']",
    position: "right",
  },
  {
    id: "simulation-first-play",
    title: "Run a simulation",
    description:
      "Press Space or click the play button to simulate traffic flowing through your architecture.",
    targetSelector: "[data-onboarding='status-bar']",
    position: "top",
  },
  {
    id: "export-first-open",
    title: "Export your design",
    description:
      "Export your architecture as JSON, Mermaid diagrams, or PNG images for sharing.",
    targetSelector: "[data-onboarding='component-palette']",
    position: "right",
  },
  // LLD Studio tooltips (LLD-171)
  {
    id: "lld-pattern-browser",
    title: "Design Patterns",
    description:
      "Browse 34 patterns organized by category -- creational, structural, behavioral, modern, resilience, concurrency, and AI agent. Each includes UML diagrams, code samples, and real-world examples.",
    targetSelector: "[data-onboarding='lld-sidebar-patterns']",
    position: "right",
  },
  {
    id: "lld-solid-toggle",
    title: "Before/After Toggle",
    description:
      "Switch between the SOLID violation and the refactored version to see the principle in action.",
    targetSelector: "[data-onboarding='lld-solid-toggle']",
    position: "bottom",
  },
  {
    id: "lld-code-generation",
    title: "Live Code Generation",
    description:
      "See TypeScript and Python code generated from the UML diagram. Changes to the diagram update the code in real time.",
    targetSelector: "[data-onboarding='lld-code-generation']",
    position: "left",
  },
  {
    id: "lld-code-to-diagram",
    title: "Code to Diagram",
    description:
      "Paste your code to auto-generate a UML class diagram. Supports TypeScript and Python with automatic relationship detection.",
    targetSelector: "[data-onboarding='lld-code-to-diagram']",
    position: "left",
  },
  // Database Lab tooltips (DBL-180)
  {
    id: "db-btree-order",
    title: "Tree Order",
    description:
      "Tree order = max children per node. Higher order = wider, shallower tree. Start with 3.",
    targetSelector: "[data-onboarding='db-btree-order']",
    position: "bottom",
  },
  {
    id: "db-hash-delete",
    title: "Delete Key",
    description:
      "Remove a key to see how deletion works in hash tables.",
    targetSelector: "[data-onboarding='db-hash-delete']",
    position: "bottom",
  },
  {
    id: "db-lsm-flush",
    title: "Flush Memtable",
    description:
      "Manually flush the in-memory memtable to disk as an SSTable.",
    targetSelector: "[data-onboarding='db-lsm-flush']",
    position: "right",
  },
  {
    id: "db-lsm-compact",
    title: "Compact SSTables",
    description:
      "Merge SSTables from one level to the next to reduce read amplification.",
    targetSelector: "[data-onboarding='db-lsm-compact']",
    position: "right",
  },
  {
    id: "db-norm-fd",
    title: "Functional Dependencies",
    description:
      "Functional dependencies use arrow notation: A,B -> C means knowing A and B determines C.",
    targetSelector: "[data-onboarding='db-norm-fd']",
    position: "left",
  },
];

// ── Global state: only 1 tooltip visible at a time ─────────────

let globalActiveTooltipId: string | null = null;
const listeners: Set<() => void> = new Set();

function claimTooltip(id: string): boolean {
  if (globalActiveTooltipId !== null && globalActiveTooltipId !== id) {
    return false;
  }
  globalActiveTooltipId = id;
  listeners.forEach((fn) => fn());
  return true;
}

function releaseTooltip(id: string): void {
  if (globalActiveTooltipId === id) {
    globalActiveTooltipId = null;
    listeners.forEach((fn) => fn());
  }
}

function useGlobalTooltip(id: string) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const check = () => setIsActive(globalActiveTooltipId === id);
    listeners.add(check);
    check();
    return () => {
      listeners.delete(check);
    };
  }, [id]);

  return isActive;
}

// ── Individual tooltip ─────────────────────────────────────────

interface SingleTooltipProps {
  feature: TooltipFeature;
}

const SingleContextualTooltip = memo(function SingleContextualTooltip({
  feature,
}: SingleTooltipProps) {
  const { show, dismiss } = useFirstEncounter(feature.id);
  const isActive = useGlobalTooltip(feature.id);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const computePosition = useCallback(() => {
    const target = document.querySelector(feature.targetSelector);
    if (!target) return null;

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (feature.position) {
      case "top":
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    left = Math.max(8, Math.min(left, vw - tooltipWidth - 8));
    top = Math.max(8, Math.min(top, vh - tooltipHeight - 8));

    return { top, left };
  }, [feature.targetSelector, feature.position]);

  // Attempt to show after a short delay (let the page render first)
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      const pos = computePosition();
      if (!pos) return;

      const claimed = claimTooltip(feature.id);
      if (!claimed) return;

      setPosition(pos);
      setVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [show, computePosition, feature.id]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    dismiss();
    releaseTooltip(feature.id);
  }, [dismiss, feature.id]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      releaseTooltip(feature.id);
    };
  }, [feature.id]);

  if (!show || !isActive) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: duration.normal }}
          className={cn(
            "fixed z-[60] w-[280px] rounded-xl border border-border bg-popover p-4 shadow-xl",
          )}
          style={{ top: position.top, left: position.left }}
          role="tooltip"
        >
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {feature.title}
            </span>
            <button
              onClick={handleDismiss}
              className="ml-auto rounded-md p-0.5 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Dismiss tooltip"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-foreground-muted">
            {feature.description}
          </p>
          <button
            onClick={handleDismiss}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ── Container: renders all feature tooltips ────────────────────

export const ContextualTooltips = memo(function ContextualTooltips() {
  return (
    <>
      {CONTEXTUAL_FEATURES.map((feature) => (
        <SingleContextualTooltip key={feature.id} feature={feature} />
      ))}
    </>
  );
});
