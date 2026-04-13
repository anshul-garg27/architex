"use client";

import { useCallback, useEffect, useState } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-sw";

/**
 * Displays a toast banner when a new service worker version is waiting.
 * The user can click "Reload" to activate the update or dismiss the banner.
 */
export function UpdateToast() {
  const [waitingReg, setWaitingReg] =
    useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const cleanup = registerServiceWorker({
      onUpdate(registration) {
        setWaitingReg(registration);
      },
    });
    return cleanup;
  }, []);

  const handleReload = useCallback(() => {
    const waiting = waitingReg?.waiting;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingReg]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!waitingReg || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg"
    >
      <svg
        className="h-4 w-4 shrink-0 text-primary"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>

      <p className="text-sm text-foreground">
        A new version of Architex is available
      </p>

      <button
        type="button"
        onClick={handleReload}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Reload
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss update notification"
      >
        Later
      </button>
    </div>
  );
}
