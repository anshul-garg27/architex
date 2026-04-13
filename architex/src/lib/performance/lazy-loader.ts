// ─────────────────────────────────────────────────────────────
// Architex — Lazy Loading Utilities
// ─────────────────────────────────────────────────────────────
//
// Wraps React.lazy with Suspense and a configurable fallback.
// Also provides pre-configured lazy imports for known heavy
// components and a `prefetchComponent` helper to trigger the
// import without rendering.
// ─────────────────────────────────────────────────────────────

import {
  lazy,
  Suspense,
  createElement,
  type ComponentType,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────

/** The shape of a dynamic import function. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ImportFn<T extends ComponentType<any> = ComponentType<any>> = () => Promise<{
  default: T;
}>;

// ── Default Fallback ───────────────────────────────────────

function DefaultFallback(): ReactNode {
  return createElement(
    'div',
    {
      className: 'flex items-center justify-center p-8 text-muted-foreground',
      'aria-busy': 'true',
    },
    createElement('span', null, 'Loading...'),
  );
}

// ── Lazy Component Wrapper ─────────────────────────────────

/**
 * Creates a lazy-loaded component wrapped in Suspense with a
 * fallback UI. Drop-in replacement for `React.lazy` that includes
 * the Suspense boundary.
 *
 * @param importFn Dynamic import function, e.g. `() => import('./HeavyComponent')`
 * @param fallback Optional custom fallback; defaults to a centered "Loading..." text
 * @returns A component that renders the lazy-loaded module inside Suspense
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyComponent<P extends Record<string, any> = Record<string, never>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode,
): ComponentType<P> {
  const LazyInner = lazy(importFn);

  function LazyWrapper(props: P): ReactNode {
    return createElement(
      Suspense,
      { fallback: fallback ?? createElement(DefaultFallback) },
      createElement(LazyInner, props),
    );
  }

  LazyWrapper.displayName = `Lazy(${importFn.name || 'Component'})`;
  return LazyWrapper;
}

// ── Prefetch ───────────────────────────────────────────────

/**
 * Triggers a dynamic import to start loading the chunk without
 * rendering it. Useful on hover / route prefetch.
 *
 * The returned promise resolves when the module is cached by the
 * bundler. Errors are silently caught — the real error surfaces
 * when the component actually renders.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prefetchComponent(importFn: ImportFn<ComponentType<any>>): void {
  importFn().catch(() => {
    // Intentionally swallowed — the real error shows at render time.
  });
}

// ── Pre-configured Heavy Component Import Factories ────────
//
// These return import functions that can be passed to `lazyComponent`
// or `prefetchComponent`. The actual modules may not exist yet —
// they will resolve at runtime when the components are built.
//
// Usage:
//   const MonacoEditor = lazyComponent(monacoEditorImport);
//   prefetchComponent(monacoEditorImport);

/** Monaco editor — ~2 MB chunk. */
export const monacoEditorImport: ImportFn = () =>
  // @ts-expect-error -- module created at build time; lazy-loaded at runtime
  import('@/components/editors/monaco-editor');

/** Heavy 3D / graph visualization. */
export const graphVisualizationImport: ImportFn = () =>
  // @ts-expect-error -- module created at build time; lazy-loaded at runtime
  import('@/components/visualizations/graph-3d');

/** Storybook preview panel. */
export const storybookPreviewImport: ImportFn = () =>
  // @ts-expect-error -- module created at build time; lazy-loaded at runtime
  import('@/components/storybook/preview');
