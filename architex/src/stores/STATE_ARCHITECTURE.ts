// ═══════════════════════════════════════════════════════════════
// Architex State Management Architecture
// Principal Frontend Architect Design Document
// ═══════════════════════════════════════════════════════════════
//
// This file contains all TypeScript interfaces, types, and
// implementation blueprints for the state management overhaul.
// Every section maps to a new file that should be created.
//
// Table of Contents:
//   1. Command Bus Pattern
//   2. React Flow Adapter Pattern
//   3. Undo/Redo Architecture
//   4. Persistence Architecture
//   5. Module State Isolation
//   6. Data Flow Diagrams (documented in comments)
//   7. Performance Optimizations (documented in comments)
//   8. Migration Plan
//   9. Task List
// ═══════════════════════════════════════════════════════════════

import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// 1. COMMAND BUS PATTERN
// File: src/stores/command-bus.ts
// ─────────────────────────────────────────────────────────────
//
// WHY: Stores are currently independent islands. When a user
// loads a template, the caller must manually:
//   1. canvas-store.setNodes(template.nodes)
//   2. canvas-store.setEdges(template.edges)
//   3. simulation-store.reset()
//   4. ui-store.setActiveModule('system-design')
//
// If any step fails or is forgotten, stores diverge. The
// Command Bus centralizes cross-store orchestration into
// atomic, auditable commands.
//
// PATTERN: Synchronous dispatcher with typed command handlers.
// NOT an event emitter (no pub/sub indirection), NOT Redux
// middleware (no reducer composition). A flat dispatch map
// where each handler calls into multiple stores atomically.

/** Every command carries a discriminated union type. */
export type Command =
  | LoadTemplateCommand
  | StartSimulationCommand
  | StopSimulationCommand
  | InjectChaosCommand
  | RemoveChaosCommand
  | UndoCommand
  | RedoCommand
  | ExportCommand
  | LoadProjectCommand
  | ResetWorkspaceCommand
  | SwitchModuleCommand;

interface LoadTemplateCommand {
  type: "LOAD_TEMPLATE";
  payload: {
    templateId: string;
    /** If true, append to existing canvas instead of replacing */
    append?: boolean;
  };
}

interface StartSimulationCommand {
  type: "START_SIMULATION";
  payload: {
    trafficConfig?: Partial<TrafficConfigPayload>;
  };
}

interface StopSimulationCommand {
  type: "STOP_SIMULATION";
  payload: Record<string, never>;
}

interface InjectChaosCommand {
  type: "INJECT_CHAOS";
  payload: {
    chaosType: string;
    /** Node IDs affected. If empty, engine picks targets. */
    targetNodeIds: string[];
    /** Duration in simulation ticks. 0 = permanent until removed. */
    durationTicks: number;
  };
}

interface RemoveChaosCommand {
  type: "REMOVE_CHAOS";
  payload: {
    chaosType: string;
  };
}

interface UndoCommand {
  type: "UNDO";
  payload: Record<string, never>;
}

interface RedoCommand {
  type: "REDO";
  payload: Record<string, never>;
}

interface ExportCommand {
  type: "EXPORT";
  payload: {
    format: "mermaid" | "plantuml" | "json" | "terraform" | "url";
  };
}

interface LoadProjectCommand {
  type: "LOAD_PROJECT";
  payload: {
    projectData: SerializedProject;
  };
}

interface ResetWorkspaceCommand {
  type: "RESET_WORKSPACE";
  payload: Record<string, never>;
}

interface SwitchModuleCommand {
  type: "SWITCH_MODULE";
  payload: {
    module: ModuleTypeRef;
    /** If true, preserve canvas state across module switch */
    preserveCanvas?: boolean;
  };
}

// Payload helpers (avoiding circular imports)
interface TrafficConfigPayload {
  requestsPerSecond: number;
  pattern: "constant" | "sine-wave" | "spike" | "ramp" | "random";
  spikeMultiplier: number;
  distribution: "uniform" | "poisson" | "normal";
}

type ModuleTypeRef =
  | "system-design"
  | "algorithms"
  | "data-structures"
  | "lld"
  | "database"
  | "distributed"
  | "networking"
  | "os"
  | "concurrency"
  | "security"
  | "ml-design"
  | "interview";

/** Result of every command dispatch. */
interface CommandResult {
  success: boolean;
  /** Machine-readable error code, null on success. */
  error: string | null;
  /** Data returned by the command (e.g., export output). */
  data?: unknown;
}

/** Audit log entry for debugging and replay. */
interface CommandLogEntry {
  command: Command;
  result: CommandResult;
  timestamp: number;
  /** Duration in ms. */
  durationMs: number;
}

/** The command bus itself. Implementation follows. */
interface CommandBus {
  dispatch: (command: Command) => CommandResult;
  /** Last N commands for debugging. */
  getHistory: () => CommandLogEntry[];
  /** Subscribe to all dispatches (for devtools). */
  subscribe: (listener: (entry: CommandLogEntry) => void) => () => void;
}

