"use client";

import React, { lazy, Suspense, memo, type ComponentType } from "react";
import type { ModuleType } from "@/stores/ui-store";
import {
  SidebarSkeleton,
  CanvasSkeleton,
  PropertiesSkeleton,
} from "@/components/shared/LoadingTransitions";

// ── Error Boundary ────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ModuleErrorBoundary extends React.Component<
  { children: React.ReactNode; moduleName: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; moduleName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">
              Failed to load {this.props.moduleName} module
            </p>
            {this.state.error && (
              <p className="mt-1 text-xs text-foreground-muted">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Lazy module map ───────────────────────────────────────

type LazyModule = ComponentType<Record<string, never>>;

const lazyModules: Record<string, () => Promise<{ default: LazyModule }>> = {
  algorithms: () =>
    import("@/components/modules/AlgorithmModule").then((m) => ({
      default: m.AlgorithmModule as unknown as LazyModule,
    })),
  "data-structures": () =>
    import("@/components/modules/data-structures").then((m) => ({
      default: m.DataStructuresModule as unknown as LazyModule,
    })),
  distributed: () =>
    import("@/components/modules/DistributedModule").then((m) => ({
      default: m.DistributedModule as unknown as LazyModule,
    })),
  networking: () =>
    import("@/components/modules/NetworkingModule").then((m) => ({
      default: m.NetworkingModule as unknown as LazyModule,
    })),
  os: () =>
    import("@/components/modules/OSModule").then((m) => ({
      default: m.OSModule as unknown as LazyModule,
    })),
  concurrency: () =>
    import("@/components/modules/ConcurrencyModule").then((m) => ({
      default: m.ConcurrencyModule as unknown as LazyModule,
    })),
  interview: () =>
    import("@/components/modules/InterviewModule").then((m) => ({
      default: m.InterviewModule as unknown as LazyModule,
    })),
  security: () =>
    import("@/components/modules/SecurityModule").then((m) => ({
      default: m.SecurityModule as unknown as LazyModule,
    })),
  "ml-design": () =>
    import("@/components/modules/MLDesignModule").then((m) => ({
      default: m.MLDesignModule as unknown as LazyModule,
    })),
  database: () =>
    import("@/components/modules/DatabaseModule").then((m) => ({
      default: m.DatabaseModule as unknown as LazyModule,
    })),
};

// Build lazy components on first access — one per module.
const lazyComponentCache = new Map<string, React.LazyExoticComponent<LazyModule>>();

function getLazyComponent(moduleType: string): React.LazyExoticComponent<LazyModule> | null {
  const factory = lazyModules[moduleType];
  if (!factory) return null;

  let component = lazyComponentCache.get(moduleType);
  if (!component) {
    component = lazy(factory);
    lazyComponentCache.set(moduleType, component);
  }
  return component;
}

// ── Skeleton fallback ─────────────────────────────────────

const ModuleSkeleton = memo(function ModuleSkeleton() {
  return (
    <div className="flex h-full w-full">
      <div className="w-64 shrink-0 border-r border-border">
        <SidebarSkeleton />
      </div>
      <div className="flex-1">
        <CanvasSkeleton />
      </div>
      <div className="w-72 shrink-0 border-l border-border">
        <PropertiesSkeleton />
      </div>
    </div>
  );
});

// ── Human-readable module names ───────────────────────────

const MODULE_NAMES: Record<string, string> = {
  "system-design": "System Design",
  algorithms: "Algorithms",
  "data-structures": "Data Structures",
  distributed: "Distributed Systems",
  networking: "Networking",
  os: "Operating Systems",
  concurrency: "Concurrency",
  interview: "Interview Prep",
  security: "Security",
  "ml-design": "ML Design",
  database: "Database",
  lld: "Low Level Design",
  "knowledge-graph": "Knowledge Graph",
};

// ── ModuleRenderer ────────────────────────────────────────

interface ModuleRendererProps {
  moduleType: ModuleType;
}

export const ModuleRenderer = memo(function ModuleRenderer({
  moduleType,
}: ModuleRendererProps) {
  const LazyComponent = getLazyComponent(moduleType);
  const displayName = MODULE_NAMES[moduleType] ?? moduleType;

  if (!LazyComponent) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-foreground-muted">
          Unknown module: {moduleType}
        </p>
      </div>
    );
  }

  return (
    <ModuleErrorBoundary moduleName={displayName}>
      <Suspense fallback={<ModuleSkeleton />}>
        <LazyComponent />
      </Suspense>
    </ModuleErrorBoundary>
  );
});
