"use client";

import { memo, useEffect, useState } from "react";
import { Check, AlertTriangle, Loader2, Save } from "lucide-react";
import { useSaveStatus } from "@/hooks/useSaveStatus";
import { cn } from "@/lib/utils";

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return "over 1h ago";
}

/**
 * SaveIndicator -- compact save status for the status bar.
 * States: idle (hidden), saving (spinner), saved (checkmark + relative time),
 * error (warning icon). Click to force save.
 */
export const SaveIndicator = memo(function SaveIndicator() {
  const { status, lastSavedAt, forceSave } = useSaveStatus();
  const [relativeTime, setRelativeTime] = useState("");

  // Update relative time display every 5 seconds
  useEffect(() => {
    if (!lastSavedAt) return;

    setRelativeTime(formatRelativeTime(lastSavedAt));

    const timer = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSavedAt));
    }, 5_000);

    return () => clearInterval(timer);
  }, [lastSavedAt]);

  // Idle with no saves yet -- stay hidden
  if (status === "idle" && !lastSavedAt) return null;

  return (
    <button
      onClick={() => void forceSave()}
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors",
        "hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        status === "error" && "text-state-error",
        status === "saving" && "text-foreground-muted",
        (status === "saved" || status === "idle") && "text-state-success",
      )}
      title={
        status === "error"
          ? "Save failed -- click to retry"
          : "Click to save now"
      }
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved {relativeTime}</span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>Save failed</span>
        </>
      )}

      {status === "idle" && lastSavedAt && (
        <>
          <Save className="h-3 w-3 text-foreground-muted" />
          <span className="text-foreground-muted">Saved {relativeTime}</span>
        </>
      )}
    </button>
  );
});
