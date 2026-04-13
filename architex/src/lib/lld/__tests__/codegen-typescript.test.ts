import { describe, it, expect } from "vitest";
import {
  generateTypeScript,
  generateTypeScriptFiles,
} from "@/lib/lld/codegen/diagram-to-typescript";
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

function makeRel(
  overrides: Partial<UMLRelationship> & {
    id: string;
    source: string;
    target: string;
    type: UMLRelationship["type"];
  },
): UMLRelationship {
  return { ...overrides };
}

// ═══════════════════════════════════════════════════════════════
//  generateTypeScript — single-file output
// ═══════════════════════════════════════════════════════════════

// -- Empty input -----------------------------------------------

describe("generateTypeScript empty", () => {
  it("returns a placeholder comment for empty class list", () => {
    const result = generateTypeScript([], []);
    expect(result).toBe("// No classes in the diagram");
  });
});

// -- Interface generation --------------------------------------

describe("generateTypeScript interface", () => {
  it("generates an interface with all methods as signatures (no body)", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "i1",
        name: "Printable",
        stereotype: "interface",
        attributes: [
          { id: "a1", name: "pageCount", type: "number", visibility: "+" },
        ],
        methods: [
          { id: "m1", name: "print", returnType: "void", params: [], visibility: "+", isAbstract: false },
          { id: "m2", name: "preview", returnType: "string", params: ["page: number"], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export interface Printable");
    expect(code).toContain("pageCount: number;");
    expect(code).toContain("print(): void;");
    expect(code).toContain("preview(page: number): string;");
    // No method bodies in interfaces
    expect(code).not.toContain("// TODO: implement");
    // Method lines should end with ; not { (interface signatures, not bodies)
    const lines = code.split("\n");
    const methodLines = lines.filter((l) => l.includes("print()") || l.includes("preview("));
    expect(methodLines.length).toBe(2);
    for (const ml of methodLines) {
      expect(ml.trimEnd()).toMatch(/;\s*$/);
      expect(ml).not.toContain("{");
    }
  });

  it("marks private interface attributes as readonly", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "i1",
        name: "IReadOnly",
        stereotype: "interface",
        attributes: [
          { id: "a1", name: "secret", type: "string", visibility: "-" },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("readonly secret: string;");
  });

  it("generates empty interface body when no attributes or methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "i1",
        name: "Marker",
        stereotype: "interface",
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export interface Marker");
    expect(code).toContain("}");
  });
});

// -- Abstract class generation ---------------------------------

describe("generateTypeScript abstract class", () => {
  it("generates abstract class with both abstract and concrete methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "a1",
        name: "Shape",
        stereotype: "abstract",
        attributes: [
          { id: "a-attr-1", name: "color", type: "string", visibility: "#" },
        ],
        methods: [
          { id: "a-m1", name: "area", returnType: "number", params: [], visibility: "+", isAbstract: true },
          { id: "a-m2", name: "perimeter", returnType: "number", params: [], visibility: "+", isAbstract: true },
          { id: "a-m3", name: "describe", returnType: "string", params: [], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export abstract class Shape");
    // Abstract methods have no body
    expect(code).toContain("public abstract area(): number;");
    expect(code).toContain("public abstract perimeter(): number;");
    // Concrete method has a body
    expect(code).toContain("public describe(): string {");
    expect(code).toContain("// TODO: implement");
    // Protected attribute
    expect(code).toContain("protected color: string;");
  });
});

// -- Enum generation -------------------------------------------

describe("generateTypeScript enum", () => {
  it("generates enum with all members", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "e1",
        name: "Direction",
        stereotype: "enum",
        attributes: [
          { id: "ea1", name: "NORTH", type: "", visibility: "+" },
          { id: "ea2", name: "SOUTH", type: "", visibility: "+" },
          { id: "ea3", name: "EAST", type: "", visibility: "+" },
          { id: "ea4", name: "WEST", type: "", visibility: "+" },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export enum Direction {");
    expect(code).toContain("NORTH,");
    expect(code).toContain("SOUTH,");
    expect(code).toContain("EAST,");
    expect(code).toContain("WEST,");
  });

  it("generates enum with no members", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "e1",
        name: "EmptyEnum",
        stereotype: "enum",
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export enum EmptyEnum {");
    expect(code).toContain("}");
  });
});

// -- Inheritance (extends) and implements ----------------------

describe("generateTypeScript inheritance and implements", () => {
  it("generates extends clause for inheritance relationship", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "p1", name: "Animal", stereotype: "abstract" }),
      makeClass({
        id: "c1",
        name: "Dog",
        attributes: [
          { id: "d-a1", name: "breed", type: "string", visibility: "+" },
        ],
      }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "p1", type: "inheritance" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("class Dog extends Animal");
  });

  it("generates implements clause for realization relationship", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Serializable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "User" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "i1", type: "realization" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("class User implements Serializable");
  });

  it("generates both extends and implements together", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "p1", name: "BaseEntity", stereotype: "abstract" }),
      makeClass({ id: "i1", name: "Auditable", stereotype: "interface" }),
      makeClass({ id: "i2", name: "Cacheable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Order" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "p1", type: "inheritance" }),
      makeRel({ id: "r2", source: "c1", target: "i1", type: "realization" }),
      makeRel({ id: "r3", source: "c1", target: "i2", type: "realization" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("class Order extends BaseEntity implements Auditable, Cacheable");
  });

  it("interface extends other interfaces via inheritance/realization", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Readable", stereotype: "interface" }),
      makeClass({ id: "i2", name: "Writable", stereotype: "interface" }),
      makeClass({ id: "i3", name: "ReadWritable", stereotype: "interface" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "i3", target: "i1", type: "inheritance" }),
      makeRel({ id: "r2", source: "i3", target: "i2", type: "realization" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("interface ReadWritable extends Readable, Writable");
  });
});

