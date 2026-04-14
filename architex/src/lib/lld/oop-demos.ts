// -----------------------------------------------------------------
// Architex -- OOP Fundamentals Demos (LLD-100)
// -----------------------------------------------------------------
//
// Two interactive before/after demos that show core OOP principles
// beyond SOLID. Each demo includes UML class diagrams for both
// states, code samples in TypeScript and Python, plus a textual
// explanation and real-world analogy.
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "./types";
import type { CodeSample } from "./solid-demos";

// ── Types ────────────────────────────────────────────────────

export type OOPPrinciple = "composition-vs-inheritance" | "polymorphism" | "encapsulation" | "abstraction";

export interface OOPDemo {
  id: string;
  principle: OOPPrinciple;
  name: string;
  description: string;
  summary: string[];
  beforeClasses: UMLClass[];
  beforeRelationships: UMLRelationship[];
  afterClasses: UMLClass[];
  afterRelationships: UMLRelationship[];
  beforeCode: CodeSample;
  afterCode: CodeSample;
  explanation: string;
  realWorldExample: string;
}

// ── Helper ───────────────────────────────────────────────────

let _rid = 0;
function rid(): string {
  return `oop-rel-${++_rid}`;
}

// ═════════════════════════════════════════════════════════════
//  1. Composition vs Inheritance
// ═════════════════════════════════════════════════════════════

