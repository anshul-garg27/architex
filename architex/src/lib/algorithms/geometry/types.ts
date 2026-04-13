// -----------------------------------------------------------------
// Architex -- Computational Geometry Types
// -----------------------------------------------------------------

export interface Point2D {
  x: number;
  y: number;
  id: string;
}

export type GeometryElementState =
  | 'default'
  | 'pivot'
  | 'processing'
  | 'hull'
  | 'rejected'
  | 'current'
  | 'closest';