// ── Command Bus Implementation Blueprint ───────────────────
//
// export function createCommandBus(): CommandBus {
//   const history: CommandLogEntry[] = [];
//   const listeners = new Set<(entry: CommandLogEntry) => void>();
//   const MAX_HISTORY = 200;
//
//   const handlers: Record<Command['type'], (cmd: Command) => CommandResult> = {
//
//     LOAD_TEMPLATE: (cmd) => {
//       const { templateId, append } = (cmd as LoadTemplateCommand).payload;
//       const template = getTemplateById(templateId);
//       if (!template) return { success: false, error: 'TEMPLATE_NOT_FOUND' };
//
//       // BEGIN ATOMIC MULTI-STORE UPDATE
//       // 1. Snapshot current state for undo
//       undoManager.beginTransaction();
//
//       // 2. Canvas: convert template nodes to ArchitexNodes, then to RF nodes
//       const canvasStore = useCanvasStore.getState();
//       const newNodes = template.nodes.map(toReactFlowNode);
//       const newEdges = template.edges.map(toReactFlowEdge);
//       if (append) {
//         canvasStore.setNodes([...canvasStore.nodes, ...newNodes]);
//         canvasStore.setEdges([...canvasStore.edges, ...newEdges]);
//       } else {
//         canvasStore.setNodes(newNodes);
//         canvasStore.setEdges(newEdges);
//       }
//
//       // 3. Simulation: reset (template = new starting state)
//       useSimulationStore.getState().reset();
//
//       // 4. UI: ensure system-design module is active
//       useUIStore.getState().setActiveModule('system-design');
//
//       // 5. Commit undo transaction
//       undoManager.commitTransaction();
//
//       return { success: true, error: null };
//     },
//
//     START_SIMULATION: (cmd) => {
//       const { trafficConfig } = (cmd as StartSimulationCommand).payload;
//       const simStore = useSimulationStore.getState();
//       const canvasStore = useCanvasStore.getState();
//
//       // Apply traffic config if provided
//       if (trafficConfig) simStore.setTrafficConfig(trafficConfig);
//
//       // Set simulation to running
//       simStore.play();
//
//       // Update all canvas nodes to 'active' state
//       const updatedNodes = canvasStore.nodes.map(n => ({
//         ...n,
//         data: { ...n.data, state: 'active' },
//       }));
//       canvasStore.setNodes(updatedNodes);
//
//       return { success: true, error: null };
//     },
//
//     STOP_SIMULATION: () => {
//       useSimulationStore.getState().stop();
//       // Reset all node states to idle
//       const canvasStore = useCanvasStore.getState();
//       canvasStore.setNodes(canvasStore.nodes.map(n => ({
//         ...n,
//         data: { ...n.data, state: 'idle', metrics: {} },
//       })));
//       return { success: true, error: null };
//     },
//
//     INJECT_CHAOS: (cmd) => {
//       const { chaosType, targetNodeIds, durationTicks } =
//         (cmd as InjectChaosCommand).payload;
//       const simStore = useSimulationStore.getState();
//       const canvasStore = useCanvasStore.getState();
//
//       // Add chaos event to simulation
//       simStore.addChaosEvent(chaosType);
//
//       // Mark affected nodes as 'error'
//       const affected = new Set(targetNodeIds);
//       canvasStore.setNodes(canvasStore.nodes.map(n =>
//         affected.has(n.id)
//           ? { ...n, data: { ...n.data, state: 'error' } }
//           : n
//       ));
//
//       return { success: true, error: null };
//     },
//
//     REMOVE_CHAOS: (cmd) => {
//       const { chaosType } = (cmd as RemoveChaosCommand).payload;
//       const simStore = useSimulationStore.getState();
//       simStore.removeChaosEvent(chaosType);
//
//       // If simulation still running, revert affected nodes to 'active'
//       if (simStore.status === 'running') {
//         const canvasStore = useCanvasStore.getState();
//         canvasStore.setNodes(canvasStore.nodes.map(n =>
//           n.data.state === 'error'
//             ? { ...n, data: { ...n.data, state: 'active' } }
//             : n
//         ));
//       }
//
//       return { success: true, error: null };
//     },
//
//     UNDO: () => {
//       undoManager.undo();
//       return { success: true, error: null };
//     },
//
//     REDO: () => {
//       undoManager.redo();
//       return { success: true, error: null };
//     },
//
//     EXPORT: (cmd) => {
//       const { format } = (cmd as ExportCommand).payload;
//       const { nodes, edges } = useCanvasStore.getState();
//       // Delegate to existing export functions
//       // Return the output string as data
//       let output: string;
//       switch (format) {
//         case 'mermaid': output = exportToMermaid(nodes, edges); break;
//         case 'plantuml': output = exportToPlantUML(nodes, edges); break;
//         case 'json': output = exportToJSON(nodes, edges); break;
//         case 'terraform': output = exportToTerraform(nodes, edges); break;
//         case 'url': output = encodeToURL(nodes, edges); break;
//       }
//       return { success: true, error: null, data: output };
//     },
//
//     LOAD_PROJECT: (cmd) => {
//       const { projectData } = (cmd as LoadProjectCommand).payload;
//       undoManager.beginTransaction();
//       // Hydrate all stores from serialized project
//       useCanvasStore.getState().setNodes(projectData.nodes);
//       useCanvasStore.getState().setEdges(projectData.edges);
//       useSimulationStore.getState().reset();
//       if (projectData.trafficConfig) {
//         useSimulationStore.getState().setTrafficConfig(projectData.trafficConfig);
//       }
//       useUIStore.getState().setActiveModule(projectData.activeModule);
//       undoManager.commitTransaction();
//       return { success: true, error: null };
//     },
//
//     RESET_WORKSPACE: () => {
//       undoManager.beginTransaction();
//       useCanvasStore.getState().clearCanvas();
//       useSimulationStore.getState().reset();
//       useEditorStore.getState().clearEditor();
//       useInterviewStore.getState().resetInterview();
//       undoManager.commitTransaction();
//       return { success: true, error: null };
//     },
//
//     SWITCH_MODULE: (cmd) => {
//       const { module, preserveCanvas } = (cmd as SwitchModuleCommand).payload;
//       if (!preserveCanvas) {
//         // Module-specific state cleanup is handled by module isolation layer
//       }
//       useUIStore.getState().setActiveModule(module);
//       return { success: true, error: null };
//     },
//   };
//
//   function dispatch(command: Command): CommandResult {
//     const start = performance.now();
//     const handler = handlers[command.type];
//     const result = handler(command);
//     const entry: CommandLogEntry = {
//       command,
//       result,
//       timestamp: Date.now(),
//       durationMs: performance.now() - start,
//     };
//     history.push(entry);
//     if (history.length > MAX_HISTORY) history.shift();
//     listeners.forEach(l => l(entry));
//     return result;
//   }
//
//   return {
//     dispatch,
//     getHistory: () => [...history],
//     subscribe: (listener) => {
//       listeners.add(listener);
//       return () => listeners.delete(listener);
//     },
//   };
// }
//
// // Singleton
// export const commandBus = createCommandBus();
//
// // React hook
// export function useCommandBus() { return commandBus; }


// ─────────────────────────────────────────────────────────────
// 2. REACT FLOW ADAPTER PATTERN
// File: src/lib/canvas/adapter.ts
// ─────────────────────────────────────────────────────────────
//
// WHY: The canvas-store currently stores Node[] and Edge[]
// from @xyflow/react. This means:
//   - Every store consumer must import @xyflow/react types
//   - Export functions (to-mermaid.ts, to-json.ts) depend on RF
//   - If we upgrade RF or switch libs, EVERY file changes
//   - Serialization includes RF internals (measured, selected, etc.)
//
// The adapter creates a clean boundary. Our canonical types
// live in our domain. RF specifics are confined to the adapter
// and DesignCanvas.tsx.

/** Our canonical node type. NOT React Flow specific. */
export interface ArchitexNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: ArchitexNodeData;
}

export interface ArchitexNodeData {
  label: string;
  category: NodeCategoryRef;
  componentType: string;
  icon: string;
  config: Record<string, number | string | boolean>;
  metrics?: NodeMetricsRef;
  state: NodeStateRef;
}

type NodeCategoryRef =
  | "compute"
  | "load-balancing"
  | "storage"
  | "messaging"
  | "networking"
  | "processing"
  | "client"
  | "observability"
  | "security";

type NodeStateRef =
  | "idle"
  | "active"
  | "success"
  | "warning"
  | "error"
  | "processing";

interface NodeMetricsRef {
  throughput?: number;
  latency?: number;
  errorRate?: number;
  utilization?: number;
  queueDepth?: number;
  cacheHitRate?: number;
}

/** Our canonical edge type. NOT React Flow specific. */
export interface ArchitexEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data: ArchitexEdgeData;
}

export interface ArchitexEdgeData {
  edgeType: EdgeTypeRef;
  latency?: number;
  bandwidth?: number;
  errorRate?: number;
  animated?: boolean;
}

type EdgeTypeRef =
  | "http"
  | "grpc"
  | "graphql"
  | "websocket"
  | "message-queue"
  | "event-stream"
  | "db-query"
  | "cache-lookup"
  | "replication";

// ── Conversion: ArchitexNode -> React Flow Node ────────────
//
// function toReactFlowNode(node: ArchitexNode): Node {
//   return {
//     id: node.id,
//     type: node.type,
//     position: { ...node.position },
//     data: {
//       ...node.data,
//       // RF expects Record<string, unknown>; our data already satisfies this
//     },
//   };
// }
//
// function toReactFlowEdge(edge: ArchitexEdge): Edge {
//   return {
//     id: edge.id,
//     source: edge.source,
//     target: edge.target,
//     sourceHandle: edge.sourceHandle,
//     targetHandle: edge.targetHandle,
//     type: 'data-flow', // Our custom edge type
//     data: { ...edge.data },
//   };
// }

// ── Conversion: React Flow Node -> ArchitexNode ────────────
//
// function fromReactFlowNode(rfNode: Node): ArchitexNode {
//   const data = rfNode.data as Record<string, unknown>;
//   return {
//     id: rfNode.id,
//     type: rfNode.type ?? 'default',
//     position: { x: rfNode.position.x, y: rfNode.position.y },
//     data: {
//       label: String(data.label ?? rfNode.id),
//       category: (data.category as NodeCategoryRef) ?? 'compute',
//       componentType: String(data.componentType ?? rfNode.type ?? 'default'),
//       icon: String(data.icon ?? 'box'),
//       config: (data.config as Record<string, number | string | boolean>) ?? {},
//       metrics: data.metrics as NodeMetricsRef | undefined,
//       state: (data.state as NodeStateRef) ?? 'idle',
//     },
//   };
// }
//
// function fromReactFlowEdge(rfEdge: Edge): ArchitexEdge {
//   const data = (rfEdge.data ?? {}) as Record<string, unknown>;
//   return {
//     id: rfEdge.id,
//     source: rfEdge.source,
//     target: rfEdge.target,
//     sourceHandle: rfEdge.sourceHandle ?? undefined,
//     targetHandle: rfEdge.targetHandle ?? undefined,
//     data: {
//       edgeType: (data.edgeType as EdgeTypeRef) ?? 'http',
//       latency: data.latency as number | undefined,
//       bandwidth: data.bandwidth as number | undefined,
//       errorRate: data.errorRate as number | undefined,
//       animated: data.animated as boolean | undefined,
//     },
//   };
// }

