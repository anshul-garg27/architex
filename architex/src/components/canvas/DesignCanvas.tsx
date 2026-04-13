"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesInitialized,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  addEdge,
  BackgroundVariant,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCanvasStore } from "@/stores/canvas-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { systemDesignNodeTypes } from "@/components/canvas/nodes/system-design";
import { systemDesignEdgeTypes } from "@/components/canvas/edges";
import { ParticleLayer } from "@/components/canvas/overlays/ParticleLayer";
import { HeatmapOverlay } from "@/components/canvas/overlays/HeatmapOverlay";
import { RequestTrace } from "@/components/canvas/overlays/RequestTrace";
import { CanvasContextMenu } from "@/components/canvas/overlays/CanvasContextMenu";
import { EmptyState } from "@/components/canvas/overlays/EmptyState";
import {
  AlignmentGuides,
  findAlignmentGuides,
  findDistanceIndicators,
  type AlignmentGuide,
  type DistanceIndicator,
} from "@/components/canvas/overlays/AlignmentGuides";
import { GroupZones } from "@/components/canvas/overlays/GroupZone";
import { CanvasToolbar } from "@/components/canvas/overlays/CanvasToolbar";
import { WhatIfPanel } from "@/components/canvas/overlays/WhatIfPanel";
import { DiffPanel } from "@/components/canvas/overlays/DiffPanel";
import { EvolutionTimeline } from "@/components/canvas/overlays/EvolutionTimeline";
import { TimeTravelScrubber } from "@/components/canvas/overlays/TimeTravelScrubber";
import { CanvasDescription } from "@/components/canvas/CanvasDescription";
import { NodeCreationPulse } from "@/components/canvas/NodeCreationPulse";
import { SimulationDashboard } from "@/components/canvas/overlays/SimulationDashboard";
import { NodeMetricsOverlay } from "@/components/canvas/overlays/NodeMetricsOverlay";
import { ChaosQuickBar } from "@/components/canvas/overlays/ChaosQuickBar";
import { CostMonitor } from "@/components/canvas/overlays/CostMonitor";
import { useUIStore } from "@/stores/ui-store";
import { useTheme } from "next-themes";

// ── Static type maps (must live outside the component to avoid re-renders) ──
const nodeTypes = systemDesignNodeTypes as unknown as NodeTypes;
const edgeTypes = systemDesignEdgeTypes as unknown as EdgeTypes;
const defaultSnapGrid: [number, number] = [16, 16];
const defaultEdgeOpts = {
  type: "data-flow" as const,
  data: { edgeType: "http", animated: false },
};

