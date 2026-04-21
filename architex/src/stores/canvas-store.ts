import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge, OnNodesChange, OnEdgesChange } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { UndoManager } from "@/lib/undo/undo-manager";
import type { ArchitexNode, ArchitexEdge } from "@/lib/types/architex-node";
import {
  toReactFlowNode,
  toReactFlowEdge,
  fromReactFlowNode,
  fromReactFlowEdge,
  toReactFlowNodes,
  toReactFlowEdges,
  fromReactFlowNodes,
  fromReactFlowEdges,
} from "@/lib/adapters/react-flow-adapter";

// ── Node Group ─────────────────────────────────────────────

export interface NodeGroup {
  id: string;
  label: string;
  color: string;
  nodeIds: string[];
}

// ── Canvas snapshot for undo/redo ─────────────────────────

interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
  groups: NodeGroup[];
}

// ── Named snapshots (user-labelled checkpoints) ──────────

export interface NamedCanvasSnapshot {
  id: string;
  label: string;
  note: string | null;
  createdAt: number;
  nodes: Node[];
  edges: Edge[];
  groups: NodeGroup[];
}

// ── Canvas annotations (sticky notes, shapes) ───────────

export interface CanvasAnnotation {
  id: string;
  kind: "sticky-note" | "arrow" | "circle" | "text";
  nodeId: string | null;
  x: number;
  y: number;
  body: string;
  color: string;
  meta: Record<string, unknown>;
  createdAt: number;
}

/** Singleton UndoManager instance used by the canvas store. */
export const canvasUndoManager = new UndoManager<CanvasSnapshot>({
  maxEntries: 100,
});

// ── State ──────────────────────────────────────────────────

interface CanvasState {
  // Nodes and edges
  nodes: Node[];
  edges: Edge[];

  // Selection
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // Groups
  groups: NodeGroup[];

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[] | ((currentEdges: Edge[]) => Edge[])) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  removeNodes: (ids: string[]) => void;
  removeEdges: (ids: string[]) => void;
  updateNodeData: (id: string, data: Partial<Node["data"]>) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  clearSelection: () => void;
  clearCanvas: () => void;

  // Undo / redo
  undo: () => void;
  redo: () => void;

  // Group actions
  addGroup: (group: NodeGroup) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, data: Partial<NodeGroup>) => void;

  // Adapter — canonical ArchitexNode/Edge accessors
  getArchitexNodes: () => ArchitexNode[];
  getArchitexEdges: () => ArchitexEdge[];
  setArchitexNodes: (nodes: ArchitexNode[]) => void;
  setArchitexEdges: (edges: ArchitexEdge[]) => void;
  addArchitexNode: (node: ArchitexNode) => void;
  addArchitexEdge: (edge: ArchitexEdge) => void;

  // Named snapshots + design binding (Phase 3 Build mode)
  activeDesignId: string | null;
  namedSnapshots: NamedCanvasSnapshot[];
  pushNamedSnapshot: (
    label: string,
    note: string | null,
  ) => NamedCanvasSnapshot;
  restoreNamedSnapshot: (id: string) => void;
  deleteNamedSnapshot: (id: string) => void;
  setActiveDesignId: (id: string | null) => void;

  // Annotations layer (floating sticky notes / shapes)
  annotations: CanvasAnnotation[];
  addAnnotation: (
    input: Omit<CanvasAnnotation, "id" | "createdAt">,
  ) => CanvasAnnotation;
  updateAnnotation: (id: string, patch: Partial<CanvasAnnotation>) => void;
  deleteAnnotation: (id: string) => void;

  // Per-node notes (stored on node.data.notes, exposed as helper)
  updateNodeNotes: (nodeId: string, notes: string) => void;
}

