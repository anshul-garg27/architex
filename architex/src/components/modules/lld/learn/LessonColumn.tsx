"use client";

import type { LessonPayload } from "@/lib/lld/lesson-types";
import { ItchSection } from "./sections/ItchSection";
import { DefinitionSection } from "./sections/DefinitionSection";
import { MechanismSection } from "./sections/MechanismSection";
import { AnatomySection } from "./sections/AnatomySection";
import { NumbersSection } from "./sections/NumbersSection";
import { UsesSection } from "./sections/UsesSection";
import { FailureModesSection } from "./sections/FailureModesSection";
import { CheckpointSection } from "./sections/CheckpointSection";

interface LessonColumnProps {
  payload: LessonPayload;
  onCheckpointResult?: (result: {
    id: string;
    correct: boolean;
    attempts: number;
  }) => void;
}

export function LessonColumn({
  payload,
  onCheckpointResult,
}: LessonColumnProps) {
  return (
    <article className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
      <ItchSection payload={payload.sections.itch} />
      <DefinitionSection payload={payload.sections.definition} />
      <MechanismSection payload={payload.sections.mechanism} />
      <AnatomySection payload={payload.sections.anatomy} />
      <NumbersSection payload={payload.sections.numbers} />
      <UsesSection payload={payload.sections.uses} />
      <FailureModesSection payload={payload.sections.failure_modes} />
      <CheckpointSection
        payload={payload.sections.checkpoints}
        onResult={onCheckpointResult}
      />
    </article>
  );
}
