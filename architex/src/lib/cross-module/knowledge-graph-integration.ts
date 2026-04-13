// ─────────────────────────────────────────────────────────────
// Architex — Knowledge Graph ↔ Bridge Integration (CROSS-009)
// Connects bridges to the knowledge graph module for concept
// relationships and cross-module navigation.
// ─────────────────────────────────────────────────────────────

import type { Concept, ConceptRelationship, ConceptDomain } from "@/lib/knowledge-graph/concepts";
import type { ModuleType } from "@/stores/ui-store";
import type { BridgePayload, BridgeLink } from "./bridge-types";
import { MODULE_LABELS } from "./bridge-types";
import { getConceptModules } from "./concept-module-map";
import type { ConceptModuleRef } from "./concept-module-map";

// ── Domain → Module mapping ───────────────────────────────────

const DOMAIN_TO_MODULE: Record<ConceptDomain, ModuleType> = {
  compute: "system-design",
  storage: "database",
  messaging: "system-design",
  reliability: "distributed",
  data: "database",
  protocols: "networking",
  security: "security",
  observability: "system-design",
  patterns: "lld",
  distributed: "distributed",
};

/**
 * Map a knowledge graph concept domain to the most relevant learning module.
 */
export function domainToModule(domain: ConceptDomain): ModuleType {
  return DOMAIN_TO_MODULE[domain];
}

// ── Concept → Bridge links ────────────────────────────────────

/**
 * Generate bridge links for a knowledge graph concept.
 * Returns links to all modules where this concept is relevant.
 */
export function conceptToBridgeLinks(concept: Concept): BridgeLink[] {
  const moduleRefs = getConceptModules(concept.id);
  const primaryModule = domainToModule(concept.domain);

  // If concept is in our concept-module-map, use those references
  if (moduleRefs.length > 0) {
    return moduleRefs.map((ref, i) => ({
      id: `kg-${concept.id}-${ref.module}-${i}`,
      sourceModule: "knowledge-graph",
      targetModule: ref.module,
      label: `Explore in ${MODULE_LABELS[ref.module]}`,
      description: ref.description,
      conceptId: concept.id,
      payloadFactory: () => ({
        type: "knowledge-graph-open-concept" as const,
        conceptId: concept.id,
        conceptName: concept.name,
        targetModule: ref.module,
        targetPath: ref.path,
      }),
    }));
  }

  // Fallback: create a single link to the primary module
  return [
    {
      id: `kg-${concept.id}-${primaryModule}`,
      sourceModule: "knowledge-graph",
      targetModule: primaryModule,
      label: `Explore in ${MODULE_LABELS[primaryModule]}`,
      description: concept.description,
      conceptId: concept.id,
      payloadFactory: () => ({
        type: "knowledge-graph-open-concept" as const,
        conceptId: concept.id,
        conceptName: concept.name,
        targetModule: primaryModule,
      }),
    },
  ];
}

/**
 * From a concept relationship, determine if it creates a cross-module bridge.
 * Returns the bridge payload if the two concepts belong to different modules.
 */
export function relationshipToBridge(
  source: Concept,
  target: Concept,
  relationship: ConceptRelationship,
): BridgePayload | null {
  const sourceModule = domainToModule(source.domain);
  const targetModule = domainToModule(target.domain);

  // Only create a bridge if concepts are in different modules
  if (sourceModule === targetModule) return null;

  return {
    type: "knowledge-graph-open-concept",
    conceptId: target.id,
    conceptName: target.name,
    targetModule,
    targetPath: `/${targetModule}?concept=${target.id}`,
  };
}

/**
 * For a set of concepts and relationships, find all cross-module bridges.
 * Useful for visualizing the bridge network on the knowledge graph.
 */
export function findCrossModuleBridges(
  concepts: Concept[],
  relationships: ConceptRelationship[],
): { source: Concept; target: Concept; bridge: BridgePayload }[] {
  const conceptMap = new Map<string, Concept>();
  for (const c of concepts) {
    conceptMap.set(c.id, c);
  }

  const bridges: { source: Concept; target: Concept; bridge: BridgePayload }[] = [];

  for (const rel of relationships) {
    const source = conceptMap.get(rel.source);
    const target = conceptMap.get(rel.target);
    if (!source || !target) continue;

    const bridge = relationshipToBridge(source, target, rel);
    if (bridge) {
      bridges.push({ source, target, bridge });
    }
  }

  return bridges;
}

/**
 * Get recommended concepts from the knowledge graph that are related
 * to the user's current activity in a given module.
 */
export function getRelatedConcepts(
  currentModule: ModuleType,
  concepts: Concept[],
  relationships: ConceptRelationship[],
  limit = 5,
): Concept[] {
  // Find concepts whose domain maps to the current module
  const moduleConcepts = concepts.filter(
    (c) => domainToModule(c.domain) === currentModule,
  );

  // Get related concepts from other modules
  const relatedIds = new Set<string>();
  for (const mc of moduleConcepts) {
    for (const rel of relationships) {
      if (rel.source === mc.id && !relatedIds.has(rel.target)) {
        const target = concepts.find((c) => c.id === rel.target);
        if (target && domainToModule(target.domain) !== currentModule) {
          relatedIds.add(rel.target);
        }
      }
      if (rel.target === mc.id && !relatedIds.has(rel.source)) {
        const source = concepts.find((c) => c.id === rel.source);
        if (source && domainToModule(source.domain) !== currentModule) {
          relatedIds.add(rel.source);
        }
      }
    }
  }

  return concepts
    .filter((c) => relatedIds.has(c.id))
    .slice(0, limit);
}
