"use client";

import { useState } from "react";
import type { CreateCheckpoint as CreateCheckpointData } from "@/lib/lld/lesson-types";
import { gradeCreateCheckpoint } from "@/lib/lld/checkpoint-grading";

interface CreateCheckpointProps {
  checkpoint: CreateCheckpointData;
  onResult?: (result: {
    id: string;
    correct: boolean;
    attempts: number;
  }) => void;
}

export function CreateCheckpoint({
  checkpoint,
  onResult,
}: CreateCheckpointProps) {
  const [userClasses, setUserClasses] = useState<string[]>(
    checkpoint.starterCanvas.classes.map((c) => c.name),
  );
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const addClass = () => {
    setUserClasses((cs) => [...cs, ""]);
  };

  const setClass = (i: number, v: string) => {
    setUserClasses((cs) => cs.map((c, j) => (j === i ? v : c)));
  };

  const removeClass = (i: number) => {
    setUserClasses((cs) => cs.filter((_, j) => j !== i));
  };

  const submit = () => {
    const result = gradeCreateCheckpoint(checkpoint, userClasses);
    const next = attempts + 1;
    setAttempts(next);
    setSubmitted(true);
    onResult?.({
      id: checkpoint.id,
      correct: result.correct,
      attempts: next,
    });
  };

  const result = submitted ? gradeCreateCheckpoint(checkpoint, userClasses) : null;

  return (
    <article
      aria-labelledby={`cp-${checkpoint.id}-prompt`}
      className="rounded-lg border border-amber-200 bg-white p-5 dark:border-amber-800 dark:bg-neutral-950"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
        Create
      </p>
      <h3
        id={`cp-${checkpoint.id}-prompt`}
        className="mt-2 font-medium text-neutral-900 dark:text-neutral-50"
      >
        {checkpoint.prompt}
      </h3>
      <ul className="mt-4 space-y-2">
        {userClasses.map((c, i) => (
          <li key={i} className="flex gap-2">
            <input
              type="text"
              value={c}
              onChange={(e) => setClass(i, e.target.value)}
              disabled={submitted}
              aria-label={`Class name ${i + 1}`}
              className="flex-1 rounded border border-neutral-200 px-2 py-1 font-mono text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
            <button
              type="button"
              onClick={() => removeClass(i)}
              disabled={submitted}
              aria-label={`Remove class ${i + 1}`}
              className="rounded border border-neutral-200 px-2 text-xs dark:border-neutral-800"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {!submitted ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={addClass}
            className="rounded border border-amber-400 px-3 py-1.5 text-sm text-amber-700 dark:border-amber-700 dark:text-amber-300"
          >
            + Add class
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={userClasses.filter((c) => c.trim()).length === 0}
            className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      ) : null}
      {result ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            Score: {result.points} / {result.maxPoints}
          </p>
          <details className="rounded border border-amber-200 p-3 dark:border-amber-800">
            <summary className="cursor-pointer text-sm font-medium">
              Reference solution
            </summary>
            <ul className="mt-2 space-y-1 text-sm">
              {checkpoint.referenceSolution.classes.map((c) => (
                <li key={c.id} className="font-mono">
                  {c.name}
                </li>
              ))}
            </ul>
          </details>
          <p className="rounded bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {checkpoint.explanation}
          </p>
        </div>
      ) : null}
    </article>
  );
}
