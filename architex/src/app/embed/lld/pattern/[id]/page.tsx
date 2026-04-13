// ---------------------------------------------------------------------------
// Embed: Design Pattern UML Canvas (LLD-141)
// ---------------------------------------------------------------------------
// Lightweight embed route that renders ONLY the UML canvas — no sidebar,
// no bottom panel, no activity bar. Designed for iframe embedding.
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import {
  DESIGN_PATTERNS,
  getPatternById,
} from "@/lib/lld";
import { EmbedUMLCanvas } from "../../_components/EmbedUMLCanvas";

// ---------------------------------------------------------------------------
// Static generation for all design patterns
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return DESIGN_PATTERNS.map((p) => ({ id: p.id }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ id: string }> };

export default async function EmbedPatternPage({ params }: Props) {
  const { id } = await params;
  const pattern = getPatternById(id);
  if (!pattern) notFound();

  return (
    <EmbedUMLCanvas
      title={pattern.name}
      category={pattern.category}
      classes={pattern.classes}
      relationships={pattern.relationships}
      linkHref={`/?pattern=${pattern.id}`}
    />
  );
}