// ── Batch Converters ───────────────────────────────────────
//
// export function toReactFlowNodes(nodes: ArchitexNode[]): Node[] {
//   return nodes.map(toReactFlowNode);
// }
//
// export function fromReactFlowNodes(rfNodes: Node[]): ArchitexNode[] {
//   return rfNodes.map(fromReactFlowNode);
// }
//
// export function toReactFlowEdges(edges: ArchitexEdge[]): Edge[] {
//   return edges.map(toReactFlowEdge);
// }
//
// export function fromReactFlowEdges(rfEdges: Edge[]): ArchitexEdge[] {
//   return rfEdges.map(fromReactFlowEdge);
// }

// ── Edge Cases Handled ─────────────────────────────────────
//
// 1. Missing rfNode.type -> defaults to 'default'
// 2. Missing data fields -> safe defaults applied
// 3. RF internal properties (measured, selected, dragging,
//    positionAbsolute, width, height) are STRIPPED during
//    fromReactFlowNode — they are RF rendering state, not
//    our domain model.
// 4. Position is always deep-copied to prevent shared
//    reference mutations.
// 5. Edge sourceHandle/targetHandle may be null in RF but
//    undefined in our model — coerced via ?? undefined.


// ─────────────────────────────────────────────────────────────
// 3. UNDO/REDO ARCHITECTURE
// File: src/stores/undo-manager.ts
// ─────────────────────────────────────────────────────────────
//
// PROBLEMS WITH CURRENT APPROACH (zundo on canvas-store):
//
// Problem 1: Every pixel of a drag creates a history entry.
//   zundo wraps the store setter, so onNodesChange (called
//   per-frame during drag) creates 60+ entries per second.
//
// Problem 2: Single-store undo. Loading a template changes
//   canvas-store + simulation-store + ui-store. Undo only
//   reverts canvas, leaving stores out of sync.
//
// Problem 3: No memory limit by size. limit:100 caps count
//   but a single entry could be 50KB (full node array).
//   100 entries of 50KB = 5MB of undo history.
//
// SOLUTION: Custom UndoManager that operates above stores.

/** A snapshot of all undoable state across all stores. */
interface UndoSnapshot {
  /** Canvas state at this point */
  canvas: {
    nodes: ArchitexNode[];
    edges: ArchitexEdge[];
  };
  /** Simulation config (NOT runtime metrics — those aren't undoable) */
  simulation: {
    trafficConfig: TrafficConfigPayload;
  };
  /** UI state that's undoable */
  ui: {
    activeModule: ModuleTypeRef;
  };
  /** Editor state */
  editor: {
    code: string;
    language: string;
  };
}

/** Metadata about an undo entry. */
interface UndoEntry {
  snapshot: UndoSnapshot;
  /** Human-readable description for devtools */
  label: string;
  timestamp: number;
  /** Byte size estimate for memory management */
  sizeBytes: number;
}

/** Operations that ARE undoable vs NOT undoable. */
//
// UNDOABLE (user intent):
//   - Add node
//   - Remove node
//   - Move node (debounced: drag start -> drag end = 1 entry)
//   - Add edge / remove edge
//   - Load template
//   - Change node config
//   - Change traffic config
//   - Inject/remove chaos
//   - Change editor code
//
// NOT UNDOABLE (ephemeral/view state):
//   - Zoom / pan (viewport-store)
//   - Selection changes
//   - Simulation runtime metrics
//   - Timer state (interview)
//   - Panel visibility toggles
//   - Playback speed
//   - Simulation tick position

interface UndoManager {
  /** Capture current state as an undo point. */
  pushSnapshot: (label: string) => void;

  /**
   * Begin a transaction. Multiple store changes between
   * beginTransaction() and commitTransaction() produce
   * ONE undo entry.
   */
  beginTransaction: () => void;

  /** Commit the transaction, capturing final state. */
  commitTransaction: (label?: string) => void;

  /** Discard the transaction without creating an entry. */
  rollbackTransaction: () => void;

  /** Undo to the previous snapshot. */
  undo: () => boolean;

  /** Redo to the next snapshot. */
  redo: () => boolean;

  /** Whether undo is available. */
  canUndo: () => boolean;

  /** Whether redo is available. */
  canRedo: () => boolean;

  /** Current stack sizes for UI indicators. */
  getStackInfo: () => { undoSize: number; redoSize: number };
}

// ── Debounce Strategy for Drag Operations ──────────────────
//
// Instead of recording every onNodesChange, the undo manager
// uses a "coalesce window":
//
// 1. DesignCanvas detects drag START (onNodeDragStart callback).
//    Calls undoManager.beginTransaction().
//
// 2. During drag, onNodesChange fires 60x/sec. No snapshots.
//
// 3. DesignCanvas detects drag END (onNodeDragStop callback).
//    Calls undoManager.commitTransaction('Move node(s)').
//
// This produces exactly ONE undo entry per drag operation.
//
// For rapid non-drag changes (e.g., typing in config panel),
// the pushSnapshot function is debounced with a 500ms window:
//
// const debouncedPush = debounce(undoManager.pushSnapshot, 500);

// ── Memory Management ──────────────────────────────────────
//
// Two caps enforced simultaneously:
//   MAX_ENTRIES = 100     (hard count limit)
//   MAX_SIZE_BYTES = 10MB (memory pressure limit)
//
// Size estimation per entry:
//   sizeBytes = JSON.stringify(snapshot).length * 2
//   (x2 for UTF-16 in-memory overhead)
//
// When either limit is exceeded, oldest entries are evicted
// from the undo stack. The redo stack is cleared on any new
// push (standard undo/redo behavior).

