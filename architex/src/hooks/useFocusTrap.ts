"use client";

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface UseFocusTrapOptions {
  /** Whether the trap is currently active */
  active: boolean;
  /** Called when the user presses Escape inside the trap */
  onEscape?: () => void;
}

/**
 * Generic focus trap hook.
 *
 * Traps Tab / Shift+Tab within a container element when `active` is true.
 * On activation the first focusable element receives focus.
 * On deactivation focus returns to the element that was focused before the trap
 * opened.
 */
export function useFocusTrap({ active, onEscape }: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Restore focus when the trap is deactivated
  useEffect(() => {
    if (active) {
      // Remember what was focused before the trap opened
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [active]);

  // Move focus into the container on activation
  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Small delay so the container renders its children first
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [active]);

  // Keyboard handler: Tab wrap-around + Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active) return;

      if (e.key === "Escape" && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key !== "Tab" || !containerRef.current) return;

      const container = containerRef.current;
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

      if (focusables.length === 0) {
        // Nothing to focus — prevent Tab from leaving the container
        e.preventDefault();
        return;
      }

      if (focusables.length === 1) {
        // Single focusable element — keep focus there
        e.preventDefault();
        focusables[0].focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [active, onEscape],
  );

  return { containerRef, handleKeyDown };
}
