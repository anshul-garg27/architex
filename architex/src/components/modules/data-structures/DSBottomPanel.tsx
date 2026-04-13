"use client";

import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";
import SystemRoleSelector from "@/components/modules/data-structures/SystemRoleSelector";
import P95LatencyCalculator from "@/components/modules/data-structures/P95LatencyCalculator";
import WriteAmplificationVisualizer from "@/components/modules/data-structures/WriteAmplificationVisualizer";
import { DailyChallenge } from "@/components/modules/data-structures/DailyChallenge";
import { ScenarioChallenges } from "@/components/modules/data-structures/ScenarioChallenges";
import { ComplexityQuiz } from "@/components/modules/data-structures/ComplexityQuiz";
import { BreakItMode } from "@/components/modules/data-structures/BreakItMode";
import { ReverseMode } from "@/components/modules/data-structures/ReverseMode";
import { DebuggingChallenges } from "@/components/modules/data-structures/DebuggingChallenges";
import { InterviewPath } from "@/components/modules/data-structures/InterviewPath";
import { AutoQuiz } from "@/components/modules/data-structures/AutoQuiz";
import type { DSStep } from "@/lib/data-structures";
import type { ActiveDS } from "./types";

type DSBottomTab = "log" | "system-role" | "p95-latency" | "write-amp" | "daily-challenge" | "scenarios" | "complexity-quiz" | "quiz-me" | "break-it" | "reverse" | "debugging" | "interview-path";

const DS_BOTTOM_TABS: { id: DSBottomTab; label: string }[] = [
  { id: "log", label: "Operation Log" },
  { id: "system-role", label: "System Role" },
  { id: "p95-latency", label: "P95 Latency" },
  { id: "write-amp", label: "Write Amplification" },
  { id: "daily-challenge", label: "Daily Challenge" },
  { id: "scenarios", label: "Scenarios" },
  { id: "complexity-quiz", label: "Complexity Quiz" },
  { id: "quiz-me", label: "Quiz Me" },
  { id: "break-it", label: "Break It" },
  { id: "reverse", label: "Reverse" },
  { id: "debugging", label: "Debug" },
  { id: "interview-path", label: "Interview Prep" },
];

const DSBottomPanel = memo(function DSBottomPanel({
  log,
  steps,
  currentStepIdx,
  onTryChallenge,
}: {
  log: string[];
  steps: DSStep[];
  currentStepIdx: number;
  onTryChallenge: (ds: ActiveDS, data: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<DSBottomTab>("log");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-0">
        {DS_BOTTOM_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "border-b-2 px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
              activeTab === tab.id
                ? "border-primary bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent"
                : "border-transparent text-foreground-muted hover:text-foreground-subtle",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === "log" && (
          <div className="px-4 py-2">
            {steps.length > 0 && currentStepIdx >= 0 ? (
              <div className="space-y-0.5">
                {steps.slice(0, currentStepIdx + 1).map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "text-xs",
                      i === currentStepIdx
                        ? "text-primary font-medium"
                        : "text-foreground-muted",
                    )}
                  >
                    <span className="mr-2 font-mono text-foreground-subtle">[{i + 1}]</span>
                    {s.description}
                  </div>
                ))}
              </div>
            ) : log.length > 0 ? (
              <div className="space-y-0.5">
                {log.map((entry, i) => (
                  <div key={`ds-${i}`} className="text-xs text-foreground-muted">
                    {entry}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">
                Perform operations to see the step-by-step log here.
              </p>
            )}
          </div>
        )}
        {activeTab === "system-role" && <SystemRoleSelector />}
        {activeTab === "p95-latency" && <P95LatencyCalculator />}
        {activeTab === "write-amp" && <WriteAmplificationVisualizer />}
        {activeTab === "daily-challenge" && (
          <DailyChallenge onTryChallenge={onTryChallenge} />
        )}
        {activeTab === "scenarios" && <ScenarioChallenges />}
        {activeTab === "complexity-quiz" && <ComplexityQuiz />}
        {activeTab === "quiz-me" && <AutoQuiz />}
        {activeTab === "break-it" && <BreakItMode />}
        {activeTab === "reverse" && <ReverseMode />}
        {activeTab === "debugging" && <DebuggingChallenges />}
        {activeTab === "interview-path" && <InterviewPath />}
      </div>
    </div>
  );
});

export { DSBottomPanel };
