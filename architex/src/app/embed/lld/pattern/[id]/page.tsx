// ---------------------------------------------------------------------------
// Embed: Design Pattern UML Canvas (LLD-141)
// ---------------------------------------------------------------------------
// Lightweight embed route that renders ONLY the UML canvas — no sidebar,
// no bottom panel, no activity bar. Designed for iframe embedding.
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import { getSEOContent, getSEOContentBySlug } from "@/lib/seo/content-from-db";
import { getPatternById, DESIGN_PATTERNS } from "@/lib/lld";
import { EmbedUMLCanvas } from "../../_components/EmbedUMLCanvas";

// ---------------------------------------------------------------------------
// Static generation — tries DB first, falls back to static array
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const dbItems = await getSEOContent("lld", "pattern");
  if (dbItems.length > 0) {
    return dbItems.map((p) => ({ id: p.slug }));
  }
  // Fallback to static array if DB not available
  return DESIGN_PATTERNS.map((p) => ({ id: p.id }));
}

// ISR: revalidate every 24 hours
export const revalidate = 86400;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ id: string }> };

export default async function EmbedPatternPage({ params }: Props) {
  const { id } = await params;

  // Try DB first
  const dbItem = await getSEOContentBySlug("lld", "pattern", id);
  if (dbItem) {
    const content = dbItem.content as Record<string, unknown>;
    return (
      <EmbedUMLCanvas
        title={dbItem.name}
        category={(dbItem.category ?? "creational") as string}
        classes={(content.classes as any[]) ?? []}
        relationships={(content.relationships as any[]) ?? []}
        linkHref={`/?lld=pattern:${id}`}
      />
    );
  }

  // Fallback to static
  const pattern = getPatternById(id);
  if (!pattern) notFound();

  return (
    <EmbedUMLCanvas
      title={pattern.name}
      category={pattern.category}
      classes={pattern.classes}
      relationships={pattern.relationships}
      linkHref={`/?lld=pattern:${pattern.id}`}
    />
  );
}
