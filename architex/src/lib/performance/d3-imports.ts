// ─────────────────────────────────────────────────────────────
// Architex — Tree-shaken D3 re-exports (PER-008)
// ─────────────────────────────────────────────────────────────
//
// D3 is NOT currently a project dependency. This module exists
// as a controlled import point so that if D3 is ever added,
// only the specific submodules we need are pulled in — avoiding
// the full ~500 KB d3 bundle.
//
// Usage:
//   import { scaleLinear, line, arc } from '@/lib/performance/d3-imports';
//
// When adding a D3 dependency, install the specific submodule
// packages (e.g. `d3-scale`, `d3-shape`) and re-export below.
// Never import from the top-level `d3` package.
// ─────────────────────────────────────────────────────────────

// ── d3-scale (install: npm i d3-scale @types/d3-scale) ──────
// export { scaleLinear, scaleLog, scaleOrdinal } from 'd3-scale';

// ── d3-shape (install: npm i d3-shape @types/d3-shape) ──────
// export { line, area, arc, pie } from 'd3-shape';

// ── d3-array (install: npm i d3-array @types/d3-array) ──────
// export { extent, max, min, bisect } from 'd3-array';

// ── d3-force (install: npm i d3-force @types/d3-force) ──────
// export {
//   forceSimulation,
//   forceLink,
//   forceManyBody,
//   forceCenter,
// } from 'd3-force';

// ── d3-hierarchy (install: npm i d3-hierarchy @types/d3-hierarchy)
// export { hierarchy, tree, treemap } from 'd3-hierarchy';

// ── d3-selection (install: npm i d3-selection @types/d3-selection)
// export { select, selectAll } from 'd3-selection';

/**
 * Placeholder export so the module is a valid ES module even
 * before any d3 submodules are uncommented. Remove this once
 * actual re-exports are enabled.
 */
export const D3_TREE_SHAKE_READY = true as const;
