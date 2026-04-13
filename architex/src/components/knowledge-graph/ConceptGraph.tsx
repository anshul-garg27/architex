"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type NodeProps,
  type EdgeProps,
  type OnSelectionChangeParams,
  BackgroundVariant,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Search, Filter, RotateCcw, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONCEPTS,
  RELATIONSHIPS,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  ALL_DOMAINS,
  getConnectionCount,
  findPath,
  type Concept,
  type ConceptDomain,
  type Difficulty,
  type RelationshipType,
} from "@/lib/knowledge-graph/concepts";
import { layoutGraph } from "@/lib/knowledge-graph/graph-layout";
import { ConceptDetailPanel } from "./ConceptDetailPanel";

// ── Relationship edge styles ──────────────────────────────────

const EDGE_STYLES: Record<RelationshipType, { stroke: string; strokeDasharray?: string; label: string }> = {
  uses: { stroke: "#64748b", label: "uses" },
  "alternative-to": { stroke: "#f59e0b", strokeDasharray: "6 3", label: "alt" },
  "depends-on": { stroke: "#ef4444", label: "dep" },
  enhances: { stroke: "#10b981", label: "enh" },
  "part-of": { stroke: "#8b5cf6", strokeDasharray: "3 3", label: "part" },
};

// ── Custom Node ───────────────────────────────────────────────

type ConceptNodeData = {
  label: string;
  domain: ConceptDomain;
  connectionCount: number;
  difficulty: Difficulty;
  isHighlighted: boolean;
  isPathNode: boolean;
  isDimmed: boolean;
};

type ConceptNodeType = Node<ConceptNodeData, "concept">;