// -- Composition / aggregation field generation ----------------

describe("generateTypeScript composition and aggregation", () => {
  it("generates composition field with label", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Car" }),
      makeClass({ id: "c2", name: "Engine" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "c2", type: "composition", label: "engine" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("engine: Engine;");
    // Composition fields are private
    expect(code).toContain("private engine: Engine;");
  });

  it("generates aggregation field as public (not private)", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Team" }),
      makeClass({ id: "c2", name: "Player" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({
        id: "r1",
        source: "c1",
        target: "c2",
        type: "aggregation",
        label: "captain",
      }),
    ];

    const code = generateTypeScript(classes, rels);
    // Aggregation -> public visibility (composition uses private)
    expect(code).toContain("public captain: Player;");
  });

  it("generates array field for * cardinality", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Library" }),
      makeClass({ id: "c2", name: "Book" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({
        id: "r1",
        source: "c1",
        target: "c2",
        type: "composition",
        targetCardinality: "*",
      }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("books: Book[];");
  });

  it("generates array field for 0..* cardinality", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Department" }),
      makeClass({ id: "c2", name: "Employee" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({
        id: "r1",
        source: "c1",
        target: "c2",
        type: "aggregation",
        label: "employees",
        targetCardinality: "0..*",
      }),
    ];

    const code = generateTypeScript(classes, rels);
    // In class context, aggregation uses public visibility without optional marker
    expect(code).toContain("public employees: Employee[];");
  });

  it("generates array field for 1..* cardinality", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Playlist" }),
      makeClass({ id: "c2", name: "Song" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({
        id: "r1",
        source: "c1",
        target: "c2",
        type: "composition",
        targetCardinality: "1..*",
      }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("songs: Song[];");
  });

  it("derives field name from target class when no label", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "House" }),
      makeClass({ id: "c2", name: "Room" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "c2", type: "composition" }),
    ];

    const code = generateTypeScript(classes, rels);
    // Single cardinality, no label -> lowercase target name
    expect(code).toContain("room: Room;");
  });

  it("generates association field", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Student" }),
      makeClass({ id: "c2", name: "Course" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({
        id: "r1",
        source: "c1",
        target: "c2",
        type: "association",
        label: "enrolledCourses",
        targetCardinality: "0..*",
      }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("enrolledCourses: Course[];");
  });
});

// -- Import map correctness -----------------------------------

describe("generateTypeScript imports", () => {
  it("includes import comment block when relationships exist", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Loggable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Service" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "i1", type: "realization" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain("Imports (in a multi-file setup)");
    expect(code).toContain("Service:");
    expect(code).toContain("Loggable");
  });

  it("does not include import block when no relationships exist", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Alpha" }),
      makeClass({ id: "c2", name: "Beta" }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).not.toContain("Imports");
  });

  it("uses import type for interfaces and enums", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Sortable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "ListImpl" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "i1", type: "realization" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain('import type { Sortable }');
  });

  it("uses regular import for classes", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "p1", name: "BaseService" }),
      makeClass({ id: "c1", name: "UserService" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "p1", type: "inheritance" }),
    ];

    const code = generateTypeScript(classes, rels);
    expect(code).toContain('import { BaseService }');
    expect(code).not.toContain('import type { BaseService }');
  });

  it("deduplicates imports (same target referenced by multiple relationships)", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Disposable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Connection" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "i1", type: "realization" }),
      makeRel({ id: "r2", source: "c1", target: "i1", type: "association" }),
    ];

    const code = generateTypeScript(classes, rels);
    // Count occurrences of the import statement
    const matches = code.match(/import.*Disposable/g);
    expect(matches).toHaveLength(1);
  });
});

// -- Edge cases ------------------------------------------------

