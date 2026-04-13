// ─────────────────────────────────────────────────────────────
// Architex — Visualization System Barrel Export
// ─────────────────────────────────────────────────────────────

// Charts (Canvas 2D, real-time metrics)
export { ThroughputChart } from './charts/ThroughputChart';
export { LatencyPercentileChart } from './charts/LatencyPercentileChart';
export { ErrorRateChart } from './charts/ErrorRateChart';
export { QueueDepthBars } from './charts/QueueDepthBars';

// Gauges (Canvas 2D)
export { UtilizationGauge } from './gauges/UtilizationGauge';
export { CacheHitGauge } from './gauges/CacheHitGauge';

// Sparklines (Canvas 2D, inline)
export { Sparkline } from './sparklines/Sparkline';

// Distributed systems (SVG + motion/react)
export { RaftVisualizer } from './distributed/RaftVisualizer';
export { ConsistentHashRingVisualizer } from './distributed/ConsistentHashRingVisualizer';
export { VectorClockDiagram } from './distributed/VectorClockDiagram';

// Multi-region visualization (SVG + motion/react)
export { MultiRegionMap } from './MultiRegionMap';
export { RegionDetailPanel } from './RegionDetailPanel';

// Data flow diagrams (SVG + motion/react)
export { SankeyDiagram } from './SankeyDiagram';