// ── Implementation Blueprint ───────────────────────────────
//
// export function createUndoManager(): UndoManager {
//   const undoStack: UndoEntry[] = [];
//   const redoStack: UndoEntry[] = [];
//   let transactionOpen = false;
//   let preTransactionSnapshot: UndoSnapshot | null = null;
//
//   const MAX_ENTRIES = 100;
//   const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
//
//   function captureSnapshot(): UndoSnapshot {
//     const canvas = useCanvasStore.getState();
//     const sim = useSimulationStore.getState();
//     const ui = useUIStore.getState();
//     const editor = useEditorStore.getState();
//     return {
//       canvas: {
//         nodes: fromReactFlowNodes(canvas.nodes),
//         edges: fromReactFlowEdges(canvas.edges),
//       },
//       simulation: {
//         trafficConfig: { ...sim.trafficConfig },
//       },
//       ui: {
//         activeModule: ui.activeModule,
//       },
//       editor: {
//         code: editor.code,
//         language: editor.language,
//       },
//     };
//   }
//
//   function applySnapshot(snapshot: UndoSnapshot): void {
//     useCanvasStore.getState().setNodes(toReactFlowNodes(snapshot.canvas.nodes));
//     useCanvasStore.getState().setEdges(toReactFlowEdges(snapshot.canvas.edges));
//     useSimulationStore.getState().setTrafficConfig(snapshot.simulation.trafficConfig);
//     useUIStore.getState().setActiveModule(snapshot.ui.activeModule);
//     useEditorStore.getState().setCode(snapshot.editor.code);
//     useEditorStore.getState().setLanguage(snapshot.editor.language);
//   }
//
//   function estimateSize(snapshot: UndoSnapshot): number {
//     return JSON.stringify(snapshot).length * 2;
//   }
//
//   function enforceMemoryLimits(): void {
//     while (undoStack.length > MAX_ENTRIES) undoStack.shift();
//     let totalBytes = undoStack.reduce((sum, e) => sum + e.sizeBytes, 0);
//     while (totalBytes > MAX_SIZE_BYTES && undoStack.length > 1) {
//       const removed = undoStack.shift()!;
//       totalBytes -= removed.sizeBytes;
//     }
//   }
//
//   return {
//     pushSnapshot(label: string) {
//       if (transactionOpen) return; // Don't push during transactions
//       const snapshot = captureSnapshot();
//       undoStack.push({
//         snapshot,
//         label,
//         timestamp: Date.now(),
//         sizeBytes: estimateSize(snapshot),
//       });
//       redoStack.length = 0; // Clear redo on new action
//       enforceMemoryLimits();
//     },
//
//     beginTransaction() {
//       if (transactionOpen) return;
//       transactionOpen = true;
//       preTransactionSnapshot = captureSnapshot();
//     },
//
//     commitTransaction(label = 'Batch operation') {
//       if (!transactionOpen || !preTransactionSnapshot) return;
//       // Push the PRE-transaction state (so undo restores to before)
//       undoStack.push({
//         snapshot: preTransactionSnapshot,
//         label,
//         timestamp: Date.now(),
//         sizeBytes: estimateSize(preTransactionSnapshot),
//       });
//       redoStack.length = 0;
//       enforceMemoryLimits();
//       transactionOpen = false;
//       preTransactionSnapshot = null;
//     },
//
//     rollbackTransaction() {
//       if (!transactionOpen || !preTransactionSnapshot) return;
//       applySnapshot(preTransactionSnapshot);
//       transactionOpen = false;
//       preTransactionSnapshot = null;
//     },
//
//     undo() {
//       if (undoStack.length === 0) return false;
//       const current = captureSnapshot();
//       const entry = undoStack.pop()!;
//       redoStack.push({
//         snapshot: current,
//         label: entry.label,
//         timestamp: Date.now(),
//         sizeBytes: estimateSize(current),
//       });
//       applySnapshot(entry.snapshot);
//       return true;
//     },
//
//     redo() {
//       if (redoStack.length === 0) return false;
//       const current = captureSnapshot();
//       const entry = redoStack.pop()!;
//       undoStack.push({
//         snapshot: current,
//         label: entry.label,
//         timestamp: Date.now(),
//         sizeBytes: estimateSize(current),
//       });
//       applySnapshot(entry.snapshot);
//       return true;
//     },
//
//     canUndo: () => undoStack.length > 0,
//     canRedo: () => redoStack.length > 0,
//     getStackInfo: () => ({
//       undoSize: undoStack.length,
//       redoSize: redoStack.length,
//     }),
//   };
// }
//
// export const undoManager = createUndoManager();


// ─────────────────────────────────────────────────────────────
// 4. PERSISTENCE ARCHITECTURE
// File: src/stores/persistence.ts
// ─────────────────────────────────────────────────────────────

/** What gets persisted and where. */
//
// ┌────────────────────────┬──────────────┬───────────────────────────────┐
// │ Data                   │ Storage      │ Reason                        │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ UI preferences         │ localStorage │ Small (<1KB), fast access     │
// │ (theme, panel states,  │              │                               │
// │  active module)        │              │                               │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Active project canvas  │ IndexedDB    │ Can be >100KB with many nodes │
// │ (nodes, edges, config) │              │ localStorage has 5MB limit    │
// │                        │              │ and blocks the main thread    │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Saved projects list    │ IndexedDB    │ Multiple projects, each large │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Viewport state         │ NOT persisted│ Ephemeral — fitView on load   │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Simulation runtime     │ NOT persisted│ Ephemeral — must re-run       │
// │ (metrics, tick, status)│              │                               │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Editor code            │ IndexedDB    │ Can be large, per-module      │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Interview progress     │ IndexedDB    │ Timer state, hints used       │
// ├────────────────────────┼──────────────┼───────────────────────────────┤
// │ Undo history           │ NOT persisted│ Too large, stale on reload    │
// └────────────────────────┴──────────────┴───────────────────────────────┘

/** The full serialized project format for IndexedDB. */
export interface SerializedProject {
  /** Schema version for migrations */
  version: number;
  /** Project metadata */
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Canvas state */
  nodes: ArchitexNode[];
  edges: ArchitexEdge[];
  /** Simulation configuration (not runtime state) */
  trafficConfig: TrafficConfigPayload;
  /** Active module when saved */
  activeModule: ModuleTypeRef;
  /** Editor state per module */
  editorState?: {
    code: string;
    language: string;
  };
  /** Interview state if in progress */
  interviewState?: {
    challengeId: string;
    timerSeconds: number;
    hintsUsed: number;
  };
}

// Current schema version. Increment on breaking changes.
const SCHEMA_VERSION = 1;

/** IndexedDB database configuration. */
//
// Database: 'architex-db'
// Object stores:
//   'projects'    - key: project.id
//   'autosave'    - key: 'current' (single active workspace)
//   'preferences' - key: 'ui' (localStorage backup)

// ── Auto-Save Strategy ─────────────────────────────────────
//
// 1. DIRTY FLAG: Each store mutation sets a dirty flag via
//    Zustand middleware. This avoids saving when nothing changed.
//
// 2. DEBOUNCED SAVE: After any mutation sets dirty=true,
//    schedule a save after 2000ms of inactivity. This groups
//    rapid changes (multi-node drag, batch config edits).
//
// 3. SAVE ON BLUR: window 'blur' event triggers immediate
//    save (user switching tabs/closing).
//
// 4. SAVE ON UNLOAD: beforeunload triggers synchronous
//    localStorage save as fallback (IndexedDB is async).
//
// Implementation:
//
// let dirtyFlag = false;
// let saveTimer: ReturnType<typeof setTimeout> | null = null;
// const SAVE_DEBOUNCE_MS = 2000;
//
// function markDirty() {
//   dirtyFlag = true;
//   if (saveTimer) clearTimeout(saveTimer);
//   saveTimer = setTimeout(performSave, SAVE_DEBOUNCE_MS);
// }
//
// async function performSave() {
//   if (!dirtyFlag) return;
//   dirtyFlag = false;
//   const project = captureProjectState();
//   await idb.put('autosave', project, 'current');
// }
//
// // Zustand middleware to track dirty state
// const dirtyMiddleware = (config) => (set, get, api) =>
//   config(
//     (...args) => {
//       set(...args);
//       markDirty();
//     },
//     get,
//     api,
//   );

// ── Hydration Order ────────────────────────────────────────
//
// On app startup, stores hydrate in this exact order:
//
// 1. ui-store (localStorage, synchronous via zustand/persist)
//    -> Determines which module to render, theme to apply.
//    -> Already implemented. Keep as-is.
//
// 2. canvas-store + editor-store (IndexedDB, async)
//    -> Read from 'autosave' key in IndexedDB.
//    -> While loading, show skeleton/loading state.
//    -> Convert ArchitexNode[] -> Node[] via adapter.
//
// 3. simulation-store (no hydration — starts fresh)
//    -> Always starts at idle. Configs come from canvas.
//
// 4. viewport-store (no hydration — fitView on load)
//    -> React Flow's fitView handles initial positioning.
//
// 5. interview-store (IndexedDB, async, only if module=interview)
//    -> Lazy hydration — only loads if interview module active.
//
// Hydration state is exposed as a Zustand store:
//
// interface HydrationState {
//   uiReady: boolean;       // step 1
//   canvasReady: boolean;   // step 2
//   fullyReady: boolean;    // all complete
// }

