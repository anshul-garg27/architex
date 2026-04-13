"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface SkipTarget {
  /** Visible label text. */
  label: string;
  /** CSS selector or element ID for the target. */
  target: string;
}

export interface SkipLinkProps {
  /** Additional CSS classes. */
  className?: string;
}

// ── Constants ────────────────────────────────────────────────

const SKIP_TARGETS: SkipTarget[] = [
  { label: "Skip to main content", target: "#main-content" },
  { label: "Skip to navigation", target: "#navigation" },
];

// ── Component ────────────────────────────────────────────────

/**
 * Standard accessible skip links rendered at the top of the page.
 * Visually hidden until focused via keyboard (Tab), then appear
 * as fixed overlays at the top of the viewport.
 *
 * Follows the WCAG 2.4.1 "Bypass Blocks" pattern.
 */
export function SkipLink({ className }: SkipLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
      e.preventDefault();
      const el = document.querySelector(target);
      if (!el) return;

      // Make the target focusable if it is not natively
      if (!el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "-1");
      }
      (el as HTMLElement).focus({ preventScroll: false });
    },
    [],
  );

  return (
    <div className={cn("fixed left-0 top-0 z-[9999]", className)}>
      {SKIP_TARGETS.map(({ label, target }) => (
        <a
          key={target}
          href={target.startsWith("#") ? target : `#${target}`}
          onClick={(e) => handleClick(e, target)}
          className={cn(
            // Visually hidden by default
            "sr-only",
            // Appears on focus
            "focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[9999]",
            "focus:rounded-md focus:bg-primary focus:px-4 focus:py-2",
            "focus:text-sm focus:font-medium focus:text-primary-foreground",
            "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
