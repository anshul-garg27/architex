"use client";

import { useState } from "react";
import type { CompareCheckpoint as CompareCheckpointData } from "@/lib/lld/lesson-types";
import { gradeCompareCheckpoint } from "@/lib/lld/checkpoint-grading";

interface CompareCheckpointProps {
  checkpoint: CompareCheckpointData;
  onResult?: (result: {
    id: string;
    correct: boolean;
    attempts: number;
  }) => void;
}

type Side = "left" | "right" | "both";

export function CompareCheckpoint({
  checkpoint,
  onResult,
}: CompareCheckpointProps) {
  const [picks, setPicks] = useState<Record<string, Side>>({});
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const choose = (statementId: string, side: Side) => {
    if (submitted) return;
    setPicks((p) => ({ ...p, [statementId]: side }));
  };

  const allAnswered = checkpoint.statements.every((s) => picks[s.id]);

  const submit = () => {
    const result = gradeCompareCheckpoint(checkpoint, picks);
    const next = attempts + 1;
    setAttempts(next);
    if (result.correct) {
      setSubmitted(true);
      onResult?.({ id: checkpoint.id, correct: true, attempts: next });
    } else if (next >= 3) {
      setSubmitted(true);
      onResult?.({ id: checkpoint.id, correct: false, attempts: next });
    }
  };

  return (
    <article
      aria-labelledby={`cp-${checkpoint.id}-prompt`}
      className="rounded-lg border border-cyan-200 bg-white p-5 dark:border-cyan-800 dark:bg-neutral-950"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
        Compare
      </p>
      <h3
        id={`cp-${checkpoint.id}-prompt`}
        className="mt-2 font-medium text-neutral-900 dark:text-neutral-50"
      >
        {checkpoint.prompt}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-cyan-300 p-2 text-center font-mono dark:border-cyan-700">
          {checkpoint.left.label}
        </div>
        <div className="rounded border border-cyan-300 p-2 text-center font-mono dark:border-cyan-700">
          {checkpoint.right.label}
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {checkpoint.statements.map((s) => (
          <li
            key={s.id}
            className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {s.text}
            </p>
            <div className="mt-2 flex gap-2">
              {(["left", "both", "right"] as Side[]).map((side) => {
                const active = picks[s.id] === side;
                const correct = submitted && s.correct === side;
                const wrong = submitted && picks[s.id] === side && s.correct !== side;
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => choose(s.id, side)}
                    disabled={submitted}
                    aria-pressed={active}
                    className={`rounded border px-2 py-1 text-xs ${
                      correct
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                        : wrong
                          ? "border-red-400 bg-red-50 dark:bg-red-950/40"
                          : active
                            ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30"
                            : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    {side === "left"
                      ? checkpoint.left.label
                      : side === "right"
                        ? checkpoint.right.label
                        : "both"}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="mt-4 rounded bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Submit
        </button>
      ) : null}
      {submitted ? (
        <p className="mt-4 rounded bg-cyan-50 p-3 text-sm text-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200">
          {checkpoint.explanation}
        </p>
      ) : null}
    </article>
  );
}
