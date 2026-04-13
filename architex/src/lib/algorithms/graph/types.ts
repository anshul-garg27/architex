// -----------------------------------------------------------------
// Architex -- Graph Algorithm Types
// -----------------------------------------------------------------

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  directed: boolean;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Visual state a graph node or edge can be in during animation. */
export type GraphElementState =
  | 'default'
  | 'visiting'
  | 'visited'
  | 'current'
  | 'in-queue'
  | 'in-path'
  | 'discovered';
