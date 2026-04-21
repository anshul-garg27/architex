"use client";

/**
 * MDXRenderer — evaluates pre-compiled MDX (function-body output from
 * @mdx-js/mdx) into a React element.
 *
 * At compile time `@mdx-js/mdx` emits a function body that expects a
 * JSX runtime injected as { jsx, jsxs, Fragment }. We inject React's
 * automatic-runtime exports and invoke the function.
 *
 * Async path: some versions of `@mdx-js/mdx` v3 `run()` return a Promise.
 * The hook below handles both sync and async runners.
 */

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { CompiledMDX } from "@/lib/lld/lesson-types";

/**
 * Inline MDX component stubs. The compile pipeline extracts `id` attributes
 * from <Class id="..."> and <Concept id="..."> JSX in the source MDX, so we
 * need real components at render time. For Phase 2 these render as small
 * inline chips; Phase 3 wires them to canvas interactions and concept popovers.
 */
function Class({ id, children }: { id: string; children?: ReactNode }): ReactNode {
  return (
    <code
      data-class-id={id}
      className="rounded border border-amber-400/40 bg-amber-50 px-1 py-0.5 text-sm font-mono text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200"
    >
      {children ?? id}
    </code>
  );
}

function Concept({ id, children }: { id: string; children?: ReactNode }): ReactNode {
  return (
    <span
      data-concept-id={id}
      className="rounded border border-sky-400/40 bg-sky-50 px-1 py-0.5 text-sm text-sky-900 dark:border-sky-400/30 dark:bg-sky-950/30 dark:text-sky-200"
    >
      {children ?? id}
    </span>
  );
}

const DEFAULT_MDX_COMPONENTS = {
  Class,
  Concept,
} as unknown as Record<string, React.ComponentType<unknown>>;

interface MDXRendererProps {
  compiled: Pick<CompiledMDX, "code" | "raw">;
  components?: Record<string, React.ComponentType<unknown>>;
}

type MDXExports = {
  default: React.ComponentType<Record<string, unknown>>;
};

/**
 * Eval the function-body string with the JSX runtime in scope.
 * The result is either a module-like object or a Promise of one.
 *
 * `@mdx-js/mdx` with `outputFormat: "function-body"` destructures its runtime
 * from `arguments[0]` like:
 *     const {Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs} = arguments[0];
 * so we pass a single object, not positional args.
 */
async function evalMDX(code: string): Promise<MDXExports> {
  type Runtime = {
    Fragment: typeof Fragment;
    jsx: typeof jsx;
    jsxs: typeof jsxs;
  };
  const fn = new Function(`${code}`) as (
    runtime: Runtime,
  ) => MDXExports | Promise<MDXExports>;
  const result = fn({ Fragment, jsx, jsxs });
  return result instanceof Promise ? await result : result;
}

interface RenderState {
  Content: React.ComponentType<Record<string, unknown>> | null;
  error: string | null;
}

export function MDXRenderer({
  compiled,
  components,
}: MDXRendererProps): ReactNode {
  // Reset state whenever the code string changes via a derived key.
  const codeKey = compiled.code;
  const initial = useMemo<RenderState>(
    () => ({ Content: null, error: null }),
    // Reset each time code changes:
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeKey],
  );
  const [state, setState] = useState<RenderState>(initial);

  useEffect(() => {
    // Subscribe to the async eval as an external system and only
    // call setState from the async callback (not synchronously).
    let cancelled = false;

    evalMDX(compiled.code)
      .then((mod) => {
        if (cancelled) return;
        setState({ Content: mod.default, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          Content: null,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [compiled.code]);

  const { Content, error } = state;

  if (error) {
    return (
      <div
        data-testid="mdx-error"
        className="rounded-md border border-red-400/40 bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        Failed to render lesson content: {error}
      </div>
    );
  }

  if (!Content) {
    // Degrade gracefully — show the raw markdown until JSX is available.
    return (
      <pre
        data-testid="mdx-pending"
        className="whitespace-pre-wrap text-sm opacity-60"
      >
        {compiled.raw}
      </pre>
    );
  }

  return (
    <Content
      components={{ ...DEFAULT_MDX_COMPONENTS, ...(components ?? {}) }}
    />
  );
}
