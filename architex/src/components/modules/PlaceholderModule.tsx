"use client";

import React, { memo } from "react";
import {
  Boxes,
  ShieldCheck,
  Brain,
  Clock,
} from "lucide-react";
import type { ModuleType } from "@/stores/ui-store";

// ── Module Definitions ──────────────────────────────────────

interface PlaceholderDef {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const PLACEHOLDER_DEFS: Partial<Record<ModuleType, PlaceholderDef>> = {
  "data-structures": {
    name: "Data Structures",
    description:
      "Interactive visualizations of arrays, linked lists, trees, graphs, heaps, hash tables, and more.",
    icon: Boxes,
    features: [
      "Binary Search Tree with insert, delete, and search animations",
      "Graph traversal visualizer (BFS, DFS, Dijkstra)",
      "Heap operations with tree and array dual view",
      "Hash table collision resolution visualization",
      "Trie and suffix tree exploration",
      "Red-Black and AVL tree rotations",
    ],
  },
  security: {
    name: "Security",
    description:
      "Visualizations of OAuth flows, JWT lifecycle, encryption, and common vulnerability patterns.",
    icon: ShieldCheck,
    features: [
      "OAuth 2.0 / OIDC flow visualizer",
      "JWT encode/decode playground",
      "TLS certificate chain explorer",
      "SQL injection demo with sanitization",
      "CSRF and XSS attack flow diagrams",
      "Password hashing comparison (bcrypt, Argon2)",
    ],
  },
  "ml-design": {
    name: "ML System Design",
    description:
      "Machine learning pipeline designer with feature store, training, serving, and monitoring components.",
    icon: Brain,
    features: [
      "ML pipeline architecture builder",
      "Feature store design patterns",
      "Model serving infrastructure (TF Serving, Triton)",
      "A/B testing and experimentation framework",
      "Data pipeline DAG visualizer",
      "Model monitoring and drift detection",
    ],
  },
};

// ── Component ───────────────────────────────────────────────

export function usePlaceholderModule(moduleType: ModuleType) {
  const def = PLACEHOLDER_DEFS[moduleType] ?? {
    name: moduleType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "This module is under development.",
    icon: Clock,
    features: [],
  };

  const Icon = def.icon;

  const canvas = (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <Icon className="mx-auto mb-4 h-20 w-20 text-foreground-subtle opacity-20" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          {def.name}
        </h2>
        <p className="mb-6 text-sm text-foreground-muted">{def.description}</p>
        <div className="rounded-lg border border-border bg-elevated p-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-foreground-subtle">
            This module is actively being developed. Check back soon for interactive visualizations.
          </p>
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          {def.name}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-3 text-xs text-foreground-muted">{def.description}</p>
        <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
          Planned Features
        </h3>
        <ul className="space-y-1.5">
          {def.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-foreground-muted"
            >
              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-subtle opacity-50" />
              {f}
            </li>
          ))}
        </ul>
      </div>
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
          Properties will appear here when the module is ready.
        </p>
      </div>
    </div>
  );

  const bottomPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Console
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
        Module output will appear here.
      </div>
    </div>
  );

  return { sidebar, canvas, properties, bottomPanel };
}

export const PlaceholderModule = memo(function PlaceholderModule() {
  return null;
});
