"use client";

import { memo, useState } from "react";
import { X } from "lucide-react";
import { useLLDTemplatesLibrary } from "@/hooks/useLLDTemplatesLibrary";
import { PatternLibraryItem } from "./PatternLibraryItem";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TemplateLoaderDialog = memo(function TemplateLoaderDialog({
  open,
  onClose,
}: Props) {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");

  const { data: templates = [] } = useLLDTemplatesLibrary({
    q: q.trim() || undefined,
    difficulty: difficulty || undefined,
  });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Template loader"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-border/40 bg-elevated/95 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border/20 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Load a template
            </h2>
            <p className="text-xs text-foreground-muted">
              ~60 curated starters. Click to apply.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex gap-2 border-b border-border/20 px-4 py-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary/40"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs"
          >
            <option value="">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <ul className="grid max-h-[60vh] grid-cols-2 gap-1 overflow-y-auto p-2">
          {templates.map((t) => (
            <PatternLibraryItem key={t.id} template={t} />
          ))}
        </ul>
      </div>
    </div>
  );
});