// ── Migration Strategy ─────────────────────────────────────
//
// When SCHEMA_VERSION increments:
//
// 1. On hydration, read version from stored project.
// 2. If version < SCHEMA_VERSION, run migration chain:
//
// const migrations: Record<number, (data: unknown) => unknown> = {
//   // version 1 -> 2: Added 'group' field to nodes
//   2: (project: SerializedProject_v1) => ({
//     ...project,
//     version: 2,
//     nodes: project.nodes.map(n => ({ ...n, group: null })),
//   }),
//   // version 2 -> 3: Renamed 'edgeType' to 'protocol'
//   3: (project: SerializedProject_v2) => ({
//     ...project,
//     version: 3,
//     edges: project.edges.map(e => ({
//       ...e,
//       data: { ...e.data, protocol: e.data.edgeType },
//     })),
//   }),
// };
//
// function migrateProject(data: { version: number }): SerializedProject {
//   let current = data;
//   while (current.version < SCHEMA_VERSION) {
//     const next = current.version + 1;
//     const migrator = migrations[next];
//     if (!migrator) throw new Error(`No migration for v${next}`);
//     current = migrator(current);
//   }
//   return current as SerializedProject;
// }
//
// CONFLICT RESOLUTION: Last-write-wins. This is a single-user
// local app. No server sync means no merge conflicts. If we
// add multi-device sync later, switch to CRDTs or OT.


// ─────────────────────────────────────────────────────────────
// 5. MODULE STATE ISOLATION
// File: src/stores/module-state.ts
// ─────────────────────────────────────────────────────────────
//
// PROBLEM: page.tsx calls ALL 7 module hooks on every render:
//
//   const algorithmContent = useAlgorithmModule();    // always runs
//   const distributedContent = useDistributedModule(); // always runs
//   const networkingContent = useNetworkingModule();   // always runs
//   ...etc
//
// Each hook creates React state (useState), refs, effects,
// and intervals (interview timer). Even when viewing the
// system-design module, all 7 modules maintain live state.
//
// SOLUTION: Lazy rendering via component composition.

/** Module content descriptor (what each module must provide). */
interface ModuleContent {
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
  bottomPanel: React.ReactNode;
}

// ── Lazy Module Pattern ────────────────────────────────────
//
// Replace useModuleContent() with a component-based approach:
//
// function ModuleRenderer({ module }: { module: ModuleTypeRef }) {
//   // Only ONE module component renders at a time.
//   // When module changes, the previous component unmounts,
//   // releasing all useState, useEffect, and useRef resources.
//
//   switch (module) {
//     case 'system-design':
//       return <SystemDesignModule />;
//     case 'algorithms':
//     case 'data-structures':
//       return <AlgorithmModuleLazy />;
//     case 'distributed':
//       return <DistributedModuleLazy />;
//     case 'networking':
//       return <NetworkingModuleLazy />;
//     case 'os':
//       return <OSModuleLazy />;
//     case 'concurrency':
//       return <ConcurrencyModuleLazy />;
//     case 'interview':
//       return <InterviewModuleLazy />;
//     default:
//       return <PlaceholderModule name={module} />;
//   }
// }
//
// Each module component uses React.lazy() + dynamic import:
//
// const AlgorithmModuleLazy = React.lazy(
//   () => import('@/components/modules/AlgorithmModule')
// );
//
// Wrapped in Suspense:
// <Suspense fallback={<ModuleSkeleton />}>
//   <ModuleRenderer module={activeModule} />
// </Suspense>

// ── Module Lifecycle ───────────────────────────────────────
//
// ON MOUNT (module becomes active):
//   1. Dynamic import loads module chunk (if not cached).
//   2. Module's useState initializes fresh state.
//   3. Module's useEffect runs (e.g., interview timer starts).
//   4. If module has persisted state in IndexedDB, hydrate it.
//
// ON UNMOUNT (different module selected):
//   1. Module's useEffect cleanup runs (timer cleared, etc.).
//   2. Module's state is garbage collected.
//   3. OPTIONAL: Before unmount, snapshot state to IndexedDB
//      for "warm resume" on re-activation.
//
// KEEP WARM vs COLD START:
//   - System-design: ALWAYS warm (it's the primary module).
//     Canvas state persists in canvas-store, never unmounted.
//   - Algorithms: COLD. State is cheap to recreate.
//   - Interview: WARM. Save timer + challenge progress to
//     IndexedDB on unmount, restore on remount.
//   - Others: COLD. No expensive state.

// ── Shared vs Module-Specific State ────────────────────────
//
// SHARED (lives in global Zustand stores):
//   - canvas-store: nodes, edges (used by system-design + interview)
//   - viewport-store: zoom/pan (shared across canvas-based modules)
//   - ui-store: theme, panel visibility (app-wide)
//   - editor-store: code/language (shared code editor)
//
// MODULE-SPECIFIC (lives in module's own useState/useReducer):
//   - AlgorithmModule: currentArray, elementStates, stepIndex
//   - InterviewModule: searchQuery, filterDifficulty, timer
//   - DistributedModule: consensus visualization state
//   - ConcurrencyModule: thread states, lock states
//   - NetworkingModule: packet visualization state
//   - OSModule: process table, memory map state
//
// RULE: If two or more modules share the same data, it goes
// in a global store. If only one module uses it, it stays
// in the module's local React state.

// ── Module State Context Pattern ───────────────────────────
//
// For modules with complex state that needs prop-drilling
// avoidance, use a scoped context within the module:
//
// const AlgorithmContext = createContext<AlgorithmModuleState | null>(null);
//
// function AlgorithmModuleProvider({ children }: { children: ReactNode }) {
//   const [state, dispatch] = useReducer(algorithmReducer, initialState);
//   return (
//     <AlgorithmContext.Provider value={state}>
//       {children}
//     </AlgorithmContext.Provider>
//   );
// }
//
// This context is created AND destroyed with the module,
// preventing stale state from lingering.


// ─────────────────────────────────────────────────────────────
// 6. DATA FLOW DIAGRAMS
// ─────────────────────────────────────────────────────────────

// ── 6a. User drags Web Server from palette onto canvas ─────
//
// FLOW:
//   ComponentPalette.tsx
//     -> onDragStart: sets dataTransfer with JSON {type, label, category, icon, config}
//
//   DesignCanvas.tsx
//     -> onDragOver: preventDefault, set dropEffect='move'
//     -> onDrop:
//         1. Parse JSON from dataTransfer
//         2. Convert screen coords to flow coords via reactFlowInstance.screenToFlowPosition()
//         3. Create ArchitexNode (proposed): { id, type, position, data }
//         4. Convert to RF Node via adapter.toReactFlowNode()
//         5. Call commandBus.dispatch({ type: 'ADD_NODE', payload: { node } })
//            OR directly: canvasStore.addNode(rfNode)
//         6. undoManager.pushSnapshot('Add Web Server')
//
// STORE ACTIONS:
//   - canvas-store.addNode(node) -> set(s => ({ nodes: [...s.nodes, node] }))
//
// COMPONENTS THAT RE-RENDER:
//   - DesignCanvas (subscribes to s.nodes)
//   - The new node component itself (ReactFlow renders it)
//   - MiniMap (re-renders on node list change)
//   - PropertiesPanel does NOT re-render (no node is selected yet)
//
// SIDE EFFECTS:
//   - Undo snapshot captured
//   - Auto-save dirty flag set
//   - No simulation effect (sim is idle)

// ── 6b. User clicks "Play Simulation" ──────────────────────
//
// FLOW:
//   SimulationControls.tsx (in BottomPanel)
//     -> onClick handler calls:
//        commandBus.dispatch({ type: 'START_SIMULATION', payload: {} })
//
//   Command Bus handler:
//     1. simulation-store.play()           -> set({ status: 'running' })
//     2. canvas-store nodes -> forEach:
//        updateNodeData(id, { state: 'active' })
//     3. Simulation engine (src/lib/simulation/) starts tick loop
//
// STORE ACTIONS:
//   - simulation-store.play()
//   - canvas-store.updateNodeData(id, { state: 'active' }) x N nodes
//   - simulation-store.updateMetrics() (every tick)
//   - simulation-store.recordMetricsSnapshot() (every N ticks)
//   - canvas-store.updateNodeData(id, { metrics: {...} }) (every tick)
//
// COMPONENTS THAT RE-RENDER:
//   - DesignCanvas: nodes re-render (state changed from idle->active)
//   - BottomPanel: metrics display updates per tick
//   - Each node component: animates active state
//   - SimulationControls: play button -> pause button
//
// SIDE EFFECTS:
//   - requestAnimationFrame / setInterval loop starts
//   - Metrics history grows (capped)
//   - NO undo snapshot (simulation is ephemeral)
//   - Auto-save does NOT trigger (runtime state isn't saved)

