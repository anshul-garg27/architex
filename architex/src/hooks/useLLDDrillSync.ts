"use client";

import { useEffect } from "react";
import { useDrillStore } from "@/stores/drill-store";

const HEARTBEAT_MS = 10_000;

async function sendHeartbeat(attemptId: string): Promise<void> {
  await fetch(`/api/lld/drill-attempts/${attemptId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "heartbeat" }),
  });
}

/**
 * Pings the server every 10s while a drill attempt is active.
 * Updates `last_activity_at` server-side so the stale-drill sweep in
 * GET /api/lld/drill-attempts/active (>30min idle) doesn't auto-abandon
 * users doing pure client-side work (e.g. quietly diagramming on canvas).
 *
 * Reads the live attempt from the drill store (Phase 4). Heartbeat pauses
 * while the tab is hidden and resumes on visibility.
 */
export function useLLDDrillSync(): void {
  const attemptId = useDrillStore((s) => s.attemptId);
  const isGraded = useDrillStore((s) => s.rubricBreakdown !== null);

  useEffect(() => {
    if (!attemptId || isGraded) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const beat = () => {
      sendHeartbeat(attemptId).catch((err) => {
        console.warn("[useLLDDrillSync] heartbeat failed:", err);
      });
    };

    const start = () => {
      if (interval !== null) return;
      interval = setInterval(beat, HEARTBEAT_MS);
    };

    const stop = () => {
      if (interval === null) return;
      clearInterval(interval);
      interval = null;
    };

    // Be polite: no heartbeat while the tab is hidden.
    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [attemptId, isGraded]);
}
