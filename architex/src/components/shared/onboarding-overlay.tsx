"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

// ── Step Definitions ────────────────────────────────────────

interface OnboardingStepDef {
  title: string;
  description: string;
  /** data-onboarding attribute value to spotlight, or null for full-screen */
  target: string | null;
  /** Where the tooltip card appears relative to the target */
  tooltipPosition: "center" | "right" | "left" | "top" | "bottom";
}

// ── System Design Tour Steps ────────────────────────────────

const SYSTEM_DESIGN_STEPS: OnboardingStepDef[] = [
  {
    title: "Welcome to Architex",
    description:
      "Design, simulate, and study system architectures — all in one interactive workspace with 13 modules covering algorithms, distributed systems, databases, networking, and more. Let us show you around.",
    target: null,
    tooltipPosition: "center",
  },
  {
    title: "Drag Components",
    description:
      "Drag any component from here onto the canvas to start building your architecture.",
    target: "component-palette",
    tooltipPosition: "right",
  },
  {
    title: "Connect Nodes",
    description:
      "Drag from one node's handle to another to create a connection. Each edge represents a data flow between services.",
    target: "canvas",
    tooltipPosition: "left",
  },
  {
    title: "Run Simulation",
    description:
      "Press Space or click Play to run a traffic simulation through your architecture and observe real-time metrics.",
    target: "status-bar",
    tooltipPosition: "top",
  },
  {
    title: "Explore Modules",
    description:
      "13 modules to explore — algorithms, distributed systems, networking, databases, LLD, and more. Click any icon to switch.",
    target: "activity-bar",
    tooltipPosition: "right",
  },
  {
    title: "Data Structures",
    description:
      "Explore 39 interactive data structures — from Arrays to B-Trees. Click any structure, then use Insert/Delete/Search to visualize operations step by step.",
    target: "ds-sidebar",
    tooltipPosition: "right",
  },
];

// ── LLD Tour Steps ──────────────────────────────────────────

const LLD_STEPS: OnboardingStepDef[] = [
  {
    title: "Welcome to LLD Studio",
    description:
      "Explore design patterns, SOLID principles, and practice LLD interview problems — all with interactive UML diagrams.",
    target: null,
    tooltipPosition: "center",
  },
  {
    title: "Design Patterns",
    description:
      "20 GoF patterns with UML class diagrams, code in TypeScript and Python, and real-world examples.",
    target: "lld-sidebar-patterns",
    tooltipPosition: "right",
  },
  {
    title: "SOLID Principles",
    description:
      "5 SOLID principles with interactive before/after UML transformations. Toggle to see the refactoring.",
    target: "lld-sidebar-solid",
    tooltipPosition: "right",
  },
  {
    title: "Practice Problems",
    description:
      "10 classic interview problems with starter diagrams and progressive hints.",
    target: "lld-sidebar-problems",
    tooltipPosition: "right",
  },
  {
    title: "Code Generation",
    description:
      "Paste code to generate UML, or view generated TypeScript/Python from any diagram.",
    target: "lld-sidebar-code",
    tooltipPosition: "right",
  },
];

// ── localStorage Keys ───────────────────────────────────────

const SD_ONBOARDING_KEY = "architex_onboarding_completed";
const LLD_ONBOARDING_KEY = "architex_lld_onboarding_completed";

// ── Tour type ───────────────────────────────────────────────

export type OnboardingTourType = "system-design" | "lld";

// ── Spotlight Mask ──────────────────────────────────────────

function useSpotlightRect(target: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-onboarding="${target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [target]);

  return rect;
}

function buildClipPath(rect: DOMRect | null, padding: number = 8): string {
  if (!rect) return "none";
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 12; // border-radius for the cutout

  // Outer rectangle (full viewport) with inner rounded-rect cutout
  return `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${x + r}px ${y}px,
    ${x + w - r}px ${y}px,
    ${x + w}px ${y + r}px,
    ${x + w}px ${y + h - r}px,
    ${x + w - r}px ${y + h}px,
    ${x + r}px ${y + h}px,
    ${x}px ${y + h - r}px,
    ${x}px ${y + r}px,
    ${x + r}px ${y}px
  )`;
}

// ── Tooltip Card Position ───────────────────────────────────

