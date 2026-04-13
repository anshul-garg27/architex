import { describe, it, expect } from "vitest";
import { generateTypeScript } from "@/lib/lld/codegen/diagram-to-typescript";
import { parseTypeScript } from "@/lib/lld/codegen/code-to-diagram";
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

// -- generateTypeScript tests -----------------------------------

describe("generateTypeScript", () => {
  it("returns placeholder comment for empty input", () => {
    const result = generateTypeScript([], []);
    expect(result).toBe("// No classes in the diagram");
  });

  it("generates a simple class with attributes and methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "User",
        attributes: [
          { id: "gen-attr-0", name: "id", type: "string", visibility: "-" },
          { id: "gen-attr-1", name: "name", type: "string", visibility: "+" },
        ],
        methods: [
          { id: "gen-meth-11", name: "getName", returnType: "string", params: [], visibility: "+", isAbstract: false },
          { id: "gen-meth-12", name: "setName", returnType: "void", params: ["name: string"], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("class User");
    expect(code).toContain("private id: string;");
    expect(code).toContain("public name: string;");
    expect(code).toContain("public getName(): string {");
    expect(code).toContain("public setName(name: string): void {");
  });

  it("generates an interface with attributes and method signatures", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "i1",
        name: "Printable",
        stereotype: "interface",
        attributes: [
          { id: "gen-attr-2", name: "pageCount", type: "number", visibility: "+" },
        ],
        methods: [
          { id: "gen-meth-13", name: "print", returnType: "void", params: [], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export interface Printable");
    expect(code).toContain("pageCount: number;");
    expect(code).toContain("print(): void;");
    // Interfaces should not have method bodies
    expect(code).not.toContain("// TODO: implement");
  });

  it("generates an abstract class with abstract methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "a1",
        name: "Shape",
        stereotype: "abstract",
        methods: [
          { id: "gen-meth-14", name: "area", returnType: "number", params: [], visibility: "+", isAbstract: true },
          { id: "gen-meth-15", name: "perimeter", returnType: "number", params: [], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export abstract class Shape");
    expect(code).toContain("public abstract area(): number;");
    expect(code).toContain("public perimeter(): number {");
  });

  it("generates an enum", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "e1",
        name: "Color",
        stereotype: "enum",
        attributes: [
          { id: "gen-attr-3", name: "RED", type: "", visibility: "+" },
          { id: "gen-attr-4", name: "GREEN", type: "", visibility: "+" },
          { id: "gen-attr-5", name: "BLUE", type: "", visibility: "+" },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("export enum Color {");
    expect(code).toContain("RED,");
    expect(code).toContain("GREEN,");
    expect(code).toContain("BLUE,");
  });

  it("handles inheritance (extends)", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "p1", name: "Animal", stereotype: "abstract" }),
      makeClass({ id: "c1", name: "Dog" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "p1", type: "inheritance" },
    ];

    const code = generateTypeScript(classes, relationships);
    expect(code).toContain("class Dog extends Animal");
  });

  it("handles realization (implements)", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Serializable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "User" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "i1", type: "realization" },
    ];

    const code = generateTypeScript(classes, relationships);
    expect(code).toContain("class User implements Serializable");
  });

  it("handles both extends and implements together", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "p1", name: "BaseEntity", stereotype: "abstract" }),
      makeClass({ id: "i1", name: "Auditable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Order" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "p1", type: "inheritance" },
      { id: "r2", source: "c1", target: "i1", type: "realization" },
    ];

    const code = generateTypeScript(classes, relationships);
    expect(code).toContain("class Order extends BaseEntity implements Auditable");
  });

  it("generates composition member fields", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Car" }),
      makeClass({ id: "c2", name: "Engine" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "c2", type: "composition", label: "engine" },
    ];

    const code = generateTypeScript(classes, relationships);
    expect(code).toContain("engine: Engine;");
  });

  it("generates aggregation member fields as public", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Department" }),
      makeClass({ id: "c2", name: "Employee" }),
    ];
    const relationships: UMLRelationship[] = [
      {
        id: "r1",
        source: "c1",
        target: "c2",
        type: "aggregation",
        label: "employees",
        targetCardinality: "0..*",
      },
    ];

    const code = generateTypeScript(classes, relationships);
    expect(code).toContain("employees: Employee[];");
  });

  it("generates array field for many cardinality without label", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Library" }),
      makeClass({ id: "c2", name: "Book" }),
    ];
    const relationships: UMLRelationship[] = [
      {
        id: "r1",
        source: "c1",
        target: "c2",
        type: "composition",
        targetCardinality: "*",
      },
    ];

    const code = generateTypeScript(classes, relationships);
    // Auto-derived field name: "books" (lowercase + "s")
    expect(code).toContain("books: Book[];");
  });

  it("sorts output: enums, interfaces, abstract, classes", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "ConcreteClass" }),
      makeClass({ id: "a1", name: "AbstractBase", stereotype: "abstract" }),
      makeClass({ id: "e1", name: "Status", stereotype: "enum", attributes: [{ id: "gen-attr-6", name: "ACTIVE", type: "", visibility: "+" }] }),
      makeClass({ id: "i1", name: "Readable", stereotype: "interface" }),
    ];

    const code = generateTypeScript(classes, []);
    const enumIdx = code.indexOf("enum Status");
    const ifaceIdx = code.indexOf("interface Readable");
    const abstractIdx = code.indexOf("abstract class AbstractBase");
    const classIdx = code.indexOf("class ConcreteClass");

    expect(enumIdx).toBeLessThan(ifaceIdx);
    expect(ifaceIdx).toBeLessThan(abstractIdx);
    expect(abstractIdx).toBeLessThan(classIdx);
  });

  it("handles visibility modifiers: protected and package", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Foo",
        attributes: [
          { id: "gen-attr-7", name: "protField", type: "number", visibility: "#" },
          { id: "gen-attr-8", name: "pkgField", type: "string", visibility: "~" },
        ],
      }),
    ];

    const code = generateTypeScript(classes, []);
    expect(code).toContain("protected protField: number;");
    expect(code).toContain("/* package */ pkgField: string;");
  });

  it("includes import comments for multi-file setup", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Loggable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Service" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "i1", type: "realization" },
    ];

    const code = generateTypeScript(classes, relationships);
    expect(code).toContain("Imports (in a multi-file setup)");
    expect(code).toContain("Loggable");
  });
});

