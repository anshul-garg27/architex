// -----------------------------------------------------------------
// Architex -- Mermaid-to-Diagram Parser (LLD-DSL)
// -----------------------------------------------------------------
//
// Regex-based parser that extracts UML classes and relationships
// from Mermaid classDiagram syntax. Designed as the inverse of
// `diagram-to-mermaid.ts` — round-trips Mermaid text back into
// the UMLClass / UMLRelationship model.
// -----------------------------------------------------------------

import type {
  UMLClass,
  UMLAttribute,
  UMLMethod,
  UMLMethodParam,
  UMLRelationship,
  UMLRelationshipType,
  UMLVisibility,
} from "../types";

// -- Result type --------------------------------------------------

export interface MermaidParseResult {
  classes: UMLClass[];
  relationships: UMLRelationship[];
  errors: string[];
}

// -- ID generation ------------------------------------------------

let _mermaidParseId = 0;
function nextId(prefix: string): string {
  return `mmd-${prefix}-${++_mermaidParseId}`;
}

function resetIds(): void {
  _mermaidParseId = 0;
}

// -- Layout helper ------------------------------------------------

function autoLayout(classes: UMLClass[], cols = 3): UMLClass[] {
  const gapX = 280;
  const gapY = 260;
  const startX = 60;
  const startY = 60;
  return classes.map((c, i) => ({
    ...c,
    x: startX + (i % cols) * gapX,
    y: startY + Math.floor(i / cols) * gapY,
  }));
}

// -- Visibility mapping -------------------------------------------

function parseVisibility(ch: string): UMLVisibility {
  switch (ch) {
    case "-": return "-";
    case "#": return "#";
    case "~": return "~";
    default: return "+";
  }
}

// -- Method param parsing -----------------------------------------

/**
 * Parse raw param strings into typed params when possible.
 *
 * Mermaid classDiagram uses `paramName Type` format (space-separated),
 * e.g. `+getName(id String, name String) ReturnType`.
 *
 * If ALL params match "name Type" pattern, returns UMLMethodParam[].
 * Otherwise returns string[] (backward compatible, names only).
 */
function parseMethodParams(rawParams: string[]): UMLMethodParam[] | string[] {
  if (rawParams.length === 0) return [];

  // Check if any param has a space => "name Type" pattern
  const hasTypedParams = rawParams.some((p) => /^\w+\s+\w+/.test(p));

  if (hasTypedParams) {
    return rawParams.map((p) => {
      const parts = p.trim().split(/\s+/);
      if (parts.length >= 2) {
        // Mermaid format: "name Type" (name first, type second)
        return { name: parts[0], type: parts.slice(1).join(" ") };
      }
      // Single token -- treat as name with empty type
      return { name: parts[0], type: "" };
    });
  }

  // Plain names only
  return rawParams;
}

// -- Relationship arrow mapping -----------------------------------

const ARROW_TO_TYPE: Record<string, UMLRelationshipType> = {
  "<|--": "inheritance",
  "<|..": "realization",
  "*--":  "composition",
  "o--":  "aggregation",
  "-->":  "association",
  "..>":  "dependency",
};

// -- Main export --------------------------------------------------

/**
 * Parse a Mermaid classDiagram string into UML classes and relationships.
 *
 * Handles:
 * - `class ClassName { ... }` blocks with stereotype, attributes, methods
 * - Relationship arrows: `<|--`, `<|..`, `*--`, `o--`, `-->`, `..>`
 * - Visibility markers: `+`, `-`, `#`, `~`
 * - Cardinality annotations: `"1" --> "0..*"`
 * - Labels: `A --> B : uses`
 *
 * @returns Parsed classes (auto-laid-out), relationships, and any parse errors.
 */
