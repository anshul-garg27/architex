"use client";

import { memo, useEffect } from "react";
import { useDataStructuresModule } from "@/components/modules/data-structures";
import type { ModuleContent } from "@/components/modules/module-content";

/**
 * Heavy inner component that consumes useDataStructuresModule().
 * This is lazy-loaded by DataStructuresWrapper via React.lazy()
 * so the ~24,000-line import chain loads asynchronously instead of
 * blocking the main thread on mount.
 */
export default memo(function DataStructuresInner({
  onContent,
}: {
  onContent: (c: ModuleContent) => void;
}) {
  const content = useDataStructuresModule();

  useEffect(() => {
    onContent(content);
  }, [onContent, content]);

  return null;
});
