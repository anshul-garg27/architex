"use client";

/**
 * ScreenReaderView (LLD-086) — Accessible text representation of UML diagrams.
 *
 * Replaces the SVG canvas with structured HTML describing classes, attributes,
 * methods, and relationships so that screen-reader users can fully understand
 * the diagram without visual rendering.
 */

import React, { memo, useMemo } from "react";
import type { UMLClass, UMLRelationship } from "@/lib/lld";

// ── Helpers ─────────────────────────────────────────────────

const STEREOTYPE_LABEL: Record<UMLClass["stereotype"], string> = {
  class: "class",
  interface: "interface",
  abstract: "abstract class",
  enum: "enumeration",
};

const RELATIONSHIP_VERB: Record<string, string> = {
  inheritance: "inherits from",
  realization: "implements",
  composition: "composes",
  aggregation: "aggregates",
  association: "associates with",
  dependency: "depends on",
};

function formatVisibility(v: string): string {
  switch (v) {
    case "+": return "public";
    case "-": return "private";
    case "#": return "protected";
    case "~": return "package";
    default: return v;
  }
}

function formatAttribute(attr: { name: string; type: string; visibility: string }): string {
  const vis = formatVisibility(attr.visibility);
  const typePart = attr.type ? `: ${attr.type}` : "";
  return `${vis} ${attr.name}${typePart}`;
}

function formatMethod(method: { name: string; returnType: string; params: string[]; visibility: string }): string {
  const vis = formatVisibility(method.visibility);
  const params = method.params.length > 0 ? method.params.join(", ") : "";
  const returnPart = method.returnType ? `: ${method.returnType}` : "";
  return `${vis} ${method.name}(${params})${returnPart}`;
}

// ── Props ───────────────────────────────────────────────────

export interface ScreenReaderViewProps {
  /** The diagram title (pattern/problem name). */
  title: string | null;
  /** Current set of UML classes on the canvas. */
  classes: UMLClass[];
  /** Current set of UML relationships on the canvas. */
  relationships: UMLRelationship[];
}

// ── Component ───────────────────────────────────────────────

export const ScreenReaderView = memo(function ScreenReaderView({
  title,
  classes,
  relationships,
}: ScreenReaderViewProps) {
  const classMap = useMemo(() => {
    const map = new Map<string, UMLClass>();
    for (const c of classes) map.set(c.id, c);
    return map;
  }, [classes]);

  const relationshipDescriptions = useMemo(() => {
    return relationships.map((rel) => {
      const source = classMap.get(rel.source);
      const target = classMap.get(rel.target);
      if (!source || !target) return null;
      const verb = RELATIONSHIP_VERB[rel.type] ?? rel.type;
      const labelPart = rel.label ? ` (${rel.label})` : "";
      const cardPart =
        rel.sourceCardinality || rel.targetCardinality
          ? ` [${rel.sourceCardinality ?? "*"}..${rel.targetCardinality ?? "*"}]`
          : "";
      return `${source.name} ${verb} ${target.name}${labelPart}${cardPart}`;
    }).filter(Boolean) as string[];
  }, [relationships, classMap]);

  if (classes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6" role="region" aria-label="Diagram description">
        <p className="text-sm text-foreground-muted">No classes on the canvas. Add classes from the sidebar palette to see the accessible description here.</p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto bg-background p-6"
      role="region"
      aria-label="Accessible diagram description"
    >
      {/* Summary */}
      <div className="mb-6">
        {title && (
          <h2 className="mb-2 text-base font-bold text-foreground">{title}</h2>
        )}
        <p className="text-sm text-foreground-muted">
          {title ? `${title}: ` : ""}
          {classes.length} {classes.length === 1 ? "class" : "classes"}
          {relationships.length > 0 && (
            <>, {relationships.length} {relationships.length === 1 ? "relationship" : "relationships"}</>
          )}
          .
        </p>
      </div>

      {/* Classes */}
      <section aria-label="Classes">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Classes
        </h3>
        <ul className="space-y-4">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-4"
            >
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-sm font-bold text-foreground">{cls.name}</span>
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted">
                  {STEREOTYPE_LABEL[cls.stereotype]}
                </span>
              </div>

              {cls.attributes.length > 0 && (
                <div className="mb-2">
                  <h4 className="mb-1 text-xs font-semibold text-foreground-subtle">
                    Attributes ({cls.attributes.length})
                  </h4>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {cls.attributes.map((attr) => (
                      <li key={attr.id} className="text-xs text-foreground-muted">
                        <code className="font-mono text-[11px]">{formatAttribute(attr)}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cls.methods.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-foreground-subtle">
                    Methods ({cls.methods.length})
                  </h4>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {cls.methods.map((method) => (
                      <li key={method.id} className="text-xs text-foreground-muted">
                        <code className="font-mono text-[11px]">{formatMethod(method)}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cls.attributes.length === 0 && cls.methods.length === 0 && (
                <p className="text-xs italic text-foreground-subtle">No attributes or methods.</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Relationships */}
      {relationshipDescriptions.length > 0 && (
        <section aria-label="Relationships" className="mt-6">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Relationships
          </h3>
          <ul className="ml-4 list-disc space-y-1">
            {relationshipDescriptions.map((desc, i) => (
              <li key={i} className="text-xs text-foreground-muted">
                {desc}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
});
