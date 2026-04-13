import { describe, it, expect } from "vitest";
import {
  syncDiagramToCode,
  syncCodeToDiagram,
  SyncManager,
} from "@/lib/lld/bidirectional-sync";
import type { UMLClass, UMLRelationship } from "@/lib/lld/types";

// -- Helpers ---------------------------------------------------

function makeClass(
  overrides: Partial<UMLClass> & { id: string; name: string },
): UMLClass {
  return {
    stereotype: "class",
    attributes: [],
    methods: [],
    x: 0,
    y: 0,
    ...overrides,
  };
}

// -- Sync direction tests --------------------------------------

describe("sync direction", () => {
  it("syncDiagramToCode generates TS by default for unknown language", () => {
    const classes = [makeClass({ id: "c1", name: "Foo" })];
    // Cast to trigger the default branch
    const code = syncDiagramToCode(classes, [], "unknown" as "typescript");
    expect(code).toContain("class Foo");
  });

  it("syncCodeToDiagram parses TS by default for unknown language", () => {
    const code = "export class Bar { public x: string; }";
    const result = syncCodeToDiagram(code, "unknown" as "typescript");
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("Bar");
  });

  it("SyncManager direction getter/setter works", () => {
    const mgr = new SyncManager("typescript", "diagram-to-code");
    expect(mgr.direction).toBe("diagram-to-code");

    mgr.direction = "code-to-diagram";
    expect(mgr.direction).toBe("code-to-diagram");

    mgr.direction = "bidirectional";
    expect(mgr.direction).toBe("bidirectional");
  });
});

// -- Change detection tests ------------------------------------

describe("change detection", () => {
  it("detects diagram change when class count differs", () => {
    const mgr = new SyncManager("typescript", "bidirectional");

    // First sync -- sets baseline
    mgr.syncFromDiagram([makeClass({ id: "c1", name: "A" })], []);

    // Add class => diagram changed
    const result = mgr.syncBidirectional(
      [makeClass({ id: "c1", name: "A" }), makeClass({ id: "c2", name: "B" })],
      [],
      "export class A { }",
    );
    // Diagram wins, so B should be added
    expect(result.added).toContain("B");
    expect(result.code).toBeDefined();
  });

  it("detects code change when only code is modified", () => {
    const mgr = new SyncManager("typescript", "bidirectional");
    const initial = [makeClass({ id: "c1", name: "X" })];
    mgr.syncFromDiagram(initial, []);

    // Same diagram, different code
    const result = mgr.syncBidirectional(
      initial,
      [],
      "export class X { } export class Y { }",
    );
    expect(result.classes).toBeDefined();
    expect(result.added).toContain("Y");
  });

  it("detects modification when an attribute type changes", () => {
    const mgr = new SyncManager("typescript");

    mgr.syncFromDiagram(
      [
        makeClass({
          id: "c1",
          name: "Config",
          attributes: [{ id: "cfg-attr-port", name: "port", type: "number", visibility: "+" }],
        }),
      ],
      [],
    );

    const result = mgr.syncFromDiagram(
      [
        makeClass({
          id: "c1",
          name: "Config",
          attributes: [{ id: "cfg-attr-port", name: "port", type: "string", visibility: "+" }],
        }),
      ],
      [],
    );
    expect(result.modified).toContain("Config");
  });

  it("detects modification when a method is added", () => {
    const mgr = new SyncManager("typescript");

    mgr.syncFromDiagram([makeClass({ id: "c1", name: "Svc" })], []);

    const result = mgr.syncFromDiagram(
      [
        makeClass({
          id: "c1",
          name: "Svc",
          methods: [
            { id: "svc-meth-run", name: "run", returnType: "void", params: [], visibility: "+" },
          ],
        }),
      ],
      [],
    );
    expect(result.modified).toContain("Svc");
  });

  it("reports no changes when diagram is identical", () => {
    const mgr = new SyncManager("typescript");
    const classes = [
      makeClass({
        id: "c1",
        name: "Stable",
        attributes: [{ id: "stable-attr-x", name: "x", type: "number", visibility: "+" }],
      }),
    ];

    mgr.syncFromDiagram(classes, []);
    const result = mgr.syncFromDiagram(classes, []);

    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it("diagram wins over code when both sides changed", () => {
    const mgr = new SyncManager("typescript", "bidirectional");
    mgr.syncFromDiagram([makeClass({ id: "c1", name: "Alpha" })], []);

    const newDiagram = [
      makeClass({ id: "c1", name: "Alpha" }),
      makeClass({ id: "c2", name: "DiagramClass" }),
    ];
    const newCode = "export class Alpha { } export class CodeClass { }";

    const result = mgr.syncBidirectional(newDiagram, [], newCode);

    // Diagram wins, so DiagramClass should appear, not CodeClass
    expect(result.added).toContain("DiagramClass");
    expect(result.added).not.toContain("CodeClass");
  });

  it("syncFromCode reports first sync as all added", () => {
    const mgr = new SyncManager("typescript");
    const code = "export class First { public id: string; }";
    const result = mgr.syncFromCode(code);
    expect(result.added).toContain("First");
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it("language setter resets all internal state", () => {
    const mgr = new SyncManager("typescript");
    mgr.syncFromDiagram([makeClass({ id: "c1", name: "X" })], []);

    mgr.language = "python";
    expect(mgr.language).toBe("python");

    // After language change everything is "added" again
    const result = mgr.syncFromDiagram([makeClass({ id: "c1", name: "X" })], []);
    expect(result.added).toContain("X");
  });
});
