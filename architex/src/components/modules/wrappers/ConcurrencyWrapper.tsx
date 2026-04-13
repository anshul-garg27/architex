"use client";

import { memo, useEffect } from "react";
import { useConcurrencyModule } from "@/components/modules/ConcurrencyModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function ConcurrencyModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useConcurrencyModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
