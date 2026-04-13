"use client";

import { memo, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ComponentPalette } from "@/components/canvas/panels/ComponentPalette";
import { PropertiesPanel } from "@/components/canvas/panels/PropertiesPanel";
import { BottomPanel } from "@/components/canvas/panels/BottomPanel";
import { DesignCanvas } from "@/components/canvas/DesignCanvas";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function SystemDesignModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content: ModuleContent = useMemo(() => ({
    sidebar: <ComponentPalette />,
    canvas: (
      <ReactFlowProvider>
        <DesignCanvas />
      </ReactFlowProvider>
    ),
    properties: <PropertiesPanel />,
    bottomPanel: <BottomPanel />,
  }), []);
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
