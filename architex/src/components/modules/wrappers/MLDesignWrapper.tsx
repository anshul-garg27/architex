"use client";

import { memo, useEffect } from "react";
import { useMLDesignModule } from "@/components/modules/MLDesignModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function MLDesignModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useMLDesignModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
