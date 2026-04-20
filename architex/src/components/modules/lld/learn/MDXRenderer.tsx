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

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { CompiledMDX } from "@/lib/lld/lesson-types";

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
 */
async function evalMDX(code: string): Promise<MDXExports> {
  // The function body returns `{ default: MDXContent }`.
  // Inject the jsx runtime via the `arguments` object.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const fn = new Function(
    "Fragment",
    "jsx",
    "jsxs",
    `${code}`,
  ) as (F: typeof Fragment, j: typeof jsx, js: typeof jsxs) => MDXExports | Promise<MDXExports>;
  const result = fn(Fragment, jsx, jsxs);
  return result instanceof Promise ? await result : result;
}

export function MDXRenderer({
  compiled,
  components,
}: MDXRendererProps): ReactNode {
  const [Content, setContent] = useState<
    React.ComponentType<Record<string, unknown>> | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setContent(null);

    evalMDX(compiled.code)
      .then((mod) => {
        if (cancelled) return;
        setContent(() => mod.default);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [compiled.code]);

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

  return <Content components={components ?? {}} />;
}
