"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="h-full overflow-hidden bg-background text-foreground">
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              {error.message}
            </p>
            <button
              onClick={reset}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary-hover"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