// -- parseTypeScript tests --------------------------------------

describe("parseTypeScript", () => {
  it("parses a simple class with attributes and methods", () => {
    const code = `
export class User {
  private id: string;
  public name: string;

  public getId(): string {
    return this.id;
  }

  public setName(name: string): void {
    this.name = name;
  }
}`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(1);

    const cls = result.classes[0];
    expect(cls.name).toBe("User");
    expect(cls.stereotype).toBe("class");
    expect(cls.attributes).toHaveLength(2);
    expect(cls.attributes[0].name).toBe("id");
    expect(cls.attributes[0].visibility).toBe("-");
    expect(cls.attributes[0].type).toBe("string");
    expect(cls.attributes[1].name).toBe("name");
    expect(cls.attributes[1].visibility).toBe("+");

    expect(cls.methods).toHaveLength(2);
    expect(cls.methods[0].name).toBe("getId");
    expect(cls.methods[0].returnType).toBe("string");
    expect(cls.methods[1].name).toBe("setName");
    expect(cls.methods[1].params).toContain("name: string");
  });

  it("parses an interface", () => {
    const code = `
export interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(1);

    const cls = result.classes[0];
    expect(cls.name).toBe("Serializable");
    expect(cls.stereotype).toBe("interface");
    expect(cls.methods).toHaveLength(2);
  });

  it("parses an abstract class", () => {
    const code = `
export abstract class Shape {
  protected color: string;

  public abstract area(): number;
  public abstract perimeter(): number;
}`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(1);

    const cls = result.classes[0];
    expect(cls.name).toBe("Shape");
    expect(cls.stereotype).toBe("abstract");
    expect(cls.attributes).toHaveLength(1);
    expect(cls.attributes[0].visibility).toBe("#");
    expect(cls.methods).toHaveLength(2);
    expect(cls.methods[0].isAbstract).toBe(true);
    expect(cls.methods[1].isAbstract).toBe(true);
  });

  it("parses an enum", () => {
    const code = `
export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(1);

    const cls = result.classes[0];
    expect(cls.name).toBe("Direction");
    expect(cls.stereotype).toBe("enum");
    expect(cls.attributes).toHaveLength(4);
    expect(cls.attributes.map((a) => a.name)).toEqual(["UP", "DOWN", "LEFT", "RIGHT"]);
  });

  it("detects inheritance relationships", () => {
    const code = `
export class Animal {
  public name: string;
}

export class Dog extends Animal {
  public breed: string;
}`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);

    const rel = result.relationships[0];
    expect(rel.type).toBe("inheritance");
    // Source is Dog, target is Animal
    const dogId = result.classes.find((c) => c.name === "Dog")!.id;
    const animalId = result.classes.find((c) => c.name === "Animal")!.id;
    expect(rel.source).toBe(dogId);
    expect(rel.target).toBe(animalId);
  });

  it("detects realization (implements) relationships", () => {
    const code = `
export interface Printable {
  print(): void;
}

export class Document implements Printable {
  public title: string;

  public print(): void {
    // ...
  }
}`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);

    const rel = result.relationships[0];
    expect(rel.type).toBe("realization");
  });

  it("assigns auto-layout positions", () => {
    const code = `
class A { }
class B { }
class C { }
class D { }`;

    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(4);

    // Each class should have non-zero positions
    for (const cls of result.classes) {
      expect(cls.x).toBeGreaterThanOrEqual(0);
      expect(cls.y).toBeGreaterThanOrEqual(0);
    }

    // They should not all have the same position
    const positions = result.classes.map((c) => `${c.x},${c.y}`);
    const unique = new Set(positions);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("handles protected and default visibility", () => {
    const code = `
class Example {
  protected secret: number;
  count: string;
}`;

    const result = parseTypeScript(code);
    const cls = result.classes[0];
    expect(cls.attributes).toHaveLength(2);
    expect(cls.attributes[0].visibility).toBe("#");
    expect(cls.attributes[1].visibility).toBe("+"); // default = public
  });
});

