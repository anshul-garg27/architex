// -----------------------------------------------------------------
// Architex -- UML Class Diagram Export: PlantUML & Mermaid (LLD-403)
//
// Converts UMLClass[] + UMLRelationship[] to text-based diagram
// formats that users can paste into their own documentation.
//
// The Mermaid export delegates to the existing diagram-to-mermaid
// generator. The PlantUML export is new and follows @startuml/@enduml
// class diagram syntax.
// -----------------------------------------------------------------

import type {
  UMLClass,
  UMLRelationship,
  UMLRelationshipType,
  UMLMethodParam,
} from "./types";
import { generateMermaid } from "./codegen/diagram-to-mermaid";

// ── Re-export the existing Mermaid generator ────────────────────

/**
 * Export a UML class diagram to Mermaid `classDiagram` syntax.
 *
 * Delegates to the existing `generateMermaid` from LLD-077.
 */
export function exportToMermaid(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): string {
  return generateMermaid(classes, relationships);
}

// ── PlantUML helpers ────────────────────────────────────────────

const VISIBILITY_PUML: Record<string, string> = {
  "+": "+",
  "-": "-",
  "#": "#",
  "~": "~",
};

const STEREOTYPE_PUML: Record<UMLClass["stereotype"], string> = {
  interface: "interface",
  abstract: "abstract class",
  enum: "enum",
  class: "class",
};

const RELATIONSHIP_PUML: Record<UMLRelationshipType, string> = {
  inheritance: "<|--",
  realization: "<|..",
  composition: "*--",
  aggregation: "o--",
  association: "-->",
  dependency: "..>",
};

/**
 * Format method params for PlantUML output.
 * Handles both `UMLMethodParam[]` (name + type) and plain `string[]`.
 *
 * PlantUML convention: `name: Type`
 */
function formatPlantUMLParams(
  params: UMLMethodParam[] | string[],
): string {
  if (params.length === 0) return "";
  if (typeof params[0] === "string") {
    return (params as string[]).join(", ");
  }
  return (params as UMLMethodParam[])
    .map((p) => (p.type ? `${p.name}: ${p.type}` : p.name))
    .join(", ");
}

// ── PlantUML export ─────────────────────────────────────────────

/**
 * Export a UML class diagram to PlantUML class diagram syntax.
 *
 * Output includes `@startuml` / `@enduml` delimiters, class
 * definitions with attributes and methods, stereotype annotations,
 * visibility markers, and relationship arrows.
 *
 * Mapping:
 * - inheritance  -> `<|--`
 * - realization  -> `<|..`
 * - composition  -> `*--`
 * - aggregation  -> `o--`
 * - association  -> `-->`
 * - dependency   -> `..>`
 */
export function exportToPlantUML(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): string {
  if (classes.length === 0) {
    return "@startuml\n' No classes in the diagram\n@enduml";
  }

  const lines: string[] = [];
  lines.push("@startuml");
  lines.push("");

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
    const keyword = STEREOTYPE_PUML[cls.stereotype];
    lines.push(`${keyword} ${cls.name} {`);

    // Attributes
    for (const attr of cls.attributes) {
      const vis = VISIBILITY_PUML[attr.visibility] ?? "+";
      if (cls.stereotype === "enum") {
        // Enum values listed without types
        lines.push(`    ${vis}${attr.name}`);
      } else {
        const type = attr.type || "unknown";
        lines.push(`    ${vis}${attr.name}: ${type}`);
      }
    }

    // Methods
    for (const method of cls.methods) {
      const vis = VISIBILITY_PUML[method.visibility] ?? "+";
      const ret = method.returnType || "void";
      const params = formatPlantUMLParams(method.params);
      const abstractPrefix = method.isAbstract ? "{abstract} " : "";
      lines.push(`    ${abstractPrefix}${vis}${method.name}(${params}): ${ret}`);
    }

    lines.push("}");
    lines.push("");
  }

  // Render relationships
  for (const rel of relationships) {
    const sourceName = nameById.get(rel.source);
    const targetName = nameById.get(rel.target);
    if (!sourceName || !targetName) continue;

    const arrow = RELATIONSHIP_PUML[rel.type] ?? "-->";

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

    // For inheritance/realization: Parent <|-- Child
    // In the UML model, source inherits from target
    if (rel.type === "inheritance" || rel.type === "realization") {
      lines.push(`${targetName} ${arrow} ${sourceName}${label}`);
    } else if (srcCard || tgtCard) {
      lines.push(`${sourceName}${srcCard} ${arrow}${tgtCard} ${targetName}${label}`);
    } else {
      lines.push(`${sourceName} ${arrow} ${targetName}${label}`);
    }
  }

  lines.push("");
  lines.push("@enduml");

  return lines.join("\n");
}
