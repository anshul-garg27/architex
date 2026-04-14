// -----------------------------------------------------------------
// Architex -- Diagram-to-Python Code Generation (LLD-015)
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "../types";

// -- Helpers ------------------------------------------------------

function indent(text: string, level: number): string {
  return "    ".repeat(level) + text;
}

function toPythonType(tsType: string): string {
  if (!tsType) return "Any";
  const map: Record<string, string> = {
    string: "str",
    number: "int",
    boolean: "bool",
    void: "None",
    any: "Any",
    unknown: "Any",
    "string[]": "list[str]",
    "number[]": "list[int]",
    "boolean[]": "list[bool]",
  };
  return map[tsType.toLowerCase()] ?? tsType;
}

function toPythonDefault(tsType: string): string {
  const t = tsType.toLowerCase();
  if (t === "string" || t === "str") return '""';
  if (t === "number" || t === "int" || t === "float") return "0";
  if (t === "boolean" || t === "bool") return "False";
  if (t.endsWith("[]") || t.startsWith("list")) return "field(default_factory=list)";
  return "None";
}

function formatParams(
  params: Array<{ name: string; type: string }> | string[],
): string {
  if (params.length === 0) return "";
  // New format: UMLMethodParam[]
  if (typeof params[0] === "object" && params[0] !== null && "name" in params[0]) {
    return (params as Array<{ name: string; type: string }>)
      .map((p) => (p.type ? `${p.name}: ${toPythonType(p.type)}` : p.name))
      .join(", ");
  }
  // Old format: string[]
  return (params as string[])
    .map((p) => {
      if (p.includes(":")) {
        const [name, type] = p.split(":").map((s) => s.trim());
        return `${name}: ${toPythonType(type)}`;
      }
      return p;
    })
    .join(", ");
}

function visibilityPrefix(vis: string): string {
  // Python convention: _ for protected, __ for private
  if (vis === "-") return "__";
  if (vis === "#") return "_";
  return "";
}

/**
 * Build a lookup: classId -> parent class names and implemented interface names.
 */
function buildInheritanceMap(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): Map<string, { extends: string[]; implements: string[] }> {
  const nameById = new Map<string, string>();
  for (const c of classes) {
    nameById.set(c.id, c.name);
  }

  const map = new Map<string, { extends: string[]; implements: string[] }>();
  for (const c of classes) {
    map.set(c.id, { extends: [], implements: [] });
  }

  for (const rel of relationships) {
    const entry = map.get(rel.source);
    if (!entry) continue;
    const targetName = nameById.get(rel.target);
    if (!targetName) continue;

    if (rel.type === "inheritance") {
      entry.extends.push(targetName);
    } else if (rel.type === "realization") {
      entry.implements.push(targetName);
    }
  }

  return map;
}

/**
 * Build a lookup: classId -> composition/aggregation member fields.
 */
function buildCompositionMap(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): Map<string, Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>> {
  const nameById = new Map<string, string>();
  for (const c of classes) {
    nameById.set(c.id, c.name);
  }

  const map = new Map<string, Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>>();
  for (const c of classes) {
    map.set(c.id, []);
  }

  for (const rel of relationships) {
    if (rel.type !== "composition" && rel.type !== "aggregation" && rel.type !== "association") {
      continue;
    }
    const entry = map.get(rel.source);
    if (!entry) continue;
    const targetName = nameById.get(rel.target);
    if (!targetName) continue;

    const isMany = rel.targetCardinality === "*" ||
      rel.targetCardinality === "0..*" ||
      rel.targetCardinality === "1..*";
    const isOptional = rel.type === "aggregation";

    const fieldName = rel.label ||
      (isMany
        ? targetName.charAt(0).toLowerCase() + targetName.slice(1) + "s"
        : targetName.charAt(0).toLowerCase() + targetName.slice(1));

    entry.push({ fieldName, typeName: targetName, isArray: isMany, isOptional });
  }

  return map;
}

// -- Generators per stereotype ------------------------------------

function generateEnum(cls: UMLClass): string {
  const lines: string[] = [];
  lines.push(`class ${cls.name}(Enum):`);
  lines.push(indent(`"""Enum: ${cls.name}"""`, 1));

  if (cls.attributes.length === 0) {
    lines.push(indent("pass", 1));
  } else {
    for (const attr of cls.attributes) {
      lines.push(indent(`${attr.name} = auto()`, 1));
    }
  }

  return lines.join("\n");
}

