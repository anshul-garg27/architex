import { describe, it, expect } from "vitest";
import {
  syncDiagramToCode,
  syncCodeToDiagram,
  SyncManager,
} from "@/lib/lld/bidirectional-sync";
import type { UMLClass, UMLRelationship } from "@/lib/lld/types";

// -- Helpers ----------------------------------------------------

function makeClass(overrides: Partial<UMLClass> & { id: string; name: string }): UMLClass {
  return {
    stereotype: "class",
    attributes: [],
    methods: [],
    x: 0,
    y: 0,
    ...overrides,
  };
}

// -- syncDiagramToCode tests ------------------------------------

describe("syncDiagramToCode", () => {
  it("generates TypeScript code from classes", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "User",
        attributes: [{ id: "gen-attr-0", name: "name", type: "string", visibility: "+" }],
      }),
    ];

    const code = syncDiagramToCode(classes, [], "typescript");
    expect(code).toContain("class User");
    expect(code).toContain("name: string");
  });

  it("generates Python code from classes", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "User",
        attributes: [{ id: "gen-attr-1", name: "name", type: "string", visibility: "+" }],
      }),
    ];

    const code = syncDiagramToCode(classes, [], "python");
    expect(code).toContain("class User");
    expect(code).toContain("name: str");
  });
});

// -- syncCodeToDiagram tests ------------------------------------

describe("syncCodeToDiagram", () => {
  it("parses TypeScript code back to classes", () => {
    const code = `
export class Order {
  public id: string;
  public total: number;

  public getTotal(): number {
    return this.total;
  }
}`;

    const result = syncCodeToDiagram(code, "typescript");
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("Order");
    expect(result.classes[0].attributes).toHaveLength(2);
    expect(result.classes[0].methods).toHaveLength(1);
  });

  it("parses Python code back to classes", () => {
    const code = `
from dataclasses import dataclass

@dataclass
class Order:
    """Class: Order"""
    id: str = ""
    total: int = 0

    def get_total(self) -> int:
        return self.total
`;

    const result = syncCodeToDiagram(code, "python");
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("Order");
  });
});

// -- SyncManager tests ------------------------------------------

