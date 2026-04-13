"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SS_PREFIX = "architex-inactivity-shown-";

/**
 * useInactivityPrompt -- shows a gentle nudge after `delayMs` of inactivity
 * on an empty canvas. Dismisses on any interaction and only fires once per
 * mode per session (tracked via sessionStorage).
 *
 * @param modeId   - Unique identifier for the canvas mode (e.g. "btree-index")
 * @param isEmpty  - Whether the canvas is currently empty
 * @param delayMs  - Inactivity delay in ms (default 10000)
 */
export function useInactivityPrompt(
  modeId: string,
  isEmpty: boolean,
  delayMs = 10_000,
): {
  showPrompt: boolean;
  dismiss: () => void;
} {
  const [showPrompt, setShowPrompt] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(false);

  // Check sessionStorage on mount to see if already shown this session
  useEffect(() => {
    try {
      const key = `${SS_PREFIX}${modeId}`;
      if (sessionStorage.getItem(key)) {
        shownRef.current = true;
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [modeId]);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    shownRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      sessionStorage.setItem(`${SS_PREFIX}${modeId}`, "1");
    } catch {
      // sessionStorage unavailable
    }
  }, [modeId]);

  // Start / reset the inactivity timer when on an empty canvas
  useEffect(() => {
    // If already shown, not empty, or already visible — bail out
    if (shownRef.current || !isEmpty) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowPrompt(false);
      return;
    }

    // Start the timer
    timerRef.current = setTimeout(() => {
      if (!shownRef.current) {
        setShowPrompt(true);
      }
    }, delayMs);

    // Any user interaction dismisses
    const handleInteraction = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (showPrompt) {
        dismiss();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    for (const evt of events) {
      document.addEventListener(evt, handleInteraction, { once: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      for (const evt of events) {
        document.removeEventListener(evt, handleInteraction);
      }
    };
  }, [isEmpty, delayMs, dismiss, showPrompt]);

  return { showPrompt, dismiss };
}
