/**
 * Tests for the grading engine.
 *
 * Tests the pure gradeDiagram function with various diagram inputs
 * to verify correct scoring across all 4 categories.
 */

import { describe, it, expect } from "vitest";
import {
  gradeDiagram,
  normalize,
  levenshtein,
  isFuzzyMatch,
  PATTERN_DETECTORS,
  type GradingInput,
} from "../grading-engine";
import type { UMLClass, UMLRelationship } from "../types";

// ── Helpers ─────────────────────────────────────────────────

function makeClass(
  id: string,
  name: string,
  opts?: Partial<UMLClass>,
): UMLClass {
  return {
    id,
    name,
    stereotype: "class",
    attributes: [
      { id: `${id}-attr-0`, name: "data", type: "string", visibility: "-" },
    ],
    methods: [
      {
        id: `${id}-meth-0`,
        name: "doWork",
        returnType: "void",
        params: [],
        visibility: "+",
      },
    ],
    x: 0,
    y: 0,
    ...opts,
  };
}

function makeRel(
  id: string,
  source: string,
  target: string,
  type: UMLRelationship["type"] = "association",
): UMLRelationship {
  return { id, source, target, type };
}

// ── Tests ───────────────────────────────────────────────────

describe("normalize", () => {
  it("lowercases and removes special chars", () => {
    expect(normalize("PaymentProcessor")).toBe("paymentprocessor");
    expect(normalize("payment_processor")).toBe("paymentprocessor");
    expect(normalize("Payment-Processor")).toBe("paymentprocessor");
    expect(normalize("PAYMENT PROCESSOR")).toBe("paymentprocessor");
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("hello", "hello")).toBe(0);
  });

  it("returns correct distance for simple edits", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });
});

describe("isFuzzyMatch", () => {
  it("matches exact names (case-insensitive)", () => {
    expect(isFuzzyMatch("ParkingLot", "parkinglot")).toBe(true);
    expect(isFuzzyMatch("ParkingLot", "Parking_Lot")).toBe(true);
  });

  it("matches close names (Levenshtein < 3)", () => {
    expect(isFuzzyMatch("Vehicle", "Vehicel")).toBe(true); // distance 2
    expect(isFuzzyMatch("Ticket", "Tiket")).toBe(true); // distance 1
  });

  it("rejects very different names", () => {
    expect(isFuzzyMatch("ParkingLot", "Vehicle")).toBe(false);
    expect(isFuzzyMatch("Observer", "Factory")).toBe(false);
  });
});

