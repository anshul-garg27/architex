"use client";

import { memo, useEffect } from "react";
import { useKnowledgeGraphModule } from "@/components/modules/KnowledgeGraphModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function KnowledgeGraphModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useKnowledgeGraphModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
