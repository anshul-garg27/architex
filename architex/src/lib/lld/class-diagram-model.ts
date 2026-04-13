// -----------------------------------------------------------------
// Architex -- Class Diagram CRUD Model (LLD-007)
// -----------------------------------------------------------------
//
// Pure, immutable operations on ClassDiagram. Every function takes a
// diagram and returns a *new* diagram -- no mutations.
// -----------------------------------------------------------------

import type {
  ClassDiagram,
  UMLClass,
  UMLAttribute,
  UMLMethod,
  UMLRelationship,
  DesignPattern,
} from "./types";

// -- Helpers -------------------------------------------------------

/**
 * Generate a globally-unique ID with a prefix, using `crypto.randomUUID()`.
 *
 * This is the **shared** ID strategy for interactive / CRUD operations
 * (class diagram model, relationships, attributes, methods).
 *
 * The code-to-diagram parser intentionally uses a *separate* sequential
 * counter (`nextId()`) so that parsed output is deterministic across runs,
 * which simplifies snapshot testing and diff-based sync.
 */
/**
 * Generate a globally-unique ID with a prefix using `crypto.randomUUID()`.
 *
 * @param prefix - Short string prepended to the UUID (e.g., "cls", "attr", "rel").
 * @returns A string of the form `"${prefix}-${uuid}"`.
 *
 * @example
 * ```ts
 * const id = generateId("cls"); // "cls-a1b2c3d4-..."
 * ```
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

// -- Factory -------------------------------------------------------

/**
 * Create an empty class diagram with no classes or relationships.
 *
 * @returns A fresh `ClassDiagram` with empty arrays.
 */
export function createEmptyDiagram(): ClassDiagram {
  return { classes: [], relationships: [] };
}

// -- Class CRUD ----------------------------------------------------

/**
 * Add a new class to the diagram. A unique ID is generated automatically.
 *
 * @param diagram - The current diagram (not mutated).
 * @param classData - Class fields excluding `id` (name, stereotype, attributes, etc.).
 * @returns A new `ClassDiagram` containing the added class.
 */
export function addClass(
  diagram: ClassDiagram,
  classData: Omit<UMLClass, "id">,
): ClassDiagram {
  const newClass: UMLClass = { ...classData, id: generateId("cls") };
  return { ...diagram, classes: [...diagram.classes, newClass] };
}

/**
 * Remove a class and all relationships that reference it (as source or target).
 *
 * @param diagram - The current diagram (not mutated).
 * @param classId - The ID of the class to remove.
 * @returns A new `ClassDiagram` without the specified class or its relationships.
 */
export function removeClass(
  diagram: ClassDiagram,
  classId: string,
): ClassDiagram {
  return {
    classes: diagram.classes.filter((c) => c.id !== classId),
    relationships: diagram.relationships.filter(
      (r) => r.source !== classId && r.target !== classId,
    ),
  };
}

/**
 * Partial-update a class by merging the provided fields into the existing class.
 *
 * @param diagram - The current diagram (not mutated).
 * @param classId - The ID of the class to update.
 * @param updates - Partial fields to merge (e.g., `{ name: "Renamed" }`).
 * @returns A new `ClassDiagram` with the updated class.
 */
export function updateClass(
  diagram: ClassDiagram,
  classId: string,
  updates: Partial<Omit<UMLClass, "id">>,
): ClassDiagram {
  return {
    ...diagram,
    classes: diagram.classes.map((c) =>
      c.id === classId ? { ...c, ...updates } : c,
    ),
  };
}

// -- Attribute CRUD ------------------------------------------------

/**
 * Add an attribute to a class. Generates a unique ID if none is provided.
 *
 * @param diagram - The current diagram (not mutated).
 * @param classId - The ID of the class to add the attribute to.
 * @param attribute - Attribute data; `id` is optional and auto-generated if omitted.
 * @returns A new `ClassDiagram` with the attribute appended to the target class.
 */
export function addAttribute(
  diagram: ClassDiagram,
  classId: string,
  attribute: Omit<UMLAttribute, "id"> & { id?: string },
): ClassDiagram {
  const attr: UMLAttribute = { ...attribute, id: attribute.id ?? generateId("attr") };
  return {
    ...diagram,
    classes: diagram.classes.map((c) =>
      c.id === classId
        ? { ...c, attributes: [...c.attributes, attr] }
        : c,
    ),
  };
}

/**
 * Remove an attribute from a class by its ID.
 *
 * @param diagram - The current diagram (not mutated).
 * @param classId - The ID of the class containing the attribute.
 * @param attributeId - The ID of the attribute to remove.
 * @returns A new `ClassDiagram` without the specified attribute.
 */
export function removeAttribute(
  diagram: ClassDiagram,
  classId: string,
  attributeId: string,
): ClassDiagram {
  return {
    ...diagram,
    classes: diagram.classes.map((c) =>
      c.id === classId
        ? {
            ...c,
            attributes: c.attributes.filter((a) => a.id !== attributeId),
          }
        : c,
    ),
  };
}

// -- Method CRUD ---------------------------------------------------

