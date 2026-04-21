"use client";

import { memo, useState } from "react";
import { FilePlus, Sparkles, Undo, Redo } from "lucide-react";
import { AutoLayoutMenu } from "./AutoLayoutMenu";
import { BuildExportMenu } from "./BuildExportMenu";
import { NamedSnapshotsDrawer } from "./NamedSnapshotsDrawer";
import { TemplateLoaderDialog } from "./TemplateLoaderDialog";
import { AISuggestionsCard } from "./AISuggestionsCard";
import { useCanvasStore } from "@/stores/canvas-store";

export const BuildActionsRail = memo(function BuildActionsRail() {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setTemplatesOpen(true)}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <FilePlus className="h-3.5 w-3.5" />
        Templates
      </button>

      <button
        type="button"
        onClick={() => setAiOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest
      </button>

      <AutoLayoutMenu />
      <BuildExportMenu />
      <NamedSnapshotsDrawer />

      <div className="ml-1 flex items-center gap-0.5 border-l border-border/30 pl-2">
        <button
          type="button"
          aria-label="Undo"
          onClick={undo}
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Redo"
          onClick={redo}
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
        >
          <Redo className="h-3.5 w-3.5" />
        </button>
      </div>

      <TemplateLoaderDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
      {aiOpen && <AISuggestionsCard onDismiss={() => setAiOpen(false)} />}
    </div>
  );
});
