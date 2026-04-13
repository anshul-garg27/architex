"use client";

import { memo, useEffect } from "react";
import { useDistributedModule } from "@/components/modules/DistributedModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function DistributedModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useDistributedModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
