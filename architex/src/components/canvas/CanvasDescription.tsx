"use client";

import { memo, useMemo, useRef, useEffect } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useCanvasStore } from "@/stores/canvas-store";

// ── Helpers ──────────────────────────────────────────────────

/**
 * Maps a node's `type` string to a human-readable label.
 * Falls back to title-casing the raw type.
 */
function humanNodeType(type: string | undefined): string {
  if (!type) return "Node";
  const map: Record<string, string> = {
    "web-server": "Web Server",
    "load-balancer": "Load Balancer",
    database: "Database",
    cache: "Cache",
    "message-queue": "Message Queue",
    "api-gateway": "API Gateway",
    cdn: "CDN",
    client: "Client",
    storage: "Storage",
    "app-server": "App Server",
    serverless: "Serverless Function",
    worker: "Worker Service",
    "document-db": "Document DB",
    "wide-column": "Wide-Column DB",
    "search-engine": "Search Engine",
    "timeseries-db": "Time-Series DB",
    "graph-db": "Graph DB",
    "pub-sub": "Pub/Sub",
    "stream-processor": "Stream Processor",
    "batch-processor": "Batch Processor",
    "ml-inference": "ML Inference",
    dns: "DNS",
    "cdn-edge": "CDN Edge",
    firewall: "Firewall",
    "mobile-client": "Mobile Client",
    "third-party-api": "Third-Party API",
    "metrics-collector": "Metrics Collector",
    "log-aggregator": "Log Aggregator",
    tracer: "Distributed Tracer",
    "event-bus": "Event Bus",
    "rate-limiter": "Rate Limiter",
    "secret-manager": "Secret Manager",
  };
  return (
    map[type] ??
    type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

interface NodeTypeGroup {
  type: string;
  humanType: string;
  names: string[];
}

/**
 * Groups nodes by their `type`, collecting human-readable labels.
 */
function groupNodesByType(nodes: Node[]): NodeTypeGroup[] {
  const groups = new Map<string, string[]>();
  for (const node of nodes) {
    const t = node.type ?? "unknown";
    const label = (node.data as Record<string, unknown>)?.label;
    const name = typeof label === "string" ? label : node.id;
    const existing = groups.get(t);
    if (existing) {
      existing.push(name);
    } else {
      groups.set(t, [name]);
    }
  }
  return Array.from(groups.entries()).map(([type, names]) => ({
    type,
    humanType: humanNodeType(type),
    names,
  }));
}

/**
 * Builds a topology summary: which node types connect to which.
 */
function describeTopology(nodes: Node[], edges: Edge[]): string[] {
  if (edges.length === 0) return [];

  const nodeNameById = new Map<string, string>();
  const nodeTypeById = new Map<string, string>();
  for (const node of nodes) {
    const label = (node.data as Record<string, unknown>)?.label;
    nodeNameById.set(node.id, typeof label === "string" ? label : node.id);
    nodeTypeById.set(node.id, node.type ?? "unknown");
  }

  // Group connections by source node type
  const connectionsBySourceType = new Map<string, Set<string>>();
  for (const edge of edges) {
    const sourceType = nodeTypeById.get(edge.source);
    const targetType = nodeTypeById.get(edge.target);
    if (!sourceType || !targetType) continue;

    const key = humanNodeType(sourceType);
    const existing = connectionsBySourceType.get(key);
    const targetHuman = humanNodeType(targetType);
    if (existing) {
      existing.add(targetHuman);
    } else {
      connectionsBySourceType.set(key, new Set([targetHuman]));
    }
  }

  return Array.from(connectionsBySourceType.entries()).map(
    ([source, targets]) => {
      const targetList = Array.from(targets);
      if (targetList.length === 1) {
        return `${source} connects to ${targetList[0]}`;
      }
      const last = targetList.pop()!;
      return `${source} connects to ${targetList.join(", ")} and ${last}`;
    },
  );
}

// ── Public: generate full description ────────────────────────

export function generateCanvasDescription(
  nodes: Node[],
  edges: Edge[],
): string {
  if (nodes.length === 0) {
    return "Empty canvas. Drag components from the sidebar to begin designing.";
  }

  const groups = groupNodesByType(nodes);
  const typeSummary = groups
    .map((g) => `${g.names.length} ${g.humanType}${g.names.length !== 1 ? "s" : ""}`)
    .join(", ");

  const header = `System design with ${nodes.length} node${nodes.length !== 1 ? "s" : ""}: ${typeSummary}. ${edges.length} connection${edges.length !== 1 ? "s" : ""}.`;

  const nodeDetails = groups.map(
    (g) => `${g.humanType}${g.names.length !== 1 ? "s" : ""}: ${g.names.join(", ")}`,
  );

  const topology = describeTopology(nodes, edges);

  const parts = [header, ...nodeDetails];
  if (topology.length > 0) {
    parts.push("Topology: " + topology.join(". ") + ".");
  }

  return parts.join(" ");
}

// ── Component ────────────────────────────────────────────────

export const CanvasDescription = memo(function CanvasDescription() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const description = useMemo(
    () => generateCanvasDescription(nodes, edges),
    [nodes, edges],
  );

  // Announce changes by updating textContent — prevents stale aria-live reads
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.textContent = description;
    }
  }, [description]);

  return (
    <div
      ref={descriptionRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
});
