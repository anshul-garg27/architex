"use client";

import { memo, useEffect } from "react";
import { useSecurityModule } from "@/components/modules/SecurityModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function SecurityModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useSecurityModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
