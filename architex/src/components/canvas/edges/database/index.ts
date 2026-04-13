import CrowsFootEdge, {
  CrowsFootMarkerDefs,
  CF_MARKER_ONE,
  CF_MARKER_MANY,
  CF_MARKER_ZERO_ONE,
  CF_MARKER_ZERO_MANY,
  CF_MARKER_ONE_MANY,
} from './CrowsFootEdge';

// Re-export component
export { CrowsFootEdge, CrowsFootMarkerDefs };

// Re-export types
export type {
  CrowsFootCardinality,
  CrowsFootEdgeData,
  CrowsFootEdgeType,
} from './CrowsFootEdge';

// Re-export marker IDs
export {
  CF_MARKER_ONE,
  CF_MARKER_MANY,
  CF_MARKER_ZERO_ONE,
  CF_MARKER_ZERO_MANY,
  CF_MARKER_ONE_MANY,
};

// ── edgeTypes map for React Flow ────────────────────────────

/**
 * Pass this directly to React Flow's `edgeTypes` prop (merged with other edge types).
 *
 * ```tsx
 * <ReactFlow edgeTypes={{ ...systemDesignEdgeTypes, ...databaseEdgeTypes }} ... />
 * ```
 */
export const databaseEdgeTypes = {
  'crows-foot': CrowsFootEdge,
} as const;
