// ─────────────────────────────────────────────────────────────
// Architex — Low-Level Design Studio Types (LLD-002)
// ─────────────────────────────────────────────────────────────

export type UMLVisibility = "+" | "-" | "#" | "~";

export interface UMLAttribute {
  id: string;
  name: string;
  type: string;
  visibility: UMLVisibility;
}

export interface UMLMethod {
  id: string;
  name: string;
  returnType: string;
  params: string[];
  visibility: UMLVisibility;
  isAbstract?: boolean;
}

/** Container for a full class diagram (classes + relationships). */
export interface ClassDiagram {
  classes: UMLClass[];
  relationships: UMLRelationship[];
}

export interface UMLClass {
  id: string;
  name: string;
  stereotype: "class" | "interface" | "abstract" | "enum";
  attributes: UMLAttribute[];
  methods: UMLMethod[];
  x: number;
  y: number;
}

export type UMLRelationshipType =
  | "inheritance"
  | "composition"
  | "aggregation"
  | "association"
  | "dependency"
  | "realization";

export interface UMLRelationship {
  id: string;
  source: string;
  target: string;
  type: UMLRelationshipType;
  label?: string;
  sourceCardinality?: string;
  targetCardinality?: string;
}

// ── Sequence Diagram Shared Types ─────────────────────────

/** Base type shared by all sequence message variants. */
export interface BaseSequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
}

/** Full sequence diagram message with type and ordering. */
export interface SequenceMessage extends BaseSequenceMessage {
  type: "sync" | "async" | "return" | "self";
  order: number;
  /** Step-by-step narration explaining WHY this message happens in the flow. */
  narration?: string;
}

/** Latency-annotated sequence message for performance analysis. */
export interface LatencyMessage extends BaseSequenceMessage {
  latencyMs: number;
  isReturn?: boolean;
}

/** Participant in a sequence diagram. */
export interface SequenceParticipant {
  id: string;
  name: string;
  type?: "actor" | "object";
}

export type PatternCategory = "creational" | "structural" | "behavioral" | "modern" | "resilience" | "concurrency" | "ai-agent";

export interface DesignPattern {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  analogy: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tradeoffs: string;
  summary: string[];
  youAlreadyUseThis: string[];
  predictionPrompts?: { question: string; answer: string }[];
  classes: UMLClass[];
  relationships: UMLRelationship[];
  code: {
    typescript: string;
    python: string;
  };
  realWorldExamples: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  interviewTips?: string[];
  commonMistakes?: string[];
  confusedWith?: { patternId: string; difference: string }[];
  relatedPatterns?: { patternId: string; relationship: string }[];
}
