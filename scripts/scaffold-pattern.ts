#!/usr/bin/env npx tsx
// -----------------------------------------------------------------
// Architex -- Design Pattern Scaffolding Script (LLD-165)
// -----------------------------------------------------------------
//
// Generates a complete DesignPattern object with TODO placeholders.
//
// Usage:
//   npx tsx scripts/scaffold-pattern.ts "Abstract Factory" creational
//   npx tsx scripts/scaffold-pattern.ts "Circuit Breaker" resilience
//
// Output: valid TypeScript to stdout for copy-paste into patterns.ts
// -----------------------------------------------------------------

const VALID_CATEGORIES = [
  "creational",
  "structural",
  "behavioral",
  "modern",
  "resilience",
  "concurrency",
  "ai-agent",
] as const;

type PatternCategory = (typeof VALID_CATEGORIES)[number];

// -- Helpers ------------------------------------------------------

function toKebabCase(name: string): string {
  return name
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toPascalCase(name: string): string {
  return name
    .trim()
    .split(/[\s\-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

// -- CLI Parsing --------------------------------------------------

function printUsage(): void {
  console.error(
    `Usage: npx tsx scripts/scaffold-pattern.ts "<Pattern Name>" <category>`,
  );
  console.error(`\nValid categories: ${VALID_CATEGORIES.join(", ")}`);
  console.error(`\nExample:`);
  console.error(
    `  npx tsx scripts/scaffold-pattern.ts "Abstract Factory" creational`,
  );
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Error: both pattern name and category are required.\n");
  printUsage();
}

const patternName = args[0];
const categoryArg = args[1].toLowerCase();

if (!VALID_CATEGORIES.includes(categoryArg as PatternCategory)) {
  console.error(`Error: "${categoryArg}" is not a valid category.\n`);
  console.error(`Valid categories: ${VALID_CATEGORIES.join(", ")}`);
  process.exit(1);
}

const category = categoryArg as PatternCategory;
const id = toKebabCase(patternName);
const pascal = toPascalCase(patternName);

// -- Code Generation ----------------------------------------------

const output = `{
  id: "${id}",
  name: "${patternName}",
  category: "${category}",
  description:
    "TODO: Write a 1-2 sentence hook that explains what problem this pattern solves and why someone should care.",
  analogy:
    "TODO: Write a real-world analogy (e.g., 'Like a restaurant menu that...')",
  difficulty: 3,
  tradeoffs:
    "TODO: Describe the key tradeoff (e.g., 'Adds indirection but enables...')",
  summary: [
    "TODO: First key takeaway about this pattern",
    "TODO: Second key takeaway about this pattern",
    "TODO: Third key takeaway about this pattern",
  ],
  youAlreadyUseThis: [
    "TODO: Familiar example #1 (e.g., 'React.createElement is a factory')",
    "TODO: Familiar example #2",
  ],
  predictionPrompts: [
    {
      question: "TODO: A question that tests understanding of when to use this pattern",
      answer: "TODO: The answer",
    },
  ],
  classes: [
    {
      id: "${id}-1",
      name: "${pascal}",
      stereotype: "class" as const,
      attributes: [
        { id: "${id}-attr-1", name: "TODO_field", type: "string", visibility: "+" as const },
      ],
      methods: [
        {
          id: "${id}-meth-1",
          name: "TODO_method",
          returnType: "void",
          params: [],
          visibility: "+" as const,
        },
      ],
      x: 300,
      y: 100,
    },
    {
      id: "${id}-2",
      name: "I${pascal}",
      stereotype: "interface" as const,
      attributes: [],
      methods: [
        {
          id: "${id}-meth-2",
          name: "TODO_method",
          returnType: "void",
          params: [],
          visibility: "+" as const,
        },
      ],
      x: 60,
      y: 100,
    },
  ],
  relationships: [
    {
      id: "${id}-rel-1",
      source: "${id}-1",
      target: "${id}-2",
      type: "realization" as const,
      label: "TODO: relationship label",
    },
  ],
  code: {
    typescript: \`// TODO: Write a TypeScript implementation of the ${patternName} pattern
// Include:
//   - Interface/abstract class definitions
//   - Concrete implementations
//   - Client code showing usage
//
// Example structure:
// interface I${pascal} { ... }
// class Concrete${pascal} implements I${pascal} { ... }

export {}; // placeholder
\`,
    python: \`# TODO: Write a Python implementation of the ${patternName} pattern
# Include:
#   - ABC/interface definitions
#   - Concrete implementations
#   - Client code showing usage
#
# Example structure:
# class I${pascal}(ABC): ...
# class Concrete${pascal}(I${pascal}): ...
\`,
  },
  realWorldExamples: [
    "TODO: Real-world example #1 (e.g., 'Database connection pools in web frameworks')",
    "TODO: Real-world example #2",
    "TODO: Real-world example #3",
  ],
  whenToUse: [
    "TODO: Scenario #1 where this pattern is the right choice",
    "TODO: Scenario #2 where this pattern is the right choice",
    "TODO: Scenario #3 where this pattern is the right choice",
  ],
  whenNotToUse: [
    "TODO: Scenario #1 where this pattern is overkill or wrong",
    "TODO: Scenario #2 where this pattern is overkill or wrong",
    "TODO: Scenario #3 where this pattern is overkill or wrong",
  ],
  interviewTips: [
    "TODO: Tip #1 for discussing this pattern in interviews",
    "TODO: Tip #2 for discussing this pattern in interviews",
  ],
  commonMistakes: [
    "TODO: Common mistake #1 when implementing this pattern",
    "TODO: Common mistake #2 when implementing this pattern",
  ],
  relatedPatterns: [
    { patternId: "TODO-related-pattern-id", relationship: "TODO: How this relates to the other pattern" },
  ],
},`;

// -- Output -------------------------------------------------------

console.log("// ── Scaffolded DesignPattern: %s ──", patternName);
console.log("// Add this object to the DESIGN_PATTERNS array in patterns.ts\n");
console.log(output);
console.log("");

// -- Next steps guidance ------------------------------------------

console.error("\n──────────────────────────────────────────────────────");
console.error("Next steps:");
console.error("  1. Replace all TODO placeholders with real content");
console.error("  2. Add UML classes with proper attributes and methods");
console.error("  3. Write TypeScript and Python code samples");
console.error("  4. Set correct difficulty (1-5) and relationships");
console.error("  5. Add the object to DESIGN_PATTERNS in patterns.ts");
console.error("──────────────────────────────────────────────────────");