function generateABC(
  cls: UMLClass,
  inheritInfo: { extends: string[]; implements: string[] },
  compositionFields: Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>,
): string {
  const lines: string[] = [];

  // Build bases list
  const bases = [...inheritInfo.extends, ...inheritInfo.implements];
  if (!bases.includes("ABC")) {
    bases.unshift("ABC");
  }
  const basesStr = bases.join(", ");

  lines.push(`class ${cls.name}(${basesStr}):`);
  lines.push(indent(`"""Abstract class: ${cls.name}"""`, 1));

  const hasContent = cls.attributes.length > 0 || cls.methods.length > 0 || compositionFields.length > 0;
  if (!hasContent) {
    lines.push(indent("pass", 1));
    return lines.join("\n");
  }

  // Attributes via __init__
  if (cls.attributes.length > 0 || compositionFields.length > 0) {
    lines.push("");
    lines.push(indent("def __init__(self) -> None:", 1));
    for (const attr of cls.attributes) {
      const prefix = visibilityPrefix(attr.visibility);
      const pyType = toPythonType(attr.type);
      const pyDefault = toPythonDefault(attr.type);
      lines.push(indent(`self.${prefix}${attr.name}: ${pyType} = ${pyDefault}`, 2));
    }
    for (const field of compositionFields) {
      const pyType = field.isArray ? `list[${field.typeName}]` : field.typeName;
      const pyDefault = field.isArray ? "[]" : (field.isOptional ? "None" : `${field.typeName}()`);
      const typeAnnotation = field.isOptional && !field.isArray
        ? `${pyType} | None`
        : pyType;
      lines.push(indent(`self.${field.fieldName}: ${typeAnnotation} = ${pyDefault}`, 2));
    }
  }

  // Methods
  for (const method of cls.methods) {
    lines.push("");
    const prefix = visibilityPrefix(method.visibility);
    const ret = toPythonType(method.returnType);
    const params = method.params.length > 0 ? `, ${formatParams(method.params)}` : "";

    if (method.isAbstract) {
      lines.push(indent("@abstractmethod", 1));
      lines.push(indent(`def ${prefix}${method.name}(self${params}) -> ${ret}:`, 1));
      lines.push(indent('"""TODO: implement in subclass"""', 2));
      lines.push(indent("...", 2));
    } else {
      lines.push(indent(`def ${prefix}${method.name}(self${params}) -> ${ret}:`, 1));
      lines.push(indent("# TODO: implement", 2));
      lines.push(indent("...", 2));
    }
  }

  return lines.join("\n");
}

function generateInterface(
  cls: UMLClass,
  inheritInfo: { extends: string[]; implements: string[] },
  compositionFields: Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>,
): string {
  const lines: string[] = [];

  // In Python, interfaces are modeled as ABCs with abstract methods
  const bases = [...inheritInfo.extends, ...inheritInfo.implements];
  if (!bases.includes("ABC")) {
    bases.unshift("ABC");
  }
  const basesStr = bases.join(", ");

  lines.push(`class ${cls.name}(${basesStr}):`);
  lines.push(indent(`"""Interface: ${cls.name}"""`, 1));

  const hasContent = cls.attributes.length > 0 || cls.methods.length > 0 || compositionFields.length > 0;
  if (!hasContent) {
    lines.push(indent("pass", 1));
    return lines.join("\n");
  }

  // Properties for attributes (interface = abstract properties with @property)
  for (const attr of cls.attributes) {
    lines.push("");
    const pyType = toPythonType(attr.type);
    lines.push(indent("@property", 1));
    lines.push(indent("@abstractmethod", 1));
    lines.push(indent(`def ${attr.name}(self) -> ${pyType}:`, 1));
    lines.push(indent("...", 2));
  }

  // Properties for composition fields
  for (const field of compositionFields) {
    lines.push("");
    const pyType = field.isArray ? `list[${field.typeName}]` : field.typeName;
    lines.push(indent("@property", 1));
    lines.push(indent("@abstractmethod", 1));
    lines.push(indent(`def ${field.fieldName}(self) -> ${pyType}:`, 1));
    lines.push(indent("...", 2));
  }

  // Abstract methods
  for (const method of cls.methods) {
    lines.push("");
    const ret = toPythonType(method.returnType);
    const params = method.params.length > 0 ? `, ${formatParams(method.params)}` : "";
    lines.push(indent("@abstractmethod", 1));
    lines.push(indent(`def ${method.name}(self${params}) -> ${ret}:`, 1));
    lines.push(indent("...", 2));
  }

  return lines.join("\n");
}

