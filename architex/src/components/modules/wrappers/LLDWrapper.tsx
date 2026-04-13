"use client";

import { memo, useEffect } from "react";
import { useLLDModule } from "@/components/modules/LLDModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function LLDModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useLLDModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
