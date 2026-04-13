"use client";

import { memo, useEffect } from "react";
import { usePlaceholderModule } from "@/components/modules/PlaceholderModule";
import type { ModuleContent } from "@/components/modules/module-content";
import type { ModuleType } from "@/stores/ui-store";

export default memo(function PlaceholderModuleContent({ activeModule, onContent }: { activeModule: ModuleType; onContent: (c: ModuleContent) => void }) {
  const content = usePlaceholderModule(activeModule);
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
