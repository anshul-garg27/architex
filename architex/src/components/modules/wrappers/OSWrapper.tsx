"use client";

import { memo, useEffect } from "react";
import { useOSModule } from "@/components/modules/OSModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function OSModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useOSModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
