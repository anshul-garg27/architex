"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";
import { TopChrome } from "./shell/TopChrome";
import { Breadcrumb } from "./shell/Breadcrumb";
import { StatusBar } from "./shell/StatusBar";
import { useJourneyStateSync } from "@/hooks/blueprint/useJourneyStateSync";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import { useBlueprintRoute } from "@/hooks/blueprint/useBlueprintRoute";
import { blueprintModuleOpened } from "@/lib/analytics/blueprint-events";

/**
 * Top-level shell that wraps every Blueprint route.
 *
 * Responsibilities:
 *   - Hydrate journey state from the server on mount
 *   - Fire `module_opened` analytics event once per mount
 *   - Render fixed chrome (top bar, breadcrumb, status bar)
 *   - Keep URL↔store consistent via the route hook it implicitly
 *     exercises (SurfaceTabs and Breadcrumb both read from it)
 */
export const BlueprintShell = memo(function BlueprintShell({
  children,
}: {
  children: ReactNode;
}) {
  useJourneyStateSync();
  const { track } = useBlueprintAnalytics();
  const { surface } = useBlueprintRoute();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    track(blueprintModuleOpened({ entrySurface: surface }));
  }, [surface, track]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <TopChrome />
      <div className="flex h-10 shrink-0 items-center border-b border-border/20 bg-background/40 px-4">
        <Breadcrumb />
      </div>
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      <StatusBar />
    </div>
  );
});
