"use client";

import React from "react";
import { Share2 } from "lucide-react";
import {
  ALL_DOMAINS,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  CONCEPTS,
  getConceptsByDomain,
} from "@/lib/knowledge-graph/concepts";
import { ConceptGraph } from "@/components/knowledge-graph/ConceptGraph";

// ── Module Hook ───────────────────────────────────────────────

export function useKnowledgeGraphModule() {
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Knowledge Graph
        </h2>
        <p className="mt-1 text-[10px] text-foreground-subtle">
          {CONCEPTS.length} concepts across {ALL_DOMAINS.length} domains
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Domains
        </h3>
        <ul className="space-y-1">
          {ALL_DOMAINS.map((d) => {
            const count = getConceptsByDomain(d).length;
            return (
              <li
                key={d}
                className="flex items-center justify-between rounded px-2 py-1.5 text-xs text-foreground-muted"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DOMAIN_COLORS[d] }}
                  />
                  <span>{DOMAIN_LABELS[d]}</span>
                </div>
                <span className="text-[10px] text-foreground-subtle">{count}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-lg border border-border bg-elevated p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-foreground-muted">
              How to Use
            </span>
          </div>
          <ul className="space-y-1 text-[10px] text-foreground-subtle">
            <li>Click a node to see its details</li>
            <li>Use search to find concepts</li>
            <li>Filter by domain or difficulty</li>
            <li>Click two nodes for path finding</li>
            <li>Zoom to domain clusters from the right panel</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const canvas = (
    <div className="h-full w-full bg-background">
      <ConceptGraph />
    </div>
  );

  const properties = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Properties
        </h2>
      </div>
      <div className="flex flex-1 items-center justify-center px-3 py-8">
        <p className="text-center text-xs text-foreground-subtle">
          Select a concept node to view its details in the graph.
        </p>
      </div>
    </div>
  );

  const bottomPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Knowledge Graph Console
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
        Concept exploration data will appear here.
      </div>
    </div>
  );

  return { sidebar, canvas, properties, bottomPanel };
}
