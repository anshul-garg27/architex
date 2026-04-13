"use client";

import { memo, useEffect } from "react";
import { useInterviewModule } from "@/components/modules/InterviewModule";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function InterviewModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useInterviewModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
