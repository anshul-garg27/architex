# How to Add a New Design Pattern

Step-by-step guide for adding a `DesignPattern` to `src/lib/lld/patterns.ts`.

---

## Overview

Each design pattern in the LLD Studio is a single `DesignPattern` object in
`src/lib/lld/patterns.ts`. The object contains everything the UI needs:
metadata, UML class definitions, relationships, code samples, usage guidance,
and real-world examples.

**Time estimate:** 45-60 minutes for a new pattern (less if you use an existing
one as a template).

---

## Step 1: Copy an Existing Pattern as Template

Open `src/lib/lld/patterns.ts` and find a pattern similar in complexity to the
one you are adding. The Singleton pattern is the simplest (1 class, 0
relationships). The Observer pattern is a good mid-complexity example (3-4
classes, multiple relationships).

Copy the entire object and rename it:

```typescript
const yourPattern: DesignPattern = {
  // ... paste here, then modify
};
```

---

## Step 2: Fill All Required Fields

The `DesignPattern` interface is defined in `src/lib/lld/types.ts`. Here is
every field with an explanation:

```typescript
const abstractFactory: DesignPattern = {
  // ── Identification ──────────────────────────────────────────
  id: "abstract-factory",
  // Unique kebab-case string. Used as lookup key and URL slug.
  // Convention: lowercase, hyphens, no spaces.

  name: "Abstract Factory",
  // Display name shown in the UI sidebar and pattern header.

  category: "creational",
  // One of: "creational" | "structural" | "behavioral" | "modern"
  // Determines which group the pattern appears in.

  // ── Description (the Hook) ──────────────────────────────────
  description:
    "You're building a cross-platform UI toolkit that must render buttons, " +
    "checkboxes, and text fields on both Windows and macOS. Each platform " +
    "has different native widgets. Hardcoding platform checks everywhere " +
    "makes adding Linux support a nightmare. The Abstract Factory pattern " +
    "provides an interface for creating families of related objects without " +
    "specifying their concrete classes.",
  // MUST follow the content-style-guide.md Hook format:
  //   - Open with a concrete, relatable problem (2-3 sentences)
  //   - Use second person ("you", "you're building")
  //   - Reference a real app or scenario
  //   - End with the pattern's one-sentence purpose
  // See docs/content-style-guide.md section 1 (Hook).

  // ── UML Class Definitions ───────────────────────────────────
  classes: [
    {
      id: "abstract-factory-iface",
      // Unique ID within this pattern. Convention: <pattern-id>-<role>
      name: "GUIFactory",
      // Class name as shown in the UML box.
      stereotype: "interface",
      // One of: "class" | "interface" | "abstract" | "enum"
      attributes: [],
      // Array of UMLAttribute: { id, name, type, visibility }
      // visibility: "+" (public), "-" (private), "#" (protected), "~" (package)
      methods: [
        {
          id: "abstract-factory-iface-meth-0",
          name: "createButton",
          returnType: "Button",
          params: [],
          visibility: "+",
          // isAbstract?: boolean -- set to true for abstract methods
        },
        {
          id: "abstract-factory-iface-meth-1",
          name: "createCheckbox",
          returnType: "Checkbox",
          params: [],
          visibility: "+",
        },
      ],
      x: 250,
      y: 50,
      // Position on the UML canvas. See Step 3 for guidelines.
    },
    {
      id: "abstract-factory-win",
      name: "WinFactory",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "win-factory-meth-0", name: "createButton", returnType: "Button", params: [], visibility: "+" },
        { id: "win-factory-meth-1", name: "createCheckbox", returnType: "Checkbox", params: [], visibility: "+" },
      ],
      x: 50,
      y: 250,
    },
    {
      id: "abstract-factory-mac",
      name: "MacFactory",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "mac-factory-meth-0", name: "createButton", returnType: "Button", params: [], visibility: "+" },
        { id: "mac-factory-meth-1", name: "createCheckbox", returnType: "Checkbox", params: [], visibility: "+" },
      ],
      x: 450,
      y: 250,
    },
    {
      id: "abstract-factory-button",
      name: "Button",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "button-iface-meth-0", name: "render", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 450,
    },
    {
      id: "abstract-factory-checkbox",
      name: "Checkbox",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "checkbox-iface-meth-0", name: "render", returnType: "void", params: [], visibility: "+" },
      ],
      x: 450,
      y: 450,
    },
  ],

  // ── Relationships ───────────────────────────────────────────
  relationships: [
    {
      id: "rel-af-1",
      // Unique ID. Use the rid() helper or manual IDs.
      source: "abstract-factory-win",
      target: "abstract-factory-iface",
      type: "realization",
      // One of: "inheritance" | "composition" | "aggregation" |
      //         "association" | "dependency" | "realization"
      label: "implements",
      // Optional label text shown on the line.
      // sourceCardinality?: string  -- e.g. "1", "0..*"
      // targetCardinality?: string
    },
    {
      id: "rel-af-2",
      source: "abstract-factory-mac",
      target: "abstract-factory-iface",
      type: "realization",
      label: "implements",
    },
    {
      id: "rel-af-3",
      source: "abstract-factory-win",
      target: "abstract-factory-button",
      type: "dependency",
      label: "creates",
    },
    {
      id: "rel-af-4",
      source: "abstract-factory-mac",
      target: "abstract-factory-checkbox",
      type: "dependency",
      label: "creates",
    },
  ],

  // ── Code Samples ────────────────────────────────────────────
  code: {
    typescript: `// Abstract products
