"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "architex-install-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Add to Home Screen" prompt that captures the `beforeinstallprompt` event.
 * - On browsers that support the event (Chrome, Edge, etc.), shows a branded
 *   install banner.
 * - On iOS Safari (which does not fire `beforeinstallprompt`), shows manual
 *   instructions.
 * - Dismissible per session via sessionStorage.
 * - Will not render when already running in standalone mode.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed this session
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    // Detect iOS
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window);
    setIsIOS(ios);

    // iOS doesn't fire beforeinstallprompt -- show manual instructions
    if (ios) {
      setVisible(true);
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setVisible(false);
    }
    deferredPromptRef.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg"
    >
      {isIOS ? (
        <p className="text-sm text-foreground">
          To install Architex, tap{" "}
          <span className="inline-flex h-5 w-5 items-center justify-center align-middle">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </span>{" "}
          then &ldquo;Add to Home Screen&rdquo;
        </p>
      ) : (
        <>
          <p className="text-sm text-foreground">
            Install Architex for the best experience
          </p>

          <button
            type="button"
            onClick={handleInstall}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Install
          </button>
        </>
      )}

      <button
        type="button"
        onClick={handleDismiss}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss install prompt"
      >
        Dismiss
      </button>
    </div>
  );
}
