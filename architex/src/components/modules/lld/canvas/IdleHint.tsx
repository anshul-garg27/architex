"use client";

/**
 * Idle Detection Hint (LLD-174).
 * Tracks last user interaction timestamp and shows contextual floating hints:
 * - After 20s of inactivity on empty canvas: "Not sure where to start? Try clicking Observer in the sidebar"
 * - After 30s on a loaded pattern with no clicks: "Click any class box to see its details"
 * Non-modal, auto-dismiss after 5s or on any click. Only shows once per session.
 *
 * Integration: Render inside the canvas container:
 *   import { IdleHint } from "./IdleHint";
 *   <IdleHint hasPattern={!!selectedPattern} />
 */

import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Lightbulb, X } from "lucide-react";

// ── Constants ──────────────────────────────────────────────

const IDLE_THRESHOLD_EMPTY_MS = 20_000; // 20s for empty canvas
const IDLE_THRESHOLD_LOADED_MS = 30_000; // 30s for loaded pattern
const AUTO_DISMISS_MS = 5_000; // auto-dismiss after 5s
const CHECK_INTERVAL_MS = 1_000; // check every 1s

// Session storage key to ensure once-per-session behavior
const SESSION_KEY_EMPTY = "architex-idle-hint-empty-shown";
const SESSION_KEY_LOADED = "architex-idle-hint-loaded-shown";

// ── Hint Messages ──────────────────────────────────────────

const HINT_EMPTY =
  "Not sure where to start? Try clicking Observer in the sidebar \u2192";
const HINT_LOADED =
  "Click any class box to see its details \u2192";

// ── Component ──────────────────────────────────────────────

interface IdleHintProps {
  /** Whether a pattern is currently loaded on the canvas. */
  hasPattern: boolean;
  /** Optional additional class names. */
  className?: string;
}

export const IdleHint = memo(function IdleHint({
  hasPattern,
  className,
}: IdleHintProps) {
  const [visible, setVisible] = useState(false);
  const [hintText, setHintText] = useState("");
  const lastInteractionRef = useRef(Date.now());
  const shownEmptyRef = useRef(false);
  const shownLoadedRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize session state from sessionStorage
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY_EMPTY) === "true") {
        shownEmptyRef.current = true;
      }
      if (sessionStorage.getItem(SESSION_KEY_LOADED) === "true") {
        shownLoadedRef.current = true;
      }
    } catch {
      // sessionStorage may be unavailable in some environments
    }
  }, []);

  // Track user interactions
  useEffect(() => {
    function handleInteraction() {
      lastInteractionRef.current = Date.now();
      // Dismiss on any click/key
      if (visible) {
        setVisible(false);
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = null;
        }
      }
    }

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"] as const;
    for (const event of events) {
      window.addEventListener(event, handleInteraction, { passive: true });
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, handleInteraction);
      }
    };
  }, [visible]);

  // Show hint logic
  const showHint = useCallback(
    (text: string, sessionKey: string) => {
      setHintText(text);
      setVisible(true);

      try {
        sessionStorage.setItem(sessionKey, "true");
      } catch {
        // Ignore
      }

      // Auto-dismiss after 5s
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        setVisible(false);
        dismissTimerRef.current = null;
      }, AUTO_DISMISS_MS);
    },
    [],
  );

  // Idle check interval
  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastInteractionRef.current;

      if (!hasPattern && !shownEmptyRef.current && idle >= IDLE_THRESHOLD_EMPTY_MS) {
        shownEmptyRef.current = true;
        showHint(HINT_EMPTY, SESSION_KEY_EMPTY);
      } else if (
        hasPattern &&
        !shownLoadedRef.current &&
        idle >= IDLE_THRESHOLD_LOADED_MS
      ) {
        shownLoadedRef.current = true;
        showHint(HINT_LOADED, SESSION_KEY_LOADED);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasPattern, showHint]);

  // Cleanup dismiss timer
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-6 left-1/2 z-50 -translate-x-1/2",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-border/30",
          "bg-background/60 px-4 py-2.5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.08)] backdrop-blur-md",
          "max-w-md",
        )}
        role="status"
        aria-live="polite"
      >
        <Lightbulb className="h-4 w-4 flex-shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
        <p className="text-[11px] leading-relaxed text-foreground-muted">
          {hintText}
        </p>
        <button
          onClick={handleDismiss}
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-background/80 text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss hint"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
});
