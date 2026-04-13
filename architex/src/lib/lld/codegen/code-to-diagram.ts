// -----------------------------------------------------------------
// Architex -- Code-to-Diagram Parser (LLD-017)
// -----------------------------------------------------------------
//
// Regex-based TypeScript/Python parser that extracts UML classes
// and relationships from source code.
// -----------------------------------------------------------------

import type { UMLClass, UMLAttribute, UMLMethod, UMLRelationship } from "../types";

// -- Constants ---------------------------------------------------

/** Maximum input size in bytes (100 KB). */
const MAX_INPUT_LENGTH = 100 * 1024;

/** Maximum number of classes the parser will extract. */
const MAX_CLASSES = 100;

// -- Result type -------------------------------------------------

export interface ParseResult {
  classes: UMLClass[];
  relationships: UMLRelationship[];
  /** Non-fatal issues encountered during parsing. */
  warnings: string[];
}

// -- Shared helpers ----------------------------------------------

let _parseId = 0;
function nextId(prefix: string): string {
  return `${prefix}-${++_parseId}`;
}

/** Reset the ID counter (useful between independent parse calls). */
function resetIds(): void {
  _parseId = 0;
}

/** Simple grid layout: place classes in rows of `cols` columns.
 *  Returns a NEW array — does not mutate the input (LLD-160). */
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

// -- TypeScript Parser -------------------------------------------

/**
 * Parse TypeScript / JavaScript source code and extract UML classes
 * and relationships using regex heuristics.
 *
 * Handles classes, interfaces, abstract classes, and enums. Extracts
 * attributes, methods, getters/setters, and inheritance/realization
 * relationships. Auto-layouts the resulting classes in a grid.
 *
 * @param code - TypeScript/JavaScript source code string (max 100 KB).
 * @returns A `ParseResult` containing `classes`, `relationships`, and `warnings`.
 * @throws {Error} If the input exceeds 100 KB.
 *
 * @example
 * ```ts
 * const result = parseTypeScript(`
 *   interface Animal { speak(): string; }
 *   class Dog implements Animal { speak(): string { return "woof"; } }
 * `);
 * // result.classes has 2 entries, result.relationships has 1 realization
 * ```
 */
