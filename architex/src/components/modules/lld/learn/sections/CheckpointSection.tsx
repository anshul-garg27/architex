"use client";

import type { CheckpointsSectionPayload } from "@/lib/lld/lesson-types";
import { RecallCheckpoint } from "../checkpoints/RecallCheckpoint";
import { ApplyCheckpoint } from "../checkpoints/ApplyCheckpoint";
import { CompareCheckpoint } from "../checkpoints/CompareCheckpoint";
import { CreateCheckpoint } from "../checkpoints/CreateCheckpoint";

interface CheckpointSectionProps {
  payload: CheckpointsSectionPayload;
  onResult?: (result: {
    id: string;
    correct: boolean;
    attempts: number;
  }) => void;
}

export function CheckpointSection({
  payload,
  onResult,
}: CheckpointSectionProps) {
  const [recall, apply, compare, create] = payload.checkpoints;

  return (
    <section
      data-lesson-section="checkpoints"
      aria-labelledby="lesson-section-checkpoints"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Section 8 · Checkpoints
        </p>
        <h2
          id="lesson-section-checkpoints"
          className="mt-2 font-serif text-3xl leading-tight text-neutral-900 dark:text-neutral-50"
        >
          Prove it stuck
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Four short checkpoints. Get them wrong freely — each wrong answer
          reveals more detail before the final explanation.
        </p>
      </header>
      <div className="space-y-10">
        <RecallCheckpoint checkpoint={recall} onResult={onResult} />
        <ApplyCheckpoint checkpoint={apply} onResult={onResult} />
        <CompareCheckpoint checkpoint={compare} onResult={onResult} />
        <CreateCheckpoint checkpoint={create} onResult={onResult} />
      </div>
    </section>
  );
}
