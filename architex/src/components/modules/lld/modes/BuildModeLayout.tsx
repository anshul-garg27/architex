"use client";

import { memo, type ReactNode } from "react";

/**
 * Build mode · wraps today's LLD 4-panel UI unchanged.
 *
 * The actual panels (sidebar, canvas, properties, bottom tabs) are still
 * assembled by useLLDModuleImpl. BuildModeLayout just provides a named
 * wrapper so modes can evolve independently.
 */
export const BuildModeLayout = memo(function BuildModeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
});
