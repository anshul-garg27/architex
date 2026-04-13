// -----------------------------------------------------------------
// Architex -- Diagram-to-TypeScript Code Generation (LLD-014)
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "../types";

// -- Helpers ------------------------------------------------------

const VISIBILITY_KEYWORD: Record<string, string> = {
  "+": "public",
  "-": "private",
  "#": "protected",
  "~": "/* package */",
};

function indent(text: string, level: number): string {
  return "  ".repeat(level) + text;
}

function formatParams(params: string[]): string {
  return params
    .map((p) => {
      // Handle "name: Type" already formatted
      if (p.includes(":")) return p;
      // Plain name -- leave untyped
      return p;
    })
    .join(", ");
}

/**
 * Build a lookup: classId -> list of relationship info relevant for extends/implements.
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
 * Build a lookup: classId -> list of composition/aggregation member fields
 * that should be generated as typed properties.
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

    // Determine if the field should be an array based on cardinality
    const isMany = rel.targetCardinality === "*" ||
      rel.targetCardinality === "0..*" ||
      rel.targetCardinality === "1..*";
    const isOptional = rel.type === "aggregation";

    // Use the label as field name if provided, otherwise derive from target name
    const fieldName = rel.label ||
      (isMany
        ? targetName.charAt(0).toLowerCase() + targetName.slice(1) + "s"
        : targetName.charAt(0).toLowerCase() + targetName.slice(1));

    entry.push({
      fieldName,
      typeName: targetName,
      isArray: isMany,
      isOptional,
    });
  }

  return map;
}

/**
 * Build an import map: for each class, determine which other class names
 * it needs to import (from extends, implements, and composition).
 */
function buildImportMap(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): Map<string, string[]> {
  const nameById = new Map<string, string>();
  for (const c of classes) {
    nameById.set(c.id, c.name);
  }

  const map = new Map<string, string[]>();
  for (const c of classes) {
    map.set(c.id, []);
  }

  for (const rel of relationships) {
    const entry = map.get(rel.source);
    if (!entry) continue;
    const targetName = nameById.get(rel.target);
    if (!targetName) continue;
    if (!entry.includes(targetName)) {
      entry.push(targetName);
    }
  }

  return map;
}

// -- Generators per stereotype ------------------------------------

function generateEnum(cls: UMLClass): string {
  const lines: string[] = [];
  lines.push(`/** Enum: ${cls.name} */`);
  lines.push(`export enum ${cls.name} {`);

  for (const attr of cls.attributes) {
    lines.push(indent(`${attr.name},`, 1));
  }

  lines.push("}");
  return lines.join("\n");
}

function generateInterface(
  cls: UMLClass,
  inheritInfo: { extends: string[]; implements: string[] },
  compositionFields: Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>,
): string {
  const lines: string[] = [];
  lines.push(`/** Interface: ${cls.name} */`);

  let decl = `export interface ${cls.name}`;
  // Interfaces can extend other interfaces
  const extendsAll = [...inheritInfo.extends, ...inheritInfo.implements];
  if (extendsAll.length > 0) {
    decl += ` extends ${extendsAll.join(", ")}`;
  }
  decl += " {";
  lines.push(decl);

  // Attributes as properties
  for (const attr of cls.attributes) {
    const type = attr.type || "unknown";
    const readonly = attr.visibility === "-" ? "readonly " : "";
    lines.push(indent(`${readonly}${attr.name}: ${type};`, 1));
  }

  // Composition/aggregation member fields
  for (const field of compositionFields) {
    const type = field.isArray ? `${field.typeName}[]` : field.typeName;
    const opt = field.isOptional ? "?" : "";
    lines.push(indent(`${field.fieldName}${opt}: ${type};`, 1));
  }

  // Methods as signatures
  for (const method of cls.methods) {
    const ret = method.returnType || "void";
    const params = formatParams(method.params);
    lines.push(indent(`${method.name}(${params}): ${ret};`, 1));
  }

  lines.push("}");
  return lines.join("\n");
}

function generateClassOrAbstract(
  cls: UMLClass,
  inheritInfo: { extends: string[]; implements: string[] },
  compositionFields: Array<{ fieldName: string; typeName: string; isArray: boolean; isOptional: boolean }>,
): string {
  const lines: string[] = [];
  const isAbstract = cls.stereotype === "abstract";

  lines.push(`/** ${isAbstract ? "Abstract class" : "Class"}: ${cls.name} */`);

  let decl = "export ";
  if (isAbstract) decl += "abstract ";
  decl += `class ${cls.name}`;

  if (inheritInfo.extends.length > 0) {
    decl += ` extends ${inheritInfo.extends[0]}`;
  }
  if (inheritInfo.implements.length > 0) {
    decl += ` implements ${inheritInfo.implements.join(", ")}`;
  }
  decl += " {";
  lines.push(decl);

  // Attributes as typed properties with visibility
  for (const attr of cls.attributes) {
    const vis = VISIBILITY_KEYWORD[attr.visibility] ?? "public";
    const type = attr.type || "unknown";
    lines.push(indent(`${vis} ${attr.name}: ${type};`, 1));
  }

  // Composition/aggregation member fields
  for (const field of compositionFields) {
    const type = field.isArray ? `${field.typeName}[]` : field.typeName;
    const vis = field.isOptional ? "public" : "private";
    lines.push(indent(`${vis} ${field.fieldName}: ${type};`, 1));
  }

  if ((cls.attributes.length > 0 || compositionFields.length > 0) && cls.methods.length > 0) {
    lines.push("");
  }

  // Methods
  for (const method of cls.methods) {
    const vis = VISIBILITY_KEYWORD[method.visibility] ?? "public";
    const ret = method.returnType || "void";
    const params = formatParams(method.params);
    const abstractKw = method.isAbstract ? "abstract " : "";

    if (method.isAbstract) {
      lines.push(indent(`${vis} ${abstractKw}${method.name}(${params}): ${ret};`, 1));
    } else {
      lines.push(indent(`${vis} ${method.name}(${params}): ${ret} {`, 1));
      lines.push(indent("// TODO: implement", 2));
      lines.push(indent("}", 1));
    }
  }

  lines.push("}");
  return lines.join("\n");
}