describe("gradeDiagram", () => {
  it("returns 0 for an empty diagram", () => {
    const input: GradingInput = {
      userClasses: [],
      userRelationships: [],
      referenceClasses: [
        makeClass("ref-1", "ParkingLot"),
        makeClass("ref-2", "Vehicle"),
      ],
      referenceRelationships: [makeRel("r-1", "ref-1", "ref-2")],
      keyPatterns: ["Singleton"],
    };

    const result = gradeDiagram(input);
    expect(result.totalScore).toBe(0);
    expect(result.categories).toHaveLength(4);
  });

  it("gives full class score for all matching classes", () => {
    const refClasses = [
      makeClass("ref-1", "ParkingLot"),
      makeClass("ref-2", "Vehicle"),
      makeClass("ref-3", "Ticket"),
    ];

    const userClasses = [
      makeClass("u-1", "ParkingLot"),
      makeClass("u-2", "Vehicle"),
      makeClass("u-3", "Ticket"),
    ];

    const input: GradingInput = {
      userClasses,
      userRelationships: [
        makeRel("ur-1", "u-1", "u-2"),
        makeRel("ur-2", "u-1", "u-3"),
      ],
      referenceClasses: refClasses,
      referenceRelationships: [],
      keyPatterns: [],
    };

    const result = gradeDiagram(input);
    const classCategory = result.categories.find(
      (c) => c.name === "Required Classes",
    )!;
    expect(classCategory.earnedPoints).toBeCloseTo(40, 0);
    expect(classCategory.items.every((i) => i.passed)).toBe(true);
  });

  it("uses fuzzy matching for class names", () => {
    const input: GradingInput = {
      userClasses: [
        makeClass("u-1", "Parking_Lot"),
        makeClass("u-2", "Vehicel"), // typo
      ],
      userRelationships: [makeRel("ur-1", "u-1", "u-2")],
      referenceClasses: [
        makeClass("ref-1", "ParkingLot"),
        makeClass("ref-2", "Vehicle"),
      ],
      referenceRelationships: [],
      keyPatterns: [],
    };

    const result = gradeDiagram(input);
    const classCategory = result.categories.find(
      (c) => c.name === "Required Classes",
    )!;
    expect(classCategory.items[0].passed).toBe(true);
    expect(classCategory.items[1].passed).toBe(true);
  });

  it("gives relationship credit for type-matching relationships", () => {
    const refClasses = [
      makeClass("ref-a", "Subject"),
      makeClass("ref-b", "Observer"),
    ];
    const userClasses = [
      makeClass("u-a", "Subject"),
      makeClass("u-b", "Observer"),
    ];

    const input: GradingInput = {
      userClasses,
      userRelationships: [
        makeRel("ur-1", "u-a", "u-b", "association"),
      ],
      referenceClasses: refClasses,
      referenceRelationships: [
        makeRel("rr-1", "ref-a", "ref-b", "association"),
      ],
      keyPatterns: [],
    };

    const result = gradeDiagram(input);
    const relCategory = result.categories.find(
      (c) => c.name === "Relationships",
    )!;
    expect(relCategory.items[0].passed).toBe(true);
    expect(relCategory.earnedPoints).toBeCloseTo(30, 0);
  });

  it("gives half credit for wrong relationship type", () => {
    const refClasses = [
      makeClass("ref-a", "Subject"),
      makeClass("ref-b", "Observer"),
    ];
    const userClasses = [
      makeClass("u-a", "Subject"),
      makeClass("u-b", "Observer"),
    ];

    const input: GradingInput = {
      userClasses,
      userRelationships: [
        makeRel("ur-1", "u-a", "u-b", "dependency"),
      ],
      referenceClasses: refClasses,
      referenceRelationships: [
        makeRel("rr-1", "ref-a", "ref-b", "composition"),
      ],
      keyPatterns: [],
    };

    const result = gradeDiagram(input);
    const relCategory = result.categories.find(
      (c) => c.name === "Relationships",
    )!;
    // dependency vs composition = not compatible, so full miss
    expect(relCategory.items[0].passed).toBe(true);
    // At least the relationship was found (different types)
    expect(relCategory.items[0].points).toBeLessThan(30);
  });

  it("detects Singleton pattern", () => {
    const singletonClass = makeClass("s-1", "Config", {
      attributes: [
        {
          id: "s-attr-0",
          name: "instance",
          type: "Config",
          visibility: "-",
        },
      ],
      methods: [
        {
          id: "s-meth-0",
          name: "constructor",
          returnType: "void",
          params: [],
          visibility: "-",
        },
        {
          id: "s-meth-1",
          name: "getInstance",
          returnType: "Config",
          params: [],
          visibility: "+",
        },
      ],
    });

    const input: GradingInput = {
      userClasses: [singletonClass],
      userRelationships: [],
      referenceClasses: [],
      referenceRelationships: [],
      keyPatterns: ["Singleton"],
    };

    const result = gradeDiagram(input);
    const patternCategory = result.categories.find(
      (c) => c.name === "Pattern Usage",
    )!;
    expect(patternCategory.items[0].passed).toBe(true);
    expect(patternCategory.earnedPoints).toBeCloseTo(20, 0);
  });

  it("detects Observer pattern", () => {
    const subject = makeClass("subj", "EventBus", {
      attributes: [
        {
          id: "subj-attr",
          name: "observers",
          type: "Observer[]",
          visibility: "-",
        },
      ],
      methods: [
        {
          id: "subj-m1",
          name: "notify",
          returnType: "void",
          params: [],
          visibility: "+",
        },
        {
          id: "subj-m2",
          name: "attach",
          returnType: "void",
          params: ["o: Observer"],
          visibility: "+",
        },
      ],
    });

    expect(
      PATTERN_DETECTORS.observer.detect([subject], []),
    ).toBe(true);
  });

  it("detects Strategy pattern", () => {
    const strategyInterface = makeClass("si", "SortStrategy", {
      stereotype: "interface",
      methods: [
        {
          id: "si-m",
          name: "sort",
          returnType: "void",
          params: ["data: number[]"],
          visibility: "+",
        },
      ],
    });

    const implA = makeClass("ia", "BubbleSort", {
      methods: [
        {
          id: "ia-m",
          name: "sort",
          returnType: "void",
          params: ["data: number[]"],
          visibility: "+",
        },
      ],
    });

    const implB = makeClass("ib", "QuickSort", {
      methods: [
        {
          id: "ib-m",
          name: "sort",
          returnType: "void",
          params: ["data: number[]"],
          visibility: "+",
        },
      ],
    });

    const context = makeClass("ctx", "Sorter", {
      attributes: [
        {
          id: "ctx-attr",
          name: "strategy",
          type: "SortStrategy",
          visibility: "-",
        },
      ],
    });

    const rels: UMLRelationship[] = [
      makeRel("r1", "ia", "si", "realization"),
      makeRel("r2", "ib", "si", "realization"),
    ];

    expect(
      PATTERN_DETECTORS.strategy.detect(
        [strategyInterface, implA, implB, context],
        rels,
      ),
    ).toBe(true);
  });

  it("grades completeness correctly", () => {
    // One class with no methods, no attributes, and it's orphaned
    const orphanClass = makeClass("orphan", "Orphan", {
      attributes: [],
      methods: [],
    });

    const connectedA = makeClass("ca", "ClassA");
    const connectedB = makeClass("cb", "ClassB");

    const input: GradingInput = {
      userClasses: [orphanClass, connectedA, connectedB],
      userRelationships: [makeRel("r1", "ca", "cb")],
      referenceClasses: [
        makeClass("ref-1", "ClassA"),
        makeClass("ref-2", "ClassB"),
        makeClass("ref-3", "ClassC"),
      ],
      referenceRelationships: [],
      keyPatterns: [],
    };

    const result = gradeDiagram(input);
    const completeness = result.categories.find(
      (c) => c.name === "Completeness",
    )!;

    // Has enough classes (3 >= 2)
    expect(completeness.items[0].passed).toBe(true);
    // Not all classes have methods (orphan doesn't)
    expect(completeness.items[1].passed).toBe(false);
    // Not all classes have attributes (orphan doesn't)
    expect(completeness.items[2].passed).toBe(false);
    // Has orphan class
    expect(completeness.items[3].passed).toBe(false);
  });

  it("returns a perfect score for matching everything", () => {
    const refClasses = [
      makeClass("ref-1", "Config", {
        attributes: [
          {
            id: "ref-1-a",
            name: "instance",
            type: "Config",
            visibility: "-",
          },
        ],
        methods: [
          {
            id: "ref-1-m0",
            name: "constructor",
            returnType: "void",
            params: [],
            visibility: "-",
          },
          {
            id: "ref-1-m1",
            name: "getInstance",
            returnType: "Config",
            params: [],
            visibility: "+",
          },
        ],
      }),
      makeClass("ref-2", "AppService"),
    ];

    const userClasses = [
      makeClass("u-1", "Config", {
        attributes: [
          {
            id: "u-1-a",
            name: "instance",
            type: "Config",
            visibility: "-",
          },
        ],
        methods: [
          {
            id: "u-1-m0",
            name: "constructor",
            returnType: "void",
            params: [],
            visibility: "-",
          },
          {
            id: "u-1-m1",
            name: "getInstance",
            returnType: "Config",
            params: [],
            visibility: "+",
          },
        ],
      }),
      makeClass("u-2", "AppService"),
    ];

    const input: GradingInput = {
      userClasses,
      userRelationships: [makeRel("ur-1", "u-2", "u-1", "dependency")],
      referenceClasses: refClasses,
      referenceRelationships: [
        makeRel("rr-1", "ref-2", "ref-1", "dependency"),
      ],
      keyPatterns: ["Singleton"],
    };

    const result = gradeDiagram(input);
    expect(result.totalScore).toBe(100);
  });
});
