"use client";

/**
 * RationalePanel — "Why this design"
 *
 * Typography-first reading panel that surfaces a template's authored
 * EngineeringRationale: the architectural decisions made (and why),
 * the trade-offs accepted, and the alternatives that were rejected.
 *
 * Reads the active template from the template-meta store. Renders a
 * subtle empty state when no template is loaded or the template has
 * no rationale block (only v2 templates author one).
 */

import { memo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Scale,
  SplitSquareHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplateMetaStore } from "@/stores/template-meta-store";
import type {
  AlternativeApproach,
  ArchitecturalDecision,
  Tradeoff,
} from "@/lib/templates/types";

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <BookOpen className="h-5 w-5 text-foreground-muted/50" />
      <p className="max-w-[40ch] text-sm leading-relaxed text-foreground-muted">
        {message}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

interface SectionHeadingProps {
  icon: typeof Compass;
  title: string;
  count: number;
}

function SectionHeading({ icon: Icon, title, count }: SectionHeadingProps) {
  return (
    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {title}
      <span className="font-mono text-[10px] font-normal text-foreground-muted/60">
        {count}
      </span>
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Decisions — what was chosen and why
// ---------------------------------------------------------------------------

function DecisionCard({
  decision,
  index,
}: {
  decision: ArchitecturalDecision;
  index: number;
}) {
  return (
    <article className="rounded-lg border border-border border-l-2 border-l-primary/60 bg-elevated px-4 py-3 transition-colors hover:border-l-primary">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[11px] tabular-nums text-primary/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h4 className="text-sm font-semibold leading-snug text-foreground">
          {decision.title}
        </h4>
      </div>

      <dl className="mt-2 space-y-2 pl-[26px]">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/70">
            Context
          </dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
            {decision.context}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/70">
            Decision
          </dt>
          <dd className="mt-0.5 text-[13px] leading-relaxed text-foreground">
            {decision.decision}
          </dd>
        </div>
        {decision.consequences.length > 0 && (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/70">
              Consequences
            </dt>
            <dd className="mt-1">
              <ul className="space-y-1">
                {decision.consequences.map((consequence, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs leading-relaxed text-foreground-muted"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-state-success" />
                    {consequence}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Tradeoffs — what was given up for what
// ---------------------------------------------------------------------------

function TradeoffCard({ tradeoff }: { tradeoff: Tradeoff }) {
  return (
    <article className="rounded-lg border border-border bg-elevated px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold text-foreground">
          {tradeoff.dimension}
        </h4>
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          chose {tradeoff.choice}
        </span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="flex items-start gap-1.5">
          <span
            aria-hidden
            className="mt-px font-mono text-xs font-bold text-state-success"
          >
            +
          </span>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {tradeoff.benefit}
          </p>
        </div>
        <div className="flex items-start gap-1.5">
          <span
            aria-hidden
            className="mt-px font-mono text-xs font-bold text-severity-high"
          >
            −
          </span>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {tradeoff.cost}
          </p>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Alternatives — roads not taken (collapsible)
// ---------------------------------------------------------------------------

function AlternativeRow({ alternative }: { alternative: AlternativeApproach }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-elevated">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        )}
        <span className="flex-1 text-xs font-semibold text-foreground">
          {alternative.name}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
          rejected
        </span>
      </button>

      {open && (
        <dl className="space-y-2 border-t border-border/60 px-4 py-3 pl-[42px]">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/70">
              Approach
            </dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
              {alternative.description}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/70">
              Pros vs cons
            </dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
              {alternative.prosVsCons}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted/70">
              Why not chosen
            </dt>
            <dd className="mt-0.5 text-[13px] leading-relaxed text-foreground">
              {alternative.whyNotChosen}
            </dd>
          </div>
        </dl>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// RationalePanel
// ---------------------------------------------------------------------------

export const RationalePanel = memo(function RationalePanel() {
  const activeTemplate = useTemplateMetaStore((s) => s.activeTemplate);

  if (!activeTemplate) {
    return (
      <EmptyState message="Load a template to read the engineering rationale behind its design." />
    );
  }

  const rationale = activeTemplate.rationale;
  if (!rationale) {
    return (
      <EmptyState message="This design has no engineering rationale yet." />
    );
  }

  const { decisions, tradeoffs, alternatives } = rationale;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[72ch] px-5 py-4">
        {/* Header */}
        <header className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            Why this design
          </p>
          <h2 className="mt-1 text-base font-semibold leading-snug text-foreground">
            {activeTemplate.name}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
            The decisions, trade-offs, and rejected alternatives behind this
            architecture — as a working engineer would reason through them.
          </p>
        </header>

        <div className="space-y-6 pb-4">
          {decisions.length > 0 && (
            <section aria-label="Architectural decisions">
              <SectionHeading
                icon={Compass}
                title="Decisions"
                count={decisions.length}
              />
              <div className="space-y-2.5">
                {decisions.map((decision, i) => (
                  <DecisionCard key={i} decision={decision} index={i} />
                ))}
              </div>
            </section>
          )}

          {tradeoffs.length > 0 && (
            <section aria-label="Trade-offs accepted">
              <SectionHeading
                icon={Scale}
                title="Trade-offs accepted"
                count={tradeoffs.length}
              />
              <div className="space-y-2.5">
                {tradeoffs.map((tradeoff, i) => (
                  <TradeoffCard key={i} tradeoff={tradeoff} />
                ))}
              </div>
            </section>
          )}

          {alternatives.length > 0 && (
            <section aria-label="Alternatives considered">
              <SectionHeading
                icon={SplitSquareHorizontal}
                title="Alternatives rejected"
                count={alternatives.length}
              />
              <div className="space-y-2">
                {alternatives.map((alternative, i) => (
                  <AlternativeRow key={i} alternative={alternative} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
});