// ── 6c. User injects "Cache Eviction Storm" chaos ──────────
//
// FLOW:
//   ChaosPanel.tsx (sidebar or bottom panel)
//     -> onClick:
//        commandBus.dispatch({
//          type: 'INJECT_CHAOS',
//          payload: {
//            chaosType: 'cache-eviction-storm',
//            targetNodeIds: ['redis-1', 'redis-2'], // cache nodes
//            durationTicks: 100,
//          }
//        })
//
//   Command Bus handler:
//     1. simulation-store.addChaosEvent('cache-eviction-storm')
//     2. For each target node:
//        canvas-store.updateNodeData(id, { state: 'error' })
//     3. Simulation engine adjusts:
//        - Cache hit rate -> 0% on affected nodes
//        - Latency spikes on dependent nodes
//        - Error rate increases on downstream services
//
// STORE ACTIONS:
//   - simulation-store.addChaosEvent('cache-eviction-storm')
//   - canvas-store.updateNodeData('redis-1', { state: 'error', metrics: {...} })
//   - canvas-store.updateNodeData('redis-2', { state: 'error', metrics: {...} })
//   - simulation-store.updateMetrics({ errorRate: increased })
//   - Downstream node metrics update each tick
//
// COMPONENTS THAT RE-RENDER:
//   - Affected node components (state -> error, red glow)
//   - Downstream node components (metrics change)
//   - MetricsPanel (error rate spike)
//   - ChaosPanel (event now shown as active)
//   - Edge components on affected paths (may animate differently)
//
// SIDE EFFECTS:
//   - Chaos event timer starts (auto-remove after durationTicks)
//   - Metrics history records the spike
//   - Event logged to simulation event log

// ── 6d. User loads "Twitter Fanout" template ───────────────
//
// FLOW:
//   TemplateBrowser.tsx (sidebar or command palette)
//     -> onClick:
//        commandBus.dispatch({
//          type: 'LOAD_TEMPLATE',
//          payload: { templateId: 'twitter-fanout' }
//        })
//
//   Command Bus handler:
//     1. undoManager.beginTransaction()
//     2. Look up template: getTemplateById('twitter-fanout')
//     3. Convert TemplateNode[] -> ArchitexNode[] -> Node[]
//        (template types map cleanly to our adapter)
//     4. canvas-store.setNodes(convertedNodes)
//     5. canvas-store.setEdges(convertedEdges)
//     6. simulation-store.reset()
//     7. ui-store.setActiveModule('system-design')
//     8. undoManager.commitTransaction('Load Twitter Fanout template')
//
// STORE ACTIONS:
//   - canvas-store.setNodes([...]) — full replacement
//   - canvas-store.setEdges([...]) — full replacement
//   - simulation-store.reset()
//   - ui-store.setActiveModule('system-design')
//
// COMPONENTS THAT RE-RENDER:
//   - DesignCanvas: completely re-renders with new nodes/edges
//   - MiniMap: re-renders with new layout
//   - PropertiesPanel: clears (no selection)
//   - Sidebar: may switch to ComponentPalette if was in templates
//   - BottomPanel metrics: reset to zero
//
// SIDE EFFECTS:
//   - ONE undo entry created (transaction)
//   - Auto-save dirty flag set
//   - React Flow calls fitView (via useEffect on node change)
//   - Viewport resets

// ── 6e. User exports to Mermaid ────────────────────────────
//
// FLOW:
//   ExportMenu.tsx (toolbar)
//     -> onClick:
//        commandBus.dispatch({
//          type: 'EXPORT',
//          payload: { format: 'mermaid' }
//        })
//
//   Command Bus handler:
//     1. Read canvas-store.nodes, canvas-store.edges
//     2. Convert Node[] -> ArchitexNode[] via adapter (for clean data)
//     3. Pass to exportToMermaid(nodes, edges) — existing function
//     4. Return { success: true, data: mermaidString }
//
//   ExportMenu.tsx receives result:
//     -> Copy to clipboard via navigator.clipboard.writeText()
//     -> Show toast notification "Copied Mermaid to clipboard"
//
// STORE ACTIONS:
//   - NONE. Export is read-only.
//
// COMPONENTS THAT RE-RENDER:
//   - NONE. No state changes.
//   - Toast component mounts temporarily.
//
// SIDE EFFECTS:
//   - Clipboard write
//   - Toast notification
//   - No undo entry (nothing changed)

// ── 6f. User runs Bubble Sort in algorithm module ──────────
//
// FLOW:
//   AlgorithmPanel.tsx (sidebar)
//     -> User selects "Bubble Sort" from dropdown
//     -> User clicks "Run" button
//     -> AlgorithmPanel generates animation steps:
//        const steps = generateBubbleSortSteps(array)
//     -> AlgorithmPanel starts step-through loop:
//        for each step: call onStepChange(step, index)
//
//   AlgorithmModule.tsx
//     -> handleStepChange callback:
//        setState(prev => ({
//          ...prev,
//          currentStep: step,
//          stepIndex: index,
//          elementStates: parseStepMutations(step, prev.currentArray.length),
//        }))
//
// STORE ACTIONS:
//   - NO ZUSTAND STORES INVOLVED.
//   - All state is local useState in useAlgorithmModule().
//   - editor-store.setCode(bubbleSortCode) — sets code panel
//   - editor-store.setActiveLine(step.pseudocodeLine) — highlights line
//
// COMPONENTS THAT RE-RENDER:
//   - AlgorithmCanvas: values and states props change -> bars re-render
//   - ArrayVisualizer: re-renders with new element states
//   - AlgorithmProperties: step and stepIndex props change
//   - AlgorithmBottomPanel: step info updates
//   - Code editor: active line highlight moves
//
// SIDE EFFECTS:
//   - requestAnimationFrame or setTimeout loop for step animation
//   - No persistence (algo state is ephemeral)
//   - No undo (algorithm steps are not undoable)

// ── 6g. User starts an interview challenge ─────────────────
//
// FLOW:
//   InterviewModule.tsx
//     -> ChallengeBrowser.onStart(challenge)
//     -> handleStartChallenge callback:
//        setActiveChallengeId(ch.id)
//        setTimerSeconds(0)
//        setTimerRunning(false) // user must explicitly hit Start
//
//   User clicks "Start" in ChallengeView:
//     -> setTimerRunning(true)
//     -> useEffect starts setInterval (1s tick)
//
//   PROPOSED (with command bus):
//     commandBus.dispatch({
//       type: 'SWITCH_MODULE',
//       payload: { module: 'interview', preserveCanvas: true }
//     })
//     // Then within InterviewModule, local state handles challenge
//
// STORE ACTIONS (current):
//   - NO ZUSTAND STORES. All local useState.
//   - interview-store exists but is NOT used by InterviewModule.tsx.
//     This is a bug/oversight — the store should be the source of truth.
//
// STORE ACTIONS (proposed):
//   - interview-store.startChallenge(challenge)
//   - interview-store.toggleTimer()
//   - interview-store.useHint()
//   - interview-store.submitChallenge()
//
// COMPONENTS THAT RE-RENDER:
//   - ChallengeView: timer display updates every second
//   - InterviewSidebar: active challenge highlight changes
//   - Properties panel: challenge info appears
//
// SIDE EFFECTS:
//   - setInterval(1000) for timer
//   - IndexedDB save of interview progress (on module unmount)
//   - No undo (interview state is not undoable)


// ─────────────────────────────────────────────────────────────
// 7. PERFORMANCE OPTIMIZATIONS
// ─────────────────────────────────────────────────────────────

