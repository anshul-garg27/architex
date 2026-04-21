/**
 * LLD-019: Drill session variants
 *
 * Three variants with orthogonal policy axes. The UI picks one at start;
 * grading, timer, hints, and FSRS update paths all consult this config.
 *
 *   exam        — strict, no hints, timer enforced, FSRS ON
 *   timed-mock  — realistic (default), hints allowed, timer enforced, FSRS ON
 *   study       — permissive, hints free, no timer, FSRS OFF
 */

import type { DrillVariant } from "@/db/schema/lld-drill-attempts";

export { type DrillVariant };

export interface DrillVariantConfig {
  label: string;
  description: string;
  hintsAllowed: boolean;
  timerEnforced: boolean;
  affectsFSRS: boolean;
  interviewerMayOfferHelp: boolean;
  defaultDurationMs: number;
  /** Maximum hint-tier penalty allowed to accumulate before the drill
   *  auto-ends (null = unlimited, study mode only). */
  maxHintPenalty: number | null;
}

export const VARIANT_CONFIG: Record<DrillVariant, DrillVariantConfig> = {
  exam: {
    label: "Exam",
    description: "Strictest loop. No hints. Timer enforced. FSRS counts.",
    hintsAllowed: false,
    timerEnforced: true,
    affectsFSRS: true,
    interviewerMayOfferHelp: false,
    defaultDurationMs: 25 * 60 * 1000, // 25 min
    maxHintPenalty: 0,
  },
  "timed-mock": {
    label: "Timed Mock",
    description: "Realistic interview. Hints cost points. FSRS counts.",
    hintsAllowed: true,
    timerEnforced: true,
    affectsFSRS: true,
    interviewerMayOfferHelp: false,
    defaultDurationMs: 30 * 60 * 1000, // 30 min
    maxHintPenalty: 30,
  },
  study: {
    label: "Study",
    description:
      "No timer. Interviewer volunteers hints. Does not affect FSRS.",
    hintsAllowed: true,
    timerEnforced: false,
    affectsFSRS: false,
    interviewerMayOfferHelp: true,
    defaultDurationMs: 60 * 60 * 1000, // 60 min soft target
    maxHintPenalty: null,
  },
};

export function variantConfigFor(v: DrillVariant): DrillVariantConfig {
  return VARIANT_CONFIG[v];
}

export function hintsAllowedIn(v: DrillVariant): boolean {
  return VARIANT_CONFIG[v].hintsAllowed;
}

export function timerEnforcedIn(v: DrillVariant): boolean {
  return VARIANT_CONFIG[v].timerEnforced;
}

export function affectsFSRSIn(v: DrillVariant): boolean {
  return VARIANT_CONFIG[v].affectsFSRS;
}

export function defaultDurationFor(v: DrillVariant): number {
  return VARIANT_CONFIG[v].defaultDurationMs;
}