// -- Round-trip test: generate then parse -----------------------

describe("TypeScript round-trip", () => {
  it("preserves class structure through generate -> parse", () => {
    const original: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Account",
        attributes: [
          { id: "gen-attr-9", name: "id", type: "string", visibility: "-" },
          { id: "gen-attr-10", name: "balance", type: "number", visibility: "+" },
        ],
        methods: [
          { id: "gen-meth-16", name: "deposit", returnType: "void", params: ["amount: number"], visibility: "+", isAbstract: false },
          { id: "gen-meth-17", name: "getBalance", returnType: "number", params: [], visibility: "+", isAbstract: false },
        ],
      }),
    ];

    const code = generateTypeScript(original, []);
    const parsed = parseTypeScript(code);

    expect(parsed.classes).toHaveLength(1);
    const cls = parsed.classes[0];
    expect(cls.name).toBe("Account");
    expect(cls.attributes).toHaveLength(2);
    expect(cls.methods).toHaveLength(2);

    // Check attribute names survived
    const attrNames = cls.attributes.map((a) => a.name);
    expect(attrNames).toContain("id");
    expect(attrNames).toContain("balance");

    // Check method names survived
    const methodNames = cls.methods.map((m) => m.name);
    expect(methodNames).toContain("deposit");
    expect(methodNames).toContain("getBalance");
  });

  it("preserves inheritance through generate -> parse", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Identifiable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Entity" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "i1", type: "realization" },
    ];

    const code = generateTypeScript(classes, relationships);
    const parsed = parseTypeScript(code);

    expect(parsed.classes).toHaveLength(2);
    expect(parsed.relationships).toHaveLength(1);
    expect(parsed.relationships[0].type).toBe("realization");
  });
});
