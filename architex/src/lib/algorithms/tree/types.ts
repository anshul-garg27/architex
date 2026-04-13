// -----------------------------------------------------------------
// Architex -- Tree Algorithm Types
// -----------------------------------------------------------------

export interface TreeNode {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number; // computed position
  y?: number;
  color?: 'red' | 'black'; // for RB trees
  height?: number; // for AVL
  balanceFactor?: number;
}

export type TreeElementState =
  | 'default'
  | 'visiting'
  | 'visited'
  | 'current'
  | 'found'
  | 'inserting'
  | 'deleting'
  | 'rotating';
