import { describe, it, expect } from "vitest";
import { DESIGN_PATTERNS } from "../patterns";
import { SOLID_DEMOS } from "../solid-demos";
import { LLD_PROBLEMS } from "../problems";
import { SEQUENCE_EXAMPLES } from "../sequence-diagram";
import { STATE_MACHINE_EXAMPLES } from "../state-machine";
import type { UMLClass, UMLRelationship } from "../types";

// ── Helpers ────────────────────────────────────────────────────

/** Collect all class IDs from a UMLClass array. */
function classIds(classes: UMLClass[]): Set<string> {
  return new Set(classes.map((c) => c.id));
}

/** Assert that every relationship's source and target reference a valid class ID. */
function validateRelationships(
  relationships: UMLRelationship[],
  validIds: Set<string>,
  context: string,
): void {
  for (const rel of relationships) {
    expect(
      validIds.has(rel.source),
      `${context}: relationship ${rel.id} source "${rel.source}" is not a valid class ID`,
    ).toBe(true);
    expect(
      validIds.has(rel.target),
      `${context}: relationship ${rel.id} target "${rel.target}" is not a valid class ID`,
    ).toBe(true);
  }
}

// ═══════════════════════════════════════════════════════════════
//  Design Patterns
// ═══════════════════════════════════════════════════════════════

