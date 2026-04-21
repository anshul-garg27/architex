"use client";

import { WelcomeBanner } from "./WelcomeBanner";
import { ResumeCard } from "./ResumeCard";
import { StreakPill } from "./StreakPill";
import { CurriculumMap } from "./CurriculumMap";

/**
 * Top-level journey home. Composition only — each child component
 * owns its own data fetching and empty-states.
 */
export function JourneyHomePage() {
  return (
    <div className="min-h-full px-4 pb-12">
      <WelcomeBanner />
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Your journey
          </h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Twelve units · hand-authored · go at your own pace
          </p>
        </div>
        <StreakPill />
      </div>
      <ResumeCard />
      <CurriculumMap />
    </div>
  );
}