function getTooltipStyle(
  rect: DOMRect | null,
  position: OnboardingStepDef["tooltipPosition"],
): React.CSSProperties {
  if (!rect || position === "center") {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const gap = 20;

  switch (position) {
    case "right":
      return {
        position: "fixed",
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: "translateY(-50%)",
      };
    case "left":
      return {
        position: "fixed",
        top: rect.top + rect.height / 2,
        right: window.innerWidth - rect.left + gap,
        transform: "translateY(-50%)",
      };
    case "top":
      return {
        position: "fixed",
        bottom: window.innerHeight - rect.top + gap,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        position: "fixed",
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
  }
}

// ── Helper: Check if a tour has been completed ──────────────

function isTourCompleted(tourType: OnboardingTourType): boolean {
  if (typeof window === "undefined") return true;
  const key = tourType === "lld" ? LLD_ONBOARDING_KEY : SD_ONBOARDING_KEY;
  return localStorage.getItem(key) === "true";
}

function markTourCompleted(tourType: OnboardingTourType): void {
  const key = tourType === "lld" ? LLD_ONBOARDING_KEY : SD_ONBOARDING_KEY;
  localStorage.setItem(key, "true");
}

/** Clear a tour's completed flag so it replays on next visit. */
export function resetTour(tourType: OnboardingTourType): void {
  const key = tourType === "lld" ? LLD_ONBOARDING_KEY : SD_ONBOARDING_KEY;
  localStorage.removeItem(key);
}

// ── Component ───────────────────────────────────────────────

export const OnboardingOverlay = memo(function OnboardingOverlay() {
  const onboardingActive = useUIStore((s) => s.onboardingActive);
  const step = useUIStore((s) => s.onboardingStep);
  const activeModule = useUIStore((s) => s.activeModule);
  const setOnboardingActive = useUIStore((s) => s.setOnboardingActive);
  const setOnboardingStep = useUIStore((s) => s.setOnboardingStep);

  // Determine which tour to show based on active module
  const tourType: OnboardingTourType = activeModule === "lld" ? "lld" : "system-design";
  const steps = tourType === "lld" ? LLD_STEPS : SYSTEM_DESIGN_STEPS;
  const totalSteps = steps.length;

  // Auto-trigger LLD onboarding when module switches to LLD
  useEffect(() => {
    if (activeModule === "lld" && !isTourCompleted("lld") && !onboardingActive) {
      setOnboardingStep(0);
      setOnboardingActive(true);
    }
  }, [activeModule, onboardingActive, setOnboardingActive, setOnboardingStep]);

  const currentStep = steps[step] ?? steps[0];
  const rect = useSpotlightRect(onboardingActive ? currentStep.target : null);

  const completeOnboarding = useCallback(() => {
    markTourCompleted(tourType);
    setOnboardingActive(false);
    setOnboardingStep(0);
  }, [tourType, setOnboardingActive, setOnboardingStep]);

  const handleNext = useCallback(() => {
    if (step >= totalSteps - 1) {
      completeOnboarding();
    } else {
      setOnboardingStep(step + 1);
    }
  }, [step, totalSteps, setOnboardingStep, completeOnboarding]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setOnboardingStep(step - 1);
    }
  }, [step, setOnboardingStep]);

  // Keyboard support
  useEffect(() => {
    if (!onboardingActive) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        completeOnboarding();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handleBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onboardingActive, handleNext, handleBack, completeOnboarding]);

  if (!onboardingActive) return null;

  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const hasSpotlight = currentStep.target !== null;
  const clipPath = hasSpotlight ? buildClipPath(rect) : undefined;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Onboarding tutorial">
      {/* Dark overlay with spotlight cutout -- blocks all interaction behind it */}
      <div
        className="absolute inset-0 bg-black/70 transition-all duration-300"
        style={hasSpotlight && clipPath !== "none" ? { clipPath } : undefined}
        onClick={completeOnboarding}
      />

      {/* Block pointer events on the entire viewport except the tooltip */}
      <div className="pointer-events-none absolute inset-0" />

      {/* Spotlight border glow (only when targeting an element) */}
      {hasSpotlight && rect && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-primary/60 shadow-[0_0_24px_4px] shadow-primary/20 transition-all duration-300"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="pointer-events-auto z-[101] w-80 rounded-xl border border-border bg-surface p-5 shadow-2xl"
        style={getTooltipStyle(rect, currentStep.tooltipPosition)}
      >
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            {currentStep.title}
          </h3>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm leading-relaxed text-foreground-muted">
          {currentStep.description}
        </p>

        {/* Progress dots */}
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === step
                  ? "w-4 bg-primary"
                  : i < step
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-foreground-subtle/30"
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={completeOnboarding}
            className="text-xs text-foreground-muted transition-colors hover:text-foreground"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <button
              onClick={isFirstStep ? handleNext : isLastStep ? completeOnboarding : handleNext}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isFirstStep
                ? "Start Tutorial"
                : isLastStep
                  ? "Finish"
                  : "Next"}
              {!isLastStep && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