const compositionVsInheritance: OOPDemo = {
  id: "oop-composition-vs-inheritance",
  principle: "composition-vs-inheritance",
  name: "Composition vs Inheritance",
  description:
    "A Swiss Army knife tries to be everything at once through inheritance — " +
    "knife, screwdriver, can opener, scissors — and becomes rigid and hard to change. " +
    "A modular tool system lets you snap on exactly the attachments you need. " +
    "That's composition over inheritance: build flexible behavior by combining " +
    "small, focused objects rather than extending a deep class hierarchy.",
  summary: [
    "Favor composition over inheritance — the most important OOP principle",
    "Key insight: deep hierarchies are rigid; composition lets you mix and match behaviors",
    "Use when: you need to combine behaviors in ways inheritance can't express cleanly",
  ],

  // -- BEFORE: deep inheritance hierarchy ----------------------
  beforeClasses: [
    {
      id: "cvi-b-animal",
      name: "Animal",
      stereotype: "class",
      attributes: [
        { id: "cvi-b-animal-attr-0", name: "name", type: "string", visibility: "#" },
      ],
      methods: [
        { id: "cvi-b-animal-meth-0", name: "eat", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-b-animal-meth-1", name: "sleep", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 30,
    },
    {
      id: "cvi-b-pet",
      name: "Pet",
      stereotype: "class",
      attributes: [
        { id: "cvi-b-pet-attr-0", name: "owner", type: "string", visibility: "#" },
      ],
      methods: [
        { id: "cvi-b-pet-meth-0", name: "play", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 180,
    },
    {
      id: "cvi-b-dog",
      name: "Dog",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "cvi-b-dog-meth-0", name: "bark", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-b-dog-meth-1", name: "fetch", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 330,
    },
    {
      id: "cvi-b-guidedog",
      name: "GuideDog",
      stereotype: "class",
      attributes: [
        { id: "cvi-b-guidedog-attr-0", name: "handler", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "cvi-b-guidedog-meth-0", name: "guide", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-b-guidedog-meth-1", name: "navigate", returnType: "void", params: ["destination: string"], visibility: "+" },
      ],
      x: 300,
      y: 480,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "cvi-b-pet", target: "cvi-b-animal", type: "inheritance" },
    { id: rid(), source: "cvi-b-dog", target: "cvi-b-pet", type: "inheritance" },
    { id: rid(), source: "cvi-b-guidedog", target: "cvi-b-dog", type: "inheritance" },
  ],

  beforeCode: {
    typescript: `class Animal {
  constructor(protected name: string) {}
  eat() { console.log(\`\${this.name} eats\`); }
  sleep() { console.log(\`\${this.name} sleeps\`); }
}

class Pet extends Animal {
  constructor(name: string, protected owner: string) { super(name); }
  play() { console.log(\`\${this.name} plays with \${this.owner}\`); }
}

class Dog extends Pet {
  bark() { console.log("Woof!"); }
  fetch() { console.log(\`\${this.name} fetches the ball\`); }
}

class GuideDog extends Dog {
  constructor(name: string, owner: string, private handler: string) {
    super(name, owner);
  }
  guide() { console.log(\`\${this.name} guides \${this.handler}\`); }
  navigate(dest: string) { console.log(\`Navigating to \${dest}\`); }
}

// Problem: What if we need a GuideCat? A TherapyDog that's not a Pet?
// The hierarchy is rigid — can't mix and match behaviors.`,
    python: `class Animal:
    def __init__(self, name: str):
        self.name = name
    def eat(self): print(f"{self.name} eats")
    def sleep(self): print(f"{self.name} sleeps")

class Pet(Animal):
    def __init__(self, name: str, owner: str):
        super().__init__(name)
        self.owner = owner
    def play(self): print(f"{self.name} plays with {self.owner}")

class Dog(Pet):
    def bark(self): print("Woof!")
    def fetch(self): print(f"{self.name} fetches the ball")

class GuideDog(Dog):
    def __init__(self, name: str, owner: str, handler: str):
        super().__init__(name, owner)
        self.handler = handler
    def guide(self): print(f"{self.name} guides {self.handler}")
    def navigate(self, dest: str): print(f"Navigating to {dest}")

# Problem: What if we need a GuideCat? A TherapyDog that's not a Pet?
# The hierarchy is rigid — can't mix and match behaviors.`,
  },

  // -- AFTER: composition approach ------------------------------
  afterClasses: [
    {
      id: "cvi-a-walkable",
      name: "WalkBehavior",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cvi-a-walkable-meth-0", name: "walk", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 30,
    },
    {
      id: "cvi-a-guidable",
      name: "GuideBehavior",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cvi-a-guidable-meth-0", name: "guide", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-a-guidable-meth-1", name: "navigate", returnType: "void", params: ["destination: string"], visibility: "+" },
      ],
      x: 300,
      y: 30,
    },
    {
      id: "cvi-a-playable",
      name: "PlayBehavior",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cvi-a-playable-meth-0", name: "play", returnType: "void", params: [], visibility: "+" },
      ],
      x: 550,
      y: 30,
    },
    {
      id: "cvi-a-dog",
      name: "Dog",
      stereotype: "class",
      attributes: [
        { id: "cvi-a-dog-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cvi-a-dog-attr-1", name: "walkBehavior", type: "WalkBehavior", visibility: "-" },
        { id: "cvi-a-dog-attr-2", name: "guideBehavior", type: "GuideBehavior | null", visibility: "-" },
        { id: "cvi-a-dog-attr-3", name: "playBehavior", type: "PlayBehavior | null", visibility: "-" },
      ],
      methods: [
        { id: "cvi-a-dog-meth-0", name: "bark", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-a-dog-meth-1", name: "performWalk", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-a-dog-meth-2", name: "performGuide", returnType: "void", params: [], visibility: "+" },
      ],
      x: 200,
      y: 250,
    },
    {
      id: "cvi-a-cat",
      name: "Cat",
      stereotype: "class",
      attributes: [
        { id: "cvi-a-cat-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cvi-a-cat-attr-1", name: "walkBehavior", type: "WalkBehavior", visibility: "-" },
        { id: "cvi-a-cat-attr-2", name: "guideBehavior", type: "GuideBehavior | null", visibility: "-" },
      ],
      methods: [
        { id: "cvi-a-cat-meth-0", name: "purr", returnType: "void", params: [], visibility: "+" },
        { id: "cvi-a-cat-meth-1", name: "performWalk", returnType: "void", params: [], visibility: "+" },
      ],
      x: 450,
      y: 250,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "cvi-a-dog", target: "cvi-a-walkable", type: "association", label: "has-a" },
    { id: rid(), source: "cvi-a-dog", target: "cvi-a-guidable", type: "association", label: "has-a" },
    { id: rid(), source: "cvi-a-dog", target: "cvi-a-playable", type: "association", label: "has-a" },
    { id: rid(), source: "cvi-a-cat", target: "cvi-a-walkable", type: "association", label: "has-a" },
    { id: rid(), source: "cvi-a-cat", target: "cvi-a-guidable", type: "association", label: "has-a" },
  ],

  afterCode: {
    typescript: `interface WalkBehavior {
  walk(): void;
}
interface GuideBehavior {
  guide(): void;
  navigate(destination: string): void;
}
interface PlayBehavior {
  play(): void;
}

class LeashWalk implements WalkBehavior {
  walk() { console.log("Walking on a leash"); }
}
class HarnessGuide implements GuideBehavior {
  guide() { console.log("Guiding with harness"); }
  navigate(dest: string) { console.log(\`Navigating to \${dest}\`); }
}
class FetchPlay implements PlayBehavior {
  play() { console.log("Playing fetch!"); }
}

class Dog {
  constructor(
    private name: string,
    private walkBehavior: WalkBehavior,
    private guideBehavior: GuideBehavior | null = null,
    private playBehavior: PlayBehavior | null = null,
  ) {}

  bark() { console.log("Woof!"); }
  performWalk() { this.walkBehavior.walk(); }
  performGuide() { this.guideBehavior?.guide(); }
}

// Guide dog = Dog with GuideBehavior composed in
const guideDog = new Dog("Rex", new LeashWalk(), new HarnessGuide());
// Playful pet = Dog with PlayBehavior composed in
const petDog = new Dog("Buddy", new LeashWalk(), null, new FetchPlay());
// GuideCat? Just compose the same behaviors into Cat!`,
    python: `from abc import ABC, abstractmethod

class WalkBehavior(ABC):
    @abstractmethod
    def walk(self) -> None: ...

class GuideBehavior(ABC):
    @abstractmethod
    def guide(self) -> None: ...
    @abstractmethod
    def navigate(self, destination: str) -> None: ...

class PlayBehavior(ABC):
    @abstractmethod
    def play(self) -> None: ...

class LeashWalk(WalkBehavior):
    def walk(self): print("Walking on a leash")

class HarnessGuide(GuideBehavior):
    def guide(self): print("Guiding with harness")
    def navigate(self, dest: str): print(f"Navigating to {dest}")

class FetchPlay(PlayBehavior):
    def play(self): print("Playing fetch!")

class Dog:
    def __init__(
        self, name: str,
        walk_behavior: WalkBehavior,
        guide_behavior: GuideBehavior | None = None,
        play_behavior: PlayBehavior | None = None,
    ):
        self.name = name
        self._walk = walk_behavior
        self._guide = guide_behavior
        self._play = play_behavior

    def bark(self): print("Woof!")
    def perform_walk(self): self._walk.walk()
    def perform_guide(self):
        if self._guide: self._guide.guide()

# Guide dog = Dog with GuideBehavior composed in
guide_dog = Dog("Rex", LeashWalk(), HarnessGuide())
# Playful pet = Dog with PlayBehavior composed in
pet_dog = Dog("Buddy", LeashWalk(), play_behavior=FetchPlay())
# GuideCat? Just compose the same behaviors into Cat!`,
  },

  explanation:
    "The deep inheritance hierarchy Animal -> Pet -> Dog -> GuideDog creates a rigid tree where " +
    "behaviors are locked to specific levels. Need a GuideCat? You'd have to duplicate the guide " +
    "logic or create a fragile diamond inheritance. Composition solves this by extracting behaviors " +
    "(WalkBehavior, GuideBehavior, PlayBehavior) into separate objects that can be composed into any " +
    "animal. A Dog that guides is just a Dog with a GuideBehavior. A Cat that guides is just a Cat " +
    "with a GuideBehavior. No hierarchy gymnastics required.",
  realWorldExample:
    "A Swiss Army knife tries to inherit every tool into one rigid object — you can't swap the " +
    "blade or upgrade just the scissors. A modular power tool system lets you snap on a drill bit, " +
    "sander, or saw attachment to the same base. That's composition: the base 'has-a' attachment " +
    "rather than 'is-a' specific tool. You get flexibility without a tangled inheritance hierarchy.",
};

// ═════════════════════════════════════════════════════════════
//  2. Polymorphism
// ═════════════════════════════════════════════════════════════

const polymorphism: OOPDemo = {
  id: "oop-polymorphism",
  principle: "polymorphism",
  name: "Polymorphism",
  description:
    "A universal remote control doesn't care whether it's talking to a TV, a sound bar, " +
    "or a streaming box — it calls 'power on' and each device responds differently. " +
    "That's polymorphism: same method name, different behavior based on the actual type. " +
    "Replace type-checking switch statements with method overriding.",
  summary: [
    "Polymorphism = same method name, different behavior based on the actual type",
    "Key insight: eliminate instanceof/typeof checks with method overriding",
    "Use when: you have switch statements that branch on object type to decide behavior",
  ],

  // -- BEFORE: type-checking with instanceof/switch ------------
  beforeClasses: [
    {
      id: "poly-b-calculator",
      name: "AreaCalculator",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "poly-b-calculator-meth-0", name: "calculateArea", returnType: "number", params: ["shape: object"], visibility: "+" },
      ],
      x: 200,
      y: 30,
    },
    {
      id: "poly-b-circle",
      name: "CircleData",
      stereotype: "class",
      attributes: [
        { id: "poly-b-circle-attr-0", name: "type", type: '"circle"', visibility: "+" },
        { id: "poly-b-circle-attr-1", name: "radius", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 50,
      y: 230,
    },
    {
      id: "poly-b-rect",
      name: "RectangleData",
      stereotype: "class",
      attributes: [
        { id: "poly-b-rect-attr-0", name: "type", type: '"rectangle"', visibility: "+" },
        { id: "poly-b-rect-attr-1", name: "width", type: "number", visibility: "+" },
        { id: "poly-b-rect-attr-2", name: "height", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 250,
      y: 230,
    },
    {
      id: "poly-b-triangle",
      name: "TriangleData",
      stereotype: "class",
      attributes: [
        { id: "poly-b-triangle-attr-0", name: "type", type: '"triangle"', visibility: "+" },
        { id: "poly-b-triangle-attr-1", name: "base", type: "number", visibility: "+" },
        { id: "poly-b-triangle-attr-2", name: "height", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 470,
      y: 230,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "poly-b-calculator", target: "poly-b-circle", type: "dependency", label: "checks type" },
    { id: rid(), source: "poly-b-calculator", target: "poly-b-rect", type: "dependency", label: "checks type" },
    { id: rid(), source: "poly-b-calculator", target: "poly-b-triangle", type: "dependency", label: "checks type" },
  ],

  beforeCode: {
    typescript: `type ShapeData =
  | { type: "circle"; radius: number }
  | { type: "rectangle"; width: number; height: number }
  | { type: "triangle"; base: number; height: number };

class AreaCalculator {
  calculateArea(shape: ShapeData): number {
    switch (shape.type) {
      case "circle":
        return Math.PI * shape.radius ** 2;
      case "rectangle":
        return shape.width * shape.height;
      case "triangle":
        return 0.5 * shape.base * shape.height;
      default:
        throw new Error(\`Unknown shape: \${(shape as any).type}\`);
    }
    // Adding a pentagon? Edit this switch AND every other
    // method that branches on shape type (perimeter, draw, ...)
  }
}`,
    python: `from dataclasses import dataclass

@dataclass
class CircleData:
    type: str = "circle"
    radius: float = 0

@dataclass
class RectangleData:
    type: str = "rectangle"
    width: float = 0
    height: float = 0

@dataclass
class TriangleData:
    type: str = "triangle"
    base: float = 0
    height: float = 0

class AreaCalculator:
    def calculate_area(self, shape) -> float:
        if shape.type == "circle":
            return 3.14159 * shape.radius ** 2
        elif shape.type == "rectangle":
            return shape.width * shape.height
        elif shape.type == "triangle":
            return 0.5 * shape.base * shape.height
        else:
            raise ValueError(f"Unknown shape: {shape.type}")
        # Adding a pentagon? Edit this AND every other
        # method that branches on shape type (perimeter, draw, ...)`,
  },

  // -- AFTER: method overriding with a common interface ---------
  afterClasses: [
    {
      id: "poly-a-shape",
      name: "Shape",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "poly-a-shape-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-shape-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-shape-meth-2", name: "describe", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 30,
    },
    {
      id: "poly-a-circle",
      name: "Circle",
      stereotype: "class",
      attributes: [
        { id: "poly-a-circle-attr-0", name: "radius", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "poly-a-circle-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-circle-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-circle-meth-2", name: "describe", returnType: "string", params: [], visibility: "+" },
      ],
      x: 50,
      y: 250,
    },
    {
      id: "poly-a-rect",
      name: "Rectangle",
      stereotype: "class",
      attributes: [
        { id: "poly-a-rect-attr-0", name: "width", type: "number", visibility: "-" },
        { id: "poly-a-rect-attr-1", name: "height", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "poly-a-rect-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-rect-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-rect-meth-2", name: "describe", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 250,
    },
    {
      id: "poly-a-triangle",
      name: "Triangle",
      stereotype: "class",
      attributes: [
        { id: "poly-a-triangle-attr-0", name: "base", type: "number", visibility: "-" },
        { id: "poly-a-triangle-attr-1", name: "height", type: "number", visibility: "-" },
        { id: "poly-a-triangle-attr-2", name: "sideA", type: "number", visibility: "-" },
        { id: "poly-a-triangle-attr-3", name: "sideB", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "poly-a-triangle-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-triangle-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
        { id: "poly-a-triangle-meth-2", name: "describe", returnType: "string", params: [], visibility: "+" },
      ],
      x: 550,
      y: 250,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "poly-a-circle", target: "poly-a-shape", type: "realization" },
    { id: rid(), source: "poly-a-rect", target: "poly-a-shape", type: "realization" },
    { id: rid(), source: "poly-a-triangle", target: "poly-a-shape", type: "realization" },
  ],

  afterCode: {
    typescript: `interface Shape {
  area(): number;
  perimeter(): number;
  describe(): string;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area(): number { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
  describe(): string { return \`Circle(r=\${this.radius})\`; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area(): number { return this.width * this.height; }
  perimeter(): number { return 2 * (this.width + this.height); }
  describe(): string { return \`Rectangle(\${this.width}x\${this.height})\`; }
}

class Triangle implements Shape {
  constructor(
    private base: number, private height: number,
    private sideA: number, private sideB: number,
  ) {}
  area(): number { return 0.5 * this.base * this.height; }
  perimeter(): number { return this.base + this.sideA + this.sideB; }
  describe(): string { return \`Triangle(b=\${this.base}, h=\${this.height})\`; }
}

// No switch, no instanceof — just call the method
function printShapeInfo(shape: Shape) {
  console.log(\`\${shape.describe()}: area=\${shape.area()}\`);
}

// Adding a Pentagon? Just implement Shape. Zero edits elsewhere.
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6), new Triangle(3, 4, 5, 5)];
shapes.forEach(printShapeInfo);`,
    python: `from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...
    @abstractmethod
    def perimeter(self) -> float: ...
    @abstractmethod
    def describe(self) -> str: ...

class Circle(Shape):
    def __init__(self, radius: float):
        self._radius = radius
    def area(self) -> float: return math.pi * self._radius ** 2
    def perimeter(self) -> float: return 2 * math.pi * self._radius
    def describe(self) -> str: return f"Circle(r={self._radius})"

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self._width, self._height = width, height
    def area(self) -> float: return self._width * self._height
    def perimeter(self) -> float: return 2 * (self._width + self._height)
    def describe(self) -> str: return f"Rectangle({self._width}x{self._height})"

class Triangle(Shape):
    def __init__(self, base: float, height: float, side_a: float, side_b: float):
        self._base, self._height = base, height
        self._side_a, self._side_b = side_a, side_b
    def area(self) -> float: return 0.5 * self._base * self._height
    def perimeter(self) -> float: return self._base + self._side_a + self._side_b
    def describe(self) -> str: return f"Triangle(b={self._base}, h={self._height})"

# No if/elif, no isinstance — just call the method
def print_shape_info(shape: Shape):
    print(f"{shape.describe()}: area={shape.area()}")

# Adding a Pentagon? Just implement Shape. Zero edits elsewhere.
shapes: list[Shape] = [Circle(5), Rectangle(4, 6), Triangle(3, 4, 5, 5)]
for s in shapes:
    print_shape_info(s)`,
  },

  explanation:
    "The original AreaCalculator uses a switch statement on shape.type to decide how to calculate " +
    "area. Every new shape requires editing the switch — and every other method that branches on " +
    "shape type (perimeter, draw, serialize). With polymorphism, each Shape implementation owns " +
    "its own area() and perimeter() logic. The caller just invokes shape.area() and the correct " +
    "implementation runs automatically based on the actual object type. Adding a Pentagon means " +
    "creating one new class — zero edits to existing code.",
  realWorldExample:
    "A universal remote control sends 'power on' to any device — the TV turns on its screen, " +
    "the sound bar powers up its speakers, the streaming box boots its OS. The remote doesn't " +
    "check 'if TV then... else if soundbar then...' — each device knows how to handle 'power on' " +
    "its own way. That's polymorphism: same interface, different behavior based on the receiver.",
};

// ═════════════════════════════════════════════════════════════
//  3. Encapsulation
// ═════════════════════════════════════════════════════════════

const encapsulation: OOPDemo = {
  id: "oop-encapsulation",
  principle: "encapsulation",
  name: "Encapsulation",
  description:
    "A vending machine doesn't let you reach in and grab items or change the price — " +
    "you insert money, press a button, and it handles the rest internally. " +
    "That's encapsulation: hiding internal data behind controlled access points so " +
    "outsiders can't put the object into an invalid state.",
  summary: [
    "Encapsulation = hide internal data, expose controlled operations",
    "Key insight: public fields let callers bypass validation and break invariants",
    "Use when: data has rules (balance >= 0, email must be valid, state transitions must be legal)",
  ],

  // -- BEFORE: public fields, no validation ----------------------
  beforeClasses: [
    {
      id: "enc-b-account",
      name: "BankAccount",
      stereotype: "class",
      attributes: [
        { id: "enc-b-account-attr-0", name: "owner", type: "string", visibility: "+" },
        { id: "enc-b-account-attr-1", name: "balance", type: "number", visibility: "+" },
        { id: "enc-b-account-attr-2", name: "isLocked", type: "boolean", visibility: "+" },
      ],
      methods: [],
      x: 250,
      y: 80,
    },
    {
      id: "enc-b-client",
      name: "Client",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "enc-b-client-meth-0", name: "doSomething", returnType: "void", params: ["account: BankAccount"], visibility: "+" },
      ],
      x: 250,
      y: 280,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "enc-b-client", target: "enc-b-account", type: "dependency", label: "directly mutates" },
  ],

  beforeCode: {
    typescript: `class BankAccount {
  owner: string;
  balance: number;
  isLocked: boolean;

  constructor(owner: string, balance: number) {
    this.owner = owner;
    this.balance = balance;
    this.isLocked = false;
  }
}

const account = new BankAccount("Alice", 1000);

// Anyone can directly mutate — no validation!
account.balance = -500;          // Negative balance? Sure!
account.isLocked = false;        // Unlock it yourself? No problem!
account.owner = "";              // Empty owner? Why not!

// The object is in a completely invalid state
// and nobody can prevent it.`,
    python: `class BankAccount:
    def __init__(self, owner: str, balance: float):
        self.owner = owner
        self.balance = balance
        self.is_locked = False

account = BankAccount("Alice", 1000)

# Anyone can directly mutate — no validation!
account.balance = -500          # Negative balance? Sure!
account.is_locked = False       # Unlock it yourself? No problem!
account.owner = ""              # Empty owner? Why not!

# The object is in a completely invalid state
# and nobody can prevent it.`,
  },

  // -- AFTER: private fields with getters/setters, validation ----
  afterClasses: [
    {
      id: "enc-a-account",
      name: "BankAccount",
      stereotype: "class",
      attributes: [
        { id: "enc-a-account-attr-0", name: "owner", type: "string", visibility: "-" },
        { id: "enc-a-account-attr-1", name: "balance", type: "number", visibility: "-" },
        { id: "enc-a-account-attr-2", name: "isLocked", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "enc-a-account-meth-0", name: "getBalance", returnType: "number", params: [], visibility: "+" },
        { id: "enc-a-account-meth-1", name: "getOwner", returnType: "string", params: [], visibility: "+" },
        { id: "enc-a-account-meth-2", name: "deposit", returnType: "void", params: ["amount: number"], visibility: "+" },
        { id: "enc-a-account-meth-3", name: "withdraw", returnType: "void", params: ["amount: number"], visibility: "+" },
        { id: "enc-a-account-meth-4", name: "lock", returnType: "void", params: [], visibility: "+" },
      ],
      x: 250,
      y: 80,
    },
    {
      id: "enc-a-client",
      name: "Client",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "enc-a-client-meth-0", name: "doSomething", returnType: "void", params: ["account: BankAccount"], visibility: "+" },
      ],
      x: 250,
      y: 350,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "enc-a-client", target: "enc-a-account", type: "dependency", label: "uses public API" },
  ],

  afterCode: {
    typescript: `class BankAccount {
  private owner: string;
  private balance: number;
  private isLocked: boolean;

  constructor(owner: string, initialBalance: number) {
    if (!owner.trim()) throw new Error("Owner name required");
    if (initialBalance < 0) throw new Error("Initial balance cannot be negative");
    this.owner = owner;
    this.balance = initialBalance;
    this.isLocked = false;
  }

  getBalance(): number { return this.balance; }
  getOwner(): string { return this.owner; }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Deposit must be positive");
    if (this.isLocked) throw new Error("Account is locked");
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) throw new Error("Withdrawal must be positive");
    if (this.isLocked) throw new Error("Account is locked");
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }

  lock(): void { this.isLocked = true; }
}

const account = new BankAccount("Alice", 1000);
account.deposit(500);      // OK: balance is now 1500
account.withdraw(200);     // OK: balance is now 1300
// account.balance = -500; // Compile error: 'balance' is private
// account.withdraw(9999); // Runtime error: Insufficient funds`,
    python: `class BankAccount:
    def __init__(self, owner: str, initial_balance: float):
        if not owner.strip():
            raise ValueError("Owner name required")
        if initial_balance < 0:
            raise ValueError("Initial balance cannot be negative")
        self._owner = owner
        self._balance = initial_balance
        self._is_locked = False

    @property
    def balance(self) -> float:
        return self._balance

    @property
    def owner(self) -> str:
        return self._owner

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Deposit must be positive")
        if self._is_locked:
            raise RuntimeError("Account is locked")
        self._balance += amount

    def withdraw(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Withdrawal must be positive")
        if self._is_locked:
            raise RuntimeError("Account is locked")
        if amount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= amount

    def lock(self) -> None:
        self._is_locked = True

account = BankAccount("Alice", 1000)
account.deposit(500)      # OK: balance is now 1500
account.withdraw(200)     # OK: balance is now 1300
# account._balance = -500 # Convention violation: underscore = private
# account.withdraw(9999)  # Runtime error: Insufficient funds`,
  },

  explanation:
    "The original BankAccount exposes all fields as public, so any code can set balance to " +
    "-500 or clear the owner name. The invariant 'balance must never be negative' is impossible " +
    "to enforce. The encapsulated version makes fields private and exposes controlled methods — " +
    "deposit() validates amounts are positive, withdraw() checks for sufficient funds and locked " +
    "state. The object itself guarantees its own consistency. No external code can put it into an " +
    "invalid state because the only way to change state is through the validated public API.",
  realWorldExample:
    "A vending machine doesn't let you reach in and grab items or change the price display. " +
    "You interact through a controlled interface: insert coins, press a button, receive your item. " +
    "The machine internally validates that you've paid enough, tracks inventory, and makes change. " +
    "That's encapsulation: the internal state (inventory, cash register) is hidden, and all " +
    "interactions go through validated operations that maintain the machine's invariants.",
};

// ═════════════════════════════════════════════════════════════
//  4. Abstraction
// ═════════════════════════════════════════════════════════════

const abstraction: OOPDemo = {
  id: "oop-abstraction",
  principle: "abstraction",
  name: "Abstraction",
  description:
    "You don't need to understand how an engine works to drive a car — you just use " +
    "the steering wheel, pedals, and gear shift. That's abstraction: hiding complex " +
    "implementation details behind a simple interface so callers don't need to know " +
    "how things work internally, only what they can do.",
  summary: [
    "Abstraction = hide complexity behind a simple interface",
    "Key insight: callers should depend on WHAT something does, not HOW it does it",
    "Use when: implementation details are complex, likely to change, or irrelevant to callers",
  ],

  // -- BEFORE: low-level details exposed to callers ---------------
  beforeClasses: [
    {
      id: "abs-b-caller",
      name: "NotificationSender",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "abs-b-caller-meth-0", name: "sendEmail", returnType: "void", params: ["to: string", "subject: string", "body: string"], visibility: "+" },
      ],
      x: 250,
      y: 30,
    },
    {
      id: "abs-b-smtp",
      name: "SMTPConnection",
      stereotype: "class",
      attributes: [
        { id: "abs-b-smtp-attr-0", name: "host", type: "string", visibility: "+" },
        { id: "abs-b-smtp-attr-1", name: "port", type: "number", visibility: "+" },
        { id: "abs-b-smtp-attr-2", name: "socket", type: "Socket", visibility: "+" },
      ],
      methods: [
        { id: "abs-b-smtp-meth-0", name: "connect", returnType: "void", params: [], visibility: "+" },
        { id: "abs-b-smtp-meth-1", name: "authenticate", returnType: "void", params: ["user: string", "pass: string"], visibility: "+" },
        { id: "abs-b-smtp-meth-2", name: "sendRaw", returnType: "void", params: ["data: Buffer"], visibility: "+" },
        { id: "abs-b-smtp-meth-3", name: "disconnect", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 250,
    },
    {
      id: "abs-b-mime",
      name: "MIMEEncoder",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "abs-b-mime-meth-0", name: "setHeaders", returnType: "void", params: ["headers: Map"], visibility: "+" },
        { id: "abs-b-mime-meth-1", name: "encodeBody", returnType: "Buffer", params: ["text: string", "charset: string"], visibility: "+" },
        { id: "abs-b-mime-meth-2", name: "attachFile", returnType: "void", params: ["path: string"], visibility: "+" },
      ],
      x: 450,
      y: 250,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "abs-b-caller", target: "abs-b-smtp", type: "dependency", label: "manages directly" },
    { id: rid(), source: "abs-b-caller", target: "abs-b-mime", type: "dependency", label: "encodes manually" },
  ],

  beforeCode: {
    typescript: `class NotificationSender {
  sendEmail(to: string, subject: string, body: string): void {
    // Caller must manage EVERY low-level detail:
    const smtp = new SMTPConnection("smtp.gmail.com", 587);
    smtp.connect();
    smtp.authenticate(process.env.SMTP_USER!, process.env.SMTP_PASS!);

    const encoder = new MIMEEncoder();
    encoder.setHeaders(new Map([
      ["From", "noreply@app.com"],
      ["To", to],
      ["Subject", subject],
      ["Content-Type", "text/html; charset=utf-8"],
      ["MIME-Version", "1.0"],
    ]));

    const encoded = encoder.encodeBody(body, "utf-8");
    smtp.sendRaw(encoded);
    smtp.disconnect();

    // Problems:
    // - Every caller must know SMTP, MIME, encoding details
    // - Switching to SendGrid requires rewriting every caller
    // - Error handling (retry, connection pooling) duplicated everywhere
  }
}`,
    python: `class NotificationSender:
    def send_email(self, to: str, subject: str, body: str) -> None:
        # Caller must manage EVERY low-level detail:
        smtp = SMTPConnection("smtp.gmail.com", 587)
        smtp.connect()
        smtp.authenticate(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])

        encoder = MIMEEncoder()
        encoder.set_headers({
            "From": "noreply@app.com",
            "To": to,
            "Subject": subject,
            "Content-Type": "text/html; charset=utf-8",
            "MIME-Version": "1.0",
        })

        encoded = encoder.encode_body(body, "utf-8")
        smtp.send_raw(encoded)
        smtp.disconnect()

        # Problems:
        # - Every caller must know SMTP, MIME, encoding details
        # - Switching to SendGrid requires rewriting every caller
        # - Error handling (retry, connection pooling) duplicated everywhere`,
  },

  // -- AFTER: clean interface hiding complexity -------------------
  afterClasses: [
    {
      id: "abs-a-service",
      name: "EmailService",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "abs-a-service-meth-0", name: "send", returnType: "void", params: ["to: string", "subject: string", "body: string"], visibility: "+" },
      ],
      x: 300,
      y: 30,
    },
    {
      id: "abs-a-smtp-impl",
      name: "SMTPEmailService",
      stereotype: "class",
      attributes: [
        { id: "abs-a-smtp-impl-attr-0", name: "connection", type: "SMTPConnection", visibility: "-" },
        { id: "abs-a-smtp-impl-attr-1", name: "encoder", type: "MIMEEncoder", visibility: "-" },
      ],
      methods: [
        { id: "abs-a-smtp-impl-meth-0", name: "send", returnType: "void", params: ["to: string", "subject: string", "body: string"], visibility: "+" },
      ],
      x: 100,
      y: 250,
    },
    {
      id: "abs-a-sendgrid-impl",
      name: "SendGridEmailService",
      stereotype: "class",
      attributes: [
        { id: "abs-a-sendgrid-impl-attr-0", name: "apiKey", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "abs-a-sendgrid-impl-meth-0", name: "send", returnType: "void", params: ["to: string", "subject: string", "body: string"], visibility: "+" },
      ],
      x: 500,
      y: 250,
    },
    {
      id: "abs-a-caller",
      name: "NotificationSender",
      stereotype: "class",
      attributes: [
        { id: "abs-a-caller-attr-0", name: "emailService", type: "EmailService", visibility: "-" },
      ],
      methods: [
        { id: "abs-a-caller-meth-0", name: "notify", returnType: "void", params: ["to: string", "subject: string", "body: string"], visibility: "+" },
      ],
      x: 300,
      y: 450,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "abs-a-smtp-impl", target: "abs-a-service", type: "realization" },
    { id: rid(), source: "abs-a-sendgrid-impl", target: "abs-a-service", type: "realization" },
    { id: rid(), source: "abs-a-caller", target: "abs-a-service", type: "association", label: "uses" },
  ],

  afterCode: {
    typescript: `interface EmailService {
  send(to: string, subject: string, body: string): void;
}

class SMTPEmailService implements EmailService {
  private connection: SMTPConnection;
  private encoder: MIMEEncoder;

  constructor(host: string, port: number, user: string, pass: string) {
    this.connection = new SMTPConnection(host, port);
    this.encoder = new MIMEEncoder();
    this.connection.connect();
    this.connection.authenticate(user, pass);
  }

  send(to: string, subject: string, body: string): void {
    this.encoder.setHeaders(new Map([
      ["From", "noreply@app.com"], ["To", to],
      ["Subject", subject], ["Content-Type", "text/html; charset=utf-8"],
    ]));
    const encoded = this.encoder.encodeBody(body, "utf-8");
    this.connection.sendRaw(encoded);
  }
}

class SendGridEmailService implements EmailService {
  constructor(private apiKey: string) {}

  send(to: string, subject: string, body: string): void {
    // All SendGrid API details hidden inside this class
    fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: \`Bearer \${this.apiKey}\` },
      body: JSON.stringify({ to, subject, content: body }),
    });
  }
}

// Caller knows NOTHING about SMTP, MIME, or SendGrid
class NotificationSender {
  constructor(private emailService: EmailService) {}

  notify(to: string, subject: string, body: string): void {
    this.emailService.send(to, subject, body);
    // That's it. No SMTP, no encoding, no connection management.
  }
}

// Swap implementations without changing NotificationSender:
const sender = new NotificationSender(new SendGridEmailService("sk-..."));
sender.notify("user@example.com", "Welcome!", "<h1>Hello</h1>");`,
    python: `from abc import ABC, abstractmethod

class EmailService(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, body: str) -> None: ...

class SMTPEmailService(EmailService):
    def __init__(self, host: str, port: int, user: str, password: str):
        self._conn = SMTPConnection(host, port)
        self._encoder = MIMEEncoder()
        self._conn.connect()
        self._conn.authenticate(user, password)

    def send(self, to: str, subject: str, body: str) -> None:
        self._encoder.set_headers({
            "From": "noreply@app.com", "To": to,
            "Subject": subject, "Content-Type": "text/html; charset=utf-8",
        })
        encoded = self._encoder.encode_body(body, "utf-8")
        self._conn.send_raw(encoded)

class SendGridEmailService(EmailService):
    def __init__(self, api_key: str):
        self._api_key = api_key

    def send(self, to: str, subject: str, body: str) -> None:
        # All SendGrid API details hidden inside this class
        requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={"to": to, "subject": subject, "content": body},
        )

# Caller knows NOTHING about SMTP, MIME, or SendGrid
class NotificationSender:
    def __init__(self, email_service: EmailService):
        self._email_service = email_service

    def notify(self, to: str, subject: str, body: str) -> None:
        self._email_service.send(to, subject, body)
        # That's it. No SMTP, no encoding, no connection management.

# Swap implementations without changing NotificationSender:
sender = NotificationSender(SendGridEmailService("sk-..."))
sender.notify("user@example.com", "Welcome!", "<h1>Hello</h1>")`,
  },

  explanation:
    "The original NotificationSender forces every caller to manage SMTP connections, MIME " +
    "encoding, headers, and authentication — implementation details that are complex, error-prone, " +
    "and likely to change. The abstracted version defines a simple EmailService interface with a " +
    "single send() method. All the SMTP and encoding complexity is hidden inside SMTPEmailService. " +
    "Callers just call send(to, subject, body) and the implementation handles the rest. Need to " +
    "switch from SMTP to SendGrid? Create a new SendGridEmailService — zero changes to callers. " +
    "That's the power of abstraction: reduce coupling by depending on what, not how.",
  realWorldExample:
    "You don't need to understand how a car engine works to drive — you use the steering " +
    "wheel, gas pedal, and brake. These are abstractions over thousands of mechanical parts. " +
    "When the manufacturer switches from a gasoline engine to electric, the pedals and steering " +
    "wheel stay the same. The driver's 'interface' is preserved while the implementation changes " +
    "completely underneath. That's abstraction: a simplified interface hiding internal complexity.",
};

// ── Exports ──────────────────────────────────────────────────

export const OOP_DEMOS: OOPDemo[] = [compositionVsInheritance, polymorphism, encapsulation, abstraction];

export function getOOPDemoById(id: string): OOPDemo | undefined {
  return OOP_DEMOS.find((d) => d.id === id);
}

export function getOOPDemoByPrinciple(
  principle: OOPPrinciple,
): OOPDemo | undefined {
  return OOP_DEMOS.find((d) => d.principle === principle);
}
