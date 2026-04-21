"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BlueprintEvent } from "@/lib/analytics/blueprint-events";

interface PostHogLike {
  capture: (name: string, payload?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    posthog?: PostHogLike;
  }
}

const FLUSH_MS = 500;
const MAX_QUEUE = 64;

/**
 * Batches Blueprint events and flushes every 500ms or at MAX_QUEUE.
 * Also POSTs to /api/blueprint/events as a reliable audit log;
 * PostHog is the primary analytics backend, the DB log is a backup
 * + debugging channel.
 */
export function useBlueprintAnalytics(): {
  track: <T>(event: BlueprintEvent<T>) => void;
} {
  const queueRef = useRef<BlueprintEvent<unknown>[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0, queueRef.current.length);

    if (typeof window !== "undefined" && window.posthog) {
      for (const e of batch) {
        try {
          window.posthog.capture(
            e.name,
            e.payload as Record<string, unknown>,
          );
        } catch {
          // best-effort
        }
      }
    } else if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      for (const e of batch) {
         
        console.log("[blueprint-event]", e.name, e.payload);
      }
    }

    try {
      await fetch("/api/blueprint/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
    } catch {
      // Events are best-effort.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void flush();
    };
  }, [flush]);

  const track = useCallback(
    <T,>(event: BlueprintEvent<T>) => {
      queueRef.current.push(event as BlueprintEvent<unknown>);
      if (queueRef.current.length >= MAX_QUEUE) {
        void flush();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, FLUSH_MS);
    },
    [flush],
  );

  return { track };
}
