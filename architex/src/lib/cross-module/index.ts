// ─────────────────────────────────────────────────────────────
// Architex — Cross-Module Library Index
// ─────────────────────────────────────────────────────────────

export type {
  BridgePayload,
  BridgeLink,
  CrossModuleContext,
  ModuleMasteryEntry,
  ConceptProgressEntry,
  AlgorithmToSystem,
  DataStructureToSystem,
  DatabaseToSystem,
  DistributedToSystem,
  NetworkingToSystem,
  ConcurrencyToSystem,
  LLDToSystem,
  SecurityToSystem,
  InterviewSimulate,
  KnowledgeGraphOpenConcept,
} from "./bridge-types";

export { ALL_MODULES, MODULE_LABELS, MODULE_COLORS } from "./bridge-types";

export {
  BRIDGE_REGISTRY,
  getBridgesFromModule,
  getBridgesToModule,
  getBridgesBetween,
  getBridgeById,
  getModulesWithBridges,
} from "./bridge-registry";

export { dispatchBridge } from "./bridge-handlers";
export type { BridgeHandlerResult } from "./bridge-handlers";

export {
  BRIDGE_RULES,
  evaluateRules,
  getMatchingBridgePayloads,
} from "./bridge-rules";
export type { BridgeRule, BridgeRuleContext } from "./bridge-rules";

export {
  CONCEPT_MODULE_MAP,
  getConceptModules,
  getConceptsForModule,
  hasConceptCrossRefs,
  getAllConceptIds,
} from "./concept-module-map";
export type { ConceptModuleRef } from "./concept-module-map";

export {
  conceptToBridgeLinks,
  relationshipToBridge,
  findCrossModuleBridges,
  getRelatedConcepts,
  domainToModule,
} from "./knowledge-graph-integration";

export type { SimulationScore } from "./interview-simulator-bridge";
export {
  detectSinglePointsOfFailure,
  autoScoreWithSimulation,
  generateAutoFeedback,
} from "./interview-simulator-bridge";
