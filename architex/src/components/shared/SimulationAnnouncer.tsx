"use client";

import { memo, useEffect, useRef } from "react";
import { useSimulationStore, type SimulationStatus } from "@/stores/simulation-store";
import { useCanvasStore } from "@/stores/canvas-store";
import type { Node, Edge } from "@xyflow/react";

function statusLabel(status: SimulationStatus): string | null {
  switch (status) {
    case "running":
      return "Simulation started";
    case "paused":
      return "Simulation paused";
    case "idle":
      return "Simulation stopped";
    case "completed":
      return "Simulation completed";
    case "error":
      return "Simulation error";
    default:
      return null;
  }
}

/** Extract the display label from a node's data. */
function getNodeLabel(node: Node): string {
  const data = node.data as Record<string, unknown> | undefined;
  return typeof data?.label === "string" ? data.label : node.id;
}

/**
 * Visually hidden live region that announces simulation state changes,
 * periodic metrics updates, and canvas mutations (node add/delete,
 * connection create) to screen readers.
 */
export const SimulationAnnouncer = memo(function SimulationAnnouncer() {
  const status = useSimulationStore((s) => s.status);
  const totalRequests = useSimulationStore((s) => s.metrics.totalRequests);
  const throughputRps = useSimulationStore((s) => s.metrics.throughputRps);
  const errorRate = useSimulationStore((s) => s.metrics.errorRate);
  const avgLatencyMs = useSimulationStore((s) => s.metrics.avgLatencyMs);

  const announcementRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<SimulationStatus>(status);

  // ── Simulation status announcements ──────────────────────
  useEffect(() => {
    if (status === prevStatusRef.current) return;
    prevStatusRef.current = status;

    const label = statusLabel(status);
    if (label && announcementRef.current) {
      announcementRef.current.textContent = label;
    }
  }, [status]);

  // ── Simulation metrics (periodic while running) ──────────
  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      if (!announcementRef.current) return;
      announcementRef.current.textContent =
        `Throughput ${Math.round(throughputRps)} requests per second, ` +
        `${totalRequests} total requests, ` +
        `average latency ${Math.round(avgLatencyMs)} milliseconds, ` +
        `error rate ${(errorRate * 100).toFixed(1)} percent`;
    }, 5000);

    return () => clearInterval(interval);
  }, [status, totalRequests, throughputRps, avgLatencyMs, errorRate]);

  // ── Canvas mutation announcements ────────────────────────
  // Subscribe to the canvas store to detect node add/delete and
  // edge creation, then announce the change to screen readers.
  useEffect(() => {
    let prevNodes: Node[] = useCanvasStore.getState().nodes;
    let prevEdges: Edge[] = useCanvasStore.getState().edges;

    const unsubscribe = useCanvasStore.subscribe((state) => {
      const { nodes, edges } = state;

      // Detect added nodes
      if (nodes.length > prevNodes.length) {
        const prevIds = new Set(prevNodes.map((n) => n.id));
        const added = nodes.filter((n) => !prevIds.has(n.id));
        for (const node of added) {
          if (announcementRef.current) {
            announcementRef.current.textContent = `Node added: ${getNodeLabel(node)}`;
          }
        }
      }

      // Detect removed nodes
      if (nodes.length < prevNodes.length) {
        const currentIds = new Set(nodes.map((n) => n.id));
        const removed = prevNodes.filter((n) => !currentIds.has(n.id));
        for (const node of removed) {
          if (announcementRef.current) {
            announcementRef.current.textContent = `Node deleted: ${getNodeLabel(node)}`;
          }
        }
      }

      // Detect added edges (connections)
      if (edges.length > prevEdges.length) {
        const prevEdgeIds = new Set(prevEdges.map((e) => e.id));
        const addedEdges = edges.filter((e) => !prevEdgeIds.has(e.id));
        for (const edge of addedEdges) {
          // Resolve source/target labels from the current node set
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          const sourceName = sourceNode ? getNodeLabel(sourceNode) : edge.source;
          const targetName = targetNode ? getNodeLabel(targetNode) : edge.target;
          if (announcementRef.current) {
            announcementRef.current.textContent = `Connection created: ${sourceName} to ${targetName}`;
          }
        }
      }

      prevNodes = nodes;
      prevEdges = edges;
    });

    return unsubscribe;
  }, []);

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
});