export function parseTypeScript(code: string): ParseResult {
  if (code.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input too large: ${(code.length / 1024).toFixed(1)} KB exceeds the ${MAX_INPUT_LENGTH / 1024} KB limit. Trim your source code and try again.`,
    );
  }

  resetIds();

  const classes: UMLClass[] = [];
  const relationships: UMLRelationship[] = [];
  const warnings: string[] = [];
  const nameToId = new Map<string, string>();

  // Parse enums first
  parseTypeScriptEnums(code, classes, nameToId);

  // Match class / interface / abstract class declarations with their body
  // We use a brace-counting approach to correctly capture the body.
  const declarationRe =
    /(?:export\s+)?(?:(abstract)\s+)?(class|interface)\s+(\w+)(?:<[^>]*>)?(?:\s+extends\s+([\w,\s<>]+?))?(?:\s+implements\s+([\w,\s<>]+?))?\s*\{/g;

  let match: RegExpExecArray | null;
  while ((match = declarationRe.exec(code)) !== null) {
    if (classes.length >= MAX_CLASSES) {
      warnings.push(
        `Class limit reached: only the first ${MAX_CLASSES} classes were parsed. ${classes.length} found so far; remaining declarations were skipped.`,
      );
      break;
    }

    const isAbstract = match[1] === "abstract";
    const kind = match[2] as "class" | "interface";
    const name = match[3];
    const extendsRaw = match[4] || "";
    const implementsRaw = match[5] || "";

    // Extract body by counting braces
    const bodyStart = match.index + match[0].length;
    let body: string;
    try {
      body = extractBracedBody(code, bodyStart);
    } catch (e) {
      const lineNum = code.slice(0, match.index).split("\n").length;
      warnings.push(
        `Failed to parse body of "${name}" near line ${lineNum}: ${e instanceof Error ? e.message : String(e)}`,
      );
      continue;
    }

    const stereotype: UMLClass["stereotype"] = kind === "interface"
      ? "interface"
      : isAbstract
        ? "abstract"
        : "class";

    const id = nextId("ts");
    nameToId.set(name, id);

    // Parse attributes and methods from the body
    const attributes = [...parseTsAttributes(body), ...parseTsGetters(body)];
    const methods = parseTsMethods(body);

    classes.push({
      id,
      name,
      stereotype,
      attributes,
      methods,
      x: 0,
      y: 0,
    });

    // Relationships: extends
    if (extendsRaw.trim()) {
      for (const parent of splitGenerics(extendsRaw)) {
        const parentName = parent.trim();
        if (parentName) {
          relationships.push({
            id: nextId("rel"),
            source: id,
            target: parentName, // resolved later
            type: "inheritance",
          });
        }
      }
    }

    // Relationships: implements
    if (implementsRaw.trim()) {
      for (const iface of splitGenerics(implementsRaw)) {
        const ifaceName = iface.trim();
        if (ifaceName) {
          relationships.push({
            id: nextId("rel"),
            source: id,
            target: ifaceName, // resolved later
            type: "realization",
          });
        }
      }
    }
  }

  // Resolve relationship targets from name -> id
  for (const rel of relationships) {
    if (nameToId.has(rel.target)) {
      rel.target = nameToId.get(rel.target)!;
    }
  }
  // Remove relationships whose target was not found as a parsed class
  const validIds = new Set(classes.map((c) => c.id));
  const resolved = relationships.filter(
    (r) => validIds.has(r.source) && validIds.has(r.target),
  );

  if (classes.length === 0) {
    warnings.push(
      "No TypeScript classes, interfaces, or enums were found. Make sure the code contains class/interface/enum declarations.",
    );
  }

  const laid = autoLayout(classes);

  return { classes: laid, relationships: resolved, warnings };
}

/**
 * Alias for `parseTypeScript`, used by the bidirectional sync API.
 *
 * @param code - TypeScript/JavaScript source code string.
 * @returns A `ParseResult` with classes, relationships, and warnings.
 */
export const parseTypeScriptClasses = parseTypeScript;

/** Parse TypeScript enum declarations. */
function parseTypeScriptEnums(
  code: string,
  classes: UMLClass[],
  nameToId: Map<string, string>,
): void {
  const enumRe = /(?:export\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = enumRe.exec(code)) !== null) {
    const name = m[1];
    const body = m[2];
    const id = nextId("ts");
    nameToId.set(name, id);

    // Parse enum members
    const members = body
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/\s*=.*$/, ""));

    const attributes: UMLAttribute[] = members.map((member) => ({
      id: nextId("attr"),
      name: member,
      type: "",
      visibility: "+" as const,
    }));

    classes.push({
      id,
      name,
      stereotype: "enum",
      attributes,
      methods: [],
      x: 0,
      y: 0,
    });
  }
}

/** Split a comma-separated list that may contain generic parameters. */
function splitGenerics(raw: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of raw) {
    if (ch === "<") depth++;
    if (ch === ">") depth--;
    if (ch === "," && depth === 0) {
      results.push(current.replace(/<.*>/, "").trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    results.push(current.replace(/<.*>/, "").trim());
  }
  return results;
}

/** Extract the body between balanced braces starting right after the opening brace. */
function extractBracedBody(code: string, start: number): string {
  let depth = 1;
  let i = start;
  while (i < code.length && depth > 0) {
    if (code[i] === "{") depth++;
    if (code[i] === "}") depth--;
    i++;
  }
  return code.slice(start, i - 1);
}

function tsVisibility(modifier: string | undefined): UMLAttribute["visibility"] {
  switch (modifier) {
    case "private":
      return "-";
    case "protected":
      return "#";
    case "public":
      return "+";
    default:
      return "+";
  }
}

function parseTsAttributes(body: string): UMLAttribute[] {
  const attrs: UMLAttribute[] = [];
  // Match property declarations like:
  //   private name: string;
  //   readonly count: number = 0;
  //   public items: Item[];
  const propRe =
    /^\s*(?:(public|private|protected)\s+)?(?:readonly\s+)?(\w+)\s*[?!]?\s*:\s*([^;=]+?)(?:\s*=\s*[^;]+)?;/gm;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(body)) !== null) {
    attrs.push({
      id: nextId("attr"),
      name: m[2],
      type: m[3].trim(),
      visibility: tsVisibility(m[1]),
    });
  }
  return attrs;
}

function parseTsMethods(body: string): UMLMethod[] {
  const methods: UMLMethod[] = [];
  // Match method declarations like:
  //   public getData(id: string): Promise<Data> { ... }
  //   abstract process(): void;
  //   getName(): string;
  //   private helper(a: number, b: number): boolean;
  const methodRe =
    /^\s*(?:(public|private|protected)\s+)?(?:(abstract)\s+)?(\w+)\s*\(([^)]*)\)\s*:\s*([^{;]+)/gm;
  let m: RegExpExecArray | null;
  while ((m = methodRe.exec(body)) !== null) {
    const name = m[3];
    // Skip constructor or things that look like property assignments
    if (name === "constructor") continue;
    const params = m[4]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    methods.push({
      id: nextId("meth"),
      name,
      returnType: m[5].trim().replace(/\s*\{?\s*$/, ""),
      params,
      visibility: tsVisibility(m[1]),
      isAbstract: m[2] === "abstract",
    });
  }

  // Match setter declarations like:
  //   set name(value: string) { ... }
  //   public set title(val: string) { ... }
  const setterRe =
    /^\s*(?:(public|private|protected)\s+)?set\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*\w+)?\s*[{;]/gm;
  let sm: RegExpExecArray | null;
  while ((sm = setterRe.exec(body)) !== null) {
    const name = sm[2];
    const params = sm[3]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    methods.push({
      id: nextId("meth"),
      name: `set ${name}`,
      returnType: "void",
      params,
      visibility: tsVisibility(sm[1]),
    });
  }

  return methods;
}

/**
 * Parse TypeScript getter declarations as attributes (read-only properties).
 * Getters like `get name(): string { ... }` are treated as attributes.
 */
function parseTsGetters(body: string): UMLAttribute[] {
  const attrs: UMLAttribute[] = [];
  // Match getter declarations like:
  //   get name(): string { ... }
  //   public get title(): string { ... }
  const getterRe =
    /^\s*(?:(public|private|protected)\s+)?get\s+(\w+)\s*\(\)\s*:\s*([^{;]+)/gm;
  let m: RegExpExecArray | null;
  while ((m = getterRe.exec(body)) !== null) {
    attrs.push({
      id: nextId("attr"),
      name: `${m[2]} «get»`,
      type: m[3].trim().replace(/\s*\{?\s*$/, ""),
      visibility: tsVisibility(m[1]),
    });
  }
  return attrs;
}

// -- Python Parser -----------------------------------------------

/**
 * Parse Python source code and extract UML classes and relationships
 * using regex heuristics.
 *
 * Handles regular classes, abstract classes (ABC), enums, `@property`
 * decorators, `@staticmethod`, and `@abstractmethod`. Extracts
 * `self.*` attributes from method bodies. Auto-layouts the results.
 *
 * @param code - Python source code string (max 100 KB).
 * @returns A `ParseResult` containing `classes`, `relationships`, and `warnings`.
 * @throws {Error} If the input exceeds 100 KB.
 *
 * @example
 * ```ts
 * const result = parsePython(`
 * class Animal(ABC):
 *     @abstractmethod
 *     def speak(self) -> str: ...
 *
 * class Dog(Animal):
 *     def speak(self) -> str:
 *         return "woof"
 * `);
 * // result.classes has 2 entries, result.relationships has 1 inheritance
 * ```
 */
export function parsePython(code: string): ParseResult {
  if (code.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input too large: ${(code.length / 1024).toFixed(1)} KB exceeds the ${MAX_INPUT_LENGTH / 1024} KB limit. Trim your source code and try again.`,
    );
  }

  resetIds();

  const classes: UMLClass[] = [];
  const relationships: UMLRelationship[] = [];
  const warnings: string[] = [];
  const nameToId = new Map<string, string>();

  // Match class declarations: class Foo(Parent, ABC):
  const classRe = /^class\s+(\w+)(?:\(([^)]*)\))?\s*:/gm;

  let match: RegExpExecArray | null;
  while ((match = classRe.exec(code)) !== null) {
    if (classes.length >= MAX_CLASSES) {
      warnings.push(
        `Class limit reached: only the first ${MAX_CLASSES} classes were parsed. Remaining declarations were skipped.`,
      );
      break;
    }

    const name = match[1];
    const parentsRaw = match[2] || "";
    const bodyStart = match.index + match[0].length;

    // Extract body by indentation
    let body: string;
    try {
      body = extractPythonBody(code, bodyStart);
    } catch (e) {
      const lineNum = code.slice(0, match.index).split("\n").length;
      warnings.push(
        `Failed to parse body of "${name}" near line ${lineNum}: ${e instanceof Error ? e.message : String(e)}`,
      );
      continue;
    }

    // Check if abstract (inherits ABC or ABCMeta or has abstractmethod)
    const parents = parentsRaw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const isAbstract =
      parents.some((p) => p === "ABC" || p === "ABCMeta" || p.includes("metaclass=ABCMeta")) ||
      body.includes("@abstractmethod");

    // Check if enum
    const isEnum = parents.some((p) => p === "Enum");

    // Determine stereotype
    let stereotype: UMLClass["stereotype"];
    if (isEnum) {
      stereotype = "enum";
    } else if (isAbstract) {
      stereotype = "abstract";
    } else {
      stereotype = "class";
    }

    const id = nextId("py");
    nameToId.set(name, id);

    // Parse members (include @property-decorated methods as attributes)
    const attributes = isEnum
      ? parsePyEnumMembers(body)
      : [...parsePyAttributes(body), ...parsePyPropertyDecorators(body)];
    const methods = isEnum ? [] : parsePyMethods(body);

    classes.push({
      id,
      name,
      stereotype,
      attributes,
      methods,
      x: 0,
      y: 0,
    });

    // Inheritance relationships from parents
    for (const parent of parents) {
      // Skip metaclass= and ABC / ABCMeta / Enum (they are marker bases)
      if (
        parent.startsWith("metaclass=") ||
        parent === "ABC" ||
        parent === "ABCMeta" ||
        parent === "Enum"
      ) {
        continue;
      }
      relationships.push({
        id: nextId("rel"),
        source: id,
        target: parent,
        type: "inheritance",
      });
    }
  }

  // Resolve targets
  for (const rel of relationships) {
    if (nameToId.has(rel.target)) {
      rel.target = nameToId.get(rel.target)!;
    }
  }
  const validIds = new Set(classes.map((c) => c.id));
  const resolved = relationships.filter(
    (r) => validIds.has(r.source) && validIds.has(r.target),
  );

  if (classes.length === 0) {
    warnings.push(
      "No Python classes were found. Make sure the code contains class declarations at the module level.",
    );
  }

  const laid = autoLayout(classes);

  return { classes: laid, relationships: resolved, warnings };
}

