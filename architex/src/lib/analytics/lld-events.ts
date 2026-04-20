/**
 * LLD analytics event catalog (spec §13, Q19).
 *
 * Typed builders prevent event-name drift. Every event writes to
 * activityEvents (user-owned) + mirrors to PostHog (aggregate).
 *
 * Phase 1 ships only a subset: mode switching + welcome banner + drill
 * lifecycle. Later phases expand to lesson scroll milestones, checkpoint
 * attempts, etc.
 */

type LLDMode = "learn" | "build" | "drill" | "review";
type DrillMode = "interview" | "guided" | "speed";
type DrillGradeTier = "excellent" | "solid" | "partial" | "needs_work";

type EventPayload = Record<string, unknown>;

interface LLDEvent {
  event: string;
  metadata: EventPayload;
}

// ── Mode switching ──────────────────────────────────────

export function lldModeSwitched(args: {
  from: LLDMode | null;
  to: LLDMode;
  trigger: "click" | "keyboard" | "url";
}): LLDEvent {
  return { event: "lld_mode_switched", metadata: args };
}

export function lldWelcomeBannerShown(): LLDEvent {
  return { event: "lld_welcome_banner_shown", metadata: {} };
}

export function lldWelcomeBannerDismissed(args: {
  method: "dismiss" | "pick_learn" | "pick_build" | "pick_drill";
}): LLDEvent {
  return { event: "lld_welcome_banner_dismissed", metadata: args };
}

// ── Drill lifecycle ──────────────────────────────────────

export function lldDrillStarted(args: {
  problemId: string;
  drillMode: DrillMode;
}): LLDEvent {
  return { event: "lld_drill_started", metadata: args };
}

export function lldDrillPaused(args: {
  problemId: string;
  elapsedMs: number;
}): LLDEvent {
  return { event: "lld_drill_paused", metadata: args };
}

export function lldDrillSubmitted(args: {
  problemId: string;
  drillMode: DrillMode;
  grade: number;
  durationMs: number;
  hintsUsed: number;
}): LLDEvent {
  return { event: "lld_drill_submitted", metadata: args };
}

export function lldDrillAbandoned(args: {
  problemId: string;
  elapsedMs: number;
  reason: "give_up" | "timeout" | "auto";
}): LLDEvent {
  return { event: "lld_drill_abandoned", metadata: args };
}

export function lldDrillGradeTierCrossed(args: {
  problemId: string;
  tier: DrillGradeTier;
  score: number;
}): LLDEvent {
  return { event: "lld_drill_grade_tier_crossed", metadata: args };
}

// ── Emission ─────────────────────────────────────────────

/**
 * Fire an event to the activity log (fire-and-forget).
 * In Phase 1 this just POSTs to /api/activity. Later phases add
 * PostHog mirroring and offline queueing.
 */
export async function track(event: LLDEvent): Promise<void> {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: event.event,
        moduleId: "lld",
        metadata: event.metadata,
      }),
    });
  } catch (err) {
    console.warn("[lld-events] track failed (non-critical):", err);
  }
}
