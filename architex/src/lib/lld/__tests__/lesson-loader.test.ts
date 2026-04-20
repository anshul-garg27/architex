import { describe, it, expect } from "vitest";
import { validateLessonPayload } from "../lesson-loader";
import type { LessonPayload } from "../lesson-types";
import { LESSON_SECTION_ORDER } from "../lesson-types";

function mkValidPayload(): LessonPayload {
  const emptySection = {
    code: "return {};",
    raw: "",
    anchors: [],
    conceptIds: [],
    classIds: [],
  };
  return {
    schemaVersion: 1,
    patternSlug: "singleton",
    subtitle: "One object, many references",
    estimatedMinutes: 10,
    conceptIds: [],
    sections: {
      itch: emptySection,
      definition: emptySection,
      mechanism: emptySection,
      anatomy: emptySection,
      numbers: emptySection,
      uses: emptySection,
      failure_modes: emptySection,
      checkpoints: {
        ...emptySection,
        checkpoints: [
          {
            kind: "recall",
            id: "r1",
            prompt: "",
            options: [],
            explanation: "",
          },
          {
            kind: "apply",
            id: "a1",
            scenario: "",
            correctClassIds: [],
            distractorClassIds: [],
            explanation: "",
          },
          {
            kind: "compare",
            id: "cp1",
            prompt: "",
            left: { patternSlug: "a", label: "A" },
            right: { patternSlug: "b", label: "B" },
            statements: [],
            explanation: "",
          },
          {
            kind: "create",
            id: "cr1",
            prompt: "",
            starterCanvas: { classes: [] },
            rubric: [],
            referenceSolution: { classes: [] },
            explanation: "",
          },
        ],
      },
    },
  };
}

describe("validateLessonPayload", () => {
  it("accepts a well-formed payload", () => {
    expect(validateLessonPayload(mkValidPayload())).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(validateLessonPayload(null)).toContain("object");
    expect(validateLessonPayload("whatever")).toContain("object");
  });

  it("rejects unknown schemaVersion", () => {
    const bad = { ...mkValidPayload(), schemaVersion: 2 };
    expect(validateLessonPayload(bad)).toContain("schemaVersion");
  });

  it("rejects missing patternSlug", () => {
    const bad = { ...mkValidPayload(), patternSlug: "" };
    expect(validateLessonPayload(bad)).toContain("patternSlug");
  });

  it("rejects missing sections", () => {
    const base = mkValidPayload();
    const bad = {
      ...base,
      sections: {
        ...base.sections,
        mechanism: undefined as unknown as LessonPayload["sections"]["mechanism"],
      },
    };
    expect(validateLessonPayload(bad)).toContain("mechanism");
  });

  it("rejects sections missing compiled code", () => {
    const base = mkValidPayload();
    const bad = {
      ...base,
      sections: {
        ...base.sections,
        itch: { ...base.sections.itch, code: undefined },
      },
    };
    expect(validateLessonPayload(bad)).toContain("itch");
  });

  it("enumerates all 8 section ids in constant", () => {
    expect(LESSON_SECTION_ORDER).toHaveLength(8);
    expect(LESSON_SECTION_ORDER).toContain("itch");
    expect(LESSON_SECTION_ORDER).toContain("checkpoints");
  });
});
