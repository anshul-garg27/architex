// ── Service Worker Registration ─────────────────────────────────
// Registers the service worker and manages its lifecycle.
// Only activates in production or when SW_ENABLED is explicitly set.

type SWUpdateCallback = (registration: ServiceWorkerRegistration) => void;

interface RegisterSWOptions {
  /** Called when a new SW version is waiting to activate. */
  onUpdate?: SWUpdateCallback;
  /** Called when the SW has been installed for the first time. */
  onInstall?: SWUpdateCallback;
}

/** Whether SW registration should proceed. */
function shouldRegister(): boolean {
  if (!("serviceWorker" in navigator)) return false;

  const isProduction = process.env.NODE_ENV === "production";
  const isExplicitlyEnabled =
    process.env.NEXT_PUBLIC_SW_ENABLED === "true";

  return isProduction || isExplicitlyEnabled;
}

/**
 * Register the service worker and listen for lifecycle events.
 * Returns a cleanup function that removes the controllerchange listener.
 */
export function registerServiceWorker(
  options: RegisterSWOptions = {},
): () => void {
  const { onUpdate, onInstall } = options;

  if (!shouldRegister()) {
    return () => {};
  }

  let cleanedUp = false;

  const handleControllerChange = () => {
    if (!cleanedUp) {
      window.location.reload();
    }
  };

  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then((registration) => {
      // Check for updates every 60 minutes
      const interval = setInterval(() => {
        registration.update().catch(() => {
          // Silently ignore update check failures (e.g. offline)
        });
      }, 60 * 60 * 1000);

      // Track the interval so cleanup can clear it if needed
      const originalCleanup = cleanup;
      cleanup = () => {
        originalCleanup();
        clearInterval(interval);
      };

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state !== "installed") return;

          if (navigator.serviceWorker.controller) {
            // A previous SW was controlling the page -- this is an update
            onUpdate?.(registration);
          } else {
            // First-time install
            onInstall?.(registration);
          }
        });
      });
    })
    .catch((error) => {
      console.error("[SW] Registration failed:", error);
    });

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    handleControllerChange,
  );

  let cleanup = () => {
    cleanedUp = true;
    navigator.serviceWorker.removeEventListener(
      "controllerchange",
      handleControllerChange,
    );
  };

  return () => cleanup();
}
