// -----------------------------------------------------------------
// Architex -- Bidirectional Diagram/Code Sync Manager (LLD-018)
// -----------------------------------------------------------------
//
// Manages synchronisation between UML class diagrams and generated
// code (TypeScript or Python). Supports diagram-to-code,
// code-to-diagram, and bidirectional change detection with minimal
// diff-based updates.
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "./types";
import { generateTypeScript } from "./codegen/diagram-to-typescript";
import { generatePython } from "./codegen/diagram-to-python";
import { parseTypeScript, parsePython } from "./codegen/code-to-diagram";

// -- Public types ------------------------------------------------

export type SyncDirection =
  | "diagram-to-code"
  | "code-to-diagram"
  | "bidirectional";

export type SyncLanguage = "typescript" | "python";

export interface SyncResult {
  code?: string;
  classes?: UMLClass[];
  relationships?: UMLRelationship[];
  /** Names of classes that were added in this sync. */
  added: string[];
  /** Names of classes that were removed in this sync. */
  removed: string[];
  /** Names of classes that were modified in this sync. */
  modified: string[];
}

// -- Internal snapshot type --------------------------------------

interface DiagramSnapshot {
  classes: UMLClass[];
  relationships: UMLRelationship[];
}

// -- Diff helpers ------------------------------------------------

/**
 * Compute a simple fingerprint for a UML class so we can detect
 * whether it changed between two snapshots.
 */
function classFingerprint(cls: UMLClass): string {
  const attrs = cls.attributes
    .map((a) => `${a.visibility}${a.name}:${a.type}`)
    .sort()
    .join("|");
  const methods = cls.methods
    .map(
      (m) =>
        `${m.visibility}${m.isAbstract ? "~" : ""}${m.name}(${m.params.join(",")})>${m.returnType}`,
    )
    .sort()
    .join("|");
  return `${cls.stereotype}::${cls.name}::${attrs}::${methods}`;
}

/**
 * Diff two arrays of UML classes by name.
 * Returns the sets of added, removed, and modified class names.
 */
function diffClasses(
  prev: UMLClass[],
  next: UMLClass[],
): { added: string[]; removed: string[]; modified: string[] } {
  const prevMap = new Map<string, UMLClass>();
  for (const c of prev) prevMap.set(c.name, c);

  const nextMap = new Map<string, UMLClass>();
  for (const c of next) nextMap.set(c.name, c);

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const [name, cls] of nextMap) {
    const old = prevMap.get(name);
    if (!old) {
      added.push(name);
    } else if (classFingerprint(old) !== classFingerprint(cls)) {
      modified.push(name);
    }
  }

  for (const name of prevMap.keys()) {
    if (!nextMap.has(name)) {
      removed.push(name);
    }
  }

  return { added, removed, modified };
}

/**
 * Merge a "next" diagram into a "prev" diagram, preserving positions
 * of classes that still exist (by name).
 */
function mergeDiagrams(
  prev: DiagramSnapshot,
  next: DiagramSnapshot,
): DiagramSnapshot {
  const prevPositions = new Map<string, { x: number; y: number }>();
  for (const c of prev.classes) {
    prevPositions.set(c.name, { x: c.x, y: c.y });
  }

  // Preserve old positions for classes that survived
  const mergedClasses = next.classes.map((c) => {
    const pos = prevPositions.get(c.name);
    if (pos) {
      return { ...c, x: pos.x, y: pos.y };
    }
    return c;
  });

  return {
    classes: mergedClasses,
    relationships: next.relationships,
  };
}

// -- Sync functions ----------------------------------------------

/**
 * Generate source code from a UML diagram in the specified language.
 *
 * Delegates to `generateTypeScript()` or `generatePython()` based on the
 * `language` argument. This is a stateless, one-shot conversion.
 *
 * @param classes - The UML classes in the diagram.
 * @param relationships - The relationships between classes.
 * @param language - Target language: `"typescript"` or `"python"`.
 * @returns The generated source code as a string.
 *
 * @example
 * ```ts
 * const ts = syncDiagramToCode(classes, rels, "typescript");
 * const py = syncDiagramToCode(classes, rels, "python");
 * ```
 */
export function syncDiagramToCode(
  classes: UMLClass[],
  relationships: UMLRelationship[],
  language: SyncLanguage,
): string {
  switch (language) {
    case "typescript":
      return generateTypeScript(classes, relationships);
    case "python":
      return generatePython(classes, relationships);
    default:
      return generateTypeScript(classes, relationships);
  }
}

/**
 * Parse source code back into a UML diagram model.
 *
 * Delegates to `parseTypeScript()` or `parsePython()` based on the
 * `language` argument. This is a stateless, one-shot conversion.
 *
 * @param code - The source code to parse.
 * @param language - Source language: `"typescript"` or `"python"`.
 * @returns An object with `classes` and `relationships` arrays.
 *
 * @example
 * ```ts
 * const diagram = syncCodeToDiagram(tsCode, "typescript");
 * console.log(diagram.classes.length); // number of parsed classes
 * ```
 */
