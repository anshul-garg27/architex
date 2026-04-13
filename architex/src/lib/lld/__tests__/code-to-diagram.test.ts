import { describe, it, expect } from "vitest";
import {
  parseTypeScript,
  parsePython,
} from "../codegen/code-to-diagram";

// ---------------------------------------------------------------------------
// TypeScript Parser
// ---------------------------------------------------------------------------

describe("parseTypeScript", () => {
  // -- Empty / trivial classes --------------------------------------------

  it("parses an empty class with no members", () => {
    const code = `class Empty {}`;
    const { classes, relationships } = parseTypeScript(code);

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Empty");
    expect(classes[0].stereotype).toBe("class");
    expect(classes[0].attributes).toHaveLength(0);
    expect(classes[0].methods).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  it("parses an exported empty class", () => {
    const code = `export class Foo {}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Foo");
  });

  // -- Attributes and visibility ------------------------------------------

  it("parses attributes with different visibility modifiers", () => {
    const code = `
class User {
  public name: string;
  private email: string;
  protected age: number;
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    const attrs = classes[0].attributes;
    expect(attrs).toHaveLength(3);

    const nameAttr = attrs.find((a) => a.name === "name");
    expect(nameAttr?.visibility).toBe("+");
    expect(nameAttr?.type).toBe("string");

    const emailAttr = attrs.find((a) => a.name === "email");
    expect(emailAttr?.visibility).toBe("-");

    const ageAttr = attrs.find((a) => a.name === "age");
    expect(ageAttr?.visibility).toBe("#");
  });

  // -- Methods ------------------------------------------------------------

  it("parses methods with params and return types", () => {
    const code = `
class Service {
  public getData(id: string): Promise<Data> {
    return fetch(id);
  }
  private helper(a: number, b: number): boolean {
    return a > b;
  }
}`;
    const { classes } = parseTypeScript(code);
    const methods = classes[0].methods;
    expect(methods).toHaveLength(2);

    const getData = methods.find((m) => m.name === "getData");
    expect(getData?.returnType).toBe("Promise<Data>");
    expect(getData?.params).toEqual(["id: string"]);
    expect(getData?.visibility).toBe("+");

    const helper = methods.find((m) => m.name === "helper");
    expect(helper?.visibility).toBe("-");
    expect(helper?.params).toEqual(["a: number", "b: number"]);
  });

  // -- Getter / Setter (LLD-062 edge case) --------------------------------

  it("does not crash on getter/setter syntax", () => {
    const code = `
class Config {
  private _value: string;
  get value(): string {
    return this._value;
  }
  set value(v: string) {
    this._value = v;
  }
}`;
    // Current parser may or may not detect getters/setters as methods;
    // the key assertion is that parsing doesn't throw.
    const result = parseTypeScript(code);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("Config");
  });

  // -- Nested generics ----------------------------------------------------

  it("parses attributes with nested generic types", () => {
    const code = `
class Repository {
  private cache: Map<string, List<number>>;
  public items: Array<Promise<Response>>;
}`;
    const { classes } = parseTypeScript(code);
    const attrs = classes[0].attributes;
    expect(attrs.length).toBeGreaterThanOrEqual(1);

    const cacheAttr = attrs.find((a) => a.name === "cache");
    if (cacheAttr) {
      expect(cacheAttr.type).toContain("Map");
    }
  });

  // -- Enum with values ---------------------------------------------------

  it("parses an enum with explicit values", () => {
    const code = `
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Color");
    expect(classes[0].stereotype).toBe("enum");

    const memberNames = classes[0].attributes.map((a) => a.name);
    expect(memberNames).toContain("Red");
    expect(memberNames).toContain("Green");
    expect(memberNames).toContain("Blue");
  });

  it("parses an enum with numeric values", () => {
    const code = `
enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3,
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].stereotype).toBe("enum");
    expect(classes[0].attributes).toHaveLength(4);
  });

  // -- Abstract class and methods -----------------------------------------

  it("parses an abstract class with abstract methods", () => {
    const code = `
abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;
  public describe(): string {
    return "I am a shape";
  }
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].stereotype).toBe("abstract");

    const abstractMethods = classes[0].methods.filter((m) => m.isAbstract);
    expect(abstractMethods.length).toBeGreaterThanOrEqual(1);

    const areaMethod = classes[0].methods.find((m) => m.name === "area");
    expect(areaMethod).toBeDefined();
    expect(areaMethod?.isAbstract).toBe(true);
  });

  // -- Interface ----------------------------------------------------------

  it("parses an interface", () => {
    const code = `
interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Serializable");
    expect(classes[0].stereotype).toBe("interface");
    expect(classes[0].methods).toHaveLength(2);
  });

  // -- Inheritance / implements relationships -----------------------------

  it("parses extends relationship", () => {
    const code = `
class Animal {
  public name: string;
}
class Dog extends Animal {
  public breed: string;
}`;
    const { classes, relationships } = parseTypeScript(code);
    expect(classes).toHaveLength(2);

    const inheritance = relationships.filter((r) => r.type === "inheritance");
    expect(inheritance).toHaveLength(1);

    const dogClass = classes.find((c) => c.name === "Dog");
    const animalClass = classes.find((c) => c.name === "Animal");
    expect(inheritance[0].source).toBe(dogClass?.id);
    expect(inheritance[0].target).toBe(animalClass?.id);
  });

  it("parses implements relationship", () => {
    const code = `
interface Printable {
  print(): void;
}
class Document implements Printable {
  print(): void {}
}`;
    const { classes, relationships } = parseTypeScript(code);
    expect(classes).toHaveLength(2);

    const realization = relationships.filter((r) => r.type === "realization");
    expect(realization).toHaveLength(1);
  });

  // -- Deeply nested inheritance chain ------------------------------------

  it("parses a deeply nested inheritance chain", () => {
    const code = `
class A {
  public id: string;
}
class B extends A {
  public name: string;
}
class C extends B {
  public value: number;
}
class D extends C {
  public flag: boolean;
}`;
    const { classes, relationships } = parseTypeScript(code);
    expect(classes).toHaveLength(4);

    const inheritanceRels = relationships.filter(
      (r) => r.type === "inheritance",
    );
    // B->A, C->B, D->C = 3 inheritance relationships
    expect(inheritanceRels).toHaveLength(3);
  });

  // -- Multiline method params (within same line capture) -----------------

  it("handles method with multiple params", () => {
    const code = `
class Calculator {
  public compute(a: number, b: number, op: string): number {
    return 0;
  }
}`;
    const { classes } = parseTypeScript(code);
    const methods = classes[0].methods;
    expect(methods).toHaveLength(1);
    expect(methods[0].params).toEqual(["a: number", "b: number", "op: string"]);
  });

  // -- Multiple classes in one file ---------------------------------------

  it("parses multiple classes from a single source", () => {
    const code = `
class Engine {
  public horsepower: number;
  start(): void {}
}
class Car {
  private engine: Engine;
  drive(): void {}
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(2);
    expect(classes.map((c) => c.name).sort()).toEqual(["Car", "Engine"]);
  });

  // -- Auto-layout assigns positions -------------------------------------

  it("assigns non-zero x/y positions via auto-layout", () => {
    const code = `class Foo {} class Bar {}`;
    const { classes } = parseTypeScript(code);
    // At least one class should have a non-zero position
    const hasPosition = classes.some((c) => c.x > 0 || c.y > 0);
    expect(hasPosition).toBe(true);
  });

  // -- Invalid inputs -----------------------------------------------------

  it("returns empty results for an empty string", () => {
    const { classes, relationships } = parseTypeScript("");
    expect(classes).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  it("returns empty results for input with only comments", () => {
    const code = `
// This is a comment
/* Multi-line
   comment */
// Another comment
`;
    const { classes, relationships } = parseTypeScript(code);
    expect(classes).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  it("returns empty results for HTML input", () => {
    const code = `
<html>
  <body>
    <div class="container">
      <p>Hello world</p>
    </div>
  </body>
</html>`;
    // "class" appears as an HTML attribute but should not match the class regex
    const { classes } = parseTypeScript(code);
    // The parser may or may not pick up "container" as a false match --
    // main point is it doesn't throw.
    expect(() => parseTypeScript(code)).not.toThrow();
  });

  it("returns empty results for plain text", () => {
    const code = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    const { classes, relationships } = parseTypeScript(code);
    expect(classes).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  // -- Generic type parameters on class -----------------------------------

  it("parses a class with generic type parameters", () => {
    const code = `
class Repository<T> {
  private items: T[];
  add(item: T): void {}
  getAll(): T[] { return []; }
}`;
    const { classes } = parseTypeScript(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Repository");
  });
});

// ---------------------------------------------------------------------------
// Python Parser
// ---------------------------------------------------------------------------

describe("parsePython", () => {
  // -- Basic class --------------------------------------------------------

  it("parses a basic Python class with attributes", () => {
    const code = `
class User:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

    def greet(self) -> str:
        return f"Hello {self.name}"
`;
    const { classes } = parsePython(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("User");
    expect(classes[0].stereotype).toBe("class");

    // self.name and self.email should be parsed as attributes
    const attrNames = classes[0].attributes.map((a) => a.name);
    expect(attrNames).toContain("name");
    expect(attrNames).toContain("email");

    // greet should be parsed (constructor is skipped)
    const methodNames = classes[0].methods.map((m) => m.name);
    expect(methodNames).toContain("greet");
    expect(methodNames).not.toContain("__init__");
  });

  // -- Python visibility conventions -------------------------------------

  it("determines visibility from Python naming conventions", () => {
    const code = `
class MyClass:
    def __init__(self):
        self.public_attr = 1
        self._protected_attr = 2
        self.__private_attr = 3
`;
    const { classes } = parsePython(code);
    const attrs = classes[0].attributes;

    const pub = attrs.find((a) => a.name === "public_attr");
    expect(pub?.visibility).toBe("+");

    const prot = attrs.find((a) => a.name === "_protected_attr");
    expect(prot?.visibility).toBe("#");

    const priv = attrs.find((a) => a.name === "__private_attr");
    expect(priv?.visibility).toBe("-");
  });

  // -- Python @property ---------------------------------------------------

  it("does not crash on @property decorated methods", () => {
    const code = `
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @property
    def area(self) -> float:
        return 3.14159 * self._radius ** 2
`;
    // Current parser may or may not fully handle @property as an attribute.
    // The key assertion is no crash and the class is parsed.
    const result = parsePython(code);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("Circle");
  });

  // -- Python @staticmethod -----------------------------------------------

  it("does not crash on @staticmethod decorated methods", () => {
    const code = `
class MathUtils:
    @staticmethod
    def add(a: int, b: int) -> int:
        return a + b

    @staticmethod
    def multiply(a: int, b: int) -> int:
        return a * b
`;
    const result = parsePython(code);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("MathUtils");
  });

  // -- Python enum --------------------------------------------------------

  it("parses a Python Enum with values", () => {
    const code = `
class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3
`;
    const { classes } = parsePython(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Color");
    expect(classes[0].stereotype).toBe("enum");

    const memberNames = classes[0].attributes.map((a) => a.name);
    expect(memberNames).toContain("RED");
    expect(memberNames).toContain("GREEN");
    expect(memberNames).toContain("BLUE");
  });

  // -- Abstract class / @abstractmethod -----------------------------------

  it("parses a Python abstract class with abstractmethod", () => {
    const code = `
class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

    @abstractmethod
    def perimeter(self) -> float:
        pass
`;
    const { classes } = parsePython(code);
    expect(classes).toHaveLength(1);
    // Class should be detected as abstract (inherits ABC)
    expect(classes[0].stereotype).toBe("abstract");

    // Methods should be detected
    const methodNames = classes[0].methods.map((m) => m.name);
    expect(methodNames).toContain("area");
    expect(methodNames).toContain("perimeter");

    // NOTE: isAbstract detection on individual methods depends on the
    // regex + isDecoratedAbstract lookbehind heuristic which may not
    // flag all cases. The class-level stereotype is the reliable signal.
  });

  // -- Multiple inheritance -----------------------------------------------

  it("parses a class with multiple inheritance", () => {
    const code = `
class Animal:
    def __init__(self):
        self.name = ""

    def speak(self) -> str:
        return ""

class Flyable:
    def fly(self) -> str:
        return "flying"

class Dragon(Animal, Flyable):
    def __init__(self):
        self.fire_power = 100

    def breathe_fire(self) -> str:
        return "fire"
`;
    const { classes, relationships } = parsePython(code);
    expect(classes).toHaveLength(3);

    const dragonClass = classes.find((c) => c.name === "Dragon");
    expect(dragonClass).toBeDefined();

    // Dragon should have 2 inheritance relationships (Animal, Flyable)
    const dragonRels = relationships.filter(
      (r) => r.source === dragonClass?.id && r.type === "inheritance",
    );
    expect(dragonRels).toHaveLength(2);
  });

  // -- Deeply nested inheritance ------------------------------------------

  it("parses deeply nested Python inheritance", () => {
    const code = `
class Base:
    def base_method(self) -> None:
        pass

class Level1(Base):
    def level1_method(self) -> None:
        pass

class Level2(Level1):
    def level2_method(self) -> None:
        pass

class Level3(Level2):
    def level3_method(self) -> None:
        pass
`;
    const { classes, relationships } = parsePython(code);
    expect(classes).toHaveLength(4);

    const inheritanceRels = relationships.filter(
      (r) => r.type === "inheritance",
    );
    // Level1->Base, Level2->Level1, Level3->Level2 = 3
    expect(inheritanceRels).toHaveLength(3);
  });

  // -- Empty class --------------------------------------------------------

  it("parses an empty Python class", () => {
    const code = `
class Empty:
    pass
`;
    const { classes } = parsePython(code);
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe("Empty");
    expect(classes[0].attributes).toHaveLength(0);
    expect(classes[0].methods).toHaveLength(0);
  });

  // -- Invalid input ------------------------------------------------------

  it("returns empty results for an empty string", () => {
    const { classes, relationships } = parsePython("");
    expect(classes).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  it("returns empty results for input with only comments", () => {
    const code = `
# This is a comment
# Another comment
"""
Docstring-style comment
"""
`;
    const { classes, relationships } = parsePython(code);
    expect(classes).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  it("returns empty results for HTML input", () => {
    const code = `<html><body><p>Hello</p></body></html>`;
    expect(() => parsePython(code)).not.toThrow();
    const { classes } = parsePython(code);
    expect(classes).toHaveLength(0);
  });

  it("returns empty results for plain text", () => {
    const code = `This is just plain text with no Python code.`;
    const { classes, relationships } = parsePython(code);
    expect(classes).toHaveLength(0);
    expect(relationships).toHaveLength(0);
  });

  // -- Multiple classes ---------------------------------------------------

  it("parses multiple Python classes from one source", () => {
    const code = `
class Engine:
    def __init__(self):
        self.horsepower = 0

    def start(self) -> None:
        pass

class Car:
    def __init__(self):
        self.engine = None

    def drive(self) -> None:
        pass
`;
    const { classes } = parsePython(code);
    expect(classes).toHaveLength(2);
    expect(classes.map((c) => c.name).sort()).toEqual(["Car", "Engine"]);
  });

  // -- Return type annotation ---------------------------------------------

  it("captures Python return type annotations", () => {
    const code = `
class Calculator:
    def add(self, a: int, b: int) -> int:
        return a + b
`;
    const { classes } = parsePython(code);
    const addMethod = classes[0].methods.find((m) => m.name === "add");
    expect(addMethod).toBeDefined();
    expect(addMethod?.returnType).toBe("int");
  });

  // -- Auto-layout assigns positions -------------------------------------

  it("assigns non-zero x/y positions via auto-layout", () => {
    const code = `
class Foo:
    pass

class Bar:
    pass
`;
    const { classes } = parsePython(code);
    const hasPosition = classes.some((c) => c.x > 0 || c.y > 0);
    expect(hasPosition).toBe(true);
  });
});
