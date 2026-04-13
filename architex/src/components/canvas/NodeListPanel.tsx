"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { Node } from "@xyflow/react";
import { ArrowUpDown, Search, List, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ────────────────────────────────────────────────────

type SortField = "name" | "type" | "connections";
type SortDir = "asc" | "desc";

interface NodeRow {
  id: string;
  name: string;
  type: string;
  connections: number;
  x: number;
  y: number;
}

// ── Helpers ──────────────────────────────────────────────────

function humanNodeType(type: string | undefined): string {
  if (!type) return "Node";
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildRows(nodes: Node[], edges: { source: string; target: string }[]): NodeRow[] {
  const connectionCounts = new Map<string, number>();
  for (const edge of edges) {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) ?? 0) + 1);
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) ?? 0) + 1);
  }

  return nodes.map((node) => {
    const label = (node.data as Record<string, unknown>)?.label;
    return {
      id: node.id,
      name: typeof label === "string" ? label : node.id,
      type: humanNodeType(node.type),
      connections: connectionCounts.get(node.id) ?? 0,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    };
  });
}

function sortRows(rows: NodeRow[], field: SortField, dir: SortDir): NodeRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "type":
        cmp = a.type.localeCompare(b.type);
        break;
      case "connections":
        cmp = a.connections - b.connections;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ── Component ────────────────────────────────────────────────

export interface NodeListPanelProps {
  onEditNode?: (nodeId: string) => void;
}

export const NodeListPanel = memo(function NodeListPanel({
  onEditNode,
}: NodeListPanelProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const setSelectedNodeIds = useCanvasStore((s) => s.setSelectedNodeIds);
  const removeNodes = useCanvasStore((s) => s.removeNodes);

  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rows = useMemo(() => buildRows(nodes, edges), [nodes, edges]);

  const filteredRows = useMemo(() => {
    if (!filter) return sortRows(rows, sortField, sortDir);
    const lower = filter.toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.type.toLowerCase().includes(lower),
    );
    return sortRows(filtered, sortField, sortDir);
  }, [rows, filter, sortField, sortDir]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeIds([nodeId]);
    },
    [setSelectedNodeIds],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      removeNodes([nodeId]);
    },
    [removeNodes],
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, nodeId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectNode(nodeId);
        onEditNode?.(nodeId);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteNode(nodeId);
      }
    },
    [handleSelectNode, handleDeleteNode, onEditNode],
  );

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface"
      role="region"
      aria-label="Node list panel"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <List className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">Nodes</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredRows.length} of {rows.length}
        </span>
      </div>

      {/* ── Search ── */}
      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter nodes..."
            className="h-8 pl-7 text-xs"
            aria-label="Filter nodes by name or type"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs" role="grid" aria-label="Canvas nodes">
          <thead className="sticky top-0 bg-surface">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  aria-label={`Sort by name${sortIndicator("name") ?? ""}`}
                >
                  Name
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  {sortIndicator("name")}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort("type")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  aria-label={`Sort by type${sortIndicator("type") ?? ""}`}
                >
                  Type
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  {sortIndicator("type")}
                </button>
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort("connections")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  aria-label={`Sort by connections${sortIndicator("connections") ?? ""}`}
                >
                  Conns
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  {sortIndicator("connections")}
                </button>
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                Position
              </th>
              <th className="w-16 px-3 py-2" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const isSelected = selectedNodeIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  role="row"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => handleSelectNode(row.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, row.id)}
                  className={cn(
                    "cursor-pointer border-b border-border/40 transition-colors",
                    "hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary",
                    isSelected && "bg-primary/10",
                  )}
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {row.name}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.type}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {row.connections}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {row.x}, {row.y}
                  </td>
                  <td className="px-3 py-2">
                    <TooltipProvider delayDuration={300}>
                      <div className="flex items-center justify-end gap-1">
                        {onEditNode && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditNode(row.id);
                                }}
                                aria-label={`Edit ${row.name}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Edit</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(row.id);
                              }}
                              aria-label={`Delete ${row.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  {nodes.length === 0
                    ? "No nodes on canvas"
                    : "No nodes match filter"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
