"use client";

/**
 * useSelectionExplain — tracks text selection inside a container and
 * fetches an inline explanation via POST /api/lld/explain-inline when
 * the user clicks the floating "Explain this" trigger.
 *
 * Returns:
 *   selection          current non-empty text selection (trimmed)
 *   anchorRect         bounding rect of the selection for popover placement
 *   explanation        latest fetched explanation (null until requested)
 *   isAI               whether the response came from the LLM (vs fallback)
 *   isLoading          fetch in flight
 *   requestExplanation(section) trigger fetch for the current selection
 *   clear()            dismiss current explanation
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonSectionId } from "@/lib/lld/lesson-types";

export interface ExplainContext {
  patternSlug: string;
  sectionId: LessonSectionId;
  sectionRaw: string;
}

export interface SelectionExplainState {
  selection: string;
  anchorRect: DOMRect | null;
  explanation: string | null;
  isAI: boolean;
  isLoading: boolean;
  error: string | null;
}

function getSelectionDetails(): {
  text: string;
  rect: DOMRect | null;
} {
  if (typeof window === "undefined") return { text: "", rect: null };
  const sel = window.getSelection?.();
  if (!sel || sel.rangeCount === 0) return { text: "", rect: null };
  const text = sel.toString().trim();
  if (!text) return { text: "", rect: null };
  try {
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return { text, rect };
  } catch {
    return { text, rect: null };
  }
}

export function useSelectionExplain(
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const [state, setState] = useState<SelectionExplainState>({
    selection: "",
    anchorRect: null,
    explanation: null,
    isAI: false,
    isLoading: false,
    error: null,
  });
  const inFlight = useRef<AbortController | null>(null);

  // Track selection changes scoped to the container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = () => {
      const { text, rect } = getSelectionDetails();
      if (!text) {
        setState((s) => ({ ...s, selection: "", anchorRect: null }));
        return;
      }
      // Scope: ensure the selection anchorNode is inside our container.
      const sel = window.getSelection?.();
      const anchor = sel?.anchorNode;
      if (!anchor || !el.contains(anchor)) {
        return;
      }
      setState((s) => ({
        ...s,
        selection: text,
        anchorRect: rect,
        // Don't reset explanation here; user may close manually.
      }));
    };

    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [containerRef]);

  const requestExplanation = useCallback(
    async (ctx: ExplainContext): Promise<void> => {
      if (!state.selection) return;
      if (inFlight.current) {
        inFlight.current.abort();
      }
      const ctl = new AbortController();
      inFlight.current = ctl;
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const res = await fetch("/api/lld/explain-inline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selection: state.selection,
            patternSlug: ctx.patternSlug,
            sectionId: ctx.sectionId,
            sectionRaw: ctx.sectionRaw.slice(0, 4_000),
          }),
          signal: ctl.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          explanation: string;
          isAI: boolean;
        };
        setState((s) => ({
          ...s,
          isLoading: false,
          explanation: data.explanation,
          isAI: Boolean(data.isAI),
        }));
      } catch (err) {
        if (ctl.signal.aborted) return;
        setState((s) => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    },
    [state.selection],
  );

  const clear = useCallback(() => {
    setState((s) => ({
      ...s,
      explanation: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    requestExplanation,
    clear,
  };
}
