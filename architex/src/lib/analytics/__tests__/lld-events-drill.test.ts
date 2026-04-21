import { describe, it, expect } from "vitest";
import {
  lldDrillStarted,
  lldDrillStageEntered,
  lldDrillStageCompleted,
  lldDrillHintConsumed,
  lldDrillInterviewerTurn,
  lldDrillVariantSelected,
  lldDrillSubmitted,
  lldDrillAbandoned,
  lldDrillResumed,
  lldDrillGradeRevealed,
  lldDrillPostmortemViewed,
  lldDrillFollowUpClicked,
} from "@/lib/analytics/lld-events";

describe("lld-events · drill events", () => {
  it("lldDrillStarted emits required props", () => {
    const evt = lldDrillStarted({
      attemptId: "a1",
      problemId: "parking-lot",
      variant: "timed-mock",
      persona: "generic",
      durationLimitMs: 1_800_000,
    });
    expect(evt.name).toBe("lld_drill_started");
    expect(evt.props.attempt_id).toBe("a1");
    expect(evt.props.problem_id).toBe("parking-lot");
    expect(evt.props.variant).toBe("timed-mock");
  });

  it("lldDrillStageEntered + Completed emit stage + duration", () => {
    const entered = lldDrillStageEntered({ attemptId: "a1", stage: "clarify" });
    expect(entered.name).toBe("lld_drill_stage_entered");
    expect(entered.props.stage).toBe("clarify");

    const completed = lldDrillStageCompleted({
      attemptId: "a1",
      stage: "clarify",
      durationMs: 60_000,
    });
    expect(completed.name).toBe("lld_drill_stage_completed");
    expect(completed.props.duration_ms).toBe(60_000);
  });

  it("lldDrillHintConsumed emits tier + penalty", () => {
    const evt = lldDrillHintConsumed({
      attemptId: "a1",
      tier: "guided",
      penalty: 10,
      stage: "canvas",
    });
    expect(evt.props.tier).toBe("guided");
    expect(evt.props.penalty).toBe(10);
  });

  it("lldDrillInterviewerTurn emits role + persona", () => {
    const evt = lldDrillInterviewerTurn({
      attemptId: "a1",
      role: "interviewer",
      persona: "stripe",
      stage: "rubric",
      inputTokens: 120,
      outputTokens: 80,
    });
    expect(evt.props.role).toBe("interviewer");
    expect(evt.props.output_tokens).toBe(80);
  });

  it("lldDrillSubmitted emits score + band", () => {
    const evt = lldDrillSubmitted({
      attemptId: "a1",
      finalScore: 72,
      band: "solid",
      hintsUsed: 2,
      totalDurationMs: 1_700_000,
    });
    expect(evt.props.final_score).toBe(72);
    expect(evt.props.band).toBe("solid");
  });

  it("lldDrillVariantSelected emits variant", () => {
    const evt = lldDrillVariantSelected({
      problemId: "parking-lot",
      variant: "exam",
    });
    expect(evt.name).toBe("lld_drill_variant_selected");
    expect(evt.props.variant).toBe("exam");
  });

  it("lldDrillAbandoned + Resumed fire", () => {
    expect(
      lldDrillAbandoned({ attemptId: "a1", stage: "canvas", reason: "manual" })
        .name,
    ).toBe("lld_drill_abandoned");
    expect(
      lldDrillResumed({ attemptId: "a1", stage: "canvas" }).name,
    ).toBe("lld_drill_resumed");
  });

  it("lldDrillGradeRevealed + PostmortemViewed fire", () => {
    expect(lldDrillGradeRevealed({ attemptId: "a1" }).name).toBe(
      "lld_drill_grade_revealed",
    );
    expect(lldDrillPostmortemViewed({ attemptId: "a1" }).name).toBe(
      "lld_drill_postmortem_viewed",
    );
  });

  it("lldDrillFollowUpClicked emits kind + target", () => {
    const evt = lldDrillFollowUpClicked({
      attemptId: "a1",
      followUpKind: "retry",
      target: "parking-lot",
    });
    expect(evt.props.follow_up_kind).toBe("retry");
    expect(evt.props.target).toBe("parking-lot");
  });
});