// ── 7a. Overly Broad Selectors ─────────────────────────────
//
// PROBLEM: DesignCanvas.tsx subscribes to the entire nodes array:
//   const nodes = useCanvasStore((s) => s.nodes);
//
// Every time ANY node property changes (metrics update during
// simulation), the entire DesignCanvas re-renders, which
// forces React Flow to diff all nodes.
//
// CURRENT BROAD SELECTORS (in DesignCanvas.tsx):
//   useCanvasStore((s) => s.nodes)           // re-renders on ANY node change
//   useCanvasStore((s) => s.edges)           // re-renders on ANY edge change
//   useCanvasStore((s) => s.onNodesChange)   // stable reference, OK
//   useCanvasStore((s) => s.onEdgesChange)   // stable reference, OK
//   useCanvasStore((s) => s.setEdges)        // stable reference, OK
//   useCanvasStore((s) => s.addNode)         // stable reference, OK
//
// VERDICT: nodes/edges selectors CANNOT be narrowed further
// because React Flow needs the full arrays. This is acceptable.
// The real optimization is ensuring CHILD node components
// don't re-render unnecessarily.
//
// React Flow already handles this via its internal memoization,
// but our custom node components must cooperate by:
//   1. Being wrapped in memo()
//   2. Having stable data references (not creating new objects each render)

// ── 7b. Where to Use useShallow ────────────────────────────
//
// useShallow is needed when a selector returns a NEW object
// or array reference every time, even if the contents haven't
// changed.
//
// NEEDS useShallow:
//
// 1. PropertiesPanel selecting multiple scalar fields:
//    BEFORE: useCanvasStore(s => ({
//      nodes: s.nodes,
//      selectedNodeIds: s.selectedNodeIds,
//    }))
//    -> Creates new object every render. Re-renders even if
//       neither nodes nor selectedNodeIds changed.
//
//    AFTER: useCanvasStore(useShallow(s => ({
//      nodes: s.nodes,
//      selectedNodeIds: s.selectedNodeIds,
//    })))
//    -> Shallow compares object values. Only re-renders if
//       nodes or selectedNodeIds actually changed.
//
// 2. SimulationControls selecting status + speed:
//    useSimulationStore(useShallow(s => ({
//      status: s.status,
//      playbackSpeed: s.playbackSpeed,
//    })))
//
// 3. BottomPanel selecting metrics:
//    useSimulationStore(useShallow(s => ({
//      metrics: s.metrics,
//      status: s.status,
//    })))
//
// DOES NOT NEED useShallow:
//
// 1. Single scalar selectors (already optimal):
//    useUIStore(s => s.activeModule)     // string comparison
//    useUIStore(s => s.theme)            // string comparison
//    useSimulationStore(s => s.status)   // string comparison
//
// 2. Single function selectors (stable references in Zustand):
//    useCanvasStore(s => s.addNode)      // same function reference
//    useCanvasStore(s => s.setNodes)     // same function reference

// ── 7c. Derived State: Compute vs Store ────────────────────
//
// PRINCIPLE: Store raw data, compute derived values in selectors
// or useMemo. Never store values that can be calculated.
//
// SHOULD BE COMPUTED (not stored):
//
// 1. selectedNodes (currently requires a filter every render):
//    Selector:
//      const selectedNodes = useCanvasStore(s =>
//        s.nodes.filter(n => s.selectedNodeIds.includes(n.id))
//      );
//    Problem: O(n*m) every render, plus creates new array reference.
//    Solution: Memoized selector using createSelector pattern:
//      const selectSelectedNodes = (s: CanvasState) =>
//        s.nodes.filter(n => s.selectedNodeIds.includes(n.id));
//    Cache with useMemo in the component, or use a Zustand
//    computed middleware.
//
// 2. nodeCount, edgeCount (for display):
//    Compute: useCanvasStore(s => s.nodes.length)
//    Do NOT add a nodeCount field to the store.
//
// 3. simulation progress percentage:
//    Compute: useSimulationStore(s =>
//      s.totalTicks > 0 ? s.currentTick / s.totalTicks : 0
//    )
//
// 4. isSimulationActive (derived from status):
//    Compute: useSimulationStore(s =>
//      s.status === 'running' || s.status === 'paused'
//    )
//
// 5. filteredChallenges in InterviewModule:
//    Already computed via useMemo. Correct pattern.
//
// SHOULD REMAIN STORED (cannot be derived):
//
// 1. nodes, edges (source of truth)
// 2. selectedNodeIds (user intent, not derivable)
// 3. simulation status, currentTick (runtime state)
// 4. trafficConfig (user configuration)
// 5. metricsHistory (accumulated data)
// 6. activeChaosEvents (user-initiated)

// ── 7d. Additional Performance Recommendations ─────────────
//
// 1. BATCH NODE UPDATES DURING SIMULATION:
//    Currently updateNodeData is called per-node per-tick.
//    With 50 nodes at 30fps = 1500 individual set() calls/sec.
//    Solution: Add a batchUpdateNodeData action that applies
//    all updates in a single set() call:
//
//    batchUpdateNodeData: (updates: Array<{id: string, data: Partial<Node['data']>}>) =>
//      set(s => ({
//        nodes: s.nodes.map(n => {
//          const update = updates.find(u => u.id === n.id);
//          return update ? { ...n, data: { ...n.data, ...update.data } } : n;
//        }),
//      }))
//
// 2. SIMULATION METRICS THROTTLE:
//    metricsHistory grows unbounded during long simulations.
//    Cap at 1000 entries. Record snapshots every 10 ticks,
//    not every tick.
//
// 3. LAZY IMPORT HEAVY MODULES:
//    AlgorithmModule imports SORTING_ALGORITHMS (large config objects)
//    even when system-design module is active. With lazy module
//    loading (Section 5), this code only loads when needed.
//
// 4. EDGE RENDERING OPTIMIZATION:
//    Animated edges (animated: true) use CSS animations.
//    During simulation with 50+ edges, this causes layout thrash.
//    Solution: Use will-change: transform on animated edges,
//    and limit simultaneous animations to visible edges only.


// ─────────────────────────────────────────────────────────────
// 8. MIGRATION PLAN
// ─────────────────────────────────────────────────────────────
//
// Migration proceeds in 4 phases. Each phase is independently
// deployable and does not break existing functionality.
//
// PHASE 1: Foundation (no behavior change)
// ─────────────────────────────────────────
//   1.1 Create src/lib/canvas/adapter.ts with all conversion functions.
//   1.2 Create src/lib/canvas/types.ts with ArchitexNode, ArchitexEdge.
//   1.3 Add batchUpdateNodeData to canvas-store.
//   1.4 Add useShallow to all multi-field selectors.
//   1.5 Write unit tests for adapter round-trip:
//       ArchitexNode -> Node -> ArchitexNode should be identity.
//
// PHASE 2: Undo/Redo Overhaul
// ─────────────────────────────────────────
//   2.1 Create src/stores/undo-manager.ts.
//   2.2 Remove zundo temporal() wrapper from canvas-store.
//   2.3 Add onNodeDragStart/onNodeDragStop to DesignCanvas
//       for transaction-based undo of drags.
//   2.4 Wire addNode, removeNodes, addEdge, removeEdges,
//       setNodes, setEdges to call undoManager.pushSnapshot().
//   2.5 Wire Cmd+Z / Cmd+Shift+Z to undoManager.undo/redo.
//   2.6 Write tests: undo after drag = 1 step, undo after
//       template load = 1 step.
//
// PHASE 3: Command Bus + Persistence
// ─────────────────────────────────────────
//   3.1 Create src/stores/command-bus.ts.
//   3.2 Create src/stores/persistence.ts with IndexedDB layer.
//   3.3 Migrate LOAD_TEMPLATE flow: replace direct store calls
//       with commandBus.dispatch().
//   3.4 Migrate START_SIMULATION, STOP_SIMULATION, INJECT_CHAOS.
//   3.5 Add auto-save middleware to canvas-store.
//   3.6 Add hydration logic to app startup.
//   3.7 Wire interview-store to InterviewModule (currently unused).
//   3.8 Add migration framework for schema versioning.
//
// PHASE 4: Module Isolation
// ─────────────────────────────────────────
//   4.1 Convert module hooks to module components.
//   4.2 Add React.lazy() dynamic imports for each module.
//   4.3 Add Suspense boundary with ModuleSkeleton fallback.
//   4.4 Update page.tsx to use ModuleRenderer pattern.
//   4.5 Add module-level state cleanup on unmount.
//   4.6 Add warm-resume for interview module via IndexedDB.
//   4.7 Performance test: verify only active module code loads.