describe("DESIGN_PATTERNS content validation", () => {
  it("contains at least 10 patterns", () => {
    expect(DESIGN_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });

  for (const pattern of DESIGN_PATTERNS) {
    describe(`pattern: ${pattern.name} (${pattern.id})`, () => {
      it("has all required top-level fields", () => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.category).toBeTruthy();
        expect(pattern.description).toBeTruthy();
        expect(pattern.description.length).toBeGreaterThan(10);
        expect(Array.isArray(pattern.classes)).toBe(true);
        expect(pattern.classes.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(pattern.relationships)).toBe(true);
      });

      it("has non-empty code samples", () => {
        expect(pattern.code.typescript).toBeTruthy();
        expect(pattern.code.typescript.length).toBeGreaterThan(20);
        expect(pattern.code.python).toBeTruthy();
        expect(pattern.code.python.length).toBeGreaterThan(20);
      });

      it("has non-empty examples and guidance", () => {
        expect(pattern.realWorldExamples.length).toBeGreaterThanOrEqual(1);
        for (const ex of pattern.realWorldExamples) {
          expect(ex).toBeTruthy();
        }

        expect(pattern.whenToUse.length).toBeGreaterThanOrEqual(1);
        for (const item of pattern.whenToUse) {
          expect(item).toBeTruthy();
        }

        expect(pattern.whenNotToUse.length).toBeGreaterThanOrEqual(1);
        for (const item of pattern.whenNotToUse) {
          expect(item).toBeTruthy();
        }
      });

      it("has well-formed classes", () => {
        for (const cls of pattern.classes) {
          expect(cls.id).toBeTruthy();
          expect(cls.name).toBeTruthy();
          expect(["class", "interface", "abstract", "enum"]).toContain(cls.stereotype);
          expect(typeof cls.x).toBe("number");
          expect(typeof cls.y).toBe("number");

          for (const attr of cls.attributes) {
            expect(attr.id, `attribute in ${cls.name} missing id`).toBeTruthy();
            expect(attr.name, `attribute in ${cls.name} missing name`).toBeTruthy();
            expect(["+", "-", "#", "~"]).toContain(attr.visibility);
          }

          for (const meth of cls.methods) {
            expect(meth.id, `method in ${cls.name} missing id`).toBeTruthy();
            expect(meth.name, `method in ${cls.name} missing name`).toBeTruthy();
            expect(meth.returnType).toBeDefined();
            expect(Array.isArray(meth.params)).toBe(true);
            expect(["+", "-", "#", "~"]).toContain(meth.visibility);
          }
        }
      });

      it("has relationships referencing valid class IDs", () => {
        const ids = classIds(pattern.classes);
        validateRelationships(pattern.relationships, ids, pattern.name);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SOLID Demos
// ═══════════════════════════════════════════════════════════════

describe("SOLID_DEMOS content validation", () => {
  it("contains all 5 SOLID principles", () => {
    expect(SOLID_DEMOS).toHaveLength(5);
    const principles = SOLID_DEMOS.map((d) => d.principle);
    expect(principles).toContain("SRP");
    expect(principles).toContain("OCP");
    expect(principles).toContain("LSP");
    expect(principles).toContain("ISP");
    expect(principles).toContain("DIP");
  });

  for (const demo of SOLID_DEMOS) {
    describe(`SOLID: ${demo.principle} — ${demo.name} (${demo.id})`, () => {
      it("has all required top-level fields", () => {
        expect(demo.id).toBeTruthy();
        expect(demo.name).toBeTruthy();
        expect(demo.principle).toBeTruthy();
        expect(demo.description).toBeTruthy();
        expect(demo.description.length).toBeGreaterThan(10);
        expect(demo.explanation).toBeTruthy();
        expect(demo.explanation.length).toBeGreaterThan(10);
        expect(demo.realWorldExample).toBeTruthy();
      });

      it("has beforeClasses and afterClasses", () => {
        expect(demo.beforeClasses.length).toBeGreaterThanOrEqual(1);
        expect(demo.afterClasses.length).toBeGreaterThanOrEqual(1);
      });

      it("has well-formed before classes with IDs on attributes/methods", () => {
        for (const cls of demo.beforeClasses) {
          expect(cls.id).toBeTruthy();
          expect(cls.name).toBeTruthy();
          for (const attr of cls.attributes) {
            expect(attr.id, `before attr in ${cls.name} missing id`).toBeTruthy();
            expect(attr.name).toBeTruthy();
          }
          for (const meth of cls.methods) {
            expect(meth.id, `before method in ${cls.name} missing id`).toBeTruthy();
            expect(meth.name).toBeTruthy();
          }
        }
      });

      it("has well-formed after classes with IDs on attributes/methods", () => {
        for (const cls of demo.afterClasses) {
          expect(cls.id).toBeTruthy();
          expect(cls.name).toBeTruthy();
          for (const attr of cls.attributes) {
            expect(attr.id, `after attr in ${cls.name} missing id`).toBeTruthy();
            expect(attr.name).toBeTruthy();
          }
          for (const meth of cls.methods) {
            expect(meth.id, `after method in ${cls.name} missing id`).toBeTruthy();
            expect(meth.name).toBeTruthy();
          }
        }
      });

      it("has beforeRelationships referencing valid before class IDs", () => {
        const ids = classIds(demo.beforeClasses);
        validateRelationships(demo.beforeRelationships, ids, `${demo.principle} before`);
      });

      it("has afterRelationships referencing valid after class IDs", () => {
        const ids = classIds(demo.afterClasses);
        validateRelationships(demo.afterRelationships, ids, `${demo.principle} after`);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  LLD Problems
// ═══════════════════════════════════════════════════════════════

describe("LLD_PROBLEMS content validation", () => {
  it("contains at least 5 problems", () => {
    expect(LLD_PROBLEMS.length).toBeGreaterThanOrEqual(5);
  });

  for (const problem of LLD_PROBLEMS) {
    describe(`problem: ${problem.name} (${problem.id})`, () => {
      it("has all required top-level fields", () => {
        expect(problem.id).toBeTruthy();
        expect(problem.name).toBeTruthy();
        expect(problem.difficulty).toBeGreaterThanOrEqual(1);
        expect(problem.difficulty).toBeLessThanOrEqual(5);
        expect(problem.description).toBeTruthy();
        expect(problem.description.length).toBeGreaterThan(10);
      });

      it("has at least 3 requirements", () => {
        expect(problem.requirements.length).toBeGreaterThanOrEqual(3);
        for (const req of problem.requirements) {
          expect(req).toBeTruthy();
        }
      });

      it("has at least 3 hints", () => {
        expect(problem.hints.length).toBeGreaterThanOrEqual(3);
        for (const hint of problem.hints) {
          expect(hint).toBeTruthy();
        }
      });

      it("has well-formed starterClasses", () => {
        expect(problem.starterClasses.length).toBeGreaterThanOrEqual(1);
        for (const cls of problem.starterClasses) {
          expect(cls.id).toBeTruthy();
          expect(cls.name).toBeTruthy();
          expect(["class", "interface", "abstract", "enum"]).toContain(cls.stereotype);

          for (const attr of cls.attributes) {
            expect(attr.id, `attr in ${cls.name} missing id`).toBeTruthy();
            expect(attr.name).toBeTruthy();
          }
          for (const meth of cls.methods) {
            expect(meth.id, `method in ${cls.name} missing id`).toBeTruthy();
            expect(meth.name).toBeTruthy();
          }
        }
      });

      it("has starterRelationships referencing valid class IDs", () => {
        const ids = classIds(problem.starterClasses);
        validateRelationships(
          problem.starterRelationships,
          ids,
          problem.name,
        );
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  Sequence Diagrams
// ═══════════════════════════════════════════════════════════════

describe("SEQUENCE_EXAMPLES content validation", () => {
  it("contains at least 3 examples", () => {
    expect(SEQUENCE_EXAMPLES.length).toBeGreaterThanOrEqual(3);
  });

  for (const example of SEQUENCE_EXAMPLES) {
    describe(`sequence: ${example.name} (${example.id})`, () => {
      it("has all required top-level fields", () => {
        expect(example.id).toBeTruthy();
        expect(example.name).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.description.length).toBeGreaterThan(10);
      });

      it("has at least 2 participants", () => {
        expect(example.data.participants.length).toBeGreaterThanOrEqual(2);
        for (const p of example.data.participants) {
          expect(p.id).toBeTruthy();
          expect(p.name).toBeTruthy();
        }
      });

      it("has at least 3 messages", () => {
        expect(example.data.messages.length).toBeGreaterThanOrEqual(3);
      });

      it("has messages referencing valid participant IDs", () => {
        const participantIds = new Set(
          example.data.participants.map((p) => p.id),
        );
        for (const msg of example.data.messages) {
          expect(msg.id).toBeTruthy();
          expect(msg.label).toBeTruthy();
          expect(
            participantIds.has(msg.from),
            `message ${msg.id} "from" participant "${msg.from}" not found in ${example.name}`,
          ).toBe(true);
          expect(
            participantIds.has(msg.to),
            `message ${msg.id} "to" participant "${msg.to}" not found in ${example.name}`,
          ).toBe(true);
        }
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  State Machines
// ═══════════════════════════════════════════════════════════════

describe("STATE_MACHINE_EXAMPLES content validation", () => {
  it("contains at least 2 examples", () => {
    expect(STATE_MACHINE_EXAMPLES.length).toBeGreaterThanOrEqual(2);
  });

  for (const example of STATE_MACHINE_EXAMPLES) {
    describe(`state machine: ${example.name} (${example.id})`, () => {
      it("has all required top-level fields", () => {
        expect(example.id).toBeTruthy();
        expect(example.name).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.description.length).toBeGreaterThan(10);
      });

      it("has at least 2 states", () => {
        expect(example.data.states.length).toBeGreaterThanOrEqual(2);
        for (const state of example.data.states) {
          expect(state.id).toBeTruthy();
          expect(state.name).toBeTruthy();
        }
      });

      it("has at least 1 initial state", () => {
        const initialStates = example.data.states.filter((s) => s.isInitial);
        expect(
          initialStates.length,
          `${example.name} must have at least one initial state`,
        ).toBeGreaterThanOrEqual(1);
      });

      it("has at least 2 transitions", () => {
        expect(example.data.transitions.length).toBeGreaterThanOrEqual(2);
      });

      it("has transitions referencing valid state IDs", () => {
        const stateIds = new Set(example.data.states.map((s) => s.id));
        for (const t of example.data.transitions) {
          expect(t.id).toBeTruthy();
          expect(t.trigger).toBeTruthy();
          expect(
            stateIds.has(t.from),
            `transition ${t.id} "from" state "${t.from}" not found in ${example.name}`,
          ).toBe(true);
          expect(
            stateIds.has(t.to),
            `transition ${t.id} "to" state "${t.to}" not found in ${example.name}`,
          ).toBe(true);
        }
      });
    });
  }
});