/**
 * Add a method to a class. Generates a unique ID if none is provided.
 *
 * @param diagram - The current diagram (not mutated).
 * @param classId - The ID of the class to add the method to.
 * @param method - Method data; `id` is optional and auto-generated if omitted.
 * @returns A new `ClassDiagram` with the method appended to the target class.
 */
export function addMethod(
  diagram: ClassDiagram,
  classId: string,
  method: Omit<UMLMethod, "id"> & { id?: string },
): ClassDiagram {
  const m: UMLMethod = { ...method, id: method.id ?? generateId("mth") };
  return {
    ...diagram,
    classes: diagram.classes.map((c) =>
      c.id === classId
        ? { ...c, methods: [...c.methods, m] }
        : c,
    ),
  };
}

/**
 * Remove a method from a class by its ID.
 *
 * @param diagram - The current diagram (not mutated).
 * @param classId - The ID of the class containing the method.
 * @param methodId - The ID of the method to remove.
 * @returns A new `ClassDiagram` without the specified method.
 */
export function removeMethod(
  diagram: ClassDiagram,
  classId: string,
  methodId: string,
): ClassDiagram {
  return {
    ...diagram,
    classes: diagram.classes.map((c) =>
      c.id === classId
        ? { ...c, methods: c.methods.filter((m) => m.id !== methodId) }
        : c,
    ),
  };
}

// -- Relationship CRUD ---------------------------------------------

/**
 * Add a relationship between two classes. Generates a unique ID if none is provided.
 *
 * @param diagram - The current diagram (not mutated).
 * @param relationship - Relationship data with source/target class IDs; `id` is optional.
 * @returns A new `ClassDiagram` with the relationship appended.
 */
export function addRelationship(
  diagram: ClassDiagram,
  relationship: Omit<UMLRelationship, "id"> & { id?: string },
): ClassDiagram {
  const rel: UMLRelationship = {
    ...relationship,
    id: relationship.id ?? generateId("rel"),
  };
  return {
    ...diagram,
    relationships: [...diagram.relationships, rel],
  };
}

/**
 * Remove a relationship from the diagram by its ID.
 *
 * @param diagram - The current diagram (not mutated).
 * @param relationshipId - The ID of the relationship to remove.
 * @returns A new `ClassDiagram` without the specified relationship.
 */
export function removeRelationship(
  diagram: ClassDiagram,
  relationshipId: string,
): ClassDiagram {
  return {
    ...diagram,
    relationships: diagram.relationships.filter(
      (r) => r.id !== relationshipId,
    ),
  };
}

// -- Validation ----------------------------------------------------

