"use client";

/**
 * Blueprint-scoped MDX runtime renderer.
 *
 * Carries over the function-body eval pattern that old LLD settled on
 * (src/components/modules/lld/learn/MDXRenderer.tsx):
 *   1. `@mdx-js/mdx` compile({ outputFormat: "function-body" })
 *      emits code that expects `{Fragment, jsx, jsxs}` at runtime.
 *   2. We call `new Function(code)({ Fragment, jsx, jsxs })` and
 *      render the default export.
 *
 * The difference from LLD's renderer: we inject Blueprint-specific
 * inline MDX components (`<Class>`, `<Concept>`, `<Callout>`) for the
 * new curriculum voice.
 */

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { CompiledMDX } from "@/lib/blueprint/section-types";

// ── Inline MDX components ───────────────────────────────────

function Class({
  id,
  children,
}: {
  id: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <code
      data-class-id={id}
      className="rounded border border-amber-400/40 bg-amber-50 px-1 py-0.5 text-sm font-mono text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200"
    >
      {children ?? id}
    </code>
  );
}

function Concept({
  id,
  children,
}: {
  id: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <span
      data-concept-id={id}
      className="rounded border border-sky-400/40 bg-sky-50 px-1 py-0.5 text-sm text-sky-900 dark:border-sky-400/30 dark:bg-sky-950/30 dark:text-sky-200"
    >
      {children ?? id}
    </span>
  );
}

function Callout({
  kind = "note",
  children,
}: {
  kind?: "note" | "warn" | "aside";
  children?: ReactNode;
}): ReactNode {
  const tone =
    kind === "warn"
      ? "border-amber-400/50 bg-amber-50/80 dark:bg-amber-950/30"
      : kind === "aside"
        ? "border-indigo-400/40 bg-indigo-50/60 dark:bg-indigo-950/20"
        : "border-border bg-background/60";
  return (
    <aside
      className={`my-4 rounded-lg border px-4 py-3 text-sm leading-relaxed ${tone}`}
    >
      {children}
    </aside>
  );
}

const DEFAULT_COMPONENTS = {
  Class,
  Concept,
  Callout,
} as unknown as Record<string, React.ComponentType<unknown>>;

// ── Runtime eval ────────────────────────────────────────────

type MDXExports = {
  default: React.ComponentType<Record<string, unknown>>;
};

async function evalMDX(code: string): Promise<MDXExports> {
  type Runtime = {
    Fragment: typeof Fragment;
    jsx: typeof jsx;
    jsxs: typeof jsxs;
  };
  const fn = new Function(code) as (
    runtime: Runtime,
  ) => MDXExports | Promise<MDXExports>;
  const result = fn({ Fragment, jsx, jsxs });
  return result instanceof Promise ? await result : result;
}

interface Props {
  compiled: CompiledMDX;
  components?: Record<string, React.ComponentType<unknown>>;
}

interface RenderState {
  Content: React.ComponentType<Record<string, unknown>> | null;
  error: string | null;
}

export function BlueprintMDXRenderer({ compiled, components }: Props) {
  const codeKey = compiled.code;
  const initial = useMemo<RenderState>(
    () => ({ Content: null, error: null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeKey],
  );
  const [state, setState] = useState<RenderState>(initial);

  useEffect(() => {
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
        role="alert"
        data-testid="blueprint-mdx-error"
        className="rounded-md border border-red-400/40 bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-200"
      >
        Failed to render lesson content: {error}
      </div>
    );
  }

  if (!Content) {
    return (
      <pre
        data-testid="blueprint-mdx-pending"
        className="whitespace-pre-wrap text-sm opacity-60"
      >
        {compiled.raw}
      </pre>
    );
  }

  return (
    <Content components={{ ...DEFAULT_COMPONENTS, ...(components ?? {}) }} />
  );
}