describe("SyncManager", () => {
  it("tracks added classes on first syncFromDiagram", () => {
    const mgr = new SyncManager("typescript");
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Foo" }),
      makeClass({ id: "c2", name: "Bar" }),
    ];

    const result = mgr.syncFromDiagram(classes, []);
    expect(result.code).toBeDefined();
    expect(result.added).toEqual(["Foo", "Bar"]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
  });

  it("detects added classes in subsequent sync", () => {
    const mgr = new SyncManager("typescript");

    // First sync
    mgr.syncFromDiagram([makeClass({ id: "c1", name: "Foo" })], []);

    // Second sync with added class
    const result = mgr.syncFromDiagram(
      [makeClass({ id: "c1", name: "Foo" }), makeClass({ id: "c2", name: "Bar" })],
      [],
    );

    expect(result.added).toContain("Bar");
    expect(result.removed).toEqual([]);
  });

  it("detects removed classes in subsequent sync", () => {
    const mgr = new SyncManager("typescript");

    // First sync
    mgr.syncFromDiagram(
      [makeClass({ id: "c1", name: "Foo" }), makeClass({ id: "c2", name: "Bar" })],
      [],
    );

    // Second sync with removed class
    const result = mgr.syncFromDiagram([makeClass({ id: "c1", name: "Foo" })], []);

    expect(result.removed).toContain("Bar");
    expect(result.added).toEqual([]);
  });

  it("detects modified classes", () => {
    const mgr = new SyncManager("typescript");

    // First sync
    mgr.syncFromDiagram(
      [makeClass({ id: "c1", name: "Foo", attributes: [{ id: "gen-attr-2", name: "x", type: "number", visibility: "+" }] })],
      [],
    );

    // Second sync with modified attribute
    const result = mgr.syncFromDiagram(
      [makeClass({ id: "c1", name: "Foo", attributes: [{ id: "gen-attr-3", name: "x", type: "string", visibility: "+" }] })],
      [],
    );

    expect(result.modified).toContain("Foo");
  });

  it("syncFromCode parses code and tracks changes", () => {
    const mgr = new SyncManager("typescript");

    const code1 = `export class Alpha { public id: string; }`;
    const result1 = mgr.syncFromCode(code1);
    expect(result1.classes).toBeDefined();
    expect(result1.classes!).toHaveLength(1);
    expect(result1.added).toContain("Alpha");

    const code2 = `
export class Alpha { public id: string; }
export class Beta { public name: string; }`;
    const result2 = mgr.syncFromCode(code2);
    expect(result2.classes!).toHaveLength(2);
    expect(result2.added).toContain("Beta");
  });

  it("preserves positions when syncing from code", () => {
    const mgr = new SyncManager("typescript");

    // Set initial diagram with specific positions
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Foo", x: 100, y: 200 }),
    ];
    mgr.syncFromDiagram(classes, []);

    // Now sync from code that still has Foo
    const code = `export class Foo { public name: string; }`;
    const result = mgr.syncFromCode(code);

    const foo = result.classes!.find((c) => c.name === "Foo");
    expect(foo).toBeDefined();
    expect(foo!.x).toBe(100);
    expect(foo!.y).toBe(200);
  });

  it("reset clears internal state", () => {
    const mgr = new SyncManager("typescript");
    mgr.syncFromDiagram([makeClass({ id: "c1", name: "Foo" })], []);

    mgr.reset();

    // After reset, everything is "added" again
    const result = mgr.syncFromDiagram([makeClass({ id: "c1", name: "Foo" })], []);
    expect(result.added).toContain("Foo");
  });

  it("language change resets state", () => {
    const mgr = new SyncManager("typescript");
    mgr.syncFromDiagram([makeClass({ id: "c1", name: "Foo" })], []);

    mgr.language = "python";

    // After language change, everything is "added" again
    const result = mgr.syncFromDiagram([makeClass({ id: "c1", name: "Foo" })], []);
    expect(result.added).toContain("Foo");
  });

  it("syncBidirectional prefers diagram when both changed", () => {
    const mgr = new SyncManager("typescript", "bidirectional");

    // Set initial state
    const initialClasses = [makeClass({ id: "c1", name: "Foo" })];
    mgr.syncFromDiagram(initialClasses, []);

    // Both diagram and code changed
    const newClasses = [
      makeClass({ id: "c1", name: "Foo" }),
      makeClass({ id: "c2", name: "Bar" }),
    ];
    const newCode = `export class Foo { } export class Baz { }`;

    const result = mgr.syncBidirectional(newClasses, [], newCode);
    // Diagram wins, so Bar should be added, not Baz
    expect(result.code).toBeDefined();
    expect(result.added).toContain("Bar");
  });

  it("syncBidirectional uses code when only code changed", () => {
    const mgr = new SyncManager("typescript", "bidirectional");

    // Set initial state
    const initialClasses = [makeClass({ id: "c1", name: "Foo" })];
    mgr.syncFromDiagram(initialClasses, []);

    // Only code changed, diagram is same
    const sameClasses = [makeClass({ id: "c1", name: "Foo" })];
    const newCode = `export class Foo { } export class NewFromCode { }`;

    const result = mgr.syncBidirectional(sameClasses, [], newCode);
    expect(result.classes).toBeDefined();
    expect(result.added).toContain("NewFromCode");
  });

  it("supports python language", () => {
    const mgr = new SyncManager("python");
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Config",
        attributes: [{ id: "gen-attr-4", name: "debug", type: "boolean", visibility: "+" }],
      }),
    ];

    const result = mgr.syncFromDiagram(classes, []);
    expect(result.code).toContain("class Config");
    expect(result.code).toContain("debug: bool");
  });
});
