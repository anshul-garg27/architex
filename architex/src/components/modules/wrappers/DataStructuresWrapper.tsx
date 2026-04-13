"use client";

import { memo, lazy, Suspense } from "react";
import type { ModuleContent } from "@/components/modules/module-content";

// Lazy-load the heavy inner component that pulls in ~24,000 lines
// of data-structure implementations + visualizers. This boundary
// ensures the wrapper itself loads instantly (~10 lines) while the
// heavy module loads asynchronously without blocking the UI.
const DataStructuresInner = lazy(() => import("./DataStructuresInner"));

export default memo(function DataStructuresModuleContent({
  onContent,
}: {
  onContent: (c: ModuleContent) => void;
}) {
  return (
    <Suspense fallback={null}>
      <DataStructuresInner onContent={onContent} />
    </Suspense>
  );
});
