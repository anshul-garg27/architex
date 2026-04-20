"use client";

import { useState } from "react";
import type { RecallCheckpoint as RecallCheckpointData } from "@/lib/lld/lesson-types";

interface RecallCheckpointProps {
  checkpoint: RecallCheckpointData;
  onResult?: (result: {
    id: string;
    correct: boolean;
    attempts: number;
  }) => void;
}

export function RecallCheckpoint({
  checkpoint,
  onResult,
}: RecallCheckpointProps) {
  const [attempts, setAttempts] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const pick = (optionId: string) => {
    const chosen = checkpoint.options.find((o) => o.id === optionId);
    if (!chosen) return;
    const isCorrect = chosen.isCorrect;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPickedId(optionId);
    if (isCorrect || nextAttempts >= 3) {
      setRevealed(true);
      onResult?.({
        id: checkpoint.id,
        correct: isCorrect,
        attempts: nextAttempts,
      });
    }
  };

  const pickedOption = checkpoint.options.find((o) => o.id === pickedId);
  const showWhyWrong =
    !revealed && pickedOption && !pickedOption.isCorrect;

  return (
    <article
      aria-labelledby={`cp-${checkpoint.id}-prompt`}
      className="rounded-lg border border-violet-200 bg-white p-5 dark:border-violet-800 dark:bg-neutral-950"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
        Recall
      </p>
      <h3
        id={`cp-${checkpoint.id}-prompt`}
        className="mt-2 font-medium text-neutral-900 dark:text-neutral-50"
      >
        {checkpoint.prompt}
      </h3>
      <ul className="mt-4 space-y-2">
        {checkpoint.options.map((opt) => {
          const picked = pickedId === opt.id;
          const showCorrect = revealed && opt.isCorrect;
          const showWrong = revealed && picked && !opt.isCorrect;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => pick(opt.id)}
                disabled={revealed}
                aria-pressed={picked}
                className={`w-full rounded border p-3 text-left text-sm transition ${
                  showCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                    : showWrong
                      ? "border-red-400 bg-red-50 dark:bg-red-950/40"
                      : picked
                        ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30"
                        : "border-neutral-200 hover:border-violet-300 dark:border-neutral-800 dark:hover:border-violet-700"
                }`}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>
      {showWhyWrong && pickedOption?.whyWrong ? (
        <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <span className="font-semibold">Not quite: </span>
          {pickedOption.whyWrong}
        </p>
      ) : null}
      {revealed ? (
        <p className="mt-4 rounded bg-violet-50 p-3 text-sm text-violet-900 dark:bg-violet-950/30 dark:text-violet-200">
          {checkpoint.explanation}
        </p>
      ) : null}
    </article>
  );
}
