import { describe, it, expect } from "vitest";
import { generatePython } from "@/lib/lld/codegen/diagram-to-python";
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

// -- Empty input -----------------------------------------------

describe("generatePython empty", () => {
  it("returns a comment for empty class list", () => {
    const result = generatePython([], []);
    expect(result).toBe("# No classes in the diagram");
  });
});

// -- Concrete class generation ---------------------------------

describe("generatePython class", () => {
  it("generates a @dataclass with attributes", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "User",
        attributes: [
          { id: "test-attr-0", name: "name", type: "string", visibility: "+" },
          { id: "test-attr-1", name: "age", type: "number", visibility: "+" },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("@dataclass");
    expect(code).toContain("class User:");
    expect(code).toContain('name: str = ""');
    expect(code).toContain("age: int = 0");
  });

  it("generates methods with correct signatures", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Calculator",
        methods: [
          {
            id: "test-meth-0",
            name: "add",
            returnType: "number",
            params: ["a: number", "b: number"],
            visibility: "+",
            isAbstract: false,
          },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("def add(self, a: int, b: int) -> int:");
    expect(code).toContain("# TODO: implement");
  });

  it("applies visibility prefixes: private (__) and protected (_)", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "c1",
        name: "Secret",
        attributes: [
          { id: "test-attr-2", name: "hidden", type: "string", visibility: "-" },
          { id: "test-attr-3", name: "internal", type: "number", visibility: "#" },
          { id: "test-attr-4", name: "open", type: "boolean", visibility: "+" },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain('__hidden: str = ""');
    expect(code).toContain("_internal: int = 0");
    expect(code).toContain("open: bool = False");
  });

  it("generates a class with no attributes or methods as pass", () => {
    const classes: UMLClass[] = [makeClass({ id: "c1", name: "Empty" })];
    const code = generatePython(classes, []);
    expect(code).toContain("class Empty:");
    expect(code).toContain("pass");
  });
});

// -- Interface generation --------------------------------------

describe("generatePython interface", () => {
  it("generates an ABC with abstract methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "i1",
        name: "Serializable",
        stereotype: "interface",
        methods: [
          {
            id: "test-meth-serialize",
            name: "serialize",
            returnType: "string",
            params: [],
            visibility: "+",
          },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("class Serializable(ABC):");
    expect(code).toContain('@abstractmethod');
    expect(code).toContain("def serialize(self) -> str:");
  });

  it("generates @property @abstractmethod for interface attributes", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "i1",
        name: "Named",
        stereotype: "interface",
        attributes: [
          { id: "test-attr-5", name: "name", type: "string", visibility: "+" },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("@property");
    expect(code).toContain("@abstractmethod");
    expect(code).toContain("def name(self) -> str:");
  });
});

// -- Abstract class generation ---------------------------------

describe("generatePython abstract", () => {
  it("generates an ABC subclass with abstract and concrete methods", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "a1",
        name: "Shape",
        stereotype: "abstract",
        methods: [
          {
            id: "test-meth-area",
            name: "area",
            returnType: "number",
            params: [],
            visibility: "+",
            isAbstract: true,
          },
          {
            id: "test-meth-describe",
            name: "describe",
            returnType: "string",
            params: [],
            visibility: "+",
            isAbstract: false,
          },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("class Shape(ABC):");
    expect(code).toContain("@abstractmethod");
    expect(code).toContain("def area(self) -> int:");
    expect(code).toContain("def describe(self) -> str:");
  });

  it("generates attributes in __init__ for abstract classes", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "a1",
        name: "Vehicle",
        stereotype: "abstract",
        attributes: [
          { id: "test-attr-6", name: "speed", type: "number", visibility: "+" },
        ],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("def __init__(self) -> None:");
    expect(code).toContain("self.speed: int = 0");
  });
});

// -- Inheritance -----------------------------------------------

describe("generatePython inheritance", () => {
  it("generates class extending a parent", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "p1", name: "Animal", stereotype: "abstract" }),
      makeClass({ id: "c1", name: "Dog" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "p1", type: "inheritance" },
    ];

    const code = generatePython(classes, relationships);
    expect(code).toContain("class Dog(Animal):");
  });

  it("generates class implementing an interface (realization)", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Loggable", stereotype: "interface" }),
      makeClass({ id: "c1", name: "Service" }),
    ];
    const relationships: UMLRelationship[] = [
      { id: "r1", source: "c1", target: "i1", type: "realization" },
    ];

    const code = generatePython(classes, relationships);
    expect(code).toContain("class Service(Loggable):");
  });
});

// -- Properties / composition ----------------------------------

describe("generatePython composition", () => {
  it("generates composition member field with default_factory", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Car" }),
      makeClass({ id: "c2", name: "Engine" }),
    ];
    const relationships: UMLRelationship[] = [
      {
        id: "r1",
        source: "c1",
        target: "c2",
        type: "composition",
        label: "engine",
      },
    ];

    const code = generatePython(classes, relationships);
    expect(code).toContain("engine: Engine = field(default_factory=Engine)");
  });

  it("generates list field for many-cardinality composition", () => {
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

    const code = generatePython(classes, relationships);
    expect(code).toContain("list[Book]");
    expect(code).toContain("field(default_factory=list)");
  });
});

// -- Import statements -----------------------------------------

describe("generatePython imports", () => {
  it("includes ABC import when interfaces or abstract classes exist", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "i1", name: "Printable", stereotype: "interface" }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("from abc import ABC, abstractmethod");
  });

  it("includes dataclass import when concrete classes exist", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "User" }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("from dataclasses import dataclass, field");
  });

  it("includes Enum import when enums exist", () => {
    const classes: UMLClass[] = [
      makeClass({
        id: "e1",
        name: "Color",
        stereotype: "enum",
        attributes: [{ id: "test-attr-e-0", name: "RED", type: "", visibility: "+" }],
      }),
    ];

    const code = generatePython(classes, []);
    expect(code).toContain("from enum import Enum, auto");
    expect(code).toContain("class Color(Enum):");
    expect(code).toContain("RED = auto()");
  });

  it("always includes from __future__ import annotations", () => {
    const classes: UMLClass[] = [makeClass({ id: "c1", name: "Foo" })];
    const code = generatePython(classes, []);
    expect(code).toContain("from __future__ import annotations");
  });
});

// -- Sorting order ---------------------------------------------

describe("generatePython sorting", () => {
  it("outputs enums before interfaces before abstract before classes", () => {
    const classes: UMLClass[] = [
      makeClass({ id: "c1", name: "Concrete" }),
      makeClass({ id: "a1", name: "AbstractBase", stereotype: "abstract" }),
      makeClass({
        id: "e1",
        name: "Status",
        stereotype: "enum",
        attributes: [{ id: "test-attr-e-1", name: "ACTIVE", type: "", visibility: "+" }],
      }),
      makeClass({ id: "i1", name: "Readable", stereotype: "interface" }),
    ];

    const code = generatePython(classes, []);
    const enumIdx = code.indexOf("class Status(Enum)");
    const ifaceIdx = code.indexOf("class Readable(ABC)");
    const abstractIdx = code.indexOf("class AbstractBase(ABC)");
    const classIdx = code.indexOf("class Concrete");

    expect(enumIdx).toBeLessThan(ifaceIdx);
    expect(ifaceIdx).toBeLessThan(abstractIdx);
    expect(abstractIdx).toBeLessThan(classIdx);
  });
});