export function parseMermaidClassDiagram(mermaid: string): MermaidParseResult {
  resetIds();

  const classes: UMLClass[] = [];
  const relationships: UMLRelationship[] = [];
  const errors: string[] = [];
  const nameToId = new Map<string, string>();

  const lines = mermaid.split("\n");

  // -- Pass 1: Extract class blocks and relationships ---------------

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines, comments, and the `classDiagram` directive
    if (!line || line.startsWith("%%") || line === "classDiagram") {
      i++;
      continue;
    }

    // -- Class block: `class ClassName {` --
    const classMatch = line.match(/^class\s+(\w+)\s*\{/);
    if (classMatch) {
      const className = classMatch[1];
      const classId = nextId("cls");
      nameToId.set(className, classId);

      let stereotype: UMLClass["stereotype"] = "class";
      const attributes: UMLAttribute[] = [];
      const methods: UMLMethod[] = [];

      i++; // move past opening line
      while (i < lines.length) {
        const memberLine = lines[i].trim();

        // End of class block
        if (memberLine === "}") {
          i++;
          break;
        }

        // Stereotype annotation
        const stereoMatch = memberLine.match(/^<<(\w+)>>$/);
        if (stereoMatch) {
          const stereoText = stereoMatch[1].toLowerCase();
          if (stereoText === "interface") stereotype = "interface";
          else if (stereoText === "abstract") stereotype = "abstract";
          else if (stereoText === "enumeration") stereotype = "enum";
          i++;
          continue;
        }

        // Try to parse as method: `+methodName(params) ReturnType` or `+methodName(params)* ReturnType`
        // Params can be: `name Type, name2 Type2` (Mermaid style) or `name, name2` (plain)
        const methodMatch = memberLine.match(
          /^([+\-#~]?)(\w+)\(([^)]*)\)(\*)?\s*(.*)?$/,
        );
        if (methodMatch) {
          const rawParams = methodMatch[3]
            ? methodMatch[3].split(",").map((p) => p.trim()).filter(Boolean)
            : [];

          // Detect if params have types: "name Type" pattern
          const parsedParams: UMLMethodParam[] | string[] = parseMethodParams(rawParams);

          methods.push({
            id: nextId("meth"),
            name: methodMatch[2],
            params: parsedParams,
            isAbstract: methodMatch[4] === "*",
            returnType: (methodMatch[5] || "void").trim(),
            visibility: parseVisibility(methodMatch[1]),
          });
          i++;
          continue;
        }

        // Try to parse as attribute: `+Type name` or `+name` (enum member)
        const attrMatch = memberLine.match(/^([+\-#~]?)(\S+?)(?:\s+(\S+))?\s*$/);
        if (attrMatch && attrMatch[2]) {
          // Mermaid format from diagram-to-mermaid.ts is: `+Type name`
          // For enums it's just: `+VALUE`
          if (attrMatch[3]) {
            // Has both type and name: `+Type name`
            attributes.push({
              id: nextId("attr"),
              name: attrMatch[3],
              type: attrMatch[2],
              visibility: parseVisibility(attrMatch[1]),
            });
          } else {
            // Single token — enum member or untyped attribute
            attributes.push({
              id: nextId("attr"),
              name: attrMatch[2],
              type: "",
              visibility: parseVisibility(attrMatch[1]),
            });
          }
          i++;
          continue;
        }

        // Unrecognized line inside class block — skip
        i++;
      }

      classes.push({
        id: classId,
        name: className,
        stereotype,
        attributes,
        methods,
        x: 0,
        y: 0,
      });
      continue;
    }

    // -- Relationship line --
    const rel = parseRelationshipLine(line, nameToId, errors);
    if (rel) {
      relationships.push(rel);
      i++;
      continue;
    }

    // Unrecognized top-level line — skip silently
    i++;
  }

  // -- Pass 2: Resolve relationship name references to IDs ----------

  for (const rel of relationships) {
    if (nameToId.has(rel.source)) {
      rel.source = nameToId.get(rel.source)!;
    }
    if (nameToId.has(rel.target)) {
      rel.target = nameToId.get(rel.target)!;
    }
  }

  // Filter out relationships with unresolved references
  const validIds = new Set(classes.map((c) => c.id));
  const resolved = relationships.filter(
    (r) => validIds.has(r.source) && validIds.has(r.target),
  );

  // Report unresolved relationships
  const unresolvedCount = relationships.length - resolved.length;
  if (unresolvedCount > 0) {
    errors.push(
      `${unresolvedCount} relationship(s) reference unknown classes and were skipped.`,
    );
  }

  const laid = autoLayout(classes);

  return { classes: laid, relationships: resolved, errors };
}

// -- Relationship line parser -------------------------------------

/**
 * Parse a single Mermaid relationship line.
 *
 * Supported formats:
 * - `Parent <|-- Child`
 * - `A "1" --> "0..*" B : label`
 * - `A *-- B`
 */
function parseRelationshipLine(
  line: string,
  nameToId: Map<string, string>,
  errors: string[],
): UMLRelationship | null {
  // Pattern: ClassName [cardinality] arrow [cardinality] ClassName [: label]
  const relMatch = line.match(
    /^(\w+)\s*(?:"([^"]*)")?\s*(<\|--|<\|\.\.|\*--|o--|-->|\.\.>)\s*(?:"([^"]*)")?\s*(\w+)(?:\s*:\s*(.+))?$/,
  );
  if (!relMatch) return null;

  const leftName = relMatch[1];
  const leftCard = relMatch[2] || undefined;
  const arrow = relMatch[3];
  const rightCard = relMatch[4] || undefined;
  const rightName = relMatch[5];
  const label = relMatch[6]?.trim() || undefined;

  const relType = ARROW_TO_TYPE[arrow];
  if (!relType) {
    errors.push(`Unknown arrow type "${arrow}" in: ${line}`);
    return null;
  }

  // For inheritance/realization: `Parent <|-- Child` means Child inherits from Parent
  // In UML model: source (child) inherits from target (parent)
  if (relType === "inheritance" || relType === "realization") {
    return {
      id: nextId("rel"),
      source: rightName, // child — will be resolved to ID
      target: leftName,  // parent — will be resolved to ID
      type: relType,
      label,
      sourceCardinality: rightCard,
      targetCardinality: leftCard,
    };
  }

  // For other types: left is source, right is target
  return {
    id: nextId("rel"),
    source: leftName,
    target: rightName,
    type: relType,
    label,
    sourceCardinality: leftCard,
    targetCardinality: rightCard,
  };
}
