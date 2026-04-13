// ─────────────────────────────────────────────────────────────
// Architex — Performance Utilities Barrel Export
// ─────────────────────────────────────────────────────────────

export {
  batchStoreUpdates,
  loadDiagramBatched,
  type DiagramPayload,
} from './batch-updates';

export {
  getLODLevel,
  shouldRenderDetail,
  getVisibleDetails,
  DEFAULT_LOD_CONFIG,
  type LODLevel,
  type LODConfig,
  type DetailType,
} from './lod-renderer';

export {
  shouldAnimateEdges,
  getEdgeStyle,
  DEFAULT_EDGE_PERFORMANCE_CONFIG,
  type EdgePerformanceConfig,
  type EdgeStyleResult,
} from './edge-optimizer';

export {
  lazyComponent,
  prefetchComponent,
  monacoEditorImport,
  graphVisualizationImport,
  storybookPreviewImport,
  type ImportFn,
} from './lazy-loader';

export {
  MAIN_BUNDLE_LIMIT,
  PAGE_LIMIT,
  checkBudget,
  formatBytes,
  type BudgetResult,
} from './size-budget';

export {
  generateStressTestNodes,
  measureRenderPerformance,
  type StressTestSize,
  type StressTestResult,
  type PerformanceResult,
} from './stress-test';