describe("generateTypeScript edge cases", () => {
  it("handles empty class (no attributes, no methods)", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Empty" }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export class Empty");
    expect(code).toContain("}");
  });

  it("handles class with no methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "DataHolder",
        attributes: [
          { id: "a1", name: "value", type: "number", visibility: "+" },
          { id: "a2", name: "label", type: "string", visibility: "+" },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("class DataHolder");
    expect(code).toContain("public value: number;");
    expect(code).toContain("public label: string;");
    expect(code).not.toContain("// TODO: implement");
  });

  it("handles class with no attributes", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Utility",
        methods: [
          { id: "m1", name: "doWork", returnType: "void", params: [], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("class Utility");
    expect(code).toContain("public doWork(): void {");
  });

  it("handles visibility modifier ~  (package)", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Internal",
        attributes: [
          { id: "a1", name: "data", type: "Buffer", visibility: "~" },
        ],
        methods: [
          { id: "m1", name: "process", returnType: "void", params: [], visibility: "~", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("/* package */ data: Buffer;");
    expect(code).toContain("/* package */ process(): void {");
  });

  it("handles method with multiple parameters", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Calculator",
        methods: [
          {
            id: "m1",
            name: "add",
            returnType: "number",
            params: ["a: number", "b: number"],
            visibility: "+",
            isAbstract: false,
          },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("public add(a: number, b: number): number {");
  });

  it("handles attributes with unknown type fallback", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Untyped",
        attributes: [
          { id: "a1", name: "something", type: "", visibility: "+" },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("public something: unknown;");
  });

  it("handles method with no return type (defaults to void)", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Worker",
        methods: [
          { id: "m1", name: "run", returnType: "", params: [], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("public run(): void {");
  });
});

// -- Sort order ------------------------------------------------

describe("generateTypeScript sort order", () => {
  it("sorts output: enums first, interfaces, abstract, classes", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "ConcreteClass" }),
      makeClass({ id: "a1", name: "AbstractBase", stereotype: "abstract" }),
      makeClass({
        id: "e1",
        name: "Status",
        stereotype: "enum",
        attributes: [
          { id: "ea1", name: "ACTIVE", type: "", visibility: "+" },
        ],
      }),
      makeClass({ id: "i1", name: "Readable", stereotype: "interface" }),
    ];

    const code = generateTypeScript(classes, []);
    const enumIdx = code.indexOf("enum Status");
    const ifaceIdx = code.indexOf("interface Readable");
    const abstractIdx = code.indexOf("abstract class AbstractBase");
    const classIdx = code.indexOf("class ConcreteClass");

    expect(enumIdx).toBeGreaterThan(-1);
    expect(ifaceIdx).toBeGreaterThan(-1);
    expect(abstractIdx).toBeGreaterThan(-1);
    expect(classIdx).toBeGreaterThan(-1);

    expect(enumIdx).toBeLessThan(ifaceIdx);
    expect(ifaceIdx).toBeLessThan(abstractIdx);
    expect(abstractIdx).toBeLessThan(classIdx);
  });
});

// ═══════════════════════════════════════════════════════════════
//  generateTypeScriptFiles — multi-file output
// ═══════════════════════════════════════════════════════════════

describe("generateTypeScriptFiles", () => {
  it("returns empty map for empty input", () => {
    const files = generateTypeScriptFiles([], []);
    expect(files.size).toBe(0);
  });

  it("produces one file per class with kebab-case names", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "UserAccount" }),
      makeClass({ id: "c2", name: "OrderItem" }),
    ];

    const files = generateTypeScriptFiles(classes, []);
    expect(files.size).toBe(2);
    expect(files.has("user-account.ts")).toBe(true);
    expect(files.has("order-item.ts")).toBe(true);
  });

  it("includes import statements in each file referencing dependencies", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Loggable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "AppService" }),
    ];
    const rels: UMLRelationship[] = [
      makeRel({ id: "r1", source: "c1", target: "i1", type: "realization" }),
    ];

    const files = generateTypeScriptFiles(classes, rels);
    const serviceFile = files.get("app-service.ts");
    expect(serviceFile).toBeDefined();
    expect(serviceFile).toContain("import type { Loggable }");
    expect(serviceFile).toContain("./loggable");

    // Loggable file should have no imports (no outgoing relationships)
    const loggableFile = files.get("loggable.ts");
    expect(loggableFile).toBeDefined();
    expect(loggableFile).not.toContain("import");
  });

  it("each file ends with a newline", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Foo" }),
    ];

    const files = generateTypeScriptFiles(classes, []);
    const content = files.get("foo.ts");
    expect(content).toBeDefined();
    expect(content!.endsWith("\n")).toBe(true);
  });

  it("generates correct content for each stereotype in its own file", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "e1",
        name: "Color",
        stereotype: "enum",
        attributes: [
          { id: "ea1", name: "RED", type: "", visibility: "+" },
        ],
      }),
      makeClass({
        id: "i1",
        name: "Drawable",
        stereotype: "interface",
        methods: [
          { id: "m1", name: "draw", returnType: "void", params: [], visibility: "+", isAbstract: false },
        ],
      }),
      makeClass({
        id: "a1",
        name: "BaseShape",
        stereotype: "abstract",
        methods: [
          { id: "m2", name: "area", returnType: "number", params: [], visibility: "+", isAbstract: true },
        ],
      }),
    ];

    const files = generateTypeScriptFiles(classes, []);
    expect(files.get("color.ts")).toContain("export enum Color");
    expect(files.get("drawable.ts")).toContain("export interface Drawable");
    expect(files.get("base-shape.ts")).toContain("export abstract class BaseShape");
  });
});