/** Push a snapshot of the current canvas into the undo stack. */
function pushSnapshot(state: CanvasState): void {
  canvasUndoManager.pushSnapshot({
    nodes: state.nodes,
    edges: state.edges,
    groups: state.groups,
  });
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      groups: [],
      activeDesignId: null,
      namedSnapshots: [],
      annotations: [],

      setNodes: (nodes) => {
        pushSnapshot(get());
        set({ nodes });
      },
      setEdges: (edges) => {
        pushSnapshot(get());
        if (typeof edges === "function") {
          set((s) => ({ edges: edges(s.edges) }));
        } else {
          set({ edges });
        }
      },

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      addNode: (node) => {
        pushSnapshot(get());
        set((s) => ({ nodes: [...s.nodes, node] }));
      },

      addEdge: (edge) => {
        pushSnapshot(get());
        set((s) => ({ edges: [...s.edges, edge] }));
      },

      removeNodes: (ids) => {
        pushSnapshot(get());
        set((s) => ({
          nodes: s.nodes.filter((n) => !ids.includes(n.id)),
          edges: s.edges.filter(
            (e) => !ids.includes(e.source) && !ids.includes(e.target),
          ),
          selectedNodeIds: s.selectedNodeIds.filter(
            (id) => !ids.includes(id),
          ),
        }));
      },

      removeEdges: (ids) => {
        pushSnapshot(get());
        set((s) => ({
          edges: s.edges.filter((e) => !ids.includes(e.id)),
          selectedEdgeIds: s.selectedEdgeIds.filter(
            (id) => !ids.includes(id),
          ),
        }));
      },

      updateNodeData: (id, data) => {
        pushSnapshot(get());
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
          ),
        }));
      },

      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      setSelectedEdgeIds: (ids) => set({ selectedEdgeIds: ids }),
      clearSelection: () =>
        set({ selectedNodeIds: [], selectedEdgeIds: [] }),
      clearCanvas: () => {
        pushSnapshot(get());
        set({
          nodes: [],
          edges: [],
          selectedNodeIds: [],
          selectedEdgeIds: [],
          groups: [],
        });
      },

      // ── Undo / Redo ──
      undo: () => {
        const snapshot = canvasUndoManager.undo();
        if (snapshot) {
          set({
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            groups: snapshot.groups,
          });
        }
      },

      redo: () => {
        const snapshot = canvasUndoManager.redo();
        if (snapshot) {
          set({
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            groups: snapshot.groups,
          });
        }
      },

      // ── Group actions ──
      addGroup: (group) =>
        set((s) => ({ groups: [...s.groups, group] })),

      removeGroup: (id) =>
        set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),

      updateGroup: (id, data) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === id ? { ...g, ...data } : g,
          ),
        })),

      // ── Adapter — canonical ArchitexNode/Edge accessors ──
      getArchitexNodes: () => fromReactFlowNodes(get().nodes),
      getArchitexEdges: () => fromReactFlowEdges(get().edges),

      setArchitexNodes: (architexNodes) => {
        pushSnapshot(get());
        set({ nodes: toReactFlowNodes(architexNodes) });
      },

      setArchitexEdges: (architexEdges) => {
        pushSnapshot(get());
        set({ edges: toReactFlowEdges(architexEdges) });
      },

      addArchitexNode: (node) => {
        pushSnapshot(get());
        set((s) => ({ nodes: [...s.nodes, toReactFlowNode(node)] }));
      },

      addArchitexEdge: (edge) => {
        pushSnapshot(get());
        set((s) => ({ edges: [...s.edges, toReactFlowEdge(edge)] }));
      },

      // ── Named snapshots ──
      pushNamedSnapshot: (label, note) => {
        const snap: NamedCanvasSnapshot = {
          id: crypto.randomUUID(),
          label,
          note,
          createdAt: Date.now(),
          nodes: get().nodes,
          edges: get().edges,
          groups: get().groups,
        };
        set({
          namedSnapshots: [snap, ...get().namedSnapshots].slice(0, 50),
        });
        return snap;
      },

      restoreNamedSnapshot: (id) => {
        const snap = get().namedSnapshots.find((s) => s.id === id);
        if (!snap) return;
        pushSnapshot(get()); // push current to undo stack before destructive replace
        set({
          nodes: snap.nodes,
          edges: snap.edges,
          groups: snap.groups,
        });
      },

      deleteNamedSnapshot: (id) =>
        set({
          namedSnapshots: get().namedSnapshots.filter((s) => s.id !== id),
        }),

      setActiveDesignId: (id) => set({ activeDesignId: id }),

      // ── Annotations ──
      addAnnotation: (input) => {
        const ann: CanvasAnnotation = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          ...input,
        };
        set({ annotations: [...get().annotations, ann] });
        return ann;
      },

      updateAnnotation: (id, patch) =>
        set({
          annotations: get().annotations.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        }),

      deleteAnnotation: (id) =>
        set({ annotations: get().annotations.filter((a) => a.id !== id) }),

      // ── Per-node notes ──
      updateNodeNotes: (nodeId, notes) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, notes } } : n,
          ),
        }),
    }),
    {
      name: "architex-canvas",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        groups: state.groups,
      }),
    },
  ),
);
