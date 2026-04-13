"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles, Database, RotateCcw } from "lucide-react";

// ── Step Definitions ────────────────────────────────────────

interface TourStepDef {
  title: string;
  description: string;
  /** data-onboarding attribute value to spotlight, or null for full-screen */
  target: string | null;
  /** Where the tooltip card appears relative to the target */
  tooltipPosition: "center" | "right" | "left" | "top" | "bottom";
}

const DATABASE_TOUR_STEPS: TourStepDef[] = [
  {
    title: "Welcome to Database Design!",
    description:
      "Explore 12 interactive modes covering ER diagrams, normalization, B-Trees, hash indexes, LSM-Trees, ACID, CAP theorem, MVCC, query plans, and more. Each mode has its own visualization and hands-on controls.",
    target: null,
    tooltipPosition: "center",
  },
  {
    title: "Pick a Topic",
    description:
      "Browse all 12 database topics here. Each one includes a description of the real-world problem it solves. Click any topic to switch the canvas visualization.",
    target: "db-mode-list",
    tooltipPosition: "right",
  },
  {
    title: "Try Inserting a Key",
    description:
      "In B-Tree mode, type a number and click Insert to watch the tree grow. The visualization animates each node split and rebalance so you can see exactly how B-Trees maintain balance.",
    target: "db-btree-insert",
    tooltipPosition: "right",
  },
  {
    title: "Step Through the Algorithm",
    description:
      "After inserting or searching, use Step, Play, and Reset to walk through the algorithm one operation at a time. Watch nodes highlight as the algorithm traverses the tree.",
    target: "db-step-controls",
    tooltipPosition: "top",
  },
  {
    title: "Explore All Modes!",
    description:
      "You have just scratched the surface. Try Transaction Isolation to see dirty reads in action, or LSM-Tree to understand write-optimized storage. Each mode is a mini-lab. Have fun exploring!",
    target: "db-mode-list",
    tooltipPosition: "right",
  },
];

// ── localStorage key ───────────────────────────────────────

const DB_TOUR_KEY = "architex_db_tour_completed";

function isTourCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DB_TOUR_KEY) === "true";
}

function markTourCompleted(): void {
  localStorage.setItem(DB_TOUR_KEY, "true");
}

/** Clear tour completed flag so it replays on next visit. */
export function resetDatabaseTour(): void {
  localStorage.removeItem(DB_TOUR_KEY);
}

// ── Spotlight Rect Hook ────────────────────────────────────

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

// ── Clip Path Builder ──────────────────────────────────────

function buildClipPath(rect: DOMRect | null, padding: number = 8): string {
  if (!rect) return "none";
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 12;

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

// ── Tooltip Position ───────────────────────────────────────

function getTooltipStyle(
  rect: DOMRect | null,
  position: TourStepDef["tooltipPosition"],
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

// ── Component ──────────────────────────────────────────────

interface DatabaseTourProps {
  /** External trigger to force-show the tour (e.g. replay button) */
  forceShow?: boolean;
  /** Called when tour finishes or is dismissed */
  onComplete?: () => void;
}

export const DatabaseTour = memo(function DatabaseTour({
  forceShow,
  onComplete,
}: DatabaseTourProps) {
  const [active, setActive] = useState(() => !isTourCompleted());
  const [step, setStep] = useState(0);

  // Handle forceShow from parent (replay)
  useEffect(() => {
    if (forceShow) {
      setStep(0);
      setActive(true);
    }
  }, [forceShow]);

  const steps = DATABASE_TOUR_STEPS;
  const totalSteps = steps.length;
  const currentStep = steps[step] ?? steps[0];
  const rect = useSpotlightRect(active ? currentStep.target : null);

  const completeTour = useCallback(() => {
    markTourCompleted();
    setActive(false);
    setStep(0);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (step >= totalSteps - 1) {
      completeTour();
    } else {
      setStep(step + 1);
    }
  }, [step, totalSteps, completeTour]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  // Keyboard support
  useEffect(() => {
    if (!active) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        completeTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handleBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, handleNext, handleBack, completeTour]);

  if (!active) return null;

  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const hasSpotlight = currentStep.target !== null;
  const clipPath = hasSpotlight ? buildClipPath(rect) : undefined;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Database module tour">
      {/* Dark overlay with spotlight cutout */}
      <div
        className="absolute inset-0 bg-black/70 transition-all duration-300"
        style={hasSpotlight && clipPath !== "none" ? { clipPath } : undefined}
        onClick={completeTour}
      />

      {/* Block pointer events on the entire viewport except the tooltip */}
      <div className="pointer-events-none absolute inset-0" />

      {/* Spotlight border glow */}
      {hasSpotlight && rect && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-emerald-500/60 shadow-[0_0_24px_4px] shadow-emerald-500/20 transition-all duration-300"
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
        className="pointer-events-auto z-[101] w-80 rounded-xl border border-border/30 bg-background/60 backdrop-blur-md p-5 shadow-2xl"
        style={getTooltipStyle(rect, currentStep.tooltipPosition)}
      >
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          {isFirstStep ? (
            <Database className="h-5 w-5 text-emerald-400" />
          ) : (
            <Sparkles className="h-5 w-5 text-emerald-400" />
          )}
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
                  ? "w-4 bg-emerald-400"
                  : i < step
                    ? "w-1.5 bg-emerald-400/40"
                    : "w-1.5 bg-foreground-subtle/30"
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={completeTour}
            className="text-xs text-foreground-muted transition-colors hover:text-foreground"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 rounded-xl border border-border/30 px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <button
              onClick={isFirstStep ? handleNext : isLastStep ? completeTour : handleNext}
              className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:bg-emerald-700 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
            >
              {isFirstStep
                ? "Start Tour"
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

// ── Replay Button (for sidebar) ────────────────────────────

export const DatabaseTourReplayButton = memo(function DatabaseTourReplayButton({
  onReplay,
}: {
  onReplay: () => void;
}) {
  return (
    <button
      onClick={onReplay}
      className="flex w-full items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all hover:bg-emerald-500/10"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Replay Tour
    </button>
  );
});
