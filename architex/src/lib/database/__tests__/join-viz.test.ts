import { describe, it, expect } from "vitest";
import { JoinViz } from "../join-viz";
import type { JoinStep } from "../join-viz";

describe("JoinViz", () => {
  it("starts with initial state containing sample data", () => {
    const viz = new JoinViz();
    const state = viz.getState();
    expect(state.leftTable.name).toBe("employees");
    expect(state.rightTable.name).toBe("departments");
    expect(state.leftTable.rows.length).toBe(6);
    expect(state.rightTable.rows.length).toBe(3);
    expect(state.matches).toEqual([]);
    expect(state.comparisons).toBe(0);
  });

  it("nested loop join produces steps and finds all matches", () => {
    const viz = new JoinViz();
    const steps = viz.nestedLoopJoin();
    expect(steps.length).toBeGreaterThan(0);

    // First step should be setup
    expect(steps[0].operation).toBe("setup");
    expect(steps[0].description).toContain("Nested Loop Join");

    // Last step should be complete
    const lastStep = steps[steps.length - 1];
    expect(lastStep.operation).toBe("complete");

    // Should find 6 matches (every employee matches a department)
    expect(lastStep.state.matches.length).toBe(6);

    // Total comparisons should be 6 * 3 = 18
    expect(lastStep.state.comparisons).toBe(18);
  });

  it("sort-merge join produces steps with sort phase", () => {
    const viz = new JoinViz();
    const steps = viz.sortMergeJoin();
    expect(steps.length).toBeGreaterThan(0);

    // Should have a sort step
    const sortStep = steps.find((s) => s.operation === "sort");
    expect(sortStep).toBeDefined();
    expect(sortStep!.description).toContain("Sort Phase");
    expect(sortStep!.state.sortedLeft).toBeDefined();
    expect(sortStep!.state.sortedRight).toBeDefined();

    // Last step should be complete with all matches
    const lastStep = steps[steps.length - 1];
    expect(lastStep.operation).toBe("complete");
    expect(lastStep.state.matches.length).toBe(6);
  });

  it("hash join produces steps with build and probe phases", () => {
    const viz = new JoinViz();
    const steps = viz.hashJoin();
    expect(steps.length).toBeGreaterThan(0);

    // Should have build steps
    const buildSteps = steps.filter((s) => s.operation === "hash-build");
    expect(buildSteps.length).toBe(3); // 3 departments

    // Build steps should show hash table growing
    expect(buildSteps[0].state.hashBuckets!.length).toBe(1);
    expect(buildSteps[2].state.hashBuckets!.length).toBe(3);

    // Should have match steps during probe phase
    const matchSteps = steps.filter((s) => s.operation === "match");
    expect(matchSteps.length).toBe(6); // Every employee matches

    // Last step should be complete
    const lastStep = steps[steps.length - 1];
    expect(lastStep.operation).toBe("complete");
    expect(lastStep.state.matches.length).toBe(6);
  });

  it("runJoin dispatches to the correct algorithm", () => {
    const viz = new JoinViz();

    const nlSteps = viz.runJoin("nested-loop");
    expect(nlSteps[0].description).toContain("Nested Loop");

    const viz2 = new JoinViz();
    const smSteps = viz2.runJoin("sort-merge");
    expect(smSteps[0].description).toContain("Sort-Merge");

    const viz3 = new JoinViz();
    const hjSteps = viz3.runJoin("hash-join");
    expect(hjSteps[0].description).toContain("Hash Join");
  });

  it("each step contains an independent state snapshot", () => {
    const viz = new JoinViz();
    const steps = viz.nestedLoopJoin();

    // Mutating a later step's state should not affect earlier steps
    if (steps.length >= 3) {
      const step1Matches = steps[1].state.matches.length;
      steps[2].state.matches.push({ leftRowIndex: 99, rightRowIndex: 99 });
      expect(steps[1].state.matches.length).toBe(step1Matches);
    }
  });

  it("reset clears state back to initial", () => {
    const viz = new JoinViz();
    viz.nestedLoopJoin();
    viz.reset();
    const state = viz.getState();
    expect(state.leftTable.rows.length).toBe(6);
    expect(state.rightTable.rows.length).toBe(3);
    expect(state.matches).toEqual([]);
  });

  it("getState returns a deep clone", () => {
    const viz = new JoinViz();
    const state1 = viz.getState();
    const state2 = viz.getState();
    // Modifying one should not affect the other
    state1.leftTable.rows.push({ id: 99, name: "Test", dept_id: 99 });
    expect(state2.leftTable.rows.length).toBe(6);
  });

  it("nested loop has more comparisons than hash join", () => {
    const viz1 = new JoinViz();
    const nlSteps = viz1.nestedLoopJoin();
    const nlComparisons = nlSteps[nlSteps.length - 1].state.comparisons;

    const viz2 = new JoinViz();
    const hjSteps = viz2.hashJoin();
    const hjComparisons = hjSteps[hjSteps.length - 1].state.comparisons;

    expect(nlComparisons).toBeGreaterThan(hjComparisons);
  });

  it("step descriptions explain WHY, not just WHAT", () => {
    const viz = new JoinViz();
    const steps = viz.nestedLoopJoin();

    // Match steps should explain the comparison result
    const matchStep = steps.find((s) => s.operation === "match");
    expect(matchStep).toBeDefined();
    expect(matchStep!.description).toContain("joins with");
    expect(matchStep!.description).toContain("==");

    // No-match compare steps should explain why no match
    const compareStep = steps.find(
      (s) => s.operation === "compare" && s.state.isMatch === false,
    );
    expect(compareStep).toBeDefined();
    expect(compareStep!.description).toContain("!=");
  });
});
