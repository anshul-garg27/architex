"use client";

import { useEffect } from "react";

export default function BlueprintError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
     
    console.error("[blueprint error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-12 text-center">
      <h2 className="text-xl font-semibold text-red-500">
        Something went wrong.
      </h2>
      <p className="max-w-md text-sm text-foreground-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
