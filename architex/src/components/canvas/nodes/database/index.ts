import EntityNode from './EntityNode';
import WeakEntityNode from './WeakEntityNode';
import RelationshipDiamond from './RelationshipDiamond';

// Re-export components
export { default as EntityNode } from './EntityNode';
export { default as WeakEntityNode } from './WeakEntityNode';
export { default as RelationshipDiamond } from './RelationshipDiamond';

// Re-export types
export type { EntityNodeData, EntityNodeType } from './EntityNode';
export type { WeakEntityNodeData, WeakEntityNodeType } from './WeakEntityNode';
export type { RelationshipDiamondData, RelationshipDiamondType } from './RelationshipDiamond';

// ── nodeTypes map for React Flow ────────────────────────────

/**
 * Pass this directly to React Flow's `nodeTypes` prop (merged with other node types).
 *
 * ```tsx
 * <ReactFlow nodeTypes={{ ...systemDesignNodeTypes, ...databaseNodeTypes }} ... />
 * ```
 */
export const databaseNodeTypes = {
  'er-entity': EntityNode,
  'er-weak-entity': WeakEntityNode,
  'er-relationship': RelationshipDiamond,
} as const;