/** Extract a Python block body based on indentation. */
function extractPythonBody(code: string, start: number): string {
  const lines = code.slice(start).split("\n");
  const bodyLines: string[] = [];
  let baseIndent: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip blank lines at the start
    if (baseIndent === null) {
      if (line.trim() === "") continue;
      // Determine base indentation
      const leadingMatch = line.match(/^(\s+)/);
      if (!leadingMatch) break; // no indent means end of class immediately
      baseIndent = leadingMatch[1].length;
      bodyLines.push(line);
      continue;
    }

    // A non-blank line with less indentation ends the body
    if (line.trim() !== "") {
      const leadingMatch = line.match(/^(\s+)/);
      if (!leadingMatch || leadingMatch[1].length < baseIndent) {
        break;
      }
    }
    bodyLines.push(line);
  }

  return bodyLines.join("\n");
}

function pyVisibility(name: string): UMLAttribute["visibility"] {
  if (name.startsWith("__") && !name.endsWith("__")) return "-";
  if (name.startsWith("_")) return "#";
  return "+";
}

function parsePyAttributes(body: string): UMLAttribute[] {
  const attrs: UMLAttribute[] = [];
  const seen = new Set<string>();

  // Match self.xxx = ... in __init__ or elsewhere
  const selfRe = /self\.(\w+)\s*(?::\s*(\w[\w\[\],\s]*))?/g;
  let m: RegExpExecArray | null;
  while ((m = selfRe.exec(body)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    attrs.push({
      id: nextId("attr"),
      name,
      type: m[2] ? m[2].trim() : "",
      visibility: pyVisibility(name),
    });
  }

  return attrs;
}

/** Parse Python enum members (NAME = value). */
function parsePyEnumMembers(body: string): UMLAttribute[] {
  const attrs: UMLAttribute[] = [];
  const memberRe = /^\s+(\w+)\s*=/gm;
  let m: RegExpExecArray | null;
  while ((m = memberRe.exec(body)) !== null) {
    const name = m[1];
    // Skip dunder methods and regular functions
    if (name.startsWith("_")) continue;
    attrs.push({
      id: nextId("attr"),
      name,
      type: "",
      visibility: "+",
    });
  }
  return attrs;
}

function parsePyMethods(body: string): UMLMethod[] {
  const methods: UMLMethod[] = [];
  // Match def method_name(self, ...): or def method_name(cls, ...):
  // Allow multiple decorator lines before def (e.g. @property, @staticmethod, @abstractmethod)
  const methodRe = /^\s*(?:@\w+(?:\.\w+)?\s*\n\s*)*def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = methodRe.exec(body)) !== null) {
    const name = m[1];
    if (name === "__init__") continue; // skip constructor
    const rawParams = m[2]
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p && p !== "self" && p !== "cls");
    const isAbstract = isDecoratedAbstract(body, m.index);
    const hasProperty = isDecoratedWith(body, m.index, "property");
    const hasStaticmethod = isDecoratedWith(body, m.index, "staticmethod");

    // @property decorated methods are treated as attributes, not methods
    // They will be collected separately by parsePyPropertyDecorators
    if (hasProperty) continue;

    methods.push({
      id: nextId("meth"),
      name: hasStaticmethod ? `${name} «static»` : name,
      returnType: m[3] || "",
      params: rawParams,
      visibility: pyVisibility(name),
      isAbstract,
    });
  }
  return methods;
}