// ─────────────────────────────────────────────────────────────
// 9. TASK LIST (Ordered by dependency, grouped by phase)
// ─────────────────────────────────────────────────────────────
//
// PHASE 1: Foundation
// ───────────────────
//  [ ] T01. Create src/lib/canvas/types.ts
//           Define ArchitexNode, ArchitexEdge, ArchitexNodeData, ArchitexEdgeData
//           with no @xyflow/react imports.
//
//  [ ] T02. Create src/lib/canvas/adapter.ts
//           Implement toReactFlowNode, fromReactFlowNode, toReactFlowEdge,
//           fromReactFlowEdge, plus batch variants.
//           Handle all edge cases (missing fields, null handles, RF internals).
//
//  [ ] T03. Write adapter round-trip tests
//           File: src/lib/canvas/__tests__/adapter.test.ts
//           Test: node -> RF -> node is identity.
//           Test: edge -> RF -> edge is identity.
//           Test: missing data fields get safe defaults.
//           Test: RF internal properties (measured, selected) are stripped.
//
//  [ ] T04. Add batchUpdateNodeData to canvas-store
//           Accepts Array<{id, data}>, applies all in single set() call.
//
//  [ ] T05. Add useShallow to PropertiesPanel multi-field selector
//           Import from 'zustand/react/shallow'.
//
//  [ ] T06. Add useShallow to BottomPanel metrics selector
//
//  [ ] T07. Add useShallow to any other multi-field selectors
//           Audit all store usage across components.
//
//  [ ] T08. Create memoized selector for selectedNodes
//           Avoid O(n*m) filter on every render.
//
// PHASE 2: Undo/Redo
// ──────────────────
//  [ ] T09. Create src/stores/undo-manager.ts
//           Implement UndoManager interface with dual-cap memory management.
//           Uses adapter to store ArchitexNode (not RF Node).
//
//  [ ] T10. Remove zundo temporal() from canvas-store
//           Replace: create(temporal(..., { limit: 100 }))
//           With:    create(...)
//
//  [ ] T11. Add onNodeDragStart/onNodeDragStop to DesignCanvas
//           DragStart -> undoManager.beginTransaction()
//           DragStop  -> undoManager.commitTransaction('Move nodes')
//
//  [ ] T12. Wire undoManager.pushSnapshot() into canvas-store mutations
//           addNode, removeNodes, addEdge, removeEdges, clearCanvas
//           each call pushSnapshot after the set().
//           Use Zustand subscribeWithSelector to listen for changes.
//
//  [ ] T13. Wire Cmd+Z / Cmd+Shift+Z keyboard shortcuts
//           Update use-keyboard-shortcuts.ts.
//
//  [ ] T14. Write undo/redo tests
//           Test: drag produces 1 undo step.
//           Test: add 3 nodes, undo 3 times, canvas is empty.
//           Test: undo past limit does nothing.
//           Test: new action clears redo stack.
//           Test: transaction rollback restores previous state.
//
//  [ ] T15. Add undo/redo indicator to toolbar
//           Show stack sizes, disable buttons when empty.
//
// PHASE 3: Command Bus + Persistence
// ───────────────────────────────────
//  [ ] T16. Create src/stores/command-bus.ts
//           Implement all 10 command handlers.
//           Include command history log and subscriber pattern.
//
//  [ ] T17. Create src/stores/persistence.ts
//           IndexedDB wrapper using idb library.
//           Object stores: projects, autosave, preferences.
//           Auto-save with 2s debounce + dirty flag.
//
//  [ ] T18. Create SerializedProject type and migration framework
//           Version field, migration chain, type-safe transforms.
//
//  [ ] T19. Add hydration logic to app startup
//           Load autosave from IndexedDB, hydrate canvas-store
//           and editor-store. Show loading skeleton until ready.
//
//  [ ] T20. Migrate template loading to use command bus
//           Replace all direct store calls with commandBus.dispatch().
//           Update TemplateBrowser and CommandPalette.
//
//  [ ] T21. Migrate simulation controls to use command bus
//           START_SIMULATION, STOP_SIMULATION, INJECT_CHAOS.
//
//  [ ] T22. Wire interview-store into InterviewModule
//           Currently InterviewModule uses only local useState.
//           Make interview-store the single source of truth.
//
//  [ ] T23. Add save-on-blur and save-on-beforeunload handlers
//           Window event listeners for data safety.
//
//  [ ] T24. Write persistence tests
//           Test: auto-save triggers after mutation.
//           Test: hydration restores correct state.
//           Test: migration chain handles version upgrades.
//
// PHASE 4: Module Isolation
// ─────────────────────────
//  [ ] T25. Convert module hooks to module components
//           Each useXxxModule() becomes a <XxxModule/> component
//           that uses WorkspaceLayout slots internally.
//
//  [ ] T26. Add React.lazy() dynamic imports
//           Create lazy wrappers for each module component.
//
//  [ ] T27. Create ModuleRenderer with Suspense boundary
//           Replaces useModuleContent() in page.tsx.
//           Add ModuleSkeleton fallback component.
//
//  [ ] T28. Add module cleanup lifecycle
//           On unmount: clear module-specific state.
//           Optional: snapshot to IndexedDB for warm resume.
//
//  [ ] T29. Add warm-resume for interview module
//           On unmount: save timer + challenge to IndexedDB.
//           On remount: restore and resume timer.
//
//  [ ] T30. Performance validation
//           Verify: switching to algorithm module does NOT
//           load interview module code.
//           Verify: node count > 100 does not cause jank.
//           Verify: simulation at 30fps with 50 nodes stays
//           under 16ms per frame.
//
//  [ ] T31. Add devtools support
//           Command bus history viewer (dev only).
//           Undo stack inspector.
//           Store subscription counter.

// ─────────────────────────────────────────────────────────────
// FILE MANIFEST (all new files to create)
// ─────────────────────────────────────────────────────────────
//
// src/lib/canvas/types.ts          - ArchitexNode, ArchitexEdge types
// src/lib/canvas/adapter.ts        - RF <-> Architex conversion functions
// src/lib/canvas/__tests__/adapter.test.ts - Adapter round-trip tests
// src/stores/command-bus.ts        - Command bus implementation
// src/stores/undo-manager.ts       - Multi-store undo/redo manager
// src/stores/persistence.ts        - IndexedDB persistence layer
// src/stores/hydration-store.ts    - Hydration state tracking
// src/components/shared/ModuleRenderer.tsx - Lazy module loader
// src/components/shared/ModuleSkeleton.tsx - Loading fallback UI
//
// MODIFIED FILES:
// src/stores/canvas-store.ts       - Remove zundo, add batch update
// src/stores/index.ts              - Re-export new stores
// src/app/page.tsx                 - Use ModuleRenderer pattern
// src/components/canvas/DesignCanvas.tsx - Add drag start/stop handlers
// src/hooks/use-keyboard-shortcuts.ts   - Add undo/redo shortcuts
// src/components/canvas/panels/PropertiesPanel.tsx - useShallow
// src/components/canvas/panels/BottomPanel.tsx     - useShallow
// src/components/modules/InterviewModule.tsx        - Use interview-store
// src/lib/export/to-mermaid.ts     - Accept ArchitexNode instead of RF Node

export {};
