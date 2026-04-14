// ─────────────────────────────────────────────────────────────
// Architex — Low-Level Design Studio
// ─────────────────────────────────────────────────────────────
//
// Barrel export for UML class diagram types and design pattern
// templates used by the LLD Studio module.
//
// This is the single entry point for all LLD functionality.
// Import from `@/lib/lld` rather than from individual files.
//
// Sections:
//   - Types (UMLClass, DesignPattern, etc.)
//   - Class Diagram CRUD Model (add/remove/update operations)
//   - Design Pattern Templates (DESIGN_PATTERNS array)
//   - SOLID Principle Demos
//   - LLD Problems
//   - Code Generation (diagram -> TypeScript/Python)
//   - Code-to-Diagram Parsing (TypeScript/Python -> diagram)
//   - Bidirectional Sync (SyncManager)
//   - Sequence Diagrams
//   - State Machines
//   - Persistence (localStorage save/load)
//   - Search (cross-content search)
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────
export type {
  UMLVisibility,
  UMLClass,
  UMLAttribute,
  UMLMethod,
  UMLRelationship,
  UMLRelationshipType,
  ClassDiagram,
  DesignPattern,
  PatternCategory,
  BaseSequenceMessage,
  SequenceMessage,
  LatencyMessage,
  SequenceParticipant,
} from "./types";

// ── Class Diagram CRUD Model ────────────────────────────────
export {
  generateId,
  addClass,
  removeClass,
  updateClass,
  addAttribute,
  removeAttribute,
  addMethod,
  removeMethod,
  addRelationship,
  removeRelationship,
  validateDiagram,
  validatePatternContent,
  createEmptyDiagram,
} from "./class-diagram-model";

// ── Design Pattern Templates ─────────────────────────────────
export type { PatternFinderEntry, PatternComparison } from "./patterns";
export {
  DESIGN_PATTERNS,
  getPatternById,
  getPatternsByCategory,
  PATTERN_FINDER_ENTRIES,
  PATTERN_COMPARISONS,
  PATTERN_PREREQUISITES,
} from "./patterns";

// ── SOLID Principle Demos ────────────────────────────────────
export type { SOLIDDemo, SOLIDPrinciple, CodeSample, SOLIDQuizQuestion } from "./solid-demos";
export {
  SOLID_DEMOS,
  SOLID_QUIZ_QUESTIONS,
  getSOLIDDemoById,
  getSOLIDDemoByPrinciple,
} from "./solid-demos";

// ── LLD Problems ─────────────────────────────────────────────
export type { LLDProblem } from "./problems";
export {
  LLD_PROBLEMS,
  getProblemById,
  getProblemsByDifficulty,
} from "./problems";

// ── Code Generation ─────────────────────────────────────────
export { generateTypeScript, generateTypeScriptFiles } from "./codegen/diagram-to-typescript";
export { generatePython } from "./codegen/diagram-to-python";
export { generateMermaid } from "./codegen/diagram-to-mermaid";
export { parseMermaidClassDiagram } from "./codegen/mermaid-to-diagram";
export type { MermaidParseResult } from "./codegen/mermaid-to-diagram";

// ── Code-to-Diagram Parsing ─────────────────────────────────
export {
  parseTypeScript as parseTypeScriptCode,
  parseTypeScriptClasses,
  parsePython as parsePythonCode,
} from "./codegen/code-to-diagram";
export type { ParseResult } from "./codegen/code-to-diagram";

// ── Bidirectional Sync ──────────────────────────────────────
export type {
  SyncDirection,
  SyncLanguage,
  SyncResult,
} from "./bidirectional-sync";
export {
  syncDiagramToCode,
  syncCodeToDiagram,
  SyncManager,
} from "./bidirectional-sync";

// ── Sequence Diagrams ───────────────────────────────────────
export type {
  SequenceDiagramData,
} from "./sequence-diagram";
export {
  SEQUENCE_EXAMPLES,
  getSequenceExampleById,
} from "./sequence-diagram";

// ── State Machines ──────────────────────────────────────────
export type {
  StateNode,
  StateTransition,
  StateMachineData,
} from "./state-machine";
export {
  STATE_MACHINE_EXAMPLES,
  getStateMachineExampleById,
} from "./state-machine";

// ── Persistence (LLD-063) ──────────────────────────────────
export type { LLDPersistedState } from "./persistence";
export {
  saveLLDState,
  loadLLDState,
  clearLLDState,
  createDebouncedSave,
} from "./persistence";

// ── Search (LLD-066) ───────────────────────────────────────
export type { SearchResult, SearchResultType } from "./search";
export { searchLLDContent } from "./search";