// -- Import generation --------------------------------------------

/**
 * Generate import statements for a class, referencing other classes
 * it depends on. Each class is assumed to live in its own file.
 */
function generateImportBlock(
  className: string,
  imports: string[],
  allClasses: UMLClass[],
): string {
  if (imports.length === 0) return "";

  const lines: string[] = [];
  for (const dep of imports) {
    const depClass = allClasses.find((c) => c.name === dep);
    if (!depClass) continue;
    const isType = depClass.stereotype === "interface" || depClass.stereotype === "enum";
    const keyword = isType ? "import type" : "import";
    const fileName = dep.replace(/([A-Z])/g, (m, p1, i) =>
      i > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase(),
    );
    lines.push(`${keyword} { ${dep} } from "./${fileName}";`);
  }
  return lines.join("\n");
}

// -- Main export --------------------------------------------------

/**
 * Generate TypeScript source code from a UML class diagram.
 *
 * Converts all stereotypes (class, interface, abstract, enum) into
 * idiomatic TypeScript with visibility keywords, typed properties,
 * `extends`/`implements` clauses, and composition member fields.
 * Output is sorted: enums first, then interfaces, abstract, classes.
 *
 * @param classes - Array of UML classes to generate code for.
 * @param relationships - Array of relationships (inheritance, realization, composition, etc.).
 * @returns A single string containing all generated TypeScript code.
 *
 * @example
 * ```ts
 * const code = generateTypeScript(diagram.classes, diagram.relationships);
 * console.log(code); // "export interface IAnimal { ... }\nexport class Dog extends ..."
 * ```
 */
export function generateTypeScript(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): string {
  if (classes.length === 0) return "// No classes in the diagram";

  const inheritMap = buildInheritanceMap(classes, relationships);
  const compositionMap = buildCompositionMap(classes, relationships);
  const importMap = buildImportMap(classes, relationships);
  const blocks: string[] = [];

  // Sort: enums first, then interfaces, then abstract, then classes
  // so that dependencies are declared before usage.
  const sorted = [...classes].sort((a, b) => {
    const order: Record<UMLClass["stereotype"], number> = {
      enum: 0,
      interface: 1,
      abstract: 2,
      class: 3,
    };
    return order[a.stereotype] - order[b.stereotype];
  });

  // Generate import block for the combined output
  const allImports = new Set<string>();
  for (const cls of sorted) {
    const deps = importMap.get(cls.id) ?? [];
    for (const dep of deps) {
      allImports.add(dep);
    }
  }

  // When generating a single file, imports are between classes in the
  // same file, so we add a comment about where imports would go
  // in a multi-file setup.
  if (allImports.size > 0) {
    const importLines: string[] = [];
    importLines.push("// -- Imports (in a multi-file setup) --");
    for (const cls of sorted) {
      const deps = importMap.get(cls.id) ?? [];
      if (deps.length > 0) {
        const importBlock = generateImportBlock(cls.name, deps, classes);
        if (importBlock) {
          importLines.push(`// ${cls.name}:`);
          importLines.push(importBlock);
        }
      }
    }
    blocks.push(importLines.join("\n"));
  }

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
      case "class":
        blocks.push(generateClassOrAbstract(cls, info, fields));
        break;
    }
  }

  return blocks.join("\n\n");
}

/**
 * Generate TypeScript code as separate per-class file contents.
 *
 * Each class gets its own file with appropriate import statements
 * referencing sibling classes. Filenames use kebab-case (e.g.,
 * `MyClass` becomes `my-class.ts`).
 *
 * @param classes - Array of UML classes to generate files for.
 * @param relationships - Array of relationships between classes.
 * @returns A `Map<string, string>` from filename to file content.
 *
 * @example
 * ```ts
 * const files = generateTypeScriptFiles(classes, rels);
 * for (const [name, content] of files) {
 *   console.log(`--- ${name} ---\n${content}`);
 * }
 * ```
 */
export function generateTypeScriptFiles(
  classes: UMLClass[],
  relationships: UMLRelationship[],
): Map<string, string> {
  const files = new Map<string, string>();
  if (classes.length === 0) return files;

  const inheritMap = buildInheritanceMap(classes, relationships);
  const compositionMap = buildCompositionMap(classes, relationships);
  const importMap = buildImportMap(classes, relationships);

  for (const cls of classes) {
    const info = inheritMap.get(cls.id) ?? { extends: [], implements: [] };
    const fields = compositionMap.get(cls.id) ?? [];
    const deps = importMap.get(cls.id) ?? [];

    const parts: string[] = [];

    // Import block
    const importBlock = generateImportBlock(cls.name, deps, classes);
    if (importBlock) {
      parts.push(importBlock);
    }

    // Class body
    switch (cls.stereotype) {
      case "enum":
        parts.push(generateEnum(cls));
        break;
      case "interface":
        parts.push(generateInterface(cls, info, fields));
        break;
      case "abstract":
      case "class":
        parts.push(generateClassOrAbstract(cls, info, fields));
        break;
    }

    // filename: PascalCase -> kebab-case
    const fileName = cls.name
      .replace(/([A-Z])/g, (m, p1, i) =>
        i > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase(),
      ) + ".ts";

    files.set(fileName, parts.join("\n\n") + "\n");
  }

  return files;
}
