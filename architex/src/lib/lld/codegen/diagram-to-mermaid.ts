// -----------------------------------------------------------------
// Architex -- Diagram-to-Mermaid Code Generation (LLD-077)
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "../types";

// -- Helpers ------------------------------------------------------

const VISIBILITY_MERMAID: Record<string, string> = {
  "+": "+",
  "-": "-",
  "#": "#",
  "~": "~",
};

const STEREOTYPE_MERMAID: Record<UMLClass["stereotype"], string> = {
  interface: "<<interface>>",
  abstract: "<<abstract>>",
  enum: "<<enumeration>>",
  class: "",
};

const RELATIONSHIP_MERMAID: Record<string, string> = {
  inheritance: "<|--",
  realization: "<|..",
  composition: "*--",
  aggregation: "o--",
  association: "-->",
  dependency: "..>",
};

// -- Param formatting ---------------------------------------------

/**
 * Format method params for Mermaid output. Handles both UMLMethodParam[]
 * (with name + type) and plain string[] (backward compatible).
 *
 * UMLMethodParam[] serializes as `name Type` (Mermaid convention).
 * string[] serializes as comma-separated names.
 */
function formatMermaidParams(
  params: Array<{ name: string; type: string }> | string[],
): string {
  if (params.length === 0) return "";
  if (typeof params[0] === "string") {
    return (params as string[]).join(", ");
  }
  return (params as Array<{ name: string; type: string }>)
    .map((p) => (p.type ? `${p.name} ${p.type}` : p.name))
    .join(", ");
}

// -- Main export --------------------------------------------------

/**
 * Generate Mermaid classDiagram syntax from a UML class diagram.
 *
 * Mapping:
 * - UMLClass -> `class ClassName { +attribute: type \n +method(): returnType }`
 * - stereotype: `<<interface>>`, `<<abstract>>`, `<<enumeration>>`
 * - inheritance -> `Parent <|-- Child`
 * - realization -> `Interface <|.. Implementor`
 * - composition -> `Whole *-- Part`
 * - aggregation -> `Whole o-- Part`
 * - association -> `A --> B`
 * - dependency -> `A ..> B`
 * - Visibility: + (public), - (private), # (protected), ~ (package)
 */
export function generateMermaid(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): string {
  if (classes.length === 0) return "classDiagram\n    %% No classes in the diagram";

  const lines: string[] = [];
  lines.push("classDiagram");

  // Build a name lookup for relationship rendering
  const nameById = new Map<string, string>();
  for (const c of classes) {
    nameById.set(c.id, c.name);
  }

  // Sort: enums first, then interfaces, then abstract, then classes
  const sorted = [...classes].sort((a, b) => {
    const order: Record<UMLClass["stereotype"], number> = {
      enum: 0,
      interface: 1,
      abstract: 2,
      class: 3,
    };
    return order[a.stereotype] - order[b.stereotype];
  });

  // Render each class
  for (const cls of sorted) {
    lines.push("");

    // Stereotype annotation
    const stereo = STEREOTYPE_MERMAID[cls.stereotype];
    if (stereo) {
      lines.push(`    class ${cls.name} {`);
      lines.push(`        ${stereo}`);
    } else {
      lines.push(`    class ${cls.name} {`);
    }

    // Attributes
    for (const attr of cls.attributes) {
      const vis = VISIBILITY_MERMAID[attr.visibility] ?? "+";
      if (cls.stereotype === "enum") {
        // Enum values don't have types
        lines.push(`        ${vis}${attr.name}`);
      } else {
        const type = attr.type || "unknown";
        lines.push(`        ${vis}${type} ${attr.name}`);
      }
    }

    // Methods
    for (const method of cls.methods) {
      const vis = VISIBILITY_MERMAID[method.visibility] ?? "+";
      const ret = method.returnType || "void";
      const params = formatMermaidParams(method.params);
      const abstractSuffix = method.isAbstract ? "*" : "";
      lines.push(`        ${vis}${method.name}(${params})${abstractSuffix} ${ret}`);
    }

    lines.push("    }");
  }

  // Render relationships
  if (relationships.length > 0) {
    lines.push("");
  }

  for (const rel of relationships) {
    const sourceName = nameById.get(rel.source);
    const targetName = nameById.get(rel.target);
    if (!sourceName || !targetName) continue;

    const arrow = RELATIONSHIP_MERMAID[rel.type] ?? "-->";

    // Build cardinality annotations
    let srcCard = "";
    let tgtCard = "";
    if (rel.sourceCardinality) {
      srcCard = ` "${rel.sourceCardinality}"`;
    }
    if (rel.targetCardinality) {
      tgtCard = ` "${rel.targetCardinality}"`;
    }

    // Build label
    let label = "";
    if (rel.label) {
      label = ` : ${rel.label}`;
    }

    // For inheritance/realization: Parent <|-- Child (target is parent, source is child)
    // In the UML model, source inherits from target
    if (rel.type === "inheritance" || rel.type === "realization") {
      lines.push(`    ${targetName} ${arrow} ${sourceName}${label}`);
    } else if (rel.type === "composition" || rel.type === "aggregation") {
      // Whole *-- Part: source owns/has target
      if (srcCard || tgtCard) {
        lines.push(`    ${sourceName}${srcCard} ${arrow}${tgtCard} ${targetName}${label}`);
      } else {
        lines.push(`    ${sourceName} ${arrow} ${targetName}${label}`);
      }
    } else {
      // association, dependency
      if (srcCard || tgtCard) {
        lines.push(`    ${sourceName}${srcCard} ${arrow}${tgtCard} ${targetName}${label}`);
      } else {
        lines.push(`    ${sourceName} ${arrow} ${targetName}${label}`);
      }
    }
  }

  return lines.join("\n");
}
