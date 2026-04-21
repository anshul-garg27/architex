"use client";

import { Fragment, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FillBlankWidget as Spec } from "@/lib/blueprint/section-types";

interface Props {
  widget: Spec;
  onSubmit: (result: { correct: boolean; attempts: number; values: Record<string, string> }) => void;
  locked: boolean;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function splitPrompt(prompt: string): Array<{ kind: "text"; text: string } | { kind: "blank"; id: string }> {
  const out: Array<{ kind: "text"; text: string } | { kind: "blank"; id: string }> = [];
  const re = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(prompt)) !== null) {
    if (match.index > lastIndex) {
      out.push({ kind: "text", text: prompt.slice(lastIndex, match.index) });
    }
    out.push({ kind: "blank", id: match[1].trim() });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < prompt.length) {
    out.push({ kind: "text", text: prompt.slice(lastIndex) });
  }
  return out;
}

export function FillBlankWidget({ widget, onSubmit, locked }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const tokens = useMemo(() => splitPrompt(widget.prompt), [widget.prompt]);

  const checkAnswer = (id: string): boolean => {
    const blank = widget.blanks.find((b) => b.id === id);
    if (!blank) return false;
    const val = normalize(values[id] ?? "");
    if (val === normalize(blank.answer)) return true;
    return (
      blank.alternatives?.some((alt) => val === normalize(alt)) ?? false
    );
  };

  const allCorrect = widget.blanks.every((b) => checkAnswer(b.id));

  const handleSubmit = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSubmitted(true);
    onSubmit({ correct: allCorrect, attempts: nextAttempts, values });
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">Fill the blanks.</p>
      <p className="text-sm leading-relaxed text-foreground">
        {tokens.map((t, i) => {
          if (t.kind === "text") return <Fragment key={i}>{t.text}</Fragment>;
          const blank = widget.blanks.find((b) => b.id === t.id);
          if (!blank) return <Fragment key={i}>{`{{${t.id}}}`}</Fragment>;
          const isCorrect = submitted && checkAnswer(t.id);
          const isIncorrect = submitted && !checkAnswer(t.id);
          return (
            <input
              key={t.id}
              type="text"
              disabled={locked || (submitted && allCorrect)}
              value={values[t.id] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [t.id]: e.target.value }))
              }
              aria-label={`Blank ${t.id}`}
              className={cn(
                "mx-1 inline-block min-w-[96px] rounded-md border border-b-2 bg-background/80 px-2 py-0.5 text-sm focus-visible:outline-none focus-visible:border-indigo-500",
                isCorrect
                  ? "border-emerald-400/60 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : isIncorrect
                    ? "border-red-400/60 bg-red-50/60 text-red-900 dark:bg-red-950/30 dark:text-red-200"
                    : "border-foreground/20",
              )}
            />
          );
        })}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-foreground-muted">
          {submitted && allCorrect && (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
              <Check className="h-3 w-3" /> All correct.
            </span>
          )}
          {submitted && !allCorrect && (
            <span className="text-red-700 dark:text-red-300">
              Close — check the highlighted blanks.
            </span>
          )}
        </p>
        {!locked && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Object.values(values).every((v) => !v.trim()) || (submitted && allCorrect)}
            className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-600 disabled:bg-foreground/10 disabled:text-foreground-muted"
          >
            {submitted && allCorrect ? "Nice" : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
