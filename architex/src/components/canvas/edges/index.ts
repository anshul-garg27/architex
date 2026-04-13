import DataFlowEdge from './DataFlowEdge';
import { CrowsFootEdge } from './database';

// Re-export component
export { DataFlowEdge };

// Re-export database edge types
export { databaseEdgeTypes, CrowsFootEdge, CrowsFootMarkerDefs } from './database';
export type { CrowsFootCardinality, CrowsFootEdgeData, CrowsFootEdgeType } from './database';

// ── edgeTypes map for React Flow ────────────────────────────

/**
 * Pass this directly to React Flow's `edgeTypes` prop.
 *
 * ```tsx
 * <ReactFlow edgeTypes={systemDesignEdgeTypes} ... />
 * ```
 */
export const systemDesignEdgeTypes = {
  'data-flow': DataFlowEdge,
  'crows-foot': CrowsFootEdge,
} as const;
