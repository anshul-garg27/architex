"use client";

import { memo, useEffect } from "react";
import { useAlgorithmModule } from "@/components/modules/AlgorithmModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function AlgorithmModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useAlgorithmModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
