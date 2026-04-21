"use client";

import { ReadSection } from "./sections/ReadSection";
import { InteractSection } from "./sections/InteractSection";
import { RetainSection } from "./sections/RetainSection";
import { ReflectSection } from "./sections/ReflectSection";
import { ApplySection } from "./sections/ApplySection";
import { PracticeSection } from "./sections/PracticeSection";
import { CheckpointSection } from "./sections/CheckpointSection";
import type {
  BlueprintUnitSectionPayload,
} from "@/hooks/blueprint/useUnit";
import type {
  ReadSectionParams,
  InteractSectionParams,
  RetainSectionParams,
  ReflectSectionParams,
  ApplySectionParams,
  PracticeSectionParams,
  CheckpointSectionParams,
} from "@/lib/blueprint/section-types";

interface Props {
  unitSlug: string;
  section: BlueprintUnitSectionPayload;
  isCompleted: boolean;
  onInteractResult: (score: number) => void;
  onRetainScheduled: () => void;
  onReflectSaved: () => void;
  onApplyMarkedDone: () => void;
  onPracticeFinished: () => void;
  onCheckpointPassed: (score: number) => void;
}

/**
 * Dispatches to the correct Section component based on `section.type`
 * and wires completion callbacks back to the parent Unit page (which
 * owns progress writes).
 *
 * Every section is wrapped in a `<section data-blueprint-section>` for
 * IntersectionObserver + deep-linking via URL hash.
 */
export function SectionRouter({
  unitSlug,
  section,
  isCompleted,
  onInteractResult,
  onRetainScheduled,
  onReflectSaved,
  onApplyMarkedDone,
  onPracticeFinished,
  onCheckpointPassed,
}: Props) {
  return (
    <section
      id={`section-${section.id}`}
      data-blueprint-section={section.id}
      data-section-type={section.type}
      className="border-b border-border/20 last:border-b-0"
    >
      {section.type === "read" && (
        <ReadSection
          title={section.title}
          params={section.params as ReadSectionParams}
        />
      )}
      {section.type === "interact" && (
        <InteractSection
          title={section.title}
          params={section.params as InteractSectionParams}
          isCompleted={isCompleted}
          onResult={(r) => {
            if (r.correct) onInteractResult(r.score);
          }}
        />
      )}
      {section.type === "retain" && (
        <RetainSection
          title={section.title}
          params={section.params as RetainSectionParams}
          isCompleted={isCompleted}
          onComplete={onRetainScheduled}
        />
      )}
      {section.type === "reflect" && (
        <ReflectSection
          title={section.title}
          params={section.params as ReflectSectionParams}
          isCompleted={isCompleted}
          onComplete={() => onReflectSaved()}
        />
      )}
      {section.type === "apply" && (
        <ApplySection
          title={section.title}
          params={section.params as ApplySectionParams}
          isCompleted={isCompleted}
          onComplete={onApplyMarkedDone}
        />
      )}
      {section.type === "practice" && (
        <PracticeSection
          title={section.title}
          params={section.params as PracticeSectionParams}
          isCompleted={isCompleted}
          onComplete={onPracticeFinished}
        />
      )}
      {section.type === "checkpoint" && (
        <CheckpointSection
          unitSlug={unitSlug}
          title={section.title}
          params={section.params as CheckpointSectionParams}
          isCompleted={isCompleted}
          onComplete={onCheckpointPassed}
        />
      )}
    </section>
  );
}
