"use client";

import { useMemo, useState } from "react";
import type { ApplyCheckpoint as ApplyCheckpointData } from "@/lib/lld/lesson-types";
import { gradeApplyCheckpoint } from "@/lib/lld/checkpoint-grading";

interface ApplyCheckpointProps {
  checkpoint: ApplyCheckpointData;
  onResult?: (result: {
    id: string;
    correct: boolean;
    attempts: number;
  }) => void;
}

export function ApplyCheckpoint({
  checkpoint,
  onResult,
}: ApplyCheckpointProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const all = useMemo(
    () => [...checkpoint.correctClassIds, ...checkpoint.distractorClassIds],
    [checkpoint.correctClassIds, checkpoint.distractorClassIds],
  );

  const toggle = (id: string) => {
    if (submitted) return;
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    const result = gradeApplyCheckpoint(checkpoint, selected);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (result.correct) {
      setSubmitted(true);
      onResult?.({
        id: checkpoint.id,
        correct: true,
        attempts: nextAttempts,
      });
    } else if (nextAttempts >= 3) {
      setSubmitted(true);
      onResult?.({
        id: checkpoint.id,
        correct: false,
        attempts: nextAttempts,
      });
    }
  };

  const result = submitted
    ? gradeApplyCheckpoint(checkpoint, selected)
    : null;

  return (
    <article
      aria-labelledby={`cp-${checkpoint.id}-prompt`}
      className="rounded-lg border border-emerald-200 bg-white p-5 dark:border-emerald-800 dark:bg-neutral-950"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
        Apply
      </p>
      <h3
        id={`cp-${checkpoint.id}-prompt`}
        className="mt-2 font-medium text-neutral-900 dark:text-neutral-50"
      >
        {checkpoint.scenario}
      </h3>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {all.map((id) => {
          const isSel = selected.has(id);
          const isCorrect = checkpoint.correctClassIds.includes(id);
          const showResult = submitted;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => toggle(id)}
                disabled={submitted}
                aria-pressed={isSel}
                className={`w-full rounded border p-2 font-mono text-xs transition ${
                  showResult && isSel && isCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                    : showResult && isSel && !isCorrect
                      ? "border-red-400 bg-red-50 dark:bg-red-950/40"
                      : showResult && !isSel && isCorrect
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40"
                        : isSel
                          ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30"
                          : "border-neutral-200 hover:border-emerald-300 dark:border-neutral-800 dark:hover:border-emerald-700"
                }`}
              >
                {id}
              </button>
            </li>
          );
        })}
      </ul>
      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={selected.size === 0}
          className="mt-4 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Submit
        </button>
      ) : null}
      {result ? (
        <div className="mt-4 space-y-2">
          {result.missing.length > 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Missing: {result.missing.join(", ")}
            </p>
          ) : null}
          {result.extra.length > 0 ? (
            <p className="text-sm text-red-700 dark:text-red-300">
              Extra: {result.extra.join(", ")}
            </p>
          ) : null}
          <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            {checkpoint.explanation}
          </p>
        </div>
      ) : null}
    </article>
  );
}
