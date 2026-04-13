"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, type ReactNode } from "react";
import { initProgressSync } from "@/lib/sync/progress-sync-subscriber";

/** Default stale time for content queries (5 minutes). */
const CONTENT_STALE_TIME = 5 * 60 * 1000;

/** Garbage collection time — keep unused queries in cache for 30 minutes. */
const GC_TIME = 30 * 60 * 1000;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CONTENT_STALE_TIME,
            gcTime: GC_TIME,
            refetchOnWindowFocus: false,
            networkMode: "offlineFirst",
            retry: 2,
          },
          mutations: {
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  // Initialize progress sync subscriber (once, client-side only)
  useEffect(() => {
    initProgressSync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
