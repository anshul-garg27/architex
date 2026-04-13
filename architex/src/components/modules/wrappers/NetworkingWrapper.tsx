"use client";

import { memo, useEffect } from "react";
import { useNetworkingModule } from "@/components/modules/NetworkingModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function NetworkingModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useNetworkingModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
