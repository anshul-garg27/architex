"use client";

import { memo, useEffect } from "react";
import { useDatabaseModule } from "@/components/modules/DatabaseModule";
import type { DatabaseMode } from "@/components/modules/DatabaseModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function DatabaseModuleContent({ onContent, initialMode }: { onContent: (c: ModuleContent) => void; initialMode?: DatabaseMode }) {
  const content = useDatabaseModule(initialMode);
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
