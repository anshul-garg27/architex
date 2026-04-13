"use client";

import { memo, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Concept,
  type ConceptRelationship,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  getConceptById,
  getRelationshipsForConcept,
} from "@/lib/knowledge-graph/concepts";

// ── Difficulty Badge ──────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  beginner: { label: "Beginner", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  intermediate: { label: "Intermediate", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  advanced: { label: "Advanced", className: "bg-red-500/15 text-red-400 border-red-500/30" },
} as const;

// ── Relationship type labels ──────────────────────────────────

const RELATIONSHIP_LABELS: Record<ConceptRelationship["type"], string> = {
  uses: "Uses",
  "alternative-to": "Alternative to",
  "depends-on": "Depends on",
  enhances: "Enhances",
  "part-of": "Part of",
};

// ── Props ─────────────────────────────────────────────────────

interface ConceptDetailPanelProps {
  concept: Concept | null;
  onClose: () => void;
  onNavigate: (conceptId: string) => void;
}

// ── Component ─────────────────────────────────────────────────

export const ConceptDetailPanel = memo(function ConceptDetailPanel({
  concept,
  onClose,
  onNavigate,
}: ConceptDetailPanelProps) {
  if (!concept) return null;

  const domainColor = DOMAIN_COLORS[concept.domain];
  const domainLabel = DOMAIN_LABELS[concept.domain];
  const difficulty = DIFFICULTY_CONFIG[concept.difficulty];
  const relationships = getRelationshipsForConcept(concept.id);

  // Group relationships by type
  const grouped = new Map<ConceptRelationship["type"], { id: string; name: string; direction: "from" | "to" }[]>();
  for (const rel of relationships) {
    const isSource = rel.source === concept.id;
    const otherId = isSource ? rel.target : rel.source;
    const other = getConceptById(otherId);
    if (!other) continue;
    const existing = grouped.get(rel.type) ?? [];
    existing.push({
      id: other.id,
      name: other.name,
      direction: isSource ? "to" : "from",
    });
    grouped.set(rel.type, existing);
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-sidebar-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {concept.name}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${domainColor}20`,
                color: domainColor,
                border: `1px solid ${domainColor}40`,
              }}
            >
              {domainLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                difficulty.className,
              )}
            >
              {difficulty.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Description */}
        <section className="mb-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Description
          </h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {concept.description}
          </p>
        </section>

        {/* Tags */}
        <section className="mb-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1">
            {concept.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-accent px-1.5 py-0.5 text-[10px] text-foreground-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Relationships */}
        <section className="mb-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Relationships ({relationships.length})
          </h3>
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([type, items]) => (
              <div key={type}>
                <span className="text-[10px] font-medium text-foreground-subtle">
                  {RELATIONSHIP_LABELS[type]}
                </span>
                <ul className="mt-1 space-y-0.5">
                  {items.map((item) => (
                    <RelatedConceptLink
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      onNavigate={onNavigate}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Related Concepts (from concept.relatedConcepts field) */}
        <section>
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
            Related Concepts
          </h3>
          <ul className="space-y-0.5">
            {concept.relatedConcepts.map((rid) => {
              const related = getConceptById(rid);
              if (!related) return null;
              return (
                <RelatedConceptLink
                  key={rid}
                  id={rid}
                  name={related.name}
                  onNavigate={onNavigate}
                  domainColor={DOMAIN_COLORS[related.domain]}
                />
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
});

// ── Related Concept Link ──────────────────────────────────────

interface RelatedConceptLinkProps {
  id: string;
  name: string;
  onNavigate: (id: string) => void;
  domainColor?: string;
}

const RelatedConceptLink = memo(function RelatedConceptLink({
  id,
  name,
  onNavigate,
  domainColor,
}: RelatedConceptLinkProps) {
  const handleClick = useCallback(() => {
    onNavigate(id);
  }, [id, onNavigate]);

  return (
    <li>
      <button
        onClick={handleClick}
        className="group flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
      >
        {domainColor && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: domainColor }}
          />
        )}
        <span className="truncate group-hover:underline">{name}</span>
      </button>
    </li>
  );
});