function ConceptNode({ data, selected }: NodeProps<ConceptNodeType>) {
  const color = DOMAIN_COLORS[data.domain];
  const size = Math.max(36, Math.min(64, 36 + data.connectionCount * 3));

  return (
    <div
      className={cn(
        "group relative flex items-center justify-center rounded-full border-2 transition-all duration-200",
        selected && "ring-2 ring-white/50 ring-offset-2 ring-offset-transparent",
        data.isPathNode && "ring-2 ring-yellow-400/80",
        data.isDimmed && "opacity-25",
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}20`,
        borderColor: data.isHighlighted || data.isPathNode ? color : `${color}60`,
        boxShadow: data.isHighlighted ? `0 0 16px ${color}40` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      <span
        className="pointer-events-none max-w-[80px] truncate text-center text-[9px] font-medium leading-tight"
        style={{ color }}
      >
        {data.label}
      </span>
      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[8px] text-foreground-muted opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {data.label}
      </div>
    </div>
  );
}

// ── Custom Edge ───────────────────────────────────────────────

type ConceptEdgeData = {
  relationshipType: RelationshipType;
  isHighlighted: boolean;
  isPathEdge: boolean;
  isDimmed: boolean;
};

type ConceptEdgeType = Edge<ConceptEdgeData, "concept-edge">;

function ConceptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<ConceptEdgeType>) {
  const relType = data?.relationshipType ?? "uses";
  const style = EDGE_STYLES[relType];
  const isHighlighted = data?.isHighlighted ?? false;
  const isPathEdge = data?.isPathEdge ?? false;
  const isDimmed = data?.isDimmed ?? false;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: isPathEdge ? "#facc15" : style.stroke,
        strokeWidth: isHighlighted || isPathEdge ? 2.5 : 1,
        strokeDasharray: style.strokeDasharray,
        opacity: isDimmed ? 0.1 : isHighlighted || isPathEdge ? 1 : 0.4,
        transition: "opacity 0.2s, stroke-width 0.2s",
      }}
    />
  );
}

// ── Node / Edge type maps (static, outside component) ─────────

const nodeTypes: NodeTypes = { concept: ConceptNode } as unknown as NodeTypes;
const edgeTypes: EdgeTypes = { "concept-edge": ConceptEdge } as unknown as EdgeTypes;

// ── Graph internals (inside ReactFlowProvider) ────────────────

function ConceptGraphInner() {
  const { fitView, setCenter } = useReactFlow();

  // ── State ──────────────────────────────────────────────────

  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<ConceptDomain | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Compute layout once ────────────────────────────────────

  const layout = useMemo(() => layoutGraph(CONCEPTS, RELATIONSHIPS), []);

  // ── Build node / edge id sets for path highlighting ────────

  const computePath = useCallback((startId: string | null, endId: string | null) => {
    if (!startId || !endId || startId === endId) {
      setHighlightedPath(new Set());
      setHighlightedEdges(new Set());
      return;
    }
    const path = findPath(startId, endId);
    if (!path) {
      setHighlightedPath(new Set());
      setHighlightedEdges(new Set());
      return;
    }
    setHighlightedPath(new Set(path));
    const edgeIds = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      for (const e of layout.edges) {
        if (
          (e.source === path[i] && e.target === path[i + 1]) ||
          (e.target === path[i] && e.source === path[i + 1])
        ) {
          edgeIds.add(e.id);
        }
      }
    }
    setHighlightedEdges(edgeIds);
  }, [layout.edges]);

  // ── Filter concepts ────────────────────────────────────────

  const filteredConceptIds = useMemo(() => {
    const ids = new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    for (const c of CONCEPTS) {
      if (domainFilter !== "all" && c.domain !== domainFilter) continue;
      if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) continue;
      if (q && !c.name.toLowerCase().includes(q) && !c.tags.some((t) => t.toLowerCase().includes(q))) {
        continue;
      }
      ids.add(c.id);
    }
    return ids;
  }, [searchQuery, domainFilter, difficultyFilter]);

  const isFiltered = searchQuery !== "" || domainFilter !== "all" || difficultyFilter !== "all";

  // ── React Flow nodes ───────────────────────────────────────

  const rfNodes: Node[] = useMemo(() => {
    return layout.nodes.map((n) => {
      const passesFilter = filteredConceptIds.has(n.id);
      const isPathNode = highlightedPath.has(n.id);
      return {
        id: n.id,
        type: "concept",
        position: { x: n.x, y: n.y },
        data: {
          label: n.concept.name,
          domain: n.concept.domain,
          connectionCount: n.connectionCount,
          difficulty: n.concept.difficulty,
          isHighlighted: selectedConcept?.id === n.id,
          isPathNode,
          isDimmed: isFiltered && !passesFilter && !isPathNode,
        } satisfies ConceptNodeData,
        selected: selectedConcept?.id === n.id,
      };
    });
  }, [layout.nodes, filteredConceptIds, highlightedPath, selectedConcept, isFiltered]);

  // ── React Flow edges ───────────────────────────────────────

  const rfEdges: Edge[] = useMemo(() => {
    return layout.edges.map((e) => {
      const isPathEdge = highlightedEdges.has(e.id);
      const bothVisible = filteredConceptIds.has(e.source) && filteredConceptIds.has(e.target);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "concept-edge",
        data: {
          relationshipType: e.relationship.type,
          isHighlighted: selectedConcept ? (e.source === selectedConcept.id || e.target === selectedConcept.id) : false,
          isPathEdge,
          isDimmed: isFiltered && !bothVisible && !isPathEdge,
        } satisfies ConceptEdgeData,
      };
    });
  }, [layout.edges, filteredConceptIds, highlightedEdges, selectedConcept, isFiltered]);

  // ── Handlers ───────────────────────────────────────────────

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const concept = CONCEPTS.find((c) => c.id === node.id) ?? null;
    setSelectedConcept(concept);
  }, []);

  const handleSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    if (nodes.length === 0) {
      setSelectedConcept(null);
    }
  }, []);

  const handleNavigate = useCallback((conceptId: string) => {
    const concept = CONCEPTS.find((c) => c.id === conceptId) ?? null;
    setSelectedConcept(concept);
    const layoutNode = layout.nodes.find((n) => n.id === conceptId);
    if (layoutNode) {
      setCenter(layoutNode.x, layoutNode.y, { zoom: 1.2, duration: 400 });
    }
  }, [layout.nodes, setCenter]);

  const handleCloseDetail = useCallback(() => {
    setSelectedConcept(null);
  }, []);

  const handleReset = useCallback(() => {
    setSearchQuery("");
    setDomainFilter("all");
    setDifficultyFilter("all");
    setPathStart(null);
    setPathEnd(null);
    setHighlightedPath(new Set());
    setHighlightedEdges(new Set());
    setSelectedConcept(null);
    fitView({ duration: 400 });
  }, [fitView]);

  const handleZoomToDomain = useCallback((domain: ConceptDomain) => {
    const domainNodes = layout.nodes.filter((n) => n.concept.domain === domain);
    if (domainNodes.length === 0) return;
    const xs = domainNodes.map((n) => n.x);
    const ys = domainNodes.map((n) => n.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    setCenter(cx, cy, { zoom: 1.5, duration: 400 });
    setDomainFilter(domain);
  }, [layout.nodes, setCenter]);

  // Path finding: toggle start/end nodes
  const handleTogglePathNode = useCallback((conceptId: string) => {
    if (pathStart === conceptId) {
      setPathStart(null);
      setHighlightedPath(new Set());
      setHighlightedEdges(new Set());
    } else if (pathEnd === conceptId) {
      setPathEnd(null);
      setHighlightedPath(new Set());
      setHighlightedEdges(new Set());
    } else if (!pathStart) {
      setPathStart(conceptId);
    } else if (!pathEnd) {
      setPathEnd(conceptId);
      computePath(pathStart, conceptId);
    } else {
      // Reset and start new
      setPathStart(conceptId);
      setPathEnd(null);
      setHighlightedPath(new Set());
      setHighlightedEdges(new Set());
    }
  }, [pathStart, pathEnd, computePath]);

  // MiniMap node color
  const minimapNodeColor = useCallback((node: Node) => {
    const domain = (node.data as ConceptNodeData).domain;
    return DOMAIN_COLORS[domain] ?? "#64748b";
  }, []);

  return (
    <div className="relative flex h-full w-full">
      {/* Toolbar */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {/* Search */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-popover/95 px-2 py-1.5 shadow-md backdrop-blur-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts..."
            aria-label="Search concepts"
            className="w-40 bg-transparent text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-border bg-popover/95 px-2 py-1.5 text-xs shadow-md backdrop-blur-sm transition-colors",
            filterOpen ? "text-primary" : "text-foreground-muted hover:text-foreground",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {isFiltered && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              !
            </span>
          )}
        </button>

        {/* Filter panel */}
        {filterOpen && (
          <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-md backdrop-blur-sm">
            {/* Domain filter */}
            <div className="mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Domain
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                <FilterChip
                  label="All"
                  active={domainFilter === "all"}
                  onClick={() => setDomainFilter("all")}
                />
                {ALL_DOMAINS.map((d) => (
                  <FilterChip
                    key={d}
                    label={DOMAIN_LABELS[d]}
                    active={domainFilter === d}
                    color={DOMAIN_COLORS[d]}
                    onClick={() => setDomainFilter(d)}
                  />
                ))}
              </div>
            </div>
            {/* Difficulty filter */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Difficulty
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                <FilterChip
                  label="All"
                  active={difficultyFilter === "all"}
                  onClick={() => setDifficultyFilter("all")}
                />
                <FilterChip
                  label="Beginner"
                  active={difficultyFilter === "beginner"}
                  color="#10b981"
                  onClick={() => setDifficultyFilter("beginner")}
                />
                <FilterChip
                  label="Intermediate"
                  active={difficultyFilter === "intermediate"}
                  color="#f59e0b"
                  onClick={() => setDifficultyFilter("intermediate")}
                />
                <FilterChip
                  label="Advanced"
                  active={difficultyFilter === "advanced"}
                  color="#ef4444"
                  onClick={() => setDifficultyFilter("advanced")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-popover/95 px-2 py-1.5 text-xs text-foreground-muted shadow-md backdrop-blur-sm transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        {/* Path finder */}
        <div className="rounded-lg border border-border bg-popover/95 p-2 shadow-md backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Find Path
          </span>
          <div className="mt-1 space-y-1">
            <PathNodePicker
              label="From"
              selectedId={pathStart}
              onSelect={handleTogglePathNode}
              onClear={() => { setPathStart(null); setHighlightedPath(new Set()); setHighlightedEdges(new Set()); }}
            />
            <PathNodePicker
              label="To"
              selectedId={pathEnd}
              onSelect={handleTogglePathNode}
              onClear={() => { setPathEnd(null); setHighlightedPath(new Set()); setHighlightedEdges(new Set()); }}
            />
          </div>
        </div>
      </div>

      {/* Domain cluster zoom buttons */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        <span className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-foreground-muted">
          Zoom to Domain
        </span>
        {ALL_DOMAINS.map((d) => (
          <button
            key={d}
            onClick={() => handleZoomToDomain(d)}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: DOMAIN_COLORS[d] }}
            />
            {DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      {/* React Flow Canvas */}
      <div className={cn("flex-1 transition-all", selectedConcept && "mr-0")}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={handleNodeClick}
          onSelectionChange={handleSelectionChange}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "concept-edge" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#ffffff08" />
          <Controls
            showInteractive={false}
            className="!border-border !bg-popover/90 !shadow-md [&_button]:!border-border [&_button]:!bg-transparent [&_button]:!text-foreground-muted [&_button:hover]:!bg-accent [&_button:hover]:!text-foreground"
          />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="rgba(0,0,0,0.7)"
            className="!border-border !bg-elevated/90 !shadow-md"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      {/* Detail Panel */}
      {selectedConcept && (
        <div className="w-72 shrink-0">
          <ConceptDetailPanel
            concept={selectedConcept}
            onClose={handleCloseDetail}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {/* Edge legend */}
      <div className="absolute bottom-14 left-3 z-10 rounded-lg border border-border bg-popover/95 p-2 shadow-md backdrop-blur-sm">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground-muted">
          Edge Types
        </span>
        <div className="mt-1 space-y-0.5">
          {(Object.entries(EDGE_STYLES) as [RelationshipType, typeof EDGE_STYLES[RelationshipType]][]).map(([type, style]) => (
            <div key={type} className="flex items-center gap-1.5">
              <svg width="20" height="6" className="shrink-0">
                <line
                  x1="0"
                  y1="3"
                  x2="20"
                  y2="3"
                  stroke={style.stroke}
                  strokeWidth="2"
                  strokeDasharray={style.strokeDasharray}
                />
              </svg>
              <span className="text-[9px] capitalize text-foreground-subtle">{type.replace(/-/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Filter Chip ───────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}

const FilterChip = memo(function FilterChip({ label, active, color, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-transparent text-foreground-subtle hover:border-foreground-muted hover:text-foreground-muted",
      )}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
});

// ── Path Node Picker ──────────────────────────────────────────

interface PathNodePickerProps {
  label: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

const PathNodePicker = memo(function PathNodePicker({
  label,
  selectedId,
  onClear,
}: PathNodePickerProps) {
  const concept = selectedId ? CONCEPTS.find((c) => c.id === selectedId) : null;
  return (
    <div className="flex items-center gap-1">
      <span className="w-8 text-[10px] text-foreground-subtle">{label}:</span>
      {concept ? (
        <div className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: DOMAIN_COLORS[concept.domain] }}
          />
          <span className="text-[10px] text-foreground-muted">{concept.name}</span>
          <button
            onClick={onClear}
            className="ml-0.5 text-[10px] text-foreground-subtle hover:text-foreground"
          >
            x
          </button>
        </div>
      ) : (
        <span className="text-[10px] text-foreground-subtle italic">Click a node</span>
      )}
    </div>
  );
});

// ── Wrapper with ReactFlowProvider ────────────────────────────

export const ConceptGraph = memo(function ConceptGraph() {
  return (
    <ReactFlowProvider>
      <ConceptGraphInner />
    </ReactFlowProvider>
  );
});