interface Button { render(): string; }
interface Checkbox { render(): string; }

// Abstract factory
interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

// Concrete products
class WinButton implements Button {
  render() { return "[Windows Button]"; }
}
class MacButton implements Button {
  render() { return "[macOS Button]"; }
}
class WinCheckbox implements Checkbox {
  render() { return "[Windows Checkbox]"; }
}
class MacCheckbox implements Checkbox {
  render() { return "[macOS Checkbox]"; }
}

// Concrete factories
class WinFactory implements GUIFactory {
  createButton() { return new WinButton(); }
  createCheckbox() { return new WinCheckbox(); }
}
class MacFactory implements GUIFactory {
  createButton() { return new MacButton(); }
  createCheckbox() { return new MacCheckbox(); }
}

// Client code -- depends only on abstractions
function buildUI(factory: GUIFactory) {
  const btn = factory.createButton();
  const chk = factory.createCheckbox();
  console.log(btn.render(), chk.render());
}

buildUI(new WinFactory());  // [Windows Button] [Windows Checkbox]
buildUI(new MacFactory());  // [macOS Button] [macOS Checkbox]`,

    python: `from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def render(self) -> str: ...

class Checkbox(ABC):
    @abstractmethod
    def render(self) -> str: ...

class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button: ...
    @abstractmethod
    def create_checkbox(self) -> Checkbox: ...

class WinButton(Button):
    def render(self): return "[Windows Button]"

class MacButton(Button):
    def render(self): return "[macOS Button]"

class WinCheckbox(Checkbox):
    def render(self): return "[Windows Checkbox]"

class MacCheckbox(Checkbox):
    def render(self): return "[macOS Checkbox]"

class WinFactory(GUIFactory):
    def create_button(self): return WinButton()
    def create_checkbox(self): return WinCheckbox()

class MacFactory(GUIFactory):
    def create_button(self): return MacButton()
    def create_checkbox(self): return MacCheckbox()

def build_ui(factory: GUIFactory):
    btn = factory.create_button()
    chk = factory.create_checkbox()
    print(btn.render(), chk.render())

build_ui(WinFactory())   # [Windows Button] [Windows Checkbox]
build_ui(MacFactory())   # [macOS Button] [macOS Checkbox]`,
  },
  // Both TypeScript and Python are REQUIRED.
  // Keep under 40 lines each if possible. Add comments on key decisions.
  // Code MUST be runnable -- no pseudo-code.

  // ── Usage Guidance ──────────────────────────────────────────
  realWorldExamples: [
    "Cross-platform UI toolkits (Qt, Swing, Flutter)",
    "Database driver families (connection + command + reader per DB engine)",
    "Cloud provider SDKs (AWS vs GCP vs Azure resource factories)",
  ],
  // 3+ concrete examples. Reference real frameworks/tools/companies.

  whenToUse: [
    "Code must work with families of related products",
    "You want to enforce that products from different families are not mixed",
    "New product families should be addable without changing existing code",
  ],
  // 2-4 bullet points. Each starts with a condition or scenario.

  whenNotToUse: [
    "You only have one product type -- use Factory Method instead",
    "Product families rarely change -- the abstraction adds unnecessary indirection",
    "When simple constructor calls or dependency injection suffice",
  ],
  // 2-4 bullet points. Name the alternative pattern when applicable.
};
```

---

## Step 3: UML Class Positioning Guidelines

Each `UMLClass` has `x` and `y` coordinates that determine its position on the
canvas. Follow these rules for clean, readable diagrams:

| Rule | Value |
|------|-------|
| **X range** | 50 to 600 |
| **Y range** | 50 to 600 |
| **Minimum spacing** | ~200px between class centers |
| **Interfaces/abstractions** | Top of diagram (low Y values: 50-100) |
| **Concrete classes** | Below their parent (Y + 200) |
| **Horizontal siblings** | Same Y, spaced 200px apart on X axis |

### Common Layouts

**Vertical hierarchy** (e.g., Singleton, Adapter):
```
Interface:    x=250, y=50
Concrete:     x=250, y=250
```

**Fan-out** (e.g., Factory Method, Strategy):
```
Interface:    x=250, y=50
ConcreteA:    x=50,  y=250
ConcreteB:    x=250, y=250
ConcreteC:    x=450, y=250
```

**Two-column** (e.g., Bridge, Abstract Factory):
```
Abstraction:    x=100, y=50      Implementor:    x=400, y=50
RefinedAbstr:   x=100, y=250     ConcreteImpl:   x=400, y=250
```

**Grid** (complex patterns with 5+ classes):
```
Row 1 (y=50):   x=50, x=250, x=450
Row 2 (y=250):  x=50, x=250, x=450
Row 3 (y=450):  x=50, x=250, x=450
```

---

## Step 4: Write TypeScript and Python Code

Both languages are required. Follow these rules:

1. **Keep it under 40 lines** per language when possible.
2. **Make it runnable.** Someone should be able to paste it into a REPL and see
   output.
3. **Add comments** on key design decisions, not obvious syntax.
4. **Include a usage section** at the bottom showing the pattern in action.
5. **Match the UML.** Class names in code must match class names in the diagram.

---

## Step 5: Register the Pattern

At the bottom of `src/lib/lld/patterns.ts`, find the `DESIGN_PATTERNS` array
and add your pattern:

```typescript
export const DESIGN_PATTERNS: DesignPattern[] = [
  // Creational
  singleton,
  factoryMethod,
  abstractFactory,  // <-- add here, in category order
  builder,
  prototype,
  // Structural
  adapter,
  // ...
];
```

Also verify that the helper functions `getPatternById` and
`getPatternsByCategory` work with your new pattern -- they operate over the
`DESIGN_PATTERNS` array, so no code changes are needed as long as you add to
the array.

---

## Step 6: Test in Dev Mode

```bash
pnpm dev
```

1. Open http://localhost:3000
2. Switch to the **LLD** module from the activity bar
3. Select **Design Patterns** from the sidebar
4. Find your pattern in the list under its category
5. Verify:
   - UML diagram renders with correct class boxes and relationship arrows
   - All attributes and methods appear in each class box
   - Code tab shows both TypeScript and Python
   - Properties panel shows realWorldExamples, whenToUse, whenNotToUse
   - No console errors

---

## Step 7: Quality Checklist

Before submitting your PR, verify every item. These are derived from
`docs/content-style-guide.md`.

### Content Quality

- [ ] **Hook present?** Description opens with a concrete problem scenario, NOT
  a textbook definition.
- [ ] **Second person?** Hook uses "you" / "you're building."
- [ ] **Real-world reference?** At least one mention of a real app, framework,
  or company the reader already knows.
- [ ] **No GoF-first opening?** The first sentence is NOT "Defines a..." or
  "Provides a..." -- it is a relatable problem.

### UML Diagram

- [ ] **Classes complete?** Every participant in the pattern is represented.
- [ ] **Stereotypes correct?** Interfaces use `"interface"`, abstract classes use
  `"abstract"`, enums use `"enum"`.
- [ ] **Relationships present?** All inheritance, realization, composition,
  aggregation, association, and dependency lines are defined.
- [ ] **Positions in range?** All x values between 50-600, all y values between
  50-600.
- [ ] **Spacing adequate?** At least ~200px between class centers.
- [ ] **IDs unique?** Every class ID, attribute ID, method ID, and relationship
  ID is unique within the pattern.

### Code Samples

- [ ] **Both languages?** TypeScript AND Python are both provided.
- [ ] **Runnable?** Code can be pasted into a REPL and produces output.
- [ ] **Under 40 lines?** Each language's code is concise.
- [ ] **Names match UML?** Class names in code match class names in the diagram.
- [ ] **Comments on decisions?** Key design choices are annotated.

### Usage Guidance

- [ ] **3+ real-world examples?** Each references a concrete framework, tool, or
  system.
- [ ] **2-4 whenToUse bullets?** Each starts with a condition or scenario.
- [ ] **2-4 whenNotToUse bullets?** Each names an alternative when applicable.

### Final Verification

- [ ] **Dev mode tested?** Pattern renders correctly in the LLD module.
- [ ] **No console errors?** Browser console is clean.
- [ ] **TypeScript compiles?** `pnpm typecheck` passes.
- [ ] **Lint passes?** `pnpm lint` passes.

---

## Quick Reference: DesignPattern Interface

From `src/lib/lld/types.ts`:

```typescript
interface DesignPattern {
  id: string;                        // Unique kebab-case identifier
  name: string;                      // Display name
  category: PatternCategory;         // "creational" | "structural" | "behavioral" | "modern"
  description: string;               // Hook: problem scenario + pattern purpose
  classes: UMLClass[];               // UML class boxes with positions
  relationships: UMLRelationship[];  // Lines between classes
  code: {
    typescript: string;              // Runnable TS code sample
    python: string;                  // Runnable Python code sample
  };
  realWorldExamples: string[];       // 3+ concrete examples
  whenToUse: string[];               // 2-4 usage scenarios
  whenNotToUse: string[];            // 2-4 anti-scenarios with alternatives
}
```

### Supporting Types

```typescript
interface UMLClass {
  id: string;
  name: string;
  stereotype: "class" | "interface" | "abstract" | "enum";
  attributes: UMLAttribute[];
  methods: UMLMethod[];
  x: number;  // 50-600
  y: number;  // 50-600
}

interface UMLAttribute {
  id: string;
  name: string;
  type: string;
  visibility: "+" | "-" | "#" | "~";  // public, private, protected, package
}

interface UMLMethod {
  id: string;
  name: string;
  returnType: string;
  params: string[];
  visibility: "+" | "-" | "#" | "~";
  isAbstract?: boolean;
}

interface UMLRelationship {
  id: string;
  source: string;               // Class ID
  target: string;               // Class ID
  type: UMLRelationshipType;    // "inheritance" | "composition" | "aggregation" |
                                // "association" | "dependency" | "realization"
  label?: string;
  sourceCardinality?: string;   // e.g. "1", "0..*"
  targetCardinality?: string;
}
```

---

## Content Style Reference

All pattern content must follow the structure in `docs/content-style-guide.md`:

```
Hook --> Analogy --> UML Diagram --> Code --> Tradeoffs --> Summary
```

The `description` field in `DesignPattern` covers the **Hook**. The UML
diagram, code, and usage guidance fields cover the remaining sections. If the
pattern type later expands to include `analogy`, `tradeoffs`, and `summary`
fields, follow the content-style-guide.md templates for each.