export function syncCodeToDiagram(
  code: string,
  language: SyncLanguage,
): { classes: UMLClass[]; relationships: UMLRelationship[] } {
  switch (language) {
    case "typescript":
      return parseTypeScript(code);
    case "python":
      return parsePython(code);
    default:
      return parseTypeScript(code);
  }
}

// -- SyncManager class -------------------------------------------

/**
 * Stateful sync manager that tracks previous snapshots and computes
 * minimal diffs when synchronising between diagram and code.
 *
 * Usage:
 * ```ts
 * const mgr = new SyncManager("typescript");
 * const result = mgr.syncFromDiagram(classes, relationships);
 * // result.code contains the generated code
 * // result.added / removed / modified tell you what changed
 *
 * // Later, user edits code:
 * const result2 = mgr.syncFromCode(editedCode);
 * // result2.classes / relationships contain the updated diagram
 * ```
 */
export class SyncManager {
  private _language: SyncLanguage;
  private _direction: SyncDirection;
  private _prevDiagram: DiagramSnapshot | null = null;
  private _prevCode: string | null = null;

  constructor(language: SyncLanguage, direction: SyncDirection = "bidirectional") {
    this._language = language;
    this._direction = direction;
  }

  get language(): SyncLanguage {
    return this._language;
  }

  set language(lang: SyncLanguage) {
    this._language = lang;
    // Reset snapshots when language changes
    this._prevDiagram = null;
    this._prevCode = null;
  }

  get direction(): SyncDirection {
    return this._direction;
  }

  set direction(dir: SyncDirection) {
    this._direction = dir;
  }

  /**
   * Generate code from diagram, tracking changes from the previous
   * diagram snapshot.
   */
  syncFromDiagram(
    classes: UMLClass[],
    relationships: UMLRelationship[],
  ): SyncResult {
    const code = syncDiagramToCode(classes, relationships, this._language);

    // Compute diff against previous diagram
    const diff = this._prevDiagram
      ? diffClasses(this._prevDiagram.classes, classes)
      : { added: classes.map((c) => c.name), removed: [], modified: [] };

    // Update snapshot
    this._prevDiagram = { classes: [...classes], relationships: [...relationships] };
    this._prevCode = code;

    return {
      code,
      ...diff,
    };
  }

  /**
   * Parse code back to diagram model, tracking changes from the
   * previous diagram snapshot. Preserves positions of classes that
   * still exist.
   */
  syncFromCode(code: string): SyncResult {
    const parsed = syncCodeToDiagram(code, this._language);

    // Merge with previous diagram to preserve positions
    const merged = this._prevDiagram
      ? mergeDiagrams(this._prevDiagram, parsed)
      : parsed;

    // Compute diff
    const diff = this._prevDiagram
      ? diffClasses(this._prevDiagram.classes, merged.classes)
      : { added: merged.classes.map((c) => c.name), removed: [], modified: [] };

    // Update snapshots
    this._prevDiagram = {
      classes: [...merged.classes],
      relationships: [...merged.relationships],
    };
    this._prevCode = code;

    return {
      classes: merged.classes,
      relationships: merged.relationships,
      ...diff,
    };
  }

  /**
   * Full bidirectional sync: given both the current diagram state
   * and the current code, determine which side changed and apply
   * the appropriate sync direction.
   *
   * Returns the sync result from whichever side was detected as
   * the source of truth.
   */
  syncBidirectional(
    diagramClasses: UMLClass[],
    diagramRelationships: UMLRelationship[],
    code: string,
  ): SyncResult {
    const diagramChanged = this._hasDiagramChanged(diagramClasses);
    const codeChanged = this._hasCodeChanged(code);

    // If both changed (conflict), diagram wins by default
    if (diagramChanged || !codeChanged) {
      return this.syncFromDiagram(diagramClasses, diagramRelationships);
    }

    return this.syncFromCode(code);
  }

  /** Reset all internal state. */
  reset(): void {
    this._prevDiagram = null;
    this._prevCode = null;
  }

  // -- Private helpers -------------------------------------------

  private _hasDiagramChanged(classes: UMLClass[]): boolean {
    if (!this._prevDiagram) return true;
    if (this._prevDiagram.classes.length !== classes.length) return true;
    const prevFingerprints = new Set(
      this._prevDiagram.classes.map(classFingerprint),
    );
    return classes.some((c) => !prevFingerprints.has(classFingerprint(c)));
  }

  private _hasCodeChanged(code: string): boolean {
    if (this._prevCode === null) return true;
    return this._prevCode !== code;
  }
}
