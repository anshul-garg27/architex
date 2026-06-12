import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Node } from "@xyflow/react";
import { DrillResultsScreen } from "../DrillResultsScreen";
import { useDrillStore } from "@/stores/drill-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { RUBRIC_AXES, type RubricBreakdown } from "@/lib/lld/drill-rubric";
import type { PostmortemOutput } from "@/lib/ai/postmortem-generator";

// ── Fixtures: a mocked grade payload + AI postmortem ─────────────────

const mockRubric = Object.fromEntries(
  RUBRIC_AXES.map((axis) => [
    axis,
    { score: 80, good: ["solid work"], missing: [], wrong: [] },
  ]),
) as RubricBreakdown;

const MOCK_FINAL_SCORE = 78;

const mockPostmortem: PostmortemOutput = {
  tldr: "Strong decomposition; tradeoff narration was thin.",
  strengths: ["Clean class boundaries"],
  gaps: ["Name the pattern out loud earlier"],
  patternCommentary: "Strategy fit the billing variance well.",
  tradeoffAnalysis: "You traded flexibility for indirection without saying so.",
  canonicalDiff: ["Missed the Ticket entity"],
  followUps: ["Re-drill with the exam variant"],
};

function seedGradedDrill() {
  useDrillStore.getState().beginAttempt({
    attemptId: "attempt-1",
    variant: "timed-mock",
    persona: "generic",
    problemId: "parking-lot",
  });
  useDrillStore.setState({
    stageDurationsMs: {
      clarify: 4 * 60_000,
      rubric: 90_000,
      canvas: 15 * 60_000,
      walkthrough: 5 * 60_000,
      reflection: 2 * 60_000,
    },
  });
  useDrillStore.getState().setRubric(mockRubric, MOCK_FINAL_SCORE);
}

function mockFetchPostmortem(ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () =>
      ok ? { postmortem: mockPostmortem } : { error: "boom" },
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderResults(
  overrides?: Partial<Parameters<typeof DrillResultsScreen>[0]>,
) {
  return render(
    <DrillResultsScreen
      attemptId="attempt-1"
      onStartNew={vi.fn()}
      onBackToProblems={vi.fn()}
      {...overrides}
    />,
  );
}

describe("DrillResultsScreen", () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
    useCanvasStore.setState({
      nodes: [
        {
          id: "n1",
          position: { x: 0, y: 0 },
          data: { label: "ParkingLot" },
        },
      ] as Node[],
    });
    seedGradedDrill();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the grade hero with score and band from the mocked grade payload", () => {
    mockFetchPostmortem();
    renderResults();

    expect(screen.getByText(String(MOCK_FINAL_SCORE))).toBeInTheDocument();
    // 78 falls in the "Solid" band (>= 70).
    expect(screen.getByText("Solid")).toBeInTheDocument();
  });

  it("renders all six rubric axes with their scores", () => {
    mockFetchPostmortem();
    renderResults();

    expect(screen.getByText("Pattern Fit")).toBeInTheDocument();
    expect(screen.getByText("Tradeoffs")).toBeInTheDocument();
    expect(screen.getAllByText("80")).toHaveLength(RUBRIC_AXES.length);
  });

  it("renders the timing heatmap from drill-store stage durations (bypassing the dead hook)", () => {
    mockFetchPostmortem();
    renderResults();

    expect(screen.getByText("Time by stage")).toBeInTheDocument();
    expect(screen.getByText("Narrate")).toBeInTheDocument();
  });

  it("shows a shimmer, POSTs the postmortem route, then renders the postmortem", async () => {
    const fetchMock = mockFetchPostmortem();
    renderResults();

    expect(
      screen.getByText(/Claude is writing your postmortem/i),
    ).toBeInTheDocument();

    // TL;DR shows twice by design: grade-hero feedback + postmortem body.
    await waitFor(() =>
      expect(screen.getAllByText(mockPostmortem.tldr)).toHaveLength(2),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lld/drill-attempts/attempt-1/postmortem",
      { method: "POST" },
    );
    // Bullets render with a "- " prefix; match on substring.
    expect(screen.getByText(/Clean class boundaries/)).toBeInTheDocument();
    // followUps render in the postmortem body AND feed the footer card.
    expect(
      screen.getAllByText(/Re-drill with the exam variant/).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("falls back to graceful copy when the postmortem request fails", async () => {
    mockFetchPostmortem(false);
    renderResults();

    await waitFor(() =>
      expect(
        screen.getByText(/postmortem didn't come through/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders the canonical compare with the user's canvas classes", () => {
    mockFetchPostmortem();
    renderResults();

    expect(screen.getByText("You drew")).toBeInTheDocument();
    expect(screen.getByText("Canonical")).toBeInTheDocument();
    // "ParkingLot" appears in both the user column and the canonical column.
    expect(screen.getAllByText(/ParkingLot/).length).toBeGreaterThanOrEqual(2);
  });

  it("wires Start new drill and Back to problems actions", () => {
    mockFetchPostmortem();
    const onStartNew = vi.fn();
    const onBackToProblems = vi.fn();
    renderResults({ onStartNew, onBackToProblems });

    fireEvent.click(screen.getByRole("button", { name: "Start new drill" }));
    expect(onStartNew).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Back to problems" }),
    );
    expect(onBackToProblems).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the drill has not been graded", () => {
    mockFetchPostmortem();
    useDrillStore.getState().reset();
    const { container } = renderResults();
    expect(container).toBeEmptyDOMElement();
  });
});
