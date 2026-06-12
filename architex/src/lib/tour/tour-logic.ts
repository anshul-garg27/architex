/**
 * Guided Tour — pure logic
 *
 * Step navigation math and the CSS used to spotlight a learn step's
 * highlightNodes/highlightEdges on the React Flow canvas. The overlay
 * injects the generated stylesheet into <head> while a step is active
 * and removes it on step change / close, so no canvas store state is
 * ever mutated and cleanup is automatic.
 *
 * Dimming uses `opacity` on `.react-flow__node` / `.react-flow__edge`
 * wrappers (compositor-friendly); highlighted nodes get a soft
 * `drop-shadow` glow that follows the node's rendered shape.
 */

import type { DiagramTemplate, LearnStep } from '@/lib/templates/types';

// ── Step access ─────────────────────────────────────────────

/** Safe accessor for a template's learn steps. Returns [] when absent. */
export function getTourSteps(
  template: DiagramTemplate | null | undefined,
): LearnStep[] {
  return template?.learnSteps ?? [];
}

/** Clamp a step index into [0, total - 1]. Returns 0 for empty tours. */
export function clampStepIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), total - 1);
}

/** Whether `index` is the final step of a `total`-step tour. */
export function isLastStep(index: number, total: number): boolean {
  return total > 0 && clampStepIndex(index, total) === total - 1;
}

// ── Highlight CSS generation ────────────────────────────────

/** Escape a value for use inside a double-quoted CSS attribute selector. */
export function escapeCssAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function notChain(base: string, ids: readonly string[]): string {
  return (
    base +
    ids.map((id) => `:not([data-id="${escapeCssAttr(id)}"])`).join('')
  );
}

const DIM_TRANSITION =
  'transition: opacity 240ms var(--motion-ease-out, cubic-bezier(0.16, 1, 0.3, 1));';

export interface TourHighlight {
  nodeIds: readonly string[];
  edgeIds: readonly string[];
}

/** Normalized highlight target lists for a learn step (defensive vs. JSON). */
export function getStepHighlights(
  step: LearnStep | null | undefined,
): TourHighlight {
  return {
    nodeIds: step?.highlightNodes ?? [],
    edgeIds: step?.highlightEdges ?? [],
  };
}

/**
 * Build the stylesheet that dims every node/edge NOT referenced by the
 * current step and glows the ones that are. Returns '' when the step
 * highlights nothing, so callers can skip injection entirely.
 */
export function buildTourHighlightCss(highlight: TourHighlight): string {
  const { nodeIds, edgeIds } = highlight;
  if (nodeIds.length === 0 && edgeIds.length === 0) return '';

  const rules: string[] = [
    `.react-flow__node { ${DIM_TRANSITION} }`,
    `.react-flow__edge { ${DIM_TRANSITION} }`,
    // Dim everything that is not part of the current step.
    `${notChain('.react-flow__node', nodeIds)} { opacity: 0.16; pointer-events: none; }`,
    `${notChain('.react-flow__edge', edgeIds)} { opacity: 0.12; }`,
  ];

  // Violet glow on the spotlighted nodes (drop-shadow hugs clip-path shapes).
  for (const id of nodeIds) {
    rules.push(
      `.react-flow__node[data-id="${escapeCssAttr(id)}"] { filter: drop-shadow(0 0 10px color-mix(in srgb, var(--primary) 55%, transparent)); }`,
    );
  }

  return rules.join('\n');
}