function generateNodeId() {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const DesignCanvas = memo(function DesignCanvas() {
  const { resolvedTheme } = useTheme();
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const addNode = useCanvasStore((s) => s.addNode);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);
  const setSelectedEdgeIds = useCanvasStore((s) => s.setSelectedEdgeIds);
  const setViewport = useViewportStore((s) => s.setViewport);
  const simulationStatus = useSimulationStore((s) => s.status);
  const timelineVisible = useUIStore((s) => s.timelineVisible);
  const minimapVisible = useUIStore((s) => s.minimapVisible);
  const heatmapEnabled = useSimulationStore((s) => s.heatmapEnabled);
  const heatmapMetric = useSimulationStore((s) => s.heatmapMetric);
  const traceActive = useSimulationStore((s) => s.traceActive);
  const traceType = useSimulationStore((s) => s.traceType);
  const stopTrace = useSimulationStore((s) => s.stopTrace);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);

  const handleTraceComplete = useCallback(() => {
    stopTrace();
  }, [stopTrace]);

  // Re-apply edges after nodes have initialized their handles in the DOM.
  // Without this, edges with sourceHandle/targetHandle are silently dropped
  // when nodes and edges are restored simultaneously from persisted state.
  const nodesInitialized = useNodesInitialized();
  const edgesReapplied = useRef(false);
  useEffect(() => {
    if (nodesInitialized && !edgesReapplied.current) {
      edgesReapplied.current = true;
      const currentEdges = useCanvasStore.getState().edges;
      if (currentEdges.some((e) => e.sourceHandle || e.targetHandle)) {
        useCanvasStore.setState({ edges: [...currentEdges] });
      }
    }
    if (!nodesInitialized) {
      edgesReapplied.current = false;
    }
  }, [nodesInitialized]);

  // ── Time-travel scrubber ──
  const timeTravelInstance = useMemo(
    () => orchestratorRef?.getTimeTravel() ?? null,
    [orchestratorRef],
  );
  const showTimeTravelScrubber =
    timeTravelInstance !== null &&
    (simulationStatus === "paused" ||
      simulationStatus === "completed" ||
      simulationStatus === "running");

  // ── What If panel state ──
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const handleToggleWhatIf = useCallback(() => {
    setWhatIfOpen((v) => !v);
  }, []);

  // ── Diff panel state ──
  const [diffOpen, setDiffOpen] = useState(false);
  const handleToggleDiff = useCallback(() => {
    setDiffOpen((v) => !v);
  }, []);

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);

  // ── Alignment guides state ──
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  const [distanceIndicators, setDistanceIndicators] = useState<DistanceIndicator[]>([]);

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      const currentNodes = useCanvasStore.getState().nodes;
      const otherNodes = currentNodes.map((n) => ({
        id: n.id,
        position: n.id === draggedNode.id ? draggedNode.position : n.position,
        width: n.measured?.width ?? (n.width as number | undefined) ?? 180,
        height: n.measured?.height ?? (n.height as number | undefined) ?? 60,
      }));

      const draggedSize = {
        width: draggedNode.measured?.width ?? (draggedNode.width as number | undefined) ?? 180,
        height: draggedNode.measured?.height ?? (draggedNode.height as number | undefined) ?? 60,
      };

      const newGuides = findAlignmentGuides(
        draggedNode.id,
        draggedNode.position,
        draggedSize,
        otherNodes,
        5,
      );
      const newIndicators = findDistanceIndicators(
        draggedNode.id,
        draggedNode.position,
        draggedSize,
        otherNodes,
        100,
      );

      setGuides(newGuides);
      setDistanceIndicators(newIndicators);
    },
    [],
  );

  const onNodeDragStop = useCallback(() => {
    setGuides([]);
    setDistanceIndicators([]);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: "data-flow",
            data: { edgeType: "http", animated: true },
          },
          currentEdges,
        ),
      );
    },
    [setEdges],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Array<{ id: string }>; edges: Array<{ id: string }> }) => {
      setSelectedNodeIds(selectedNodes.map((n) => n.id));
      setSelectedEdgeIds(selectedEdges.map((e) => e.id));
    },
    [setSelectedNodeIds, setSelectedEdgeIds],
  );

  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  // ── Drag-and-drop from Component Palette ──
  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();

      // Handle chaos event drop from ChaosQuickBar (UI-003 / UI-008)
      const chaosRaw = e.dataTransfer.getData("application/architex-chaos");
      if (chaosRaw && reactFlowRef.current) {
        try {
          const chaosData = JSON.parse(chaosRaw) as { eventTypeId: string };
          const position = reactFlowRef.current.screenToFlowPosition({
            x: e.clientX,
            y: e.clientY,
          });
          // Find the node closest to the drop position
          const currentNodes = useCanvasStore.getState().nodes;
          let closestNodeId: string | null = null;
          let closestDist = Infinity;
          for (const node of currentNodes) {
            const nw = node.measured?.width ?? (node.width as number | undefined) ?? 180;
            const nh = node.measured?.height ?? (node.height as number | undefined) ?? 60;
            const cx = node.position.x + nw / 2;
            const cy = node.position.y + nh / 2;
            const dist = Math.hypot(position.x - cx, position.y - cy);
            if (dist < closestDist && dist < Math.max(nw, nh)) {
              closestDist = dist;
              closestNodeId = node.id;
            }
          }

          if (closestNodeId) {
            const orch = useSimulationStore.getState().orchestratorRef;
            if (orch) {
              orch.injectChaos(chaosData.eventTypeId, [closestNodeId]);
            }
          }
        } catch {
          // ignore malformed chaos data
        }
        return;
      }

      const raw = e.dataTransfer.getData("application/architex-node");
      if (!raw || !reactFlowRef.current) return;

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        return; // silently ignore malformed drag data
      }
      const position = reactFlowRef.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode = {
        id: generateNodeId(),
        type: data.type,
        position,
        data: {
          label: data.label,
          category: data.category,
          componentType: data.type,
          icon: data.icon,
          config: data.config,
          metrics: {},
          state: "idle" as const,
        },
      };

      addNode(newNode);
    },
    [addNode],
  );

  return (
    <div className="relative h-full w-full" style={{ touchAction: "none" }}>
      <CanvasContextMenu>
        <div className="h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onMoveEnd={onMoveEnd}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={(instance) => {
              reactFlowRef.current = instance;
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid
            snapGrid={defaultSnapGrid}
            defaultEdgeOptions={defaultEdgeOpts}
            colorMode={resolvedTheme === 'light' ? 'light' : 'dark'}
            proOptions={{ hideAttribution: true }}
            className="bg-canvas-bg"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--canvas-dot)"
            />
            <Controls
              showInteractive={false}
              className="!rounded-lg !border !border-border !bg-surface !shadow-lg"
            />
            {minimapVisible && (
              <MiniMap
                nodeColor={(node) => {
                  const category = (node.data as Record<string, unknown>)?.category as string | undefined;
                  if (category) {
                    const value = getComputedStyle(document.documentElement)
                      .getPropertyValue(`--node-${category}`)
                      .trim();
                    if (value) return value;
                  }
                  return getComputedStyle(document.documentElement)
                    .getPropertyValue('--foreground-muted')
                    .trim() || '#6B7280';
                }}
                nodeStrokeWidth={2}
                zoomable
                pannable
                className="!rounded-lg !border !border-border !bg-background"
              />
            )}
            <CanvasToolbar whatIfOpen={whatIfOpen} onToggleWhatIf={handleToggleWhatIf} diffOpen={diffOpen} onToggleDiff={handleToggleDiff} />
          </ReactFlow>
        </div>
      </CanvasContextMenu>
      {nodes.length === 0 && <EmptyState />}
      {simulationStatus === "running" && <ParticleLayer />}
      {heatmapEnabled &&
        (simulationStatus === "running" || simulationStatus === "paused") && (
          <HeatmapOverlay metric={heatmapMetric} />
        )}
      {traceActive &&
        (simulationStatus === "running" || simulationStatus === "paused") && (
          <RequestTrace traceType={traceType} onComplete={handleTraceComplete} />
        )}
      {/* Simulation UI overlays (UI-001 through UI-004) */}
      {(simulationStatus === "running" || simulationStatus === "paused") && (
        <>
          <SimulationDashboard />
          <NodeMetricsOverlay />
          <ChaosQuickBar />
          <CostMonitor />
        </>
      )}
      {whatIfOpen && <WhatIfPanel onClose={handleToggleWhatIf} />}
      {diffOpen && <DiffPanel onClose={handleToggleDiff} />}
      {timelineVisible && <EvolutionTimeline />}
      {showTimeTravelScrubber && timeTravelInstance && (
        <TimeTravelScrubber timeTravel={timeTravelInstance} />
      )}
      <GroupZones />
      <AlignmentGuides guides={guides} distanceIndicators={distanceIndicators} />
      <NodeCreationPulse />
      <CanvasDescription />
    </div>
  );
});