/** Check whether the method at `offset` in `body` has a specific decorator. */
function isDecoratedWith(body: string, offset: number, decorator: string): boolean {
  const preceding = body.slice(Math.max(0, offset - 200), offset);
  const lines = preceding.split("\n").reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed === `@${decorator}`) return true;
    // Also match decorators like @name.setter
    if (trimmed.startsWith(`@${decorator}`)) return true;
    // Stop at first non-decorator, non-empty line
    if (!trimmed.startsWith("@")) break;
  }
  return false;
}

/** Parse Python @property-decorated methods as attributes. */
function parsePyPropertyDecorators(body: string): UMLAttribute[] {
  const attrs: UMLAttribute[] = [];
  const methodRe = /^\s*(?:@\w+(?:\.\w+)?\s*\n\s*)*def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = methodRe.exec(body)) !== null) {
    const name = m[1];
    if (name === "__init__") continue;
    if (isDecoratedWith(body, m.index, "property")) {
      attrs.push({
        id: nextId("attr"),
        name: `${name} «property»`,
        type: m[3] || "",
        visibility: pyVisibility(name),
      });
    }
  }
  return attrs;
}

/** Check whether the method at `offset` in `body` has an @abstractmethod decorator. */
function isDecoratedAbstract(body: string, offset: number): boolean {
  // Look backwards from the def for @abstractmethod on preceding lines
  const preceding = body.slice(Math.max(0, offset - 100), offset);
  const lines = preceding.split("\n").reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("@abstractmethod")) return true;
    // Any other non-empty line means the decorator block ended
    break;
  }
  return false;
}