export interface DiagramValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a class diagram for common issues: duplicate class names,
 * dangling relationship endpoints, and self-relationships.
 *
 * @param diagram - The diagram to validate.
 * @returns An object with `valid: boolean` and an `errors: string[]` array describing each issue.
 *
 * @example
 * ```ts
 * const result = validateDiagram(myDiagram);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateDiagram(
  diagram: ClassDiagram,
): DiagramValidationResult {
  const errors: string[] = [];
  const classNameById = new Map<string, string>();
  for (const cls of diagram.classes) {
    classNameById.set(cls.id, cls.name);
  }

  // 1. No duplicate class names
  const nameCount = new Map<string, number>();
  for (const cls of diagram.classes) {
    nameCount.set(cls.name, (nameCount.get(cls.name) ?? 0) + 1);
  }
  for (const [name, count] of nameCount) {
    if (count > 1) {
      const dupeIds = diagram.classes
        .filter((c) => c.name === name)
        .map((c) => c.id);
      errors.push(
        `Duplicate class name: "${name}" appears ${count} times (IDs: ${dupeIds.join(", ")}). ` +
          `Rename one of them or remove the duplicate to fix this.`,
      );
    }
  }

  // 2. Relationship endpoints must reference existing classes
  const classIds = new Set(diagram.classes.map((c) => c.id));
  const validClassList =
    diagram.classes.length > 0
      ? diagram.classes.map((c) => `"${c.name}" (${c.id})`).join(", ")
      : "(none)";

  for (const rel of diagram.relationships) {
    if (!classIds.has(rel.source)) {
      errors.push(
        `Relationship "${rel.id}" (type: ${rel.type}) references non-existent source class "${rel.source}". ` +
          `Available classes: ${validClassList}. ` +
          `Did you forget to add the source class, or was it removed?`,
      );
    }
    if (!classIds.has(rel.target)) {
      errors.push(
        `Relationship "${rel.id}" (type: ${rel.type}) references non-existent target class "${rel.target}". ` +
          `Available classes: ${validClassList}. ` +
          `Did you forget to add the target class, or was it removed?`,
      );
    }
  }

  // 3. No self-relationships
  for (const rel of diagram.relationships) {
    if (rel.source === rel.target) {
      const className = classNameById.get(rel.source) ?? rel.source;
      errors.push(
        `Relationship "${rel.id}" is a self-relationship on class "${className}" (${rel.source}). ` +
          `A ${rel.type} relationship should connect two different classes. ` +
          `If you need recursive structure, model it with a separate child class.`,
      );
    }
  }

  // 4. Classes with no attributes and no methods (dev hint)
  if (process.env.NODE_ENV === "development") {
    for (const cls of diagram.classes) {
      if (cls.attributes.length === 0 && cls.methods.length === 0) {
        errors.push(
          `[dev] Class "${cls.name}" (${cls.id}) has no attributes and no methods. ` +
            `This may be intentional for a marker interface, but most classes should have at least one member.`,
        );
      }
    }

    // 5. Orphan classes (no relationships)
    const connectedIds = new Set<string>();
    for (const rel of diagram.relationships) {
      connectedIds.add(rel.source);
      connectedIds.add(rel.target);
    }
    for (const cls of diagram.classes) {
      if (diagram.classes.length > 1 && !connectedIds.has(cls.id)) {
        errors.push(
          `[dev] Class "${cls.name}" (${cls.id}) is not connected to any other class via relationships. ` +
            `Consider adding an association, dependency, or inheritance relationship.`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pattern Content Validation (LLD-169) ---------------------------------

/**
 * Validate that a DesignPattern object has all required fields populated.
 * Returns an array of human-readable warning strings. An empty array means
 * the pattern is fully valid.
 *
 * This is intended for development-mode content checks (e.g., CI, dev
 * tooling) rather than runtime validation.
 *
 * @param pattern - The DesignPattern to validate.
 * @returns An array of warning strings describing missing or empty fields.
 *
 * @example
 * ```ts
 * const warnings = validatePatternContent(myPattern);
 * if (warnings.length > 0) {
 *   console.warn("Pattern issues:", warnings);
 * }
 * ```
 */
export function validatePatternContent(pattern: DesignPattern): string[] {
  const warnings: string[] = [];
  const name = pattern.name || pattern.id || "(unknown)";

  // -- Required string fields --
  if (!pattern.id) {
    warnings.push(`Pattern "${name}" has no id`);
  }
  if (!pattern.name) {
    warnings.push(`Pattern "${pattern.id}" has no name`);
  }
  if (!pattern.description) {
    warnings.push(`Pattern "${name}" has no description`);
  }
  if (!pattern.analogy) {
    warnings.push(`Pattern "${name}" has no analogy`);
  }
  if (!pattern.tradeoffs) {
    warnings.push(`Pattern "${name}" has no tradeoffs`);
  }
  if (!pattern.category) {
    warnings.push(`Pattern "${name}" has no category`);
  }

  // -- Required array fields --
  if (pattern.classes.length === 0) {
    warnings.push(`Pattern "${name}" has no UML classes`);
  }
  if (pattern.summary.length === 0) {
    warnings.push(`Pattern "${name}" has no summary bullet points`);
  }
  if (pattern.youAlreadyUseThis.length === 0) {
    warnings.push(`Pattern "${name}" has no "you already use this" examples`);
  }
  if (pattern.realWorldExamples.length === 0) {
    warnings.push(`Pattern "${name}" has no real-world examples`);
  }
  if (pattern.whenToUse.length === 0) {
    warnings.push(`Pattern "${name}" has no "when to use" guidance`);
  }
  if (pattern.whenNotToUse.length === 0) {
    warnings.push(`Pattern "${name}" has no "when not to use" guidance`);
  }

  // -- Code samples --
  if (!pattern.code.typescript) {
    warnings.push(`Pattern "${name}" has no TypeScript code sample`);
  }
  if (!pattern.code.python) {
    warnings.push(`Pattern "${name}" has no Python code sample`);
  }

  // -- Difficulty range --
  if (pattern.difficulty < 1 || pattern.difficulty > 5) {
    warnings.push(
      `Pattern "${name}" has invalid difficulty ${pattern.difficulty} (expected 1-5)`,
    );
  }

  // -- UML class quality checks --
  for (const cls of pattern.classes) {
    if (!cls.name) {
      warnings.push(`Pattern "${name}" has a class with no name (id: ${cls.id})`);
    }
    if (cls.attributes.length === 0 && cls.methods.length === 0) {
      warnings.push(
        `Pattern "${name}" class "${cls.name}" has no attributes and no methods`,
      );
    }
    // Check for missing IDs on attributes/methods
    for (const attr of cls.attributes) {
      if (!attr.id) {
        warnings.push(
          `Pattern "${name}" class "${cls.name}" attribute "${attr.name}" has no id`,
        );
      }
    }
    for (const meth of cls.methods) {
      if (!meth.id) {
        warnings.push(
          `Pattern "${name}" class "${cls.name}" method "${meth.name}" has no id`,
        );
      }
    }
  }

  // -- Relationship integrity --
  const classIds = new Set(pattern.classes.map((c) => c.id));
  for (const rel of pattern.relationships) {
    if (!classIds.has(rel.source)) {
      warnings.push(
        `Pattern "${name}" relationship "${rel.id}" references non-existent source "${rel.source}"`,
      );
    }
    if (!classIds.has(rel.target)) {
      warnings.push(
        `Pattern "${name}" relationship "${rel.id}" references non-existent target "${rel.target}"`,
      );
    }
  }

  return warnings;
}
