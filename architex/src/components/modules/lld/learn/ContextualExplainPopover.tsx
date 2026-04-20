"use client";

/**
 * ContextualExplainPopover — floating surface that follows the text
 * selection while active, and flips into an explanation panel once the
 * user requests one.
 */

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import type { LessonSectionId } from "@/lib/lld/lesson-types";
import type { SelectionExplainState } from "@/hooks/useSelectionExplain";

interface ContextualExplainPopoverProps {
  state: SelectionExplainState;
  patternSlug: string;
  sectionId: LessonSectionId | null;
  /**
   * Raw section markdown — consumed upstream when building the explain
   * request. Kept in the component props for prop-drilling coherence.
   */
  sectionRaw?: string;
  onRequest: () => void;
  onClose: () => void;
}

export function ContextualExplainPopover({
  state,
  patternSlug,
  sectionId,
  onRequest,
  onClose,
}: ContextualExplainPopoverProps) {
  const { selection, anchorRect, explanation, isAI, isLoading, error } = state;

  // Trigger appears near the selection until an explanation is loaded.
  if (!selection && !explanation) return null;

  const triggerStyle: React.CSSProperties = anchorRect
    ? {
        position: "fixed",
        left: Math.min(anchorRect.left, window.innerWidth - 160),
        top: Math.max(anchorRect.top - 42, 12),
        zIndex: 60,
      }
    : { display: "none" };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 360,
    zIndex: 61,
  };

  if (explanation) {
    return (
      <div
        role="dialog"
        aria-label={`${patternSlug} inline explanation`}
        aria-live="polite"
        style={panelStyle}
        className="rounded-lg border border-amber-200 bg-white p-4 shadow-xl dark:border-amber-800 dark:bg-neutral-950"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {isAI ? "Inline explanation" : "Inline explanation (offline)"}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {patternSlug} · {sectionId ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close explanation"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={14} />
          </button>
        </div>
        <p className="mt-3 max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {explanation}
        </p>
      </div>
    );
  }

  return (
    <div
      style={triggerStyle}
      role="region"
      aria-label="Explain selection"
      className="rounded border border-amber-300 bg-white/95 px-2 py-1 shadow dark:border-amber-700 dark:bg-neutral-950/95"
    >
      <button
        type="button"
        onClick={onRequest}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 disabled:opacity-60 dark:text-amber-300 dark:hover:text-amber-100"
      >
        <Sparkles size={12} />
        {isLoading ? "Thinking…" : "Explain this"}
      </button>
      {error ? (
        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