function generateClass(
  cls: UMLClass,
  inheritInfo: { extends: string[]; implements: string[] },
  compositionFields: Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>,
): string {
  const lines: string[] = [];

  const bases = [...inheritInfo.extends, ...inheritInfo.implements];
  const basesStr = bases.length > 0 ? `(${bases.join(", ")})` : "";

  lines.push(`@dataclass`);
  lines.push(`class ${cls.name}${basesStr}:`);
  lines.push(indent(`"""Class: ${cls.name}"""`, 1));

  const hasContent = cls.attributes.length > 0 || cls.methods.length > 0 || compositionFields.length > 0;
  if (!hasContent) {
    lines.push(indent("pass", 1));
    return lines.join("\n");
  }

  // Dataclass fields
  for (const attr of cls.attributes) {
    const prefix = visibilityPrefix(attr.visibility);
    const pyType = toPythonType(attr.type);
    const pyDefault = toPythonDefault(attr.type);
    lines.push(indent(`${prefix}${attr.name}: ${pyType} = ${pyDefault}`, 1));
  }

  // Composition/aggregation fields
  for (const field of compositionFields) {
    const pyType = field.isArray ? `list[${field.typeName}]` : field.typeName;
    if (field.isArray) {
      lines.push(indent(`${field.fieldName}: ${pyType} = field(default_factory=list)`, 1));
    } else if (field.isOptional) {
      lines.push(indent(`${field.fieldName}: ${pyType} | None = None`, 1));
    } else {
      lines.push(indent(`${field.fieldName}: ${pyType} = field(default_factory=${field.typeName})`, 1));
    }
  }

  // Methods
  for (const method of cls.methods) {
    lines.push("");
    const prefix = visibilityPrefix(method.visibility);
    const ret = toPythonType(method.returnType);
    const params = method.params.length > 0 ? `, ${formatParams(method.params)}` : "";
    lines.push(indent(`def ${prefix}${method.name}(self${params}) -> ${ret}:`, 1));
    lines.push(indent("# TODO: implement", 2));
    lines.push(indent("...", 2));
  }

  return lines.join("\n");
}

// -- Main export --------------------------------------------------

/**
 * Generate Python source code from a UML class diagram.
 *
 * Uses `@dataclass` for concrete classes, `ABC` + `@abstractmethod` for
 * abstract classes and interfaces, and `Enum` for enumerations.
 * Includes `from __future__ import annotations`, type hints, docstrings,
 * `@property` for interface attributes, and composition/aggregation fields.
 * Output is sorted: enums first, then interfaces, abstract, classes.
 *
 * @param classes - Array of UML classes to generate code for.
 * @param relationships - Array of relationships (inheritance, realization, composition, etc.).
 * @returns A single string containing all generated Python code with import header.
 *
 * @example
 * ```ts
 * const code = generatePython(diagram.classes, diagram.relationships);
 * console.log(code);
 * // "from __future__ import annotations\nfrom abc import ABC, abstractmethod\n..."
 * ```
 */
export function generatePython(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): string {
  if (classes.length === 0) return "# No classes in the diagram";

  const inheritMap = buildInheritanceMap(classes, relationships);
  const compositionMap = buildCompositionMap(classes, relationships);

  // Collect which imports are needed
  const needsABC =
    classes.some((c) => c.stereotype === "abstract" || c.stereotype === "interface");
  const needsEnum = classes.some((c) => c.stereotype === "enum");
  const needsDataclass = classes.some((c) => c.stereotype === "class");

  const imports: string[] = [];
  imports.push("from __future__ import annotations");
  if (needsABC) {
    imports.push("from abc import ABC, abstractmethod");
  }
  if (needsDataclass) {
    imports.push("from dataclasses import dataclass, field");
  }
  if (needsEnum) {
    imports.push("from enum import Enum, auto");
  }

  const blocks: string[] = [imports.join("\n")];

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

  for (const cls of sorted) {
    const info = inheritMap.get(cls.id) ?? { extends: [], implements: [] };
    const fields = compositionMap.get(cls.id) ?? [];

    switch (cls.stereotype) {
      case "enum":
        blocks.push(generateEnum(cls));
        break;
      case "interface":
        blocks.push(generateInterface(cls, info, fields));
        break;
      case "abstract":
        blocks.push(generateABC(cls, info, fields));
        break;
      case "class":
        blocks.push(generateClass(cls, info, fields));
        break;
    }
  }

  return blocks.join("\n\n\n");
}
