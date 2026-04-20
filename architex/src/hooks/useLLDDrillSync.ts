"use client";

import { useEffect } from "react";
import { useInterviewStore } from "@/stores/interview-store";

const HEARTBEAT_MS = 10_000;

async function sendHeartbeat(drillId: string): Promise<void> {
  await fetch(`/api/lld/drill-attempts/${drillId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "heartbeat" }),
  });
}

/**
 * Pings the server every 10s while a drill is running (not paused).
 * Updates `last_activity_at` server-side so stale-drill detection
 * (>30min idle) correctly auto-abandons inactive attempts.
 */
export function useLLDDrillSync(drillId: string | null): void {
  const activeDrill = useInterviewStore((s) => s.activeDrill);
  const isRunning = activeDrill !== null && activeDrill.pausedAt === null;

  useEffect(() => {
    if (!drillId || !isRunning) return;
    const interval = setInterval(() => {
      sendHeartbeat(drillId).catch((err) => {
        console.warn("[useLLDDrillSync] heartbeat failed:", err);
      });
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [drillId, isRunning]);
}
